import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTimetable from './pages/CreateTimetable';
import DisplayTimetable from './pages/DisplayTimetable';
import UpdateTimetable from './pages/UpdateTimetable';
import TimetableHistory from './pages/TimetableHistory';
import ManualEditTimetable from './pages/ManualEditTimetable';

import Layout from './components/Layout';
import LecturersList from './pages/LecturersList';
import SchedulesList from './pages/SchedulesList';

// Layout Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  // In a real app, check auth token here
  // const token = localStorage.getItem('token');
  // if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <h1 className="text-2xl font-bold text-gray-700">{title} (Coming Soon)</h1>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with Sidebar Layout */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateTimetable /></ProtectedRoute>} />
        <Route path="/timetables" element={<ProtectedRoute><TimetableHistory /></ProtectedRoute>} />
        <Route path="/display/:id" element={<ProtectedRoute><DisplayTimetable /></ProtectedRoute>} />
        <Route path="/update" element={<ProtectedRoute><UpdateTimetable /></ProtectedRoute>} />
        <Route path="/update/:id" element={<ProtectedRoute><UpdateTimetable /></ProtectedRoute>} />
        <Route path="/manual-edit/:id" element={<ProtectedRoute><ManualEditTimetable /></ProtectedRoute>} />

        {/* New Pages */}
        <Route path="/lecturers" element={<ProtectedRoute><LecturersList /></ProtectedRoute>} />
        <Route path="/schedules" element={<ProtectedRoute><SchedulesList /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
