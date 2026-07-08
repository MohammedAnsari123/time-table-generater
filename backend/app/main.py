from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import timetable

app = FastAPI(title="Time Table Generator AI Microservice")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Time Table Generator AI Microservice is running"}

app.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
