from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.models.schemas import TimetableRequest, TimetableResponse, TimetableSlot, Classroom
from pydantic import BaseModel
from app.services.llm_service import generate_timetable_with_llm
from datetime import datetime

from app.services.validator import validate_timetable
from app.core.database import get_database
import uuid


router = APIRouter()


@router.get("/stats")
async def get_stats():
    db = await get_database()
    
    # 1. Total Timetables
    total_timetables = await db.timetables.count_documents({})
    
    # 2. Active Classes (Total Slots)
    pipeline_classes = [
        {"$project": {"count": {"$size": "$slots"}}},
        {"$group": {"_id": None, "total_classes": {"$sum": "$count"}}}
    ]
    classes_result = await db.timetables.aggregate(pipeline_classes).to_list(length=1)
    total_classes = classes_result[0]["total_classes"] if classes_result else 0
    
    # 3. Active Lecturers (Unique Lecturers in Slots)
    pipeline_lecturers = [
        {"$unwind": "$slots"},
        {"$group": {"_id": None, "unique_lecturers": {"$addToSet": "$slots.lecturer"}}}
    ]
    lecturers_result = await db.timetables.aggregate(pipeline_lecturers).to_list(length=1)
    total_lecturers = len(lecturers_result[0]["unique_lecturers"]) if lecturers_result else 0
    
    return {
        "total_timetables": total_timetables,
        "active_classes": total_classes,
        "active_lecturers": total_lecturers
    }

from app.services.repair import repair_timetable, resolve_sequential_conflicts, optimize_distribution, repair_division_slots_full

from app.services.prompt_builder import build_single_division_prompt

@router.post("/generate", response_model=TimetableResponse)
async def generate_timetable_endpoint(request: TimetableRequest):
    # Merge labs into classrooms pool if provided
    if request.labs:
        for lab in request.labs:
            if not any(c.id == lab.id for c in request.classrooms):
                request.classrooms.append(
                    Classroom(
                        id=lab.id,
                        name=lab.name,
                        capacity=lab.capacity,
                        building=lab.department,
                        floor=0,
                        type="Lab",
                        status=lab.status
                    )
                )

    all_generated_slots: List[TimetableSlot] = []

    
    # Iterate through each division sequentially
    for division in request.divisions:
        print(f"Generating Timetable for Division: {division.name}")
        
        # Build prompt for THIS division, passing already occupied slots
        current_prompt = build_single_division_prompt(request, division, all_generated_slots)
        
        max_retries = 5
        last_error = None
        division_slots = []
        success = False
        
        for attempt in range(max_retries):
            print(f"  Attempt {attempt + 1}/{max_retries} for Div {division.name}")
            
            # Call LLM
            llm_response = generate_timetable_with_llm(current_prompt)
            if "error" in llm_response:
                print(f"  LLM Error: {llm_response['error']}")
                last_error = f"LLM Error: {llm_response['error']}"
                continue

            try:
                # Parse output
                slots_data = llm_response.get("slots", [])
                division_slots = [TimetableSlot(**slot) for slot in slots_data]
                
                # Check 1: Subject Load for THIS division
                # (Simple check locally before full validation)
                # 3.5 REPAIR ALGORITHM (Deterministic Fix)
                # Try to move conflicts and fill deficits BEFORE validation
                division_slots = repair_division_slots_full(division_slots, all_generated_slots, request, division.name)

                # Check 2: Global Conflicts (Is it clashing with all_generated_slots?)
                # We can use our validator by constructing a temporary "partial" timetable
                temp_slots = all_generated_slots + division_slots
                
                temp_response = TimetableResponse(
                    timetable_id="temp",
                    metadata=request.metadata,
                    divisions=request.divisions,
                    lecturers=request.lecturers,
                    classrooms=request.classrooms,
                    slots=temp_slots
                )
                
                # Validate
                # We only validate the current division's requirements + global conflicts
                validation_result = validate_timetable(temp_response, request, specific_divisions=[division.name])
                
                # Filter errors relevant to THIS division (optional, or just take any error)
                if validation_result["valid"]:
                    print(f"  Division {division.name} valid!")
                    success = True
                    break # Break retry loop
                else:
                    print(f"  Validation Failed: {validation_result['errors']}")
                    last_error = str(validation_result['errors'])
                    
                    # Refine Prompt
                    current_prompt += f"\n\nCRITICAL: The previous generation was INVALID. Violations:\n"
                    current_prompt += "\n".join([f"- {e}" for e in validation_result["errors"] if division.name in e or "double-booked" in e]) # focused errors
                    current_prompt += "\n\nPlease try again used UNUSED time slots."

            except Exception as e:
                print(f"  Parsing Error: {e}")
                last_error = f"Parsing Error: {e}"
                current_prompt += f"\n\nJSON Parsing Error: {e}. Output valid JSON only."

        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to generate valid schedule for Division {division.name} after retries. Errors: {last_error}")
        
        # If successful, add these slots to the global list
        all_generated_slots.extend(division_slots)

    # All divisions done. Store result.
    final_response = TimetableResponse(
        timetable_id=str(uuid.uuid4()),
        metadata=request.metadata,
        divisions=request.divisions,
        lecturers=request.lecturers,
        classrooms=request.classrooms,
        slots=all_generated_slots,
        created_at=datetime.utcnow()
    )
    
    db = await get_database()
    timetable_dict = final_response.dict()
    timetable_dict["_id"] = timetable_dict["timetable_id"]
    await db.timetables.insert_one(timetable_dict)
    
    return final_response

