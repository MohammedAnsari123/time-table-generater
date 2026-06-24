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
            continue # Try fallback model
            
    return {"error": "Failed to generate timetable with HuggingFace. All models returned parsing errors or timed out."}

