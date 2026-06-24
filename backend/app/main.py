from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, timetable, staff, subjects, classrooms, labs
from app.core.database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Time Table Generator Tool", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Time Table Generator API is running"}

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
app.include_router(staff.router, prefix="/staff", tags=["Staff"])
app.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
app.include_router(classrooms.router, prefix="/classrooms", tags=["Classrooms"])
app.include_router(labs.router, prefix="/labs", tags=["Laboratories"])
