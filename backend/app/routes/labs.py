from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.schemas import Laboratory
from app.core.database import get_database

router = APIRouter()

@router.get("/", response_model=List[Laboratory])
async def list_labs(q: Optional[str] = None):
    db = await get_database()
    query = {}
    if q:
        # Search by id (lab number), name, department (case-insensitive)
        query = {
            "$or": [
                {"id": {"$regex": q, "$options": "i"}},
                {"name": {"$regex": q, "$options": "i"}},
                {"department": {"$regex": q, "$options": "i"}},
                {"supported_subjects": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        }
    cursor = db.labs.find(query)
    lab_docs = await cursor.to_list(length=100)
    return [Laboratory(**doc) for doc in lab_docs]

@router.post("/", response_model=Laboratory, status_code=status.HTTP_201_CREATED)
async def create_lab(lab: Laboratory):
    db = await get_database()
    existing = await db.labs.find_one({"id": lab.id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Laboratory {lab.id} already exists")
    
    lab_dict = lab.dict()
    lab_dict["_id"] = lab.id
    await db.labs.insert_one(lab_dict)
    return lab

@router.put("/{lab_id}", response_model=Laboratory)
async def update_lab(lab_id: str, lab: Laboratory):
    db = await get_database()
    existing = await db.labs.find_one({"id": lab_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Laboratory {lab_id} not found")
    
    lab_dict = lab.dict()
    lab_dict["id"] = lab_id
    lab_dict["_id"] = lab_id
    await db.labs.replace_one({"id": lab_id}, lab_dict)
    return lab

@router.delete("/{lab_id}")
async def delete_lab(lab_id: str):
    db = await get_database()
    result = await db.labs.delete_one({"id": lab_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Laboratory {lab_id} not found")
    return {"message": f"Laboratory {lab_id} deleted successfully"}
