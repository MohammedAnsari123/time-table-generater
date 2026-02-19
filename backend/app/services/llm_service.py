import os
import json
from groq import Groq
from huggingface_hub import InferenceClient
from app.core.config import settings

# --- 1. Initialize Groq Client ---
try:
    groq_client = Groq(api_key=settings.GROQ_API_KEY)
except Exception as e:
    print(f"Groq Client Init Failed: {e}")
    groq_client = None

# --- 2. Initialize HuggingFace Client (Remote Qwen) ---
# This allows using Qwen/Qwen2.5-3B-Instruct without downloading weights locally.
try:
    hf_client = InferenceClient(api_key=settings.HF_API_KEY)
    # Model ID on HuggingFace Hub
    HF_MODEL = "Qwen/Qwen2.5-72B-Instruct" # Using 72B via API for better reasoning, or falling back to 7B/3B if rate limited.
    # Actually, 72B might be Pro only. Let's start with a safer bet that is usually free on Inference API.
    # "Qwen/Qwen2.5-Coder-32B-Instruct" or "Qwen/Qwen2.5-7B-Instruct".
    # User liked Qwen2.5-3B. Let's use 72B if available, else 7B.
    # But for "Inference API" (free), usually smaller models or specific ones are available.
    # "Qwen/Qwen2.5-72B-Instruct" is often available. If not, we can change.
    HF_MODEL = "Qwen/Qwen2.5-72B-Instruct" 
except Exception as e:
    print(f"HF Client Init Failed: {e}")
    hf_client = None


def generate_timetable_with_llm(prompt: str) -> dict:
    
    # A. Try Groq (Primary - Fast & Reliable)
    if groq_client:
        try:
            print("Attempting generation with Groq (Llama 3)...")
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a highly intelligent timetable generation engine. Your goal is to create a conflict-free academic timetable based on the provided constraints. output ONLY valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            response_content = chat_completion.choices[0].message.content
            return json.loads(response_content)
        except Exception as e:
            print(f"Groq Generation Failed: {e}. Switching to HF Fallback...")

    # B. Try HuggingFace Inference API (Remote Qwen)
    if hf_client:
        try:
            print(f"Attempting generation with HuggingFace API ({HF_MODEL})...")
            messages = [
                {"role": "system", "content": "You are a highly intelligent timetable generation engine. Your goal is to create a conflict-free academic timetable based on the provided constraints. output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            # Streaming is false by default
            response = hf_client.chat_completion(
                messages=messages,
                model=HF_MODEL,
                max_tokens=2048,
                temperature=0.1,
                top_p=0.9
            )
            
            response_content = response.choices[0].message.content
            
            # Helper to extract JSON if model adds markdown
            if "```json" in response_content:
                response_content = response_content.split("```json")[1].split("```")[0].strip()
            elif "```" in response_content:
                response_content = response_content.split("```")[1].split("```")[0].strip()
            
            # Attempt to find JSON object bounds
            start = response_content.find('{')
            end = response_content.rfind('}') + 1
            if start != -1 and end != -1:
                response_content = response_content[start:end]

            return json.loads(response_content)
            
        except Exception as e:
            print(f"HF Generation Failed: {e}")
            return {"error": f"Both Groq and HF failed. Groq Error: (see logs), HF Error: {str(e)}"}
            
    return {"error": "No LLM clients initialized. Check API Keys."}
