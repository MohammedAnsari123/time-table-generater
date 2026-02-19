# 🗓️ Time Table Generator Tool

A full-stack intelligent timetable generation application powered by **Large Language Models (LLMs)** and a deterministic constraint-satisfaction engine. Designed for academic institutions to automatically generate conflict-free timetables across multiple divisions.

---

## 📌 Features

-   **AI-Powered Timetable Generation** – Uses Groq (Llama 3) and HuggingFace (Qwen) APIs for intelligent scheduling.
-   **Multi-Division Support** – Generate and manage timetables for multiple class divisions simultaneously.
-   **Conflict Detection & Auto-Repair** – Automatically detects and resolves lecturer/room double-bookings.
-   **Distribution Optimization** – Spreads subjects evenly across the week (max 2 theory periods per subject per day).
-   **Export Options** – Download timetables as DOCX or PDF with official college header.
-   **Dashboard** – View all generated timetables, stats, and manage history.
-   **Edit & Regenerate** – Modify constraints and regenerate any existing timetable.

---

## 🏗️ Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS, Lucide React   |
| Backend   | FastAPI, Python                              |
| Database  | MongoDB (Atlas or Local)                     |
| LLM       | Groq API (Llama 3) + HuggingFace API (Qwen)  |
| Auth      | JWT (python-jose)                            |

---

## 📁 Project Structure

```
Time Table Generator Tool/
├── frontend/         # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/      # CreateTimetable, DisplayTimetable, etc.
│   │   ├── components/ # Reusable UI components
│   │   └── services/   # API client (api.js)
│   ├── vercel.json
│   └── netlify.toml
│
├── backend/          # FastAPI Backend
│   ├── app/
│   │   ├── routes/     # API Endpoints
│   │   ├── services/   # LLM, Validator, Repair Logic
│   │   ├── models/     # Pydantic Schemas
│   │   └── core/       # Config, Database
│   ├── requirements.txt
│   ├── Procfile
│   └── render.yaml
│
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
-   Node.js (v18+)
-   Python (v3.10+)
-   MongoDB (Local or Atlas)
-   API Keys: Groq, HuggingFace

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Create .env file (see backend/README.md)
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
```

---

## 🌐 Deployment

| Service  | Platform          | Notes                           |
|----------|-------------------|---------------------------------|
| Backend  | Render            | Uses `render.yaml` blueprint.   |
| Frontend | Vercel / Netlify  | Uses `vercel.json` or `netlify.toml`. |

See **backend/README.md** and **frontend/README.md** for detailed deployment steps.

---

## 📄 License

MIT License – Free to use and modify.
