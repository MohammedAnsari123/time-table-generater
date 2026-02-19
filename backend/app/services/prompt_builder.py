from app.models.schemas import TimetableRequest, Division, TimetableSlot
import json
from typing import List

def build_single_division_prompt(request: TimetableRequest, current_division: Division, occupied_slots: List[TimetableSlot]) -> str:
    """
    Builds a prompt to generate a timetable for ONE specific division,
    considering already occupied slots from other divisions as HARD CONSTRAINTS.
    """
    
    # 1. Format Division Requirements
    req_list = "\n".join([f"      - {s.code} ({s.type}): {s.periods_per_week} periods" for s in current_division.subjects])
    division_reqs = f"    DIVISION {current_division.name}:\n{req_list}\n"

    # 2. Format Occupied Slots (Constraints)
    # We need to list which Lecturers and Rooms are BUSY at specific times.
    # Format: "Monday Period 1: Lecturer L1 is BUSY, Room R1 is BUSY"
    blocked_times_desc = ""
    if occupied_slots:
        blocked_map = {} # Key: (Day, Period) -> List of strings like "L1 BUSY", "R1 BUSY"
        for slot in occupied_slots:
            key = (slot.day, slot.period)
            if key not in blocked_map:
                blocked_map[key] = []
            blocked_map[key].append(f"Lecturer {slot.lecturer} (Div {slot.division})")
            blocked_map[key].append(f"Room {slot.room} (Div {slot.division})")
        
        blocked_times_desc = "    ALREADY OCCUPIED RESOURCES (HARD CONSTRAINTS):\n"
        for (day, period), conflicts in blocked_map.items():
            blocked_times_desc += f"    - {day} Period {period}: {', '.join(conflicts)}\n"
    else:
        blocked_times_desc = "    (No other divisions scheduled yet - all resources free)"

    # 3. Construct Prompt
    prompt = f"""
    Generate a conflict-free timetable for DIVISION {current_division.name}.
    
    METADATA:
    - Institution: {request.metadata.institution_name}
    - Department: {request.metadata.department}
    - Semester: {request.metadata.semester}
    - Working Days: {', '.join(request.metadata.working_days)}
    - Periods per Day: {request.metadata.periods_per_day}
    
    GLOBAL RESOURCES:
    - Lecturers: {json.dumps([l.dict() for l in request.lecturers], indent=2)}
    - Classrooms: {json.dumps([c.dict() for c in request.classrooms], indent=2)}
    
    REQUIREMENTS FOR DIVISION {current_division.name}:
    {division_reqs}
    
    {blocked_times_desc}
    
    CONSTRAINTS:
    1. **NO DOUBLE BOOKING**: You MUST NOT assign a Lecturer or Room listed in "ALREADY OCCUPIED RESOURCES" for that specific Day/Period.
    2. **Lecturer Availability**: Respect the `available_days` for each lecturer.
    3. **Labs**: Must be consecutive periods (e.g., Period 1-2, 3-4, etc.) if possible.
    4. **Subject Load**: You MUST assign exactly the number of periods specified for each subject for this division.
    5. **Output**: Generate slots ONLY for Division {current_division.name}.
    6. **DISTRIBUTION**: SPREAD subjects across the week. Do NOT schedule more than 2 periods of the same Theory subject on the same day unless unavoidable.
    
    OUTPUT FORMAT (JSON ONLY, NO EXPLANATION):
    {{
        "slots": [
            {{ "division": "{current_division.name}", "day": "Monday", "period": 1, "subject": "SUB1", "lecturer": "L1", "room": "R1", "type": "Theory" }},
            ...
        ]
    }}
    """
    return prompt
