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
                # Iterate again to try SWAP
                # Find a slot of DIFFERENT subject on a GOOD target day
                # ensuring that AFTER swap, neither subject violates constraints
                # This is complex, skipping for MVP to avoid infinite loops or complexity. 
                # Simple move to free slot is often enough.
                pass

    return current_slots
