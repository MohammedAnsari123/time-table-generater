from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.models.schemas import Staff
from app.core.database import get_database

router = APIRouter()

@router.get("/", response_model=List[Staff])
async def list_staff(q: Optional[str] = None):
    db = await get_database()
    query = {}
    if q:
        # Search by ID, Name, Department, Designation, or associated subjects (case-insensitive)
        query = {
            "$or": [
                {"id": {"$regex": q, "$options": "i"}},
                {"name": {"$regex": q, "$options": "i"}},
                {"department": {"$regex": q, "$options": "i"}},
                {"designation": {"$regex": q, "$options": "i"}},
                {"subjects": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        }
    cursor = db.staff.find(query)
    staff_docs = await cursor.to_list(length=100)
    return [Staff(**doc) for doc in staff_docs]

@router.post("/", response_model=Staff, status_code=status.HTTP_201_CREATED)
async def create_staff(staff_member: Staff):
    db = await get_database()
    existing = await db.staff.find_one({"id": staff_member.id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Staff member with ID {staff_member.id} already exists")
    
    staff_dict = staff_member.dict()
    staff_dict["_id"] = staff_member.id
    await db.staff.insert_one(staff_dict)
    return staff_member

@router.put("/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_member: Staff):
    db = await get_database()
    existing = await db.staff.find_one({"id": staff_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Staff member {staff_id} not found")
    
    staff_dict = staff_member.dict()
    # Force ID alignment
    staff_dict["id"] = staff_id
    staff_dict["_id"] = staff_id
    await db.staff.replace_one({"id": staff_id}, staff_dict)
    return staff_member

@router.delete("/{staff_id}")
async def delete_staff(staff_id: str):
    db = await get_database()
    result = await db.staff.delete_one({"id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Staff member {staff_id} not found")
    return {"message": f"Staff member {staff_id} deleted successfully"}
