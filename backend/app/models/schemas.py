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
class Lecturer(BaseModel):
    id: str
    name: str
    subjects: List[str]
    max_periods_per_day: int = 4
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

class Subject(BaseModel):
    code: str
    name: str
    type: Literal["Theory", "Lab"]
    periods_per_week: int
    assigned_lecturer_id: Optional[str] = None

class Classroom(BaseModel):
    id: str
    capacity: int
    type: Literal["Classroom", "Lab"]

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
    lecturers: List[Lecturer] # Global Pool
    classrooms: List[Classroom] # Global Pool
    constraints: Optional[List[str]] = None

class TimetableSlot(BaseModel):
    division: str # ADDED
    day: str
    period: int
    subject: str
    lecturer: str
    room: str
    type: str

class TimetableResponse(BaseModel):
    timetable_id: str
    metadata: TimetableMetadata
    divisions: List[Division]
    lecturers: List[Lecturer]
    classrooms: List[Classroom]
    slots: List[TimetableSlot]
