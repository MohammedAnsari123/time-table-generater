from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.models.schemas import Lecturer
from app.core.database import get_database

router = APIRouter()

@router.get("/", response_model=List[Lecturer])
async def list_lecturers(q: Optional[str] = None):
    db = await get_database()
    query = {}
    if q:
        # Search by ID, Name, or associated subjects (case-insensitive)
        query = {
            "$or": [
                {"id": {"$regex": q, "$options": "i"}},
                {"name": {"$regex": q, "$options": "i"}},
                {"subjects": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        }
    cursor = db.lecturers.find(query)
    lecturers_docs = await cursor.to_list(length=100)
    return [Lecturer(**doc) for doc in lecturers_docs]

@router.post("/", response_model=Lecturer, status_code=status.HTTP_201_CREATED)
async def create_lecturer(lecturer: Lecturer):
    db = await get_database()
    existing = await db.lecturers.find_one({"id": lecturer.id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Lecturer with ID {lecturer.id} already exists")
    
    lecturer_dict = lecturer.dict()
    lecturer_dict["_id"] = lecturer.id
    await db.lecturers.insert_one(lecturer_dict)
    return lecturer

@router.put("/{lecturer_id}", response_model=Lecturer)
async def update_lecturer(lecturer_id: str, lecturer: Lecturer):
    db = await get_database()
    existing = await db.lecturers.find_one({"id": lecturer_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Lecturer {lecturer_id} not found")
    
    lecturer_dict = lecturer.dict()
    # Force ID alignment
    lecturer_dict["id"] = lecturer_id
    lecturer_dict["_id"] = lecturer_id
    await db.lecturers.replace_one({"id": lecturer_id}, lecturer_dict)
    return lecturer

@router.delete("/{lecturer_id}")
async def delete_lecturer(lecturer_id: str):
    db = await get_database()
    result = await db.lecturers.delete_one({"id": lecturer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Lecturer {lecturer_id} not found")
    return {"message": f"Lecturer {lecturer_id} deleted successfully"}
