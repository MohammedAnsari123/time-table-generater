import uuid
from typing import List, Dict, Any
from ortools.sat.python import cp_model
from app.models.schemas import TimetableRequest, TimetableSlot, Classroom

def schedule_with_ortools(request: TimetableRequest) -> dict:
    """
    Schedules the timetable using Google OR-Tools CP-SAT Solver.
    Guarantees conflict-free allocations matching all hard constraints.
    """
    model = cp_model.CpModel()
    
    # 1. Parse Metadata & Setup Indices
    working_days = request.metadata.working_days
    num_days = len(working_days)
    periods_per_day = request.metadata.periods_per_day
    
    # Setup lookup helpers
    day_to_idx = {day: idx for idx, day in enumerate(working_days)}
    idx_to_day = {idx: day for idx, day in enumerate(working_days)}
    
    # Merge labs into classrooms pool if provided (matching route behavior)
    all_rooms = list(request.classrooms)
    if request.labs:
        for lab in request.labs:
            if not any(c.id == lab.id for c in all_rooms):
                all_rooms.append(
                    Classroom(
                        id=lab.id,
                        name=lab.name,
                        capacity=lab.capacity,
                        building=lab.department,
                        floor=0,
                        type="Lab",
                        status=lab.status
                    )
                )
    
    # Filter active rooms
    available_rooms = [r for r in all_rooms if r.status == "Available"]
    if not available_rooms:
        return {"status": "INFEASIBLE", "error": "No available classrooms or laboratories in the resource pool."}

    # 2. Build List of Lessons/Blocks to Schedule
    # To support professional schedules, labs are grouped into blocks of 2 consecutive periods.
    blocks = []
    block_counter = 0
    
    for div_idx, div in enumerate(request.divisions):
        for sub_idx, sub in enumerate(div.subjects):
            # Find assigned lecturer
            lecturer_id = sub.assigned_lecturer_id
            if not lecturer_id or lecturer_id == "None":
                # Find eligible lecturer from staff pool
                eligible = [l.id for l in request.lecturers if sub.code in l.subjects or sub.name in l.subjects]
                lecturer_id = eligible[0] if eligible else "TBD"
                
            periods_needed = sub.periods_per_week
            is_lab = (sub.type == "Lab" or sub.lab_requirement)
            
            # Divide into blocks
            if is_lab and periods_needed >= 2:
                # Group as double-period slots
                num_doubles = periods_needed // 2
                num_singles = periods_needed % 2
                
                for _ in range(num_doubles):
                    blocks.append({
                        "id": block_counter,
                        "division": div.name,
                        "subject": sub.code,
                        "lecturer": lecturer_id,
                        "type": "Lab",
                        "duration": 2,
                        "sub_obj": sub
                    })
                    block_counter += 1
                for _ in range(num_singles):
                    blocks.append({
                        "id": block_counter,
                        "division": div.name,
                        "subject": sub.code,
                        "lecturer": lecturer_id,
                        "type": "Lab",
                        "duration": 1,
                        "sub_obj": sub
                    })
                    block_counter += 1
            else:
                for _ in range(periods_needed):
                    blocks.append({
                        "id": block_counter,
                        "division": div.name,
                        "subject": sub.code,
                        "lecturer": lecturer_id,
                        "type": sub.type,
                        "duration": 1,
                        "sub_obj": sub
                    })
                    block_counter += 1

    if not blocks:
        return {"status": "INFEASIBLE", "error": "No subjects or periods requested for scheduling."}

    # 3. Create Decision Variables
    # x[b, d, p, r] = 1 if block b starts on day d at period p in room r
    x = {}
    
    # Map rooms by type for constraints
    lab_rooms = [r for r in available_rooms if r.type == "Lab"]
    classrooms = [r for r in available_rooms if r.type == "Classroom"]
    
    # Map lecturer objects
    lec_map = {l.id: l for l in request.lecturers}
    
    for b in blocks:
        b_id = b["id"]
        is_lab = (b["type"] == "Lab")
        duration = b["duration"]
        lec_id = b["lecturer"]
        lec = lec_map.get(lec_id)
        
        # Room candidates
        if is_lab:
            room_candidates = lab_rooms if lab_rooms else available_rooms
        else:
            room_candidates = classrooms if classrooms else available_rooms
            
        for d_idx, day in enumerate(working_days):
            # Check lecturer availability for this day
            if lec and day not in lec.available_days:
                continue # Lecturer is unavailable on this day
                
            # Period range: starting period must fit the block duration
            for p in range(1, periods_per_day - duration + 2):
                for r in room_candidates:
                    var_name = f"x_b{b_id}_d{d_idx}_p{p}_r{r.id}"
                    x[(b_id, d_idx, p, r.id)] = model.NewBoolVar(var_name)

    # 4. Enforce Hard Constraints
    
    # A. Each block must be scheduled exactly once
    for b in blocks:
        b_id = b["id"]
        variables = [v for key, v in x.items() if key[0] == b_id]
        if not variables:
            return {
                "status": "INFEASIBLE",
                "error": f"Cannot schedule subject {b['subject']} for Div {b['division']}. No valid days, periods, or rooms match its lecturer availability/room requirements."
            }
        model.Add(sum(variables) == 1)
        
    # Helper to check if a block b occupies period p on day d in room r
    # b occupies (d, p, r) if it starts at (d, p, r) OR (for duration 2) it starts at (d, p-1, r)
    def get_occupancy_vars_for_slot(d_idx: int, p: int, room_id: str = None, division: str = None, lecturer: str = None):
        occupying = []
        for (b_id, d_val, p_start, r_val), var in x.items():
            if d_val != d_idx:
                continue
            
            # Check duration overlap
            b_obj = blocks[b_id]
            dur = b_obj["duration"]
            is_overlapping = False
            if p_start == p:
                is_overlapping = True
            elif dur == 2 and p_start == p - 1:
                is_overlapping = True
                
            if not is_overlapping:
                continue
                
            # Filter matches
            if room_id and r_val != room_id:
                continue
            if division and b_obj["division"] != division:
                continue
            if lecturer and b_obj["lecturer"] != lecturer:
                continue
                
            occupying.append(var)
        return occupying

    # B. Division Double-booking: At most one lesson per division per (day, period)
    for div in request.divisions:
        for d_idx in range(num_days):
            for p in range(1, periods_per_day + 1):
                occupying_vars = get_occupancy_vars_for_slot(d_idx, p, division=div.name)
                if occupying_vars:
                    model.Add(sum(occupying_vars) <= 1)

    # C. Lecturer Double-booking: At most one class per lecturer per (day, period)
    for lec in request.lecturers:
        for d_idx in range(num_days):
            for p in range(1, periods_per_day + 1):
                occupying_vars = get_occupancy_vars_for_slot(d_idx, p, lecturer=lec.id)
                if occupying_vars:
                    model.Add(sum(occupying_vars) <= 1)

    # D. Room Double-booking: At most one class per room per (day, period)
    for room in available_rooms:
        for d_idx in range(num_days):
            for p in range(1, periods_per_day + 1):
                occupying_vars = get_occupancy_vars_for_slot(d_idx, p, room_id=room.id)
                if occupying_vars:
                    model.Add(sum(occupying_vars) <= 1)

    # E. Lecturer Workload limit per day
    for lec in request.lecturers:
        for d_idx in range(num_days):
            # Sum of block_duration * x_start
            day_vars = []
            for (b_id, d_val, p_start, r_val), var in x.items():
                if d_val == d_idx and blocks[b_id]["lecturer"] == lec.id:
                    day_vars.append(var * blocks[b_id]["duration"])
            if day_vars:
                model.Add(sum(day_vars) <= lec.max_periods_per_day)

    # F. Subject Daily Limit: Max 2 periods per day for any Theory subject per division
    for div in request.divisions:
        for sub in div.subjects:
            if sub.type == "Theory":
                for d_idx in range(num_days):
                    sub_day_vars = []
                    for (b_id, d_val, p_start, r_val), var in x.items():
                        b_obj = blocks[b_id]
                        if d_val == d_idx and b_obj["division"] == div.name and b_obj["subject"] == sub.code:
                            sub_day_vars.append(var * b_obj["duration"])
                    if sub_day_vars:
                        model.Add(sum(sub_day_vars) <= 2)

    # 5. Optimize Schedule (Soft Constraints / Preferences)
    # We want to minimize "gaps" in the daily teaching schedules of lecturers.
    # A gap is an idle period between the lecturer's first and last teaching period on a day.
    gap_penalties = []
    
    for lec in request.lecturers:
        for d_idx in range(num_days):
            # Find if lecturer teaches on this day
            lec_day_vars = {}
            for p in range(1, periods_per_day + 1):
                occupying_vars = get_occupancy_vars_for_slot(d_idx, p, lecturer=lec.id)
                if occupying_vars:
                    # Create a boolean variable representing if teacher is busy during period p on day d
                    is_busy = model.NewBoolVar(f"busy_lec_{lec.id}_d{d_idx}_p{p}")
                    model.Add(is_busy == sum(occupying_vars))
                    lec_day_vars[p] = is_busy
            
            if not lec_day_vars:
                continue
                
            # Define start_period and end_period variables for this teacher on this day
            start_p = model.NewIntVar(1, periods_per_day + 1, f"start_p_{lec.id}_d{d_idx}")
            end_p = model.NewIntVar(0, periods_per_day, f"end_p_{lec.id}_d{d_idx}")
            is_active = model.NewBoolVar(f"active_{lec.id}_d{d_idx}")
            
            # If busy at period p, start_p <= p and end_p >= p
            for p, busy_var in lec_day_vars.items():
                model.Add(start_p <= p).OnlyEnforceIf(busy_var)
                model.Add(end_p >= p).OnlyEnforceIf(busy_var)
                
            # If active, is_active is 1 (sum of busy periods is > 0)
            model.Add(is_active == 1).OnlyEnforceIf(list(lec_day_vars.values()))
            model.Add(is_active == 0).OnlyEnforceIf([v.Not() for v in lec_day_vars.values()])
            
            # If not active, start_p = periods_per_day + 1 and end_p = 0
            model.Add(start_p == periods_per_day + 1).OnlyEnforceIf(is_active.Not())
            model.Add(end_p == 0).OnlyEnforceIf(is_active.Not())
            
            # total_periods is the sum of busy periods
            total_periods = model.NewIntVar(0, periods_per_day, f"total_periods_{lec.id}_d{d_idx}")
            model.Add(total_periods == sum(lec_day_vars.values()))
            
            # Gaps count = (end_p - start_p + 1) - total_periods
            # Gaps count is end_p - start_p + 1 - total_periods
            gaps = model.NewIntVar(0, periods_per_day, f"gaps_{lec.id}_d{d_idx}")
            model.Add(gaps >= (end_p - start_p + 1) - total_periods)
            gap_penalties.append(gaps)

    if gap_penalties:
        # Minimize total daily gaps across all lecturers
        model.Minimize(sum(gap_penalties))

    # 6. Run CP-SAT Solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0  # Safe timeout for Render instances
    
    print("Solving CP-SAT Timetable Constraint model...")
    status = solver.Solve(model)
    print(f"CP-SAT Solver Finished. Status: {solver.StatusName(status)}")
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # Translate decisions back to TimetableSlots
        slots_out = []
        for (b_id, d_idx, p_start, r_id), var in x.items():
            if solver.BooleanValue(var):
                b_obj = blocks[b_id]
                duration = b_obj["duration"]
                day_name = idx_to_day[d_idx]
                
                # Add individual slot entries (e.g. double blocks get split into 2 consecutive slots for db/frontend compatibility)
                for step in range(duration):
                    slots_out.append({
                        "division": b_obj["division"],
                        "day": day_name,
                        "period": p_start + step,
                        "subject": b_obj["subject"],
                        "lecturer": b_obj["lecturer"],
                        "room": r_id,
                        "type": b_obj["type"]
                    })
        
        # Sort output for clean display
        slots_out.sort(key=lambda s: (s["division"], day_to_idx[s["day"]], s["period"]))
        return {"status": "SUCCESS", "slots": slots_out}
        
    else:
        # Generate conflict diagnostics to help explain infeasibility
        diagnostics = generate_infeasibility_diagnostics(request, blocks, available_rooms)
        return {"status": "INFEASIBLE", "conflicts": diagnostics}


