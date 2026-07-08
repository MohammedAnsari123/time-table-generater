from app.models.schemas import TimetableResponse, TimetableRequest, TimetableSlot
import random

def repair_timetable(timetable: TimetableResponse, request: TimetableRequest) -> TimetableResponse:
    """
    Attempts to repair a timetable by removing excess slots for subjects
    that have more periods than requested, PER DIVISION.
    """
    if not timetable.slots:
        return timetable

    # Map: Division -> Subject -> Required Count
    required_periods = {d.name: {s.code: s.periods_per_week for s in d.subjects} for d in request.divisions}
    
    # Store slots by Division -> Subject
    slots_by_div_sub = {} 
    all_slots = timetable.slots
    
    for slot in all_slots:
        if slot.division not in slots_by_div_sub:
             slots_by_div_sub[slot.division] = {}
        if slot.subject not in slots_by_div_sub[slot.division]:
            slots_by_div_sub[slot.division][slot.subject] = []
        
        slots_by_div_sub[slot.division][slot.subject].append(slot)
        
    ids_to_remove = set()

    # Iterate and check excess
    for div_name, subjects in slots_by_div_sub.items():
        if div_name not in required_periods:
            continue # Unknown division?

        for subject_code, slots in subjects.items():
            if subject_code in required_periods[div_name]:
                required = required_periods[div_name][subject_code]
                count = len(slots)
                
                if count > required:
                    excess = count - required
                    print(f"Repairing: Div {div_name} Subject {subject_code} has {count} periods, removing {excess}.")
                    
                    # Identify slots to remove (last 'excess' slots)
                    remove_candidates = slots[-excess:]
                    for s in remove_candidates:
                        ids_to_remove.add(id(s))
                    
    # Rebuild slots list preserving order, skipping removed IDs
    if ids_to_remove:
        timetable.slots = [s for s in all_slots if id(s) not in ids_to_remove]
    
    return timetable

def resolve_sequential_conflicts(current_slots: list, occupied_slots: list, request: TimetableRequest) -> list:
    """
    Deterministically resolves conflicts between current_slots and occupied_slots
    by moving conflicting slots to available free time slots.
    """
    if not current_slots:
        return current_slots

    # 1. Map Occupied Resources for fast lookup
    # Key: (Day, Period) -> {'lecturers': set(), 'rooms': set()}
    occupied_map = {}
    for slot in occupied_slots:
        key = (slot.day, slot.period)
        if key not in occupied_map:
            occupied_map[key] = {'lecturers': set(), 'rooms': set()}
        occupied_map[key]['lecturers'].add(slot.lecturer)
        occupied_map[key]['rooms'].add(slot.room)

    # 2. Helpers
    working_days = request.metadata.working_days
    periods = range(1, request.metadata.periods_per_day + 1)
    
    resolved_slots = []
    
    for slot in current_slots:
        # Check for conflict
        key = (slot.day, slot.period)
        conflict = False
        
        # A. Check against Occupied (Global)
        if key in occupied_map:
            if slot.lecturer in occupied_map[key]['lecturers'] or slot.room in occupied_map[key]['rooms']:
                conflict = True
                
        # B. Check against ALREADY PROCESSED current slots (Internal)
        for processed in resolved_slots:
            if processed.day == slot.day and processed.period == slot.period:
                if processed.lecturer == slot.lecturer or processed.room == slot.room:
                    conflict = True
                    
        if not conflict:
            resolved_slots.append(slot)
            continue
            
        # CONFLICT DETECTED! Find a new spot.
        # print(f"Conflict detected for {slot.division} {slot.subject} ({slot.day} P{slot.period}). Finding new slot...")
        
        moved = False
        for day in working_days:
            if moved: break
            for p in periods:
                new_key = (day, p)
                
                # Check Global Occupied
                is_global_busy = False
                if new_key in occupied_map:
                    if slot.lecturer in occupied_map[new_key]['lecturers'] or slot.room in occupied_map[new_key]['rooms']:
                        is_global_busy = True
                if is_global_busy: continue
                
                # Check Internal (Already Resolved)
                is_internal_busy = False
                for processed in resolved_slots:
                    if processed.day == day and processed.period == p:
                         # Strictly avoid reusing same slot for same division if possible, or at least resource check
                         if processed.lecturer == slot.lecturer or processed.room == slot.room:
                            is_internal_busy = True
                if is_internal_busy: continue
                
                # Success! Move here.
                slot.day = day
                slot.period = p
                resolved_slots.append(slot)
                moved = True
                # print(f"  -> Moved to {day} P{p}")
                break
        
        if not moved:
            # print(f"  -> CRITICAL: Could not find free slot for {slot.subject}!")
            resolved_slots.append(slot)
            
    return resolved_slots


