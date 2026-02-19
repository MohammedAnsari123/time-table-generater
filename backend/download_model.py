from transformers import AutoModelForCausalLM, AutoTokenizer
import os

# Define model ID and local path
model_id = "Qwen/Qwen2.5-3B-Instruct"
# Use a path relative to this script for consistency
base_dir = os.path.dirname(os.path.abspath(__file__))
local_path = os.path.join(base_dir, "local_models", "Qwen2.5-3B-Instruct")

print(f"Downloading {model_id} to {local_path}...")

try:
    if not os.path.exists(local_path):
        os.makedirs(local_path)

    # Load tokenizer and model
    print("Loading tokenizer from Hub...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    print("Loading model from Hub...")
    model = AutoModelForCausalLM.from_pretrained(model_id)

    # Save to local directory
    print("Saving tokenizer to local path...")
    tokenizer.save_pretrained(local_path)
    
    print("Saving model to local path...")
    model.save_pretrained(local_path)
    
    print("Download complete!")
except Exception as e:
    print(f"Error downloading model: {e}")
