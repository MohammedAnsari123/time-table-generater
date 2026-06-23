import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const login = async (email, password) => {
    // formData for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const register = async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
};

export const generateTimetable = async (data) => {
    const response = await api.post('/timetable/generate', data);
    return response.data;
};

export const getTimetable = async (id) => {
    const response = await api.get(`/timetable/${id}`);
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await api.get('/timetable/stats');
    return response.data;
};

export const getAllTimetables = async () => {
    const response = await api.get('/timetable/list/all');
    return response.data;
};

export const deleteTimetable = async (id) => {
    const response = await api.delete(`/timetable/${id}`);
    return response.data;
};

export const regenerateTimetable = async (id, additionalConstraints) => {
    const response = await api.post('/timetable/regenerate', {
        timetable_id: id,
        additional_constraints: additionalConstraints
    });
    return response.data;
};

// --- Lecturer CRUD APIs ---
export const getLecturers = async (q = '') => {
    const response = await api.get(`/lecturers/?q=${encodeURIComponent(q)}`);
    return response.data;
};

export const createLecturer = async (lecturer) => {
    const response = await api.post('/lecturers/', lecturer);
    return response.data;
};

export const updateLecturer = async (id, lecturer) => {
    const response = await api.put(`/lecturers/${id}`, lecturer);
    return response.data;
};

export const deleteLecturer = async (id) => {
    const response = await api.delete(`/lecturers/${id}`);
    return response.data;
};

// --- Subject CRUD APIs ---
export const getSubjects = async (q = '') => {
    const response = await api.get(`/subjects/?q=${encodeURIComponent(q)}`);
    return response.data;
};

export const createSubject = async (subject) => {
    const response = await api.post('/subjects/', subject);
    return response.data;
};

export const updateSubject = async (code, subject) => {
    const response = await api.put(`/subjects/${code}`, subject);
    return response.data;
};

export const deleteSubject = async (code) => {
    const response = await api.delete(`/subjects/${code}`);
    return response.data;
};

export default api;