def optimize_distribution(current_slots: list, occupied_slots: list, request: TimetableRequest) -> list:
    """
    Heuristic optimization to spread subjects across the week.
    Objective: Avoid >2 periods of same Theory subject per day.
    Method: Move overloaded slots to empty valid slots, or swap with other subjects.
    """
    if not current_slots: return current_slots

    working_days = request.metadata.working_days
    periods = range(1, request.metadata.periods_per_day + 1)

    # 1. Build rapid lookup maps
    occupied_map = {}
    for slot in occupied_slots:
        key = (slot.day, slot.period)
        if key not in occupied_map: occupied_map[key] = {'lecturers': set(), 'rooms': set()}
        occupied_map[key]['lecturers'].add(slot.lecturer)
        occupied_map[key]['rooms'].add(slot.room)

    # Helper to check if a slot (day, period) is valid for a specific subject/lecturer/room
    def is_slot_valid(day, period, subject_slot, current_slots_state):
        # 1. Check Global
        key = (day, period)
        if key in occupied_map:
            if subject_slot.lecturer in occupied_map[key]['lecturers'] or subject_slot.room in occupied_map[key]['rooms']:
                return False
        
        # 2. Check Internal (against other slots in current_slots_state)
        # We need to ensure no OTHER slot in current_slots_state is using this resource at (day, period)
        # AND no other slot is at (day, period) if we assume single-batch division.
        for s in current_slots_state:
            if s is subject_slot: continue # Don't check against self
            if s.day == day and s.period == period:
                return False # Slot taken by another subject in this division
            
            # If we allowed multi-batch, we'd check resources:
            # if s.day == day and s.period == period and (s.lecturer == subject_slot.lecturer or s.room == subject_slot.room): return False
            
        return True

    # 2. Iterate to fix overloads
    # We do a few passes
    for _ in range(3): # Max 3 passes
        # Calculate counts per day
        day_counts = {day: {} for day in working_days}
        for s in current_slots:
            if s.type == "Lab": continue # Labs are allowed to stack
            day_counts[s.day][s.subject] = day_counts[s.day].get(s.subject, 0) + 1

        # Identify overloads
        overloaded_slots = []
        for s in current_slots:
            if s.type == "Lab": continue
            if day_counts[s.day][s.subject] > 2:
                overloaded_slots.append(s)

        if not overloaded_slots:
            break # No violations!

        # Try to move overloaded slots
        for slot in overloaded_slots:
            # Decrement count for current position (we are trying to move it)
            origin_day = slot.day
            origin_period = slot.period
            
            if day_counts[origin_day][slot.subject] <= 2: continue # Already fixed by previous moves?
            
            moved = False
            # Find a target day with count < 2
            target_days = [d for d in working_days if day_counts[d].get(slot.subject, 0) < 2]
            random.shuffle(target_days) # Randomize to spread better

            for day in target_days:
                if moved: break
                for p in periods:
                    if is_slot_valid(day, p, slot, current_slots):
                        # Move!
                        slot.day = day
                        slot.period = p
                        day_counts[origin_day][slot.subject] -= 1
                        day_counts[day][slot.subject] = day_counts[day].get(slot.subject, 0) + 1
                        moved = True
                        break
            
            if not moved:
                # Backtracking/swapping: Swap `slot` with another division slot `swap_slot`
                # such that resource constraints are preserved and counts per day improve.
                for swap_slot in current_slots:
                    if swap_slot is slot:
                        continue
                    if swap_slot.type == "Lab":
                        continue
                    
                    target_day = swap_slot.day
                    target_period = swap_slot.period
                    
                    current_sub_on_target = day_counts[target_day].get(slot.subject, 0)
                    swap_sub_on_origin = day_counts[origin_day].get(swap_slot.subject, 0)
                    
                    if current_sub_on_target < 2 and swap_sub_on_origin < 2:
                        key_target = (target_day, target_period)
                        slot_conflict = False
                        if key_target in occupied_map:
                            if slot.lecturer in occupied_map[key_target]['lecturers'] or slot.room in occupied_map[key_target]['rooms']:
                                slot_conflict = True
                                
                        key_origin = (origin_day, origin_period)
                        swap_conflict = False
                        if key_origin in occupied_map:
                            if swap_slot.lecturer in occupied_map[key_origin]['lecturers'] or swap_slot.room in occupied_map[key_origin]['rooms']:
                                swap_conflict = True
                                
                        if not slot_conflict and not swap_conflict:
                            # Swap positions!
                            slot.day = target_day
                            slot.period = target_period
                            swap_slot.day = origin_day
                            swap_slot.period = origin_period
                            
                            day_counts[origin_day][slot.subject] -= 1
                            day_counts[target_day][slot.subject] = day_counts[target_day].get(slot.subject, 0) + 1
                            
                            day_counts[target_day][swap_slot.subject] -= 1
                            day_counts[origin_day][swap_slot.subject] = day_counts[origin_day].get(swap_slot.subject, 0) + 1
                            
                            moved = True
                            print(f"Swapped {slot.subject} with {swap_slot.subject} to balance distribution.")
                            break

    return current_slots


