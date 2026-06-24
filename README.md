# 🗓️ Intelligent AI Time Table Generator Tool

A state-of-the-art, full-stack academic timetable scheduling system. The application combines **Large Language Model (LLM) reasoning** with **deterministic constraint-satisfaction algorithms** to generate conflict-free schedules across multiple divisions, classes, and instructors.

---

## 📌 Core Features

1. **AI-Driven Multi-Division Scheduling**
   - Automatically builds conflict-free schedules for multiple divisions (e.g. Div A, B, C...) sequentially.
   - Integrates the schedule of previous divisions as hard constraints into the generation loop of subsequent divisions to prevent overlaps.
2. **Deterministic Heuristic Repair & Backtracking**
   - **`resolve_sequential_conflicts`**: Resolves any teacher or room double-bookings by relocating conflicting slots to the nearest available open periods.
   - **`optimize_distribution`**: Balances schedules by swapping theory classes to prevent single-day overload (max 2 periods of the same theory subject per day).
3. **Strict Validation Engine**
   - Runs a 5-step validation check (lecturer double-booking, room double-booking, subject period counts, metadata limits, theory distribution).
   - Dynamically re-injects validation failures back into the LLM context for iterative self-correction (up to 5 retries).
4. **Database-Backed CRUD Registries**
   - Full search, day filtering, and CRUD operations for **Lecturers** (ID, name, availability, max periods/day).
   - Full search, type filtering, and CRUD operations for **Subjects** (Code, name, Theory/Lab type, period weight, default lecturer).
   - Integrated selection dropdowns inside the creation wizard.
5. **Universal Layout Responsiveness**
   - Responsive design tailored for **Mobile screens** (horizontal scroll overlays, collapsible sidebar), **PC/Laptops** (collapsible navigation lists), and **4k Monitors** (flexible max-widths up to 2560px with padded elements).
6. **Executive Dashboard Cockpit**
   - Stats dashboard showing scheduled periods, total timetables, and active lecturers.
   - Welcoming header with dynamic dates and a feed of recently generated timetables.
7. **Official Report Exports**
   - Client-side download of division timetables as formatted **PDF documents** (using `jspdf` and `jspdf-autotable`) and **Word files** (using `docx`) complete with college letterhead headers and prepare/approval signature fields.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend [React SPA (Vite + TailwindCSS)]
        UI[Dashboard & Wizard UI]
        API[Axios API Service]
        Export[PDF / DOCX Exporter]
    end

    subgraph Backend [FastAPI Server]
        Router[Router Gateways]
        HF[Hugging Face Client]
        Repair[Heuristic Repair Solver]
        Validator[Constraint Validator]
    end

    subgraph Storage [Database & Cloud]
        Mongo[(MongoDB Atlas)]
        Cloudinary[Cloudinary CDN Banners]
    end

    UI --> API
    UI --> Export
    API --> Router
    Router --> Mongo
    Router --> HF
    Router --> Repair
    Router --> Validator
    Router --> Cloudinary
```

1. **Interactive Form Input**: The user configures institution settings, assigns lecturers from the database, and schedules subjects per division.
2. **LLM Synthesis**: The backend packages the request and queries the Hugging Face Inference API (`Qwen/Qwen2.5-72B-Instruct` or fallback `meta-llama/Llama-3.3-70B-Instruct`) using your API key.
3. **Local Optimization**: The generated slots undergo conflict resolution and backtracking swaps.
4. **Iterative Verification**: If the validator catches a clash, it passes the error report back to the LLM for self-correction.
5. **Persistence & Presentation**: Once valid, the timetable is saved with a UTC `created_at` timestamp and fetched by the frontend dashboard.

---

## ⚙️ Environment Variables

Create the following files in their respective folders:

### 1. Backend (`/backend/.env`)
```env
PROJECT_NAME="Time Table Generator Tool"
API_V1_STR="/api/v1"
SECRET_KEY="YOUR_SUPER_SECRET_KEY_CHANGE_THIS"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MongoDB Connection
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/timetable_db"
MONGO_DB_NAME="timetable_db"

# HuggingFace API key
HF_API_KEY="xxxxxxxxxxxxxxxxxxxxxxx"

# Cloudinary Assets Store
CLOUDINARY_CLOUD_NAME="dhdgid9nr"
CLOUDINARY_API_KEY="797739637432227"
CLOUDINARY_API_SECRET="wE5lt7nLVQ2XEuAHTCXpJ-t8Y_0"
```

### 2. Frontend (`/frontend/.env`)
```env
# Local URL
VITE_API_URL=http://localhost:8000

# Production URL (Uncomment for deployment)
# VITE_API_URL=https://time-table-generater-92xy.onrender.com
```

---

## 🚀 Setup & Installation (Local Development)

### 1. Backend Server Setup
Ensure you have Python 3.10+ installed.

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn app.main:app --reload
```
The local API documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend SPA Setup
Ensure you have Node.js 18+ installed.

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 API Directory Catalog

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Sign up new user credentials |
| `POST` | `/auth/login` | Authenticate user credentials and return JWT token |
| `POST` | `/timetable/generate` | Generate a new Division Timetable |
| `POST` | `/timetable/regenerate` | Re-schedule a timetable with updated constraints |
| `GET` | `/timetable/{id}` | Retrieve timetable slots by unique ID |
| `GET` | `/timetable/list/all` | Fetch all timetables sorted by `created_at` DESC |
| `DELETE` | `/timetable/{id}` | Delete a timetable from the database |
| `GET` | `/timetable/stats` | Retrieve metrics (scheduled slots, teachers, classes) |
| `GET` | `/lecturers` | Query global lecturers pool with optional search parameter `q` |
| `POST` | `/lecturers` | Register a new lecturer to the database |
| `PUT` | `/lecturers/{id}` | Update an existing lecturer profile |
| `DELETE` | `/lecturers/{id}` | Delete a lecturer from the database |
| `GET` | `/subjects` | Query global subjects registry with optional search parameter `q` |
| `POST` | `/subjects` | Add a new subject to the database |
| `PUT` | `/subjects/{code}` | Update subject parameters |
| `DELETE` | `/subjects/{code}` | Remove a subject from the database |

---

## 🌐 Production Deployment Guide

### Backend (Render or Koyeb)
1. Register a web service pointing to your GitHub repository.
2. Set the **Root Directory** to `backend`.
3. Set the **Build Command** to `pip install -r requirements.txt`.
4. Set the **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Enter all environment variable fields from the `/backend/.env` file.

### Frontend (Vercel or Netlify)
1. Create a project pointing to your GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Set the build environment variable `VITE_API_URL` to point to your live deployed backend URL.
4. Deploy! Vite output is automatically routed to static hosting.

---

## 📄 License
This project is licensed under the MIT License - feel free to modify and reuse.
