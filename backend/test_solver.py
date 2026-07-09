import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.schemas import TimetableRequest, TimetableMetadata, Division, Subject, Lecturer, Classroom, Laboratory
from app.services.solver import schedule_with_ortools

def run_test():
    # 1. Setup Feasible Request
    metadata = TimetableMetadata(
        institution_name="Test College",
        department="Computer Science",
        semester=5,
        academic_year="2026",
        working_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        periods_per_day=7
    )
    
    div_a = Division(
        name="Div A",
        strength=60,
        subjects=[
            Subject(code="CS-301", name="DBMS", type="Theory", periods_per_week=4, assigned_lecturer_id="ST-01"),
            Subject(code="CS-302", name="OS", type="Theory", periods_per_week=4, assigned_lecturer_id="ST-02"),
            Subject(code="CS-303", name="OS Lab", type="Lab", periods_per_week=2, assigned_lecturer_id="ST-02", lab_requirement=True)
        ]
    )
    
    div_b = Division(
        name="Div B",
        strength=60,
        subjects=[
            Subject(code="CS-301", name="DBMS", type="Theory", periods_per_week=4, assigned_lecturer_id="ST-01"),
            Subject(code="CS-302", name="OS", type="Theory", periods_per_week=4, assigned_lecturer_id="ST-02"),
            Subject(code="CS-303", name="OS Lab", type="Lab", periods_per_week=2, assigned_lecturer_id="ST-01", lab_requirement=True)
        ]
    )
    
    lecturers = [
        Lecturer(id="ST-01", name="Dr. Sharma", max_periods_per_day=4, max_periods_per_week=20, available_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
        Lecturer(id="ST-02", name="Prof. Khan", max_periods_per_day=4, max_periods_per_week=20, available_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    ]
    
    rooms = [
        Classroom(id="CR-101", name="Room 101", capacity=60, type="Classroom", status="Available"),
        Classroom(id="LB-101", name="Lab 101", capacity=60, type="Lab", status="Available")
    ]
    
    request_feasible = TimetableRequest(
        metadata=metadata,
        divisions=[div_a, div_b],
        lecturers=lecturers,
        classrooms=rooms
    )
    
    print("--- Test 1: Feasible Timetable Schedule ---")
    result = schedule_with_ortools(request_feasible)
    print("Result Status:", result.get("status"))
    if result.get("status") == "SUCCESS":
        print("Success! Number of slots scheduled:", len(result["slots"]))
        # Print a sample of scheduled slots
        for slot in result["slots"][:5]:
            print(f"  Div {slot['division']} | {slot['day']} P{slot['period']} | {slot['subject']} | Lec: {slot['lecturer']} | Room: {slot['room']}")
    else:
        print("Error: Feasible test failed!", result.get("error"))
        assert False, "Feasible timetable failed to schedule!"

    # 2. Setup Infeasible Request (Lecturer ST-01 over-allocated)
    print("\n--- Test 2: Infeasible Timetable (Lecturer Over-allocated) ---")
    div_a_infeasible = Division(
        name="Div A",
        strength=60,
        subjects=[
            Subject(code="CS-301", name="DBMS", type="Theory", periods_per_week=25, assigned_lecturer_id="ST-01")
        ]
    )
    request_infeasible = TimetableRequest(
        metadata=metadata,
        divisions=[div_a_infeasible],
        lecturers=lecturers, # ST-01 max_periods_per_week is 20, but assigned 25
        classrooms=rooms
    )
    result_inf = schedule_with_ortools(request_infeasible)
    print("Result Status:", result_inf.get("status"))
    print("Conflicts reported:")
    for clash in result_inf.get("conflicts", []):
        print(f"  - {clash}")
    assert result_inf.get("status") == "INFEASIBLE"
    assert len(result_inf.get("conflicts", [])) > 0
    print("Infeasible test passed successfully!")

if __name__ == "__main__":
    run_test()
