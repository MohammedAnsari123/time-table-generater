import os
import json
from huggingface_hub import InferenceClient
from app.core.config import settings

# Initialize HuggingFace client
try:
    hf_client = InferenceClient(api_key=settings.HF_API_KEY)
    # List of models ordered by preference (fastest/smartest first)
    HF_MODELS = [
        "Qwen/Qwen2.5-Coder-32B-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "meta-llama/Llama-3.1-8B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct"
    ]
except Exception as e:
    print(f"HF Client Init Failed: {e}")
    hf_client = None


def generate_timetable_with_llm(prompt: str) -> dict:
    if not hf_client:
        return {"error": "HuggingFace API client is not initialized. Please configure HF_API_KEY."}

    # Try models sequentially
    for model_id in HF_MODELS:
        try:
            print(f"Attempting generation with HuggingFace API ({model_id})...")
            messages = [
                {
                    "role": "system", 
                    "content": "You are a highly intelligent timetable generation engine. Your goal is to create a conflict-free academic timetable based on the provided constraints. output ONLY valid JSON containing a 'slots' array. Do not output conversational text outside JSON block."
                },
                {"role": "user", "content": prompt}
            ]
            
            response = hf_client.chat_completion(
                messages=messages,
                model=model_id,
                max_tokens=2500,
                temperature=0.1,
                top_p=0.9
            )
            
            response_content = response.choices[0].message.content
            print("HF Response received. Post-processing content...")
            
            # Extract JSON block
            if "```json" in response_content:
                response_content = response_content.split("```json")[1].split("```")[0].strip()
            elif "```" in response_content:
                response_content = response_content.split("```")[1].split("```")[0].strip()
            
            # Strip outer brackets if needed
            start = response_content.find('{')
            end = response_content.rfind('}') + 1
            if start != -1 and end != -1:
                response_content = response_content[start:end]
            
            parsed_json = json.loads(response_content)
            if "slots" in parsed_json:
                return parsed_json
            else:
                print(f"Parsed JSON does not contain 'slots' key. Retrying with next model...")
                
        except Exception as e:
            print(f"HF Generation Failed for model {model_id}: {e}")
            if "402" in str(e) or "Payment Required" in str(e) or "credits" in str(e).lower():
                print("Payment Required / Credits exhausted on HuggingFace. Stopping further attempts.")
                break
            continue # Try fallback model
            
    return {"error": "Failed to generate timetable with HuggingFace. All models returned parsing errors or timed out."}


def allocate_subjects_with_llm(department: str, semester: int, divisions: list, subjects: list, lecturers: list) -> dict:
    if not hf_client:
        return {"error": "HuggingFace API client is not initialized. Please configure HF_API_KEY."}

    # Build prompt
    prompt = f"Auto-Allocate and Workload-Balance subjects to academic divisions.\n\n"
    prompt += f"Context:\n"
    prompt += f"- Department: {department}\n"
    prompt += f"- Semester: {semester}\n"
    prompt += f"- Divisions: {[d.name for d in divisions]}\n\n"

    prompt += "Available Subjects:\n"
    for sub in subjects:
        prompt += f"- Code: {sub.code}, Name: {sub.name}, Type: {sub.type}, Periods/Week: {sub.periods_per_week}, Default Lecturer ID: {sub.assigned_lecturer_id or 'None'}\n"

    prompt += "\nAvailable Lecturers (Staff Pool):\n"
    for lec in lecturers:
        prompt += f"- ID: {lec.id}, Name: {lec.name}, Max Periods/Week: {lec.max_periods_per_week}, Preferred Subjects: {lec.subjects}\n"

    prompt += """
Goal:
Allocate ALL available subjects to each of the divisions. For each subject in each division, assign an eligible lecturer.

Rules:
1. For each division, you must assign every single available subject.
2. For each assigned subject in a division, you must select an assigned_lecturer_id.
3. CRITICAL: The assigned_lecturer_id MUST be chosen strictly from the exact IDs listed in the "Available Lecturers" section (e.g. 'ST-01', 'ST-02', etc.). Do NOT invent, hallucinate, make up, or abbreviate lecturer IDs (do NOT use placeholder codes like 'L1', 'L2', 'L3', etc.). If no eligible lecturer is available, use the default lecturer ID provided or leave it as null, but never invent an ID.
4. A lecturer is eligible if they have the subject listed in their preferred subjects, or if they are the default lecturer for that subject.
5. Distribute the teaching workload (periods_per_week) as equally as possible across divisions. For example, if both Lecturer A and Lecturer B teach CS-301 (DBMS), assign Lecturer A to Division A's CS-301 and Lecturer B to Division B's CS-301.
6. The total sum of periods assigned to any lecturer across all divisions must NOT exceed their max_periods_per_week.
7. The output must be valid JSON in the following format:
{
  "divisions": [
    {
      "name": "Division Name (e.g. A)",
      "strength": 60,
      "subjects": [
        {
          "code": "Subject Code",
          "name": "Subject Name",
          "type": "Theory or Lab",
          "periods_per_week": 4,
          "assigned_lecturer_id": "Lecturer ID (MUST be one of the exact IDs from the Available Lecturers list, e.g. ST-01)",
          "semester": 1,
          "department": "Department Name",
          "credits": 3,
          "lab_requirement": false
        }
      ]
    }
  ]
}

Ensure all divisions from the input are present. Ensure the output is strictly valid JSON only. Do not write any conversational text.
"""

    # Try models sequentially
    for model_id in HF_MODELS:
        try:
            print(f"Attempting subject allocation with HuggingFace API ({model_id})...")
            messages = [
                {
                    "role": "system", 
                    "content": "You are a highly intelligent timetable assistant. Your goal is to auto-allocate subjects to divisions and balance workloads equally. output ONLY valid JSON containing a 'divisions' array. Do not output conversational text or explanation."
                },
                {"role": "user", "content": prompt}
            ]
            
            response = hf_client.chat_completion(
                messages=messages,
                model=model_id,
                max_tokens=2500,
                temperature=0.1,
                top_p=0.9
            )
            
            response_content = response.choices[0].message.content
            
            # Extract JSON block
            if "```json" in response_content:
                response_content = response_content.split("```json")[1].split("```")[0].strip()
            elif "```" in response_content:
                response_content = response_content.split("```")[1].split("```")[0].strip()
            
            start = response_content.find('{')
            end = response_content.rfind('}') + 1
            if start != -1 and end != -1:
                response_content = response_content[start:end]
            
            parsed_json = json.loads(response_content)
            if "divisions" in parsed_json:
                return parsed_json
            else:
                print(f"Parsed JSON does not contain 'divisions' key. Retrying with next model...")
                
        except Exception as e:
            print(f"HF Subject Allocation Failed for model {model_id}: {e}")
            if "402" in str(e) or "Payment Required" in str(e) or "credits" in str(e).lower():
                print("Payment Required / Credits exhausted on HuggingFace. Stopping further attempts.")
                break
            continue # Try fallback model
            
    # Fallback to local heuristic allocator when HuggingFace fails (e.g. credits exhausted / 402 error)
    print("Hugging Face API failed or credits exhausted. Running local heuristic subject allocation fallback...")
    try:
        return local_heuristic_allocation(department, semester, divisions, subjects, lecturers)
    except Exception as fallback_err:
        print(f"Local heuristic fallback failed: {fallback_err}")
        return {"error": f"Failed to auto-allocate subjects. HuggingFace failed and local fallback crashed: {fallback_err}"}


