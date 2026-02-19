from app.models.schemas import TimetableResponse, TimetableRequest

def validate_timetable(timetable: TimetableResponse, request: TimetableRequest, specific_divisions: list[str] = None) -> dict:
    errors = []
    
    # 1. Check for GLOBAL lecturer conflicts (across all divisions)
    lecturer_schedule = {}
    for slot in timetable.slots:
        # Key: (Day, Period, Lecturer) -> must be unique globally
        key = (slot.day, slot.period, slot.lecturer)
        if key in lecturer_schedule:
            prev_slot = lecturer_schedule[key]
            errors.append(f"Lecturer {slot.lecturer} double-booked on {slot.day} P{slot.period} (Div {slot.division} & Div {prev_slot.division})")
        lecturer_schedule[key] = slot

    # 2. Check for GLOBAL room conflicts
    room_schedule = {}
    for slot in timetable.slots:
        # Key: (Day, Period, Room) -> must be unique globally
        key = (slot.day, slot.period, slot.room)
        if key in room_schedule:
            prev_slot = room_schedule[key]
            errors.append(f"Room {slot.room} double-booked on {slot.day} P{slot.period} (Div {slot.division} & Div {prev_slot.division})")
        room_schedule[key] = slot

    # 3. Check Subject Period Counts PER DIVISION
    # Map: Division -> Subject -> Count
    div_subject_counts = {d.name: {s.code: 0 for s in d.subjects} for d in request.divisions}
    
    for slot in timetable.slots:
        if slot.division in div_subject_counts:
            if slot.subject in div_subject_counts[slot.division]:
                div_subject_counts[slot.division][slot.subject] += 1
            else:
                 # Warn about unknown subject for this division, but maybe not error if it's a valid global subject?
                 # Ideally, slots should only contain subjects assigned to that division.
                 pass
        else:
             errors.append(f"Unknown division '{slot.division}' in slot")

    for div in request.divisions:
        # If specific_divisions is set, skip validation for divisions NOT in the list
        if specific_divisions is not None and div.name not in specific_divisions:
            continue
            
        for subject in div.subjects:
            count = div_subject_counts.get(div.name, {}).get(subject.code, 0)
            if count != subject.periods_per_week:
                errors.append(f"Div {div.name}: Subject {subject.code} has {count} periods, expected {subject.periods_per_week}")

    # 4. Check Metadata Validity (Days and Periods)
    valid_days = set(request.metadata.working_days)
    max_period = request.metadata.periods_per_day
    
    for slot in timetable.slots:
        if slot.day not in valid_days:
            errors.append(f"Invalid day '{slot.day}' in slot for {slot.subject}")
        if slot.period < 1 or slot.period > max_period:
            errors.append(f"Invalid period {slot.period} in slot for {slot.subject}")

    # 5. Check Distribution (Max 2 periods per day for Theory)
    # Map: Division -> Day -> Subject -> Count
    div_day_counts = {}
    for slot in timetable.slots:
        if slot.type == 'Lab': continue # Labs can exceed 2 periods
        
        if slot.division not in div_day_counts: div_day_counts[slot.division] = {}
        if slot.day not in div_day_counts[slot.division]: div_day_counts[slot.division][slot.day] = {}
        
        current = div_day_counts[slot.division][slot.day].get(slot.subject, 0)
        div_day_counts[slot.division][slot.day][slot.subject] = current + 1
        
        if current + 1 > 2:
            errors.append(f"Div {slot.division}: Subject {slot.subject} exceeds 2 periods on {slot.day}")

    return {
        "valid": len(errors) == 0,
        "errors": errors
    }
