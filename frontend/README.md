# 🎨 Frontend – Time Table Generator Tool

React 19 + Vite frontend for the Timetable Generator Tool. Includes a multi-step wizard for creating and editing timetables, a dashboard, and export features (PDF, DOCX).

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── TPoly-Header.jpeg   # College header for PDF/DOCX export
├── src/
│   ├── components/
│   │   ├── MultiDivisionForm.jsx   # Division/subject configuration form
│   │   ├── TimetableSteps.jsx      # Reusable step components (wizard)
│   │   └── TimetableTable.jsx      # Renders the timetable grid
│   ├── pages/
│   │   ├── Home.jsx                # Landing page
│   │   ├── Login.jsx / Register.jsx
│   │   ├── Dashboard.jsx           # Timetable list & stats
│   │   ├── CreateTimetable.jsx     # 3-step creation wizard
│   │   ├── DisplayTimetable.jsx    # Display + DOCX/PDF export
│   │   └── ManualEditTimetable.jsx # Edit & regenerate wizard
│   ├── services/
│   │   └── api.js                  # Axios API client
│   └── App.jsx                     # Root component & routes
├── .env                            # Environment variables
├── vercel.json                     # Vercel routing config
├── netlify.toml                    # Netlify build & redirect config
├── vite.config.js
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# URL of the deployed backend (no trailing slash)
VITE_API_URL=https://your-backend.onrender.com
```

For **local development**, use:

```env
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# 3. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🌐 Deployment

### Vercel (Recommended)

1.  Push your repository to GitHub.
2.  Go to [vercel.com](https://vercel.com) → **New Project** → Import repository.
3.  Set **Root Directory** to `frontend`.
4.  Add **Environment Variable**: `VITE_API_URL` = `https://your-render-backend-url.com`
5.  Deploy! (Vercel auto-detects Vite)

> **Note**: `vercel.json` is pre-configured to handle React Router deep-links.

### Netlify (Alternative)

1.  Go to [netlify.com](https://netlify.com) → **Add New Site** → Import from Git.
2.  Set **Base Directory** to `frontend`.
3.  Netlify auto-reads `netlify.toml` for build settings.
4.  Add **Environment Variable**: `VITE_API_URL`.

---

## 🖼️ Key Pages & Flows

### 1. Create Timetable (`/create`)
A 3-step wizard:
-   **Step 1**: Academic Metadata (Institution, Semester, Academic Year).
-   **Step 2**: Global Resources (Add Lecturers and Classrooms).
-   **Step 3**: Division Configuration (Add Divisions and Subjects per division).

### 2. Display Timetable (`/display/:id`)
-   Tabbed view for each division.
-   **Download DOCX**: Formatted Word document with college header.
-   **Download PDF**: Formatted PDF with college header.

### 3. Dashboard (`/dashboard`)
-   View all generated timetables.
-   Quick stats: Total Timetables, Active Classes, Active Lecturers.
-   Actions: Edit, Delete, View each timetable.

### 4. Edit & Regenerate (`/edit/:id`)
-   Pre-fills existing timetable data.
-   Allows modifying metadata, lecturers, classrooms, and division subjects.
-   Re-generates a new timetable using the updated constraints.

---

## 📦 Key Dependencies

| Package              | Purpose                              |
|----------------------|--------------------------------------|
| `react` v19          | Core UI framework                    |
| `react-router-dom`   | Client-side routing                  |
| `axios`              | HTTP client for API calls            |
| `tailwindcss`        | Utility-first CSS framework          |
| `lucide-react`       | Icon library                         |
| `docx`               | Generate DOCX files client-side      |
| `jspdf`              | Generate PDF files client-side       |
| `jspdf-autotable`    | Table rendering in PDFs              |
| `framer-motion`      | Animations                           |

---

## 🎨 Color Scheme (Timetable Slots)

| Slot Type | Color      |
|-----------|------------|
| Free      | 🟢 Green   |
| Theory    | 🔵 Light Blue |
| Lab       | 🔷 Dark Blue  |