def local_heuristic_allocation(department: str, semester: int, divisions: list, subjects: list, lecturers: list) -> dict:
    print("Running local heuristic subject allocation fallback...")
    
    # Map lecturers workload (periods assigned to each)
    lec_workload = {}
    for lec in lecturers:
        lec_id = lec.id
        lec_workload[lec_id] = 0
        
    allocated_divisions = []
    
    for div in divisions:
        div_subjects = []
        for sub in subjects:
            assigned_id = None
            
            # First choice: Default lecturer of the subject if they exist and have capacity
            default_id = sub.assigned_lecturer_id
            if default_id:
                # Find the default lecturer in our pool
                lec_obj = next((l for l in lecturers if l.id == default_id), None)
                if lec_obj:
                    if lec_workload[lec_obj.id] + sub.periods_per_week <= lec_obj.max_periods_per_week:
                        assigned_id = lec_obj.id
                        lec_workload[lec_obj.id] += sub.periods_per_week
            
            # Second choice: Any active lecturer who lists this subject in preferred subjects and has capacity
            if not assigned_id:
                eligible_lecturers = []
                for lec in lecturers:
                    if sub.code in lec.subjects or sub.name in lec.subjects:
                        if lec_workload[lec.id] + sub.periods_per_week <= lec.max_periods_per_week:
                            eligible_lecturers.append(lec)
                
                if eligible_lecturers:
                    # Choose the one with the lowest current workload to balance load
                    eligible_lecturers.sort(key=lambda l: lec_workload[l.id])
                    chosen_lec = eligible_lecturers[0]
                    assigned_id = chosen_lec.id
                    lec_workload[chosen_lec.id] += sub.periods_per_week
            
            # Third choice: Any lecturer who has capacity
            if not assigned_id:
                eligible_lecturers = [l for l in lecturers if lec_workload[l.id] + sub.periods_per_week <= l.max_periods_per_week]
                if eligible_lecturers:
                    eligible_lecturers.sort(key=lambda l: lec_workload[l.id])
                    chosen_lec = eligible_lecturers[0]
                    assigned_id = chosen_lec.id
                    lec_workload[chosen_lec.id] += sub.periods_per_week
            
            # Fallback: Just assign the default lecturer ID or the first lecturer even if it exceeds max workload
            if not assigned_id:
                assigned_id = default_id or (lecturers[0].id if lecturers else None)
                if assigned_id and assigned_id in lec_workload:
                    lec_workload[assigned_id] += sub.periods_per_week
            
            # Convert to dict representing the Pydantic Subject schema
            div_subjects.append({
                "code": sub.code,
                "name": sub.name,
                "type": sub.type,
                "periods_per_week": sub.periods_per_week,
                "assigned_lecturer_id": assigned_id,
                "semester": sub.semester,
                "department": sub.department,
                "credits": sub.credits,
                "lab_requirement": sub.lab_requirement
            })
            
        allocated_divisions.append({
            "name": div.name,
            "strength": div.strength,
            "subjects": div_subjects
        })
        
    return {"divisions": allocated_divisions}


