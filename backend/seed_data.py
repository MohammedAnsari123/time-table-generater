import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load env variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "timetable_db")

async def seed():
    print(f"Connecting to MongoDB: {MONGO_URI} (DB: {MONGO_DB_NAME})")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB_NAME]

    # 1. Seed Staff
    staff_data = [
        {
            "id": "ST-01",
            "name": "Dr. Sharma",
            "email": "sharma@institution.edu",
            "department": "Computer Science",
            "designation": "Professor",
            "subjects": ["DBMS", "Artificial Intelligence", "DBMS Lab"],
            "max_periods_per_day": 4,
            "max_periods_per_week": 16,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "preferred_slots": ["Monday P1", "Wednesday P2"],
            "status": "Active"
        },
        {
            "id": "ST-02",
            "name": "Prof. Khan",
            "email": "khan@institution.edu",
            "department": "Computer Science",
            "designation": "Associate Professor",
            "subjects": ["Operating Systems", "Computer Networks", "Networks Lab"],
            "max_periods_per_day": 4,
            "max_periods_per_week": 16,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "preferred_slots": ["Tuesday P3"],
            "status": "Active"
        },
        {
            "id": "ST-03",
            "name": "Dr. Patel",
            "email": "patel@institution.edu",
            "department": "Information Technology",
            "designation": "Assistant Professor",
            "subjects": ["Software Engineering", "Web Technology"],
            "max_periods_per_day": 4,
            "max_periods_per_week": 16,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday"],
            "preferred_slots": None,
            "status": "Active"
        }
    ]
    
    print("Seeding Staff...")
    await db.staff.delete_many({})
    for s in staff_data:
        s["_id"] = s["id"]
        await db.staff.insert_one(s)
    print(f"Inserted {len(staff_data)} staff members.")

    # 2. Seed Subjects
    subjects_data = [
        {
            "code": "CS-301",
            "name": "DBMS",
            "type": "Theory",
            "periods_per_week": 4,
            "assigned_lecturer_id": "ST-01",
            "semester": 5,
            "department": "Computer Science",
            "credits": 4,
            "lab_requirement": False
        },
        {
            "code": "CS-302",
            "name": "Operating Systems",
            "type": "Theory",
            "periods_per_week": 4,
            "assigned_lecturer_id": "ST-02",
            "semester": 5,
            "department": "Computer Science",
            "credits": 4,
            "lab_requirement": False
        },
        {
            "code": "CS-303",
            "name": "Computer Networks",
            "type": "Theory",
            "periods_per_week": 4,
            "assigned_lecturer_id": "ST-02",
            "semester": 5,
            "department": "Computer Science",
            "credits": 4,
            "lab_requirement": False
        },
        {
            "code": "CS-304",
            "name": "Artificial Intelligence",
            "type": "Theory",
            "periods_per_week": 3,
            "assigned_lecturer_id": "ST-01",
            "semester": 7,
            "department": "Computer Science",
            "credits": 3,
            "lab_requirement": False
        },
        {
            "code": "CS-301L",
            "name": "DBMS Lab",
            "type": "Lab",
            "periods_per_week": 2,
            "assigned_lecturer_id": "ST-01",
            "semester": 5,
            "department": "Computer Science",
            "credits": 2,
            "lab_requirement": True
        },
        {
            "code": "CS-303L",
            "name": "Networks Lab",
            "type": "Lab",
            "periods_per_week": 2,
            "assigned_lecturer_id": "ST-02",
            "semester": 5,
            "department": "Computer Science",
            "credits": 2,
            "lab_requirement": True
        }
    ]

    print("Seeding Subjects...")
    await db.subjects.delete_many({})
    for sub in subjects_data:
        sub["_id"] = sub["code"]
        await db.subjects.insert_one(sub)
    print(f"Inserted {len(subjects_data)} subjects.")

    # 3. Seed Classrooms
    classrooms_data = [
        {
            "id": "CR-101",
            "name": "Lecture Hall 101",
            "capacity": 60,
            "building": "Main Block",
            "floor": 1,
            "type": "Classroom",
            "status": "Available"
        },
        {
            "id": "CR-102",
            "name": "Lecture Hall 102",
            "capacity": 60,
            "building": "Main Block",
            "floor": 1,
            "type": "Classroom",
            "status": "Available"
        },
        {
            "id": "CR-201",
            "name": "Seminar Room 201",
            "capacity": 80,
            "building": "Science Block",
            "floor": 2,
            "type": "Classroom",
            "status": "Available"
        }
    ]

    print("Seeding Classrooms...")
    await db.classrooms.delete_many({})
    for room in classrooms_data:
        room["_id"] = room["id"]
        await db.classrooms.insert_one(room)
    print(f"Inserted {len(classrooms_data)} classrooms.")

    # 4. Seed Laboratories
    labs_data = [
        {
            "id": "LAB-01",
            "name": "Database & Software Lab",
            "capacity": 30,
            "department": "Computer Science",
            "supported_subjects": ["CS-301L"],
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "status": "Available"
        },
        {
            "id": "LAB-02",
            "name": "Networking & Hardware Lab",
            "capacity": 30,
            "department": "Computer Science",
            "supported_subjects": ["CS-303L"],
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "status": "Available"
        },
        {
            "id": "LAB-03",
            "name": "Advanced Research Lab",
            "capacity": 20,
            "department": "Computer Science",
            "supported_subjects": [],
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "status": "Available"
        }
    ]

    print("Seeding Laboratories...")
    await db.labs.delete_many({})
    for lab in labs_data:
        lab["_id"] = lab["id"]
        await db.labs.insert_one(lab)
    print(f"Inserted {len(labs_data)} laboratories.")

    client.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
