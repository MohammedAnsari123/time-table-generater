# 🖥️ Backend – Time Table Generator Tool

FastAPI-powered REST API for AI-driven timetable generation. Uses a multi-provider LLM strategy (Groq + HuggingFace) with heuristic validation and repair algorithms.

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py       # Pydantic Settings (reads .env)
│   │   └── database.py     # MongoDB connection
│   ├── models/
│   │   └── schemas.py      # Pydantic request/response models
│   ├── routes/
│   │   ├── auth.py         # Authentication endpoints
│   │   └── timetable.py    # Timetable generation endpoints
│   ├── services/
│   │   ├── llm_service.py  # Groq + HuggingFace LLM calls
│   │   ├── prompt_builder.py # Builds LLM prompts per division
│   │   ├── validator.py    # Conflict & distribution validation
│   │   └── repair.py       # Heuristic slot-conflict repair
│   └── main.py             # FastAPI app entrypoint
├── .env                    # Environment variables (DO NOT COMMIT)
├── requirements.txt
├── Procfile                # For Heroku/Render/Railway
└── render.yaml             # Render Blueprint config
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Required for LLM
GROQ_API_KEY=gsk_your_groq_key_here
HF_API_KEY=hf_your_huggingface_key_here

# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGO_DB_NAME=timetable_db

# Auth
SECRET_KEY=your_super_secret_key
```

### Getting API Keys

| Key            | URL                                  | Notes                          |
|----------------|--------------------------------------|--------------------------------|
| `GROQ_API_KEY` | https://console.groq.com/            | Free tier, fast inference      |
| `HF_API_KEY`   | https://huggingface.co/settings/tokens | Free tier for Qwen models   |
| `MONGO_URI`    | https://cloud.mongodb.com/           | Free M0 cluster (512MB)        |

---

## 🚀 Local Development

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file (see above)

# 4. Start the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## 🌐 Deployment on Render

1.  Push your repository to GitHub.
2.  Go to [render.com](https://render.com) → **New → Blueprint**.
3.  Select your repository. Render will auto-detect `render.yaml`.
4.  Fill in the environment variable values when prompted.
5.  Deploy!

**Manual Setup (if Blueprint doesn't work):**
-   **Type**: Web Service
-   **Root Directory**: `backend`
-   **Build Command**: `pip install -r requirements.txt`
-   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 📡 API Endpoints

| Method   | Path                       | Description                    |
|----------|----------------------------|--------------------------------|
| `POST`   | `/auth/register`           | Register a new user            |
| `POST`   | `/auth/login`              | Login and get JWT token        |
| `POST`   | `/timetable/generate`      | Generate a new timetable       |
| `GET`    | `/timetable/{id}`          | Get a timetable by ID          |
| `GET`    | `/timetable/list/all`      | Get all timetables             |
| `POST`   | `/timetable/regenerate`    | Regenerate with new constraints|
| `DELETE` | `/timetable/{id}`          | Delete a timetable             |
| `GET`    | `/timetable/stats`         | Get dashboard statistics       |

---

## 🧠 LLM Strategy

The backend uses a **Multi-Provider Fallback** approach:

1.  **Primary**: Groq API (`llama-3.3-70b-versatile`) – Fast, JSON-enforced output.
2.  **Fallback**: HuggingFace Inference API (`Qwen/Qwen2.5-72B-Instruct`) – No local download required.

**Post-processing Pipeline:**
-   `resolve_sequential_conflicts()` – Moves conflicting slots to free slots.
-   `optimize_distribution()` – Spreads subjects across the week.
-   `validate_timetable()` – Flags any remaining issues before saving.

---

## 🔒 Authentication

The API uses **JWT (Bearer Token)** authentication.

-   Register and login via `/auth/register` and `/auth/login`.
-   Include the token in the `Authorization: Bearer <token>` header for protected routes.