@router.get("/list/all", response_model=List[TimetableResponse])
async def list_timetables():
    db = await get_database()
    cursor = db.timetables.find().sort("created_at", -1)
    timetables = await cursor.to_list(length=100)
    return [TimetableResponse(**doc) for doc in timetables]

@router.delete("/{timetable_id}")
async def delete_timetable(timetable_id: str):
    db = await get_database()
    result = await db.timetables.delete_one({"timetable_id": timetable_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Timetable not found")
    return {"message": "Timetable deleted successfully"}

@router.get("/{timetable_id}", response_model=TimetableResponse)
async def get_timetable(timetable_id: str):
    db = await get_database()
    
    if timetable_id == "latest":
        # Find the most recently created timetable
        timetable_doc = await db.timetables.find_one(sort=[("_id", -1)]) # Crude "latest" check by insertion order if IDs were sequential, better to have created_at
        # Since UUIDs aren't sequential, we might just grab *any* one or ideally sort by added timestamp if we had it.
        # For MVP, let's just find one.
        if not timetable_doc:
             # Try falling back to ANY one
             timetable_doc = await db.timetables.find_one()
    else:
        timetable_doc = await db.timetables.find_one({"timetable_id": timetable_id})
        
    if not timetable_doc:
        raise HTTPException(status_code=404, detail="Timetable not found")
        
    return TimetableResponse(**timetable_doc)

class RegenerateRequest(BaseModel):
    timetable_id: str
    additional_constraints: str

@router.post("/regenerate", response_model=TimetableResponse)
async def regenerate_timetable(request: RegenerateRequest):
    db = await get_database()
    
    # 1. Fetch original timetable
    original_doc = await db.timetables.find_one({"timetable_id": request.timetable_id})
    if not original_doc:
         raise HTTPException(status_code=404, detail="Original timetable not found")
    
    original_timetable = TimetableResponse(**original_doc)
    
    # 2. Reconstruct Request
    new_constraints = [request.additional_constraints] if request.additional_constraints else []
    
    # Merge labs into classrooms pool if provided
    if original_timetable.labs:
        for lab in original_timetable.labs:
            if not any(c.id == lab.id for c in original_timetable.classrooms):
                original_timetable.classrooms.append(
                    Classroom(
                        id=lab.id,
                        name=lab.name,
                        capacity=lab.capacity,
                        building=lab.department,
                        floor=0,
                        type="Lab",
                        status=lab.status
                    )
                )

    # TimetableRequest for reference (used in prompt building)
    prompt_request = TimetableRequest(
        metadata=original_timetable.metadata,
        divisions=original_timetable.divisions, 
        lecturers=original_timetable.lecturers,
        classrooms=original_timetable.classrooms,
        labs=original_timetable.labs,
        constraints=new_constraints 
    )

    
    all_generated_slots: List[TimetableSlot] = []
    
    # 3. Iterate Divisions (Reuse Logic)
    for division in original_timetable.divisions:
        print(f"Regenerating for Division: {division.name}")
        
        current_prompt = build_single_division_prompt(prompt_request, division, all_generated_slots)
        if new_constraints:
            current_prompt += f"\n\nADDITIONAL USER CONSTRAINTS:\n" + "\n".join([f"- {c}" for c in new_constraints])
        
        max_retries = 5
        last_error = None
        division_slots = []
        success = False
        
        for attempt in range(max_retries):
            # print(f"  Attempt {attempt + 1}/{max_retries}")
            llm_response = generate_timetable_with_llm(current_prompt)
            
            if "error" in llm_response:
                last_error = f"LLM Error: {llm_response['error']}"
                continue
                
            try:
                slots_data = llm_response.get("slots", [])
                division_slots = [TimetableSlot(**slot) for slot in slots_data]
                
                # Repairs & Optims
                division_slots = repair_division_slots_full(division_slots, all_generated_slots, prompt_request, division.name)
                
                # Validate
                temp_slots = all_generated_slots + division_slots
                temp_response = TimetableResponse(
                    timetable_id="temp",
                    metadata=prompt_request.metadata,
                    divisions=prompt_request.divisions,
                    lecturers=prompt_request.lecturers,
                    classrooms=prompt_request.classrooms,
                    slots=temp_slots
                )
                
                validation_result = validate_timetable(temp_response, prompt_request, specific_divisions=[division.name])
                
                if validation_result["valid"]:
                    success = True
                    break
                else:
                    # print(f"  Validation Failed: {validation_result['errors']}")
                    last_error = str(validation_result['errors'])
                    current_prompt += f"\n\nCRITICAL: Invalid generation. Violations:\n" + "\n".join([f"- {e}" for e in validation_result["errors"]])

            except Exception as e:
                last_error = f"Parsing Error: {e}"
                
        if not success:
             raise HTTPException(status_code=500, detail=f"Failed to regenerate for Div {division.name}: {last_error}")
             
        all_generated_slots.extend(division_slots)

    # 4. Save New Timetable
    new_timetable = TimetableResponse(
        timetable_id=str(uuid.uuid4()),
        metadata=original_timetable.metadata,
        divisions=original_timetable.divisions,
        lecturers=original_timetable.lecturers,
        classrooms=original_timetable.classrooms,
        slots=all_generated_slots,
        created_at=datetime.utcnow()
    )
    
    timetable_dict = new_timetable.dict()
    timetable_dict["_id"] = timetable_dict["timetable_id"]
    await db.timetables.insert_one(timetable_dict)
    
    return new_timetable


class TimetableUpdateSlotsRequest(BaseModel):
    slots: List[TimetableSlot]

@router.put("/{timetable_id}/slots", response_model=TimetableResponse)
async def update_timetable_slots(timetable_id: str, payload: TimetableUpdateSlotsRequest):
    db = await get_database()
    
    # 1. Fetch original timetable
    timetable_doc = await db.timetables.find_one({"timetable_id": timetable_id})
    if not timetable_doc:
        raise HTTPException(status_code=404, detail="Timetable not found")
        
    # 2. Update slots in MongoDB
    slots_data = [slot.dict() for slot in payload.slots]
    await db.timetables.update_one(
        {"timetable_id": timetable_id},
        {"$set": {"slots": slots_data}}
    )
    
    # 3. Return updated timetable
    updated_doc = await db.timetables.find_one({"timetable_id": timetable_id})
    return TimetableResponse(**updated_doc)

