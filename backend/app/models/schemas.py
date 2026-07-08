from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Literal

# --- Auth Models ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Timetable Models ---
# --- Timetable Models ---
class Staff(BaseModel):
    id: str # Staff ID
    name: str
    email: Optional[EmailStr] = None
    department: str = ""
    designation: str = ""
    subjects: List[str] = []
    max_periods_per_day: int = 4
    max_periods_per_week: int = 20
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    preferred_slots: Optional[List[str]] = None
    semesters: List[int] = []
    status: Literal["Active", "Inactive"] = "Active"

# Maintain compatibility alias for the scheduling engine
Lecturer = Staff

class Subject(BaseModel):
    code: str
    name: str
    type: Literal["Theory", "Lab"]
    periods_per_week: int
    assigned_lecturer_id: Optional[str] = None
    semester: Optional[int] = 1
    semesters: List[int] = []
    department: Optional[str] = ""
    credits: Optional[int] = 3
    lab_requirement: bool = False

class Classroom(BaseModel):
    id: str # Room Number
    name: str = ""
    capacity: int
    building: str = ""
    floor: int = 0
    type: Literal["Classroom", "Lab"] = "Classroom"
    status: Literal["Available", "Unavailable"] = "Available"

class Laboratory(BaseModel):
    id: str # Lab Number
    name: str
    capacity: int
    department: str
    supported_subjects: List[str]
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    status: Literal["Available", "Unavailable"] = "Available"

class TimetableMetadata(BaseModel):
    institution_name: str
    department: str
    semester: int
    academic_year: str
    working_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day: int = 7
    breaks: List[str] = ["Lunch"]


class Division(BaseModel):
    name: str
    strength: int = 60
    subjects: List[Subject] # Each division has its own subject constraints (e.g. maybe different teachers for same subject code?)

class TimetableRequest(BaseModel):
    metadata: TimetableMetadata
    divisions: List[Division] # MULTI-DIVISION SUPPORT
    lecturers: List[Lecturer] # Global Pool (Staff)
    classrooms: List[Classroom] # Global Pool
    labs: Optional[List[Laboratory]] = [] # Global Pool of Labs
    constraints: Optional[List[str]] = None

class TimetableSlot(BaseModel):
    division: str # ADDED
    day: str
    period: int
    subject: str
    lecturer: str
    room: str
    type: str

from datetime import datetime

class TimetableResponse(BaseModel):
    timetable_id: str
    metadata: TimetableMetadata
    divisions: List[Division]
    lecturers: List[Lecturer]
    classrooms: List[Classroom]
    labs: Optional[List[Laboratory]] = []
    slots: List[TimetableSlot]
    created_at: Optional[datetime] = None

class AutoAllocateRequest(BaseModel):
    department: str
    semester: int
    divisions: List[Division]
    subjects: List[Subject]
    lecturers: List[Lecturer]

class AutoAllocateResponse(BaseModel):
    divisions: List[Division]

