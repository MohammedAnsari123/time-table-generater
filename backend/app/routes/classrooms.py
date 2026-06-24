from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.schemas import Classroom
from app.core.database import get_database

router = APIRouter()

@router.get("/", response_model=List[Classroom])
async def list_classrooms(q: Optional[str] = None):
    db = await get_database()
    query = {}
    if q:
        # Search by id (room number), name, building (case-insensitive)
        query = {
            "$or": [
                {"id": {"$regex": q, "$options": "i"}},
                {"name": {"$regex": q, "$options": "i"}},
                {"building": {"$regex": q, "$options": "i"}}
            ]
        }
    cursor = db.classrooms.find(query)
    classroom_docs = await cursor.to_list(length=100)
    return [Classroom(**doc) for doc in classroom_docs]

@router.post("/", response_model=Classroom, status_code=status.HTTP_201_CREATED)
async def create_classroom(room: Classroom):
    db = await get_database()
    existing = await db.classrooms.find_one({"id": room.id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Classroom {room.id} already exists")
    
    room_dict = room.dict()
    room_dict["_id"] = room.id
    await db.classrooms.insert_one(room_dict)
    return room

@router.put("/{room_id}", response_model=Classroom)
async def update_classroom(room_id: str, room: Classroom):
    db = await get_database()
    existing = await db.classrooms.find_one({"id": room_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Classroom {room_id} not found")
    
    room_dict = room.dict()
    room_dict["id"] = room_id
    room_dict["_id"] = room_id
    await db.classrooms.replace_one({"id": room_id}, room_dict)
    return room

@router.delete("/{room_id}")
async def delete_classroom(room_id: str):
    db = await get_database()
    result = await db.classrooms.delete_one({"id": room_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Classroom {room_id} not found")
    return {"message": f"Classroom {room_id} deleted successfully"}
