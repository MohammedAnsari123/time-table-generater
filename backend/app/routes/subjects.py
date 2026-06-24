from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.models.schemas import Subject
from app.core.database import get_database

router = APIRouter()

@router.get("/", response_model=List[Subject])
async def list_subjects(q: Optional[str] = None):
    db = await get_database()
    query = {}
    if q:
        # Search by code, name, or department (case-insensitive)
        query = {
            "$or": [
                {"code": {"$regex": q, "$options": "i"}},
                {"name": {"$regex": q, "$options": "i"}},
                {"department": {"$regex": q, "$options": "i"}}
            ]
        }
    cursor = db.subjects.find(query)
    subjects_docs = await cursor.to_list(length=100)
    return [Subject(**doc) for doc in subjects_docs]

@router.post("/", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(subject: Subject):
    db = await get_database()
    existing = await db.subjects.find_one({"code": subject.code})
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject with code {subject.code} already exists")
    
    subject_dict = subject.dict()
    subject_dict["_id"] = subject.code
    await db.subjects.insert_one(subject_dict)
    return subject

@router.put("/{subject_code}", response_model=Subject)
async def update_subject(subject_code: str, subject: Subject):
    db = await get_database()
    existing = await db.subjects.find_one({"code": subject_code})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Subject {subject_code} not found")
    
    subject_dict = subject.dict()
    # Force code alignment
    subject_dict["code"] = subject_code
    subject_dict["_id"] = subject_code
    await db.subjects.replace_one({"code": subject_code}, subject_dict)
    return subject

@router.delete("/{subject_code}")
async def delete_subject(subject_code: str):
    db = await get_database()
    result = await db.subjects.delete_one({"code": subject_code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Subject {subject_code} not found")
    return {"message": f"Subject {subject_code} deleted successfully"}