def repair_division_slots_full(
    division_slots: list,
    all_generated_slots: list,
    request: TimetableRequest,
    division_name: str
) -> list:
    """
    Deterministically repairs the generated slots for a division to ensure:
    1. Correct number of periods per subject (no excess, no deficit).
    2. No lecturer double-booking.
    3. No room double-booking.
    4. Lecturer is available on the scheduled days.
    5. At most 2 periods of a Theory subject per day (distribution constraint).
    """
    # 1. Find division
    div = next((d for d in request.divisions if d.name == division_name), None)
    if not div:
        return division_slots

    # Map subjects by code
    subjects_by_code = {s.code: s for s in div.subjects}
    
    # 2. Filter out invalid slots and skip Lab slots (so Labs are always scheduled in consecutive pairs)
    cleaned_slots = []
    for slot in division_slots:
        if slot.division == division_name and slot.subject in subjects_by_code:
            # Skip Labs here so they become deficits and are generated in pairs below
            if subjects_by_code[slot.subject].type == "Lab":
                continue
            cleaned_slots.append(slot)

    # 3. Separate slots by subject and enforce max periods (remove excess)
    slots_by_sub = {s.code: [] for s in div.subjects}
    for slot in cleaned_slots:
        slots_by_sub[slot.subject].append(slot)

    retained_slots = []
    deficits = {}
    for subject in div.subjects:
        req = subject.periods_per_week
        slots = slots_by_sub[subject.code]
        if len(slots) > req:
            retained_slots.extend(slots[:req])
            deficits[subject.code] = 0
        else:
            retained_slots.extend(slots)
            deficits[subject.code] = req - len(slots)

    cleaned_slots = retained_slots

    # Let's map lecturers availability
    lecturers_by_id = {l.id: l for l in request.lecturers}

    # Helper function to get busy maps
    def get_busy_maps(current_slots):
        busy_lecturers = set()
        busy_rooms = set()
        for slot in all_generated_slots:
            busy_lecturers.add((slot.day, slot.period, slot.lecturer))
            busy_rooms.add((slot.day, slot.period, slot.room))
        for slot in current_slots:
            busy_lecturers.add((slot.day, slot.period, slot.lecturer))
            busy_rooms.add((slot.day, slot.period, slot.room))
        return busy_lecturers, busy_rooms

    # Helper to check if a day/period is completely free for this division
    def get_division_occupied(current_slots):
        return {(slot.day, slot.period) for slot in current_slots}

    # Helper to find a free slot for a subject
    def find_free_slot(subject_code, current_slots, exclude_slot=None, strict_dist=True):
        sub = subjects_by_code[subject_code]
        lecturer_id = sub.assigned_lecturer_id
        lect = lecturers_by_id.get(lecturer_id)
        
        # Determine target room type
        expected_room_type = "Lab" if sub.type == "Lab" else "Classroom"
        
        # Build busy maps excluding the current slot if we are moving it
        slots_to_consider = [s for s in current_slots if s is not exclude_slot]
        busy_lecturers, busy_rooms = get_busy_maps(slots_to_consider)
        division_occupied = get_division_occupied(slots_to_consider)

        working_days = request.metadata.working_days
        periods = list(range(1, request.metadata.periods_per_day + 1))
        
        # Sort days by how few times this subject is scheduled on them (distribution)
        day_sub_counts = {day: 0 for day in working_days}
        for s in slots_to_consider:
            if s.subject == subject_code:
                day_sub_counts[s.day] += 1

        # We try to search days. If strict_dist, we only consider days with counts < 2 for Theory.
        for day in working_days:
            # Check lecturer availability
            if lect and day not in lect.available_days:
                continue
            
            # Check Theory distribution count
            if strict_dist and sub.type == "Theory" and day_sub_counts[day] >= 2:
                continue

            for period in periods:
                if (day, period) in division_occupied:
                    continue
                
                # Check lecturer conflict
                if (day, period, lecturer_id) in busy_lecturers:
                    continue
                
                # Find an available room of correct type
                available_room = None
                for room in request.classrooms:
                    if room.type != expected_room_type or room.status != "Available":
                        continue
                    if (day, period, room.id) not in busy_rooms:
                        available_room = room.id
                        break
                
                if available_room:
                    return day, period, available_room
                    
        # If we failed with strict distribution, try without it
        if strict_dist and sub.type == "Theory":
            return find_free_slot(subject_code, current_slots, exclude_slot, strict_dist=False)
            
        return None

    def find_free_consecutive_lab_slots(subject_code, current_slots):
        sub = subjects_by_code[subject_code]
        lecturer_id = sub.assigned_lecturer_id
        lect = lecturers_by_id.get(lecturer_id)
        
        busy_lecturers, busy_rooms = get_busy_maps(current_slots)
        division_occupied = get_division_occupied(current_slots)
        
        working_days = request.metadata.working_days
        # Search pairs: 1-2, 3-4, 5-6, 6-7 (avoiding single hour labs)
        for day in working_days:
            if lect and day not in lect.available_days:
                continue
                
            # Iterate pairs of periods (e.g. 1-2, 3-4, 5-6, 6-7)
            periods_count = request.metadata.periods_per_day
            pairs = []
            for p in range(1, periods_count, 2):
                if p + 1 <= periods_count:
                    pairs.append((p, p + 1))
            # If periods count is odd (like 7), let's also allow scheduling in the last two periods (6-7)
            if periods_count % 2 != 0 and periods_count >= 2:
                if (periods_count - 1, periods_count) not in pairs:
                    pairs.append((periods_count - 1, periods_count))

            for p1, p2 in pairs:
                # Check division occupied for both slots
                if (day, p1) in division_occupied or (day, p2) in division_occupied:
                    continue
                    
                # Check lecturer conflict for both slots
                if (day, p1, lecturer_id) in busy_lecturers or (day, p2, lecturer_id) in busy_lecturers:
                    continue
                    
                # Find a room of type "Lab" free for both periods
                available_room = None
                for room in request.classrooms:
                    if room.type != "Lab" or room.status != "Available":
                        continue
                    if (day, p1, room.id) not in busy_rooms and (day, p2, room.id) not in busy_rooms:
                        available_room = room.id
                        break
                        
                if available_room:
                    return day, p1, p2, available_room
        return None

    # 4. Resolve clashes in existing slots
    resolved_slots = []
    for slot in cleaned_slots:
        sub = subjects_by_code[slot.subject]
        lecturer_id = sub.assigned_lecturer_id
        lect = lecturers_by_id.get(lecturer_id)
        
        # Re-verify/enforce correct lecturer in slot just in case the LLM assigned wrong lecturer
        slot.lecturer = lecturer_id
        
        # Check conflicts
        busy_lecturers, busy_rooms = get_busy_maps(resolved_slots)
        division_occupied = get_division_occupied(resolved_slots)
        
        has_conflict = False
        
        # A. Check division overlap
        if (slot.day, slot.period) in division_occupied:
            has_conflict = True
        # B. Check lecturer double-booking
        elif (slot.day, slot.period, lecturer_id) in busy_lecturers:
            has_conflict = True
        # C. Check room double-booking
        elif (slot.day, slot.period, slot.room) in busy_rooms:
            # Can we fix this room booking by just changing the room?
            expected_room_type = "Lab" if sub.type == "Lab" else "Classroom"
            new_room = None
            for room in request.classrooms:
                if room.type != expected_room_type or room.status != "Available":
                    continue
                if (slot.day, slot.period, room.id) not in busy_rooms:
                    new_room = room.id
                    break
            if new_room:
                slot.room = new_room
            else:
                has_conflict = True
        # D. Check lecturer available day
        elif lect and slot.day not in lect.available_days:
            has_conflict = True
            
        # E. Check metadata ranges
        elif slot.day not in request.metadata.working_days or slot.period < 1 or slot.period > request.metadata.periods_per_day:
            has_conflict = True
            
        if not has_conflict:
            resolved_slots.append(slot)
        else:
            # Relocate slot!
            new_pos = find_free_slot(slot.subject, resolved_slots, exclude_slot=slot)
            if new_pos:
                slot.day, slot.period, slot.room = new_pos
                resolved_slots.append(slot)
            else:
                # If we couldn't relocate, keep it to preserve period counts, but try to fix room
                expected_room_type = "Lab" if sub.type == "Lab" else "Classroom"
                for room in request.classrooms:
                    if room.type == expected_room_type and room.status == "Available":
                        slot.room = room.id
                        break
                resolved_slots.append(slot)

    # 5. Fill deficits (missing periods) - prioritize Lab subjects first to find consecutive slots
    sorted_subject_codes = sorted(deficits.keys(), key=lambda code: 0 if subjects_by_code[code].type == "Lab" else 1)
    
    for subject_code in sorted_subject_codes:
        deficit = deficits[subject_code]
        sub = subjects_by_code[subject_code]
        
        if sub.type == "Lab":
            # Schedule in pairs of 2 consecutive periods (2 hours)
            while deficit >= 2:
                pair = find_free_consecutive_lab_slots(subject_code, resolved_slots)
                if pair:
                    day, p1, p2, room_id = pair
                    slot1 = TimetableSlot(
                        division=division_name,
                        day=day,
                        period=p1,
                        subject=subject_code,
                        lecturer=sub.assigned_lecturer_id,
                        room=room_id,
                        type="Lab"
                    )
                    slot2 = TimetableSlot(
                        division=division_name,
                        day=day,
                        period=p2,
                        subject=subject_code,
                        lecturer=sub.assigned_lecturer_id,
                        room=room_id,
                        type="Lab"
                    )
                    resolved_slots.extend([slot1, slot2])
                    deficit -= 2
                    print(f"Scheduled Lab {subject_code} consecutively on {day} periods {p1}-{p2} in room {room_id}")
                else:
                    print(f"Warning: Could not find consecutive slots for Lab {subject_code} in Div {division_name}")
                    break
            
            # Fallback for remaining odd deficit periods
            for _ in range(deficit):
                new_pos = find_free_slot(subject_code, resolved_slots)
                if new_pos:
                    day, period, room_id = new_pos
                    new_slot = TimetableSlot(
                        division=division_name,
                        day=day,
                        period=period,
                        subject=subject_code,
                        lecturer=sub.assigned_lecturer_id,
                        room=room_id,
                        type="Lab"
                    )
                    resolved_slots.append(new_slot)
                    print(f"Scheduled fallback single Lab {subject_code} on {day} period {period}")
        else:
            # Theory subjects: schedule singly
            for _ in range(deficit):
                new_pos = find_free_slot(subject_code, resolved_slots)
                if new_pos:
                    day, period, room_id = new_pos
                    new_slot = TimetableSlot(
                        division=division_name,
                        day=day,
                        period=period,
                        subject=subject_code,
                        lecturer=sub.assigned_lecturer_id,
                        room=room_id,
                        type="Theory"
                    )
                    resolved_slots.append(new_slot)

    # 6. Optimize distribution to balance the slots
    resolved_slots = optimize_distribution(resolved_slots, all_generated_slots, request)

    return resolved_slots