def generate_infeasibility_diagnostics(request: TimetableRequest, blocks: list, rooms: list) -> List[str]:
    """
    Analyzes inputs to build a detailed checklist of clashing constraints.
    Helps the LLM explain to the user exactly why scheduling failed.
    """
    clashes = []
    
    # 1. Total requested periods vs total classroom capacity
    total_slots_requested = sum(b["duration"] for b in blocks)
    total_capacity = len(rooms) * len(request.metadata.working_days) * request.metadata.periods_per_day
    if total_slots_requested > total_capacity:
        clashes.append(
            f"Under-capacity: You requested a total of {total_slots_requested} teaching periods, but your {len(rooms)} classrooms only have a maximum capacity of {total_capacity} periods."
        )
        
    # 2. Check for over-allocated lecturers (total teaching periods exceed available slots)
    max_weekly_slots = len(request.metadata.working_days) * request.metadata.periods_per_day
    for lec in request.lecturers:
        lec_periods = sum(b["duration"] for b in blocks if b["lecturer"] == lec.id)
        if lec_periods > lec.max_periods_per_week:
            clashes.append(
                f"Lecturer {lec.name} ({lec.id}) is over-assigned: Needs to teach {lec_periods} periods, but max workload is {lec.max_periods_per_week}."
            )
        if lec_periods > max_weekly_slots:
            clashes.append(
                f"Lecturer {lec.name} ({lec.id}) has {lec_periods} periods assigned, which exceeds the absolute maximum weekly slots of the timetable ({max_weekly_slots})."
            )
            
    # 3. Check for specific room type deficits
    lab_blocks = [b for b in blocks if b["type"] == "Lab"]
    lab_rooms = [r for r in rooms if r.type == "Lab"]
    if lab_blocks and not lab_rooms:
        clashes.append("Missing Lab rooms: You have Lab subjects scheduled, but there are no laboratories (type 'Lab') available.")
        
    # 4. Check for overloaded divisions (total periods exceed maximum periods in a week)
    for div in request.divisions:
        div_periods = sum(sub.periods_per_week for sub in div.subjects)
        max_periods = len(request.metadata.working_days) * request.metadata.periods_per_day
        if div_periods > max_periods:
            clashes.append(
                f"Division {div.name} is over-constrained: Requesting {div_periods} periods of subjects, which exceeds the total periods available in a week ({max_periods})."
            )
            
    if not clashes:
        clashes.append("Resource bottleneck: High teacher overlap or dense classroom schedules prevent any conflict-free assignment from existing.")
        
    return clashes