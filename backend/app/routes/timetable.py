from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.schemas import TimetableRequest, TimetableResponse, TimetableSlot, Classroom, AutoAllocateRequest, AutoAllocateResponse
from pydantic import BaseModel
from app.services.llm_service import generate_timetable_with_llm, allocate_subjects_with_llm
from datetime import datetime
import uuid

from app.services.validator import validate_timetable
from app.services.repair import repair_division_slots_full
from app.services.prompt_builder import build_single_division_prompt

router = APIRouter()

@router.post("/generate", response_model=TimetableResponse)
def generate_timetable_endpoint(request: TimetableRequest):
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
                
                # Repair algorithm
                division_slots = repair_division_slots_full(division_slots, all_generated_slots, request, division.name)

                # Check global conflicts
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
                validation_result = validate_timetable(temp_response, request, specific_divisions=[division.name])
                
                if validation_result["valid"]:
                    print(f"  Division {division.name} valid!")
                    success = True
                    break
                else:
                    print(f"  Validation Failed: {validation_result['errors']}")
                    last_error = str(validation_result['errors'])
                    
                    # Refine Prompt
                    current_prompt += f"\n\nCRITICAL: The previous generation was INVALID. Violations:\n"
                    current_prompt += "\n".join([f"- {e}" for e in validation_result["errors"] if division.name in e or "double-booked" in e])
                    current_prompt += "\n\nPlease try again used UNUSED time slots."

            except Exception as e:
                print(f"  Parsing Error: {e}")
                last_error = f"Parsing Error: {e}"
                current_prompt += f"\n\nJSON Parsing Error: {e}. Output valid JSON only."

        if not success:
            print(f"HuggingFace failed to generate timetable for Division {division.name}. Falling back to local heuristic scheduler...")
            try:
                division_slots = repair_division_slots_full([], all_generated_slots, request, division.name)
                # Check validation of local generation
                temp_slots = all_generated_slots + division_slots
                temp_response = TimetableResponse(
                    timetable_id="temp",
                    metadata=request.metadata,
                    divisions=request.divisions,
                    lecturers=request.lecturers,
                    classrooms=request.classrooms,
                    slots=temp_slots
                )
                validation_result = validate_timetable(temp_response, request, specific_divisions=[division.name])
                if validation_result["valid"]:
                    print(f"  Local heuristic scheduler succeeded for Div {division.name}!")
                    success = True
                else:
                    # If still not fully valid, we use it anyway rather than raising 500!
                    print(f"  Local heuristic scheduler validation warnings: {validation_result['errors']}")
                    success = True
            except Exception as fallback_err:
                print(f"Local heuristic scheduler fallback failed: {fallback_err}")
                raise HTTPException(status_code=500, detail=f"Failed to generate valid schedule for Division {division.name} after retries. Errors: {last_error}. Heuristic fallback failed: {fallback_err}")
        
        # If successful, add these slots to the global list
        all_generated_slots.extend(division_slots)

    # All divisions done. Return result.
    final_response = TimetableResponse(
        timetable_id=str(uuid.uuid4()),
        metadata=request.metadata,
        divisions=request.divisions,
        lecturers=request.lecturers,
        classrooms=request.classrooms,
        labs=request.labs or [],
        slots=all_generated_slots,
        created_at=datetime.utcnow()
    )
    
    return final_response

class StatelessRegenerateRequest(BaseModel):
    original_timetable: TimetableResponse
    additional_constraints: str

@router.post("/regenerate", response_model=TimetableResponse)
def regenerate_timetable(request: StatelessRegenerateRequest):
    original_timetable = request.original_timetable
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
    
    # Iterate Divisions (Reuse Logic)
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
            llm_response = generate_timetable_with_llm(current_prompt)
            
            if "error" in llm_response:
                last_error = f"LLM Error: {llm_response['error']}"
                continue
                
            try:
                slots_data = llm_response.get("slots", [])
                division_slots = [TimetableSlot(**slot) for slot in slots_data]
                
                # Repairs
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
                    last_error = str(validation_result['errors'])
                    current_prompt += f"\n\nCRITICAL: Invalid generation. Violations:\n" + "\n".join([f"- {e}" for e in validation_result["errors"]])

            except Exception as e:
                last_error = f"Parsing Error: {e}"
                
        if not success:
            print(f"HuggingFace failed to regenerate timetable for Division {division.name}. Falling back to local heuristic scheduler...")
            try:
                division_slots = repair_division_slots_full([], all_generated_slots, prompt_request, division.name)
                # Check validation of local generation
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
                    print(f"  Local heuristic scheduler succeeded for Div {division.name}!")
                    success = True
                else:
                    print(f"  Local heuristic scheduler validation warnings: {validation_result['errors']}")
                    success = True
            except Exception as fallback_err:
                print(f"Local heuristic scheduler fallback failed: {fallback_err}")
                raise HTTPException(status_code=500, detail=f"Failed to regenerate for Div {division.name}. LLM failed: {last_error}. Heuristic fallback failed: {fallback_err}")
             
        all_generated_slots.extend(division_slots)

    # Return newly generated timetable
    new_timetable = TimetableResponse(
        timetable_id=str(uuid.uuid4()),
        metadata=original_timetable.metadata,
        divisions=original_timetable.divisions,
        lecturers=original_timetable.lecturers,
        classrooms=original_timetable.classrooms,
        labs=original_timetable.labs or [],
        slots=all_generated_slots,
        created_at=datetime.utcnow()
    )
    
    return new_timetable

@router.post("/auto-allocate", response_model=AutoAllocateResponse)
def auto_allocate_endpoint(request: AutoAllocateRequest):
    print(f"Auto-allocating subjects for Department: {request.department}, Semester: {request.semester}")
    
    result = allocate_subjects_with_llm(
        department=request.department,
        semester=request.semester,
        divisions=request.divisions,
        subjects=request.subjects,
        lecturers=request.lecturers
    )
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    try:
        # Validate that the response format is correct
        parsed_response = AutoAllocateResponse(**result)
        return parsed_response
    except Exception as e:
        print(f"Failed to parse LLM auto-allocate response: {e}. Raw response: {result}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid format: {e}")
