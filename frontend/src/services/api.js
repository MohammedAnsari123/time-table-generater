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

// --- Staff (Lecturers) CRUD APIs ---
export const getStaff = async (q = '') => {
    const response = await api.get(`/staff/?q=${encodeURIComponent(q)}`);
    return response.data;
};

export const createStaff = async (staffMember) => {
    const response = await api.post('/staff/', staffMember);
    return response.data;
};

export const updateStaff = async (id, staffMember) => {
    const response = await api.put(`/staff/${id}`, staffMember);
    return response.data;
};

export const deleteStaff = async (id) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
};

// Aliases to avoid breaking legacy code
export const getLecturers = getStaff;
export const createLecturer = createStaff;
export const updateLecturer = updateStaff;
export const deleteLecturer = deleteStaff;

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

// --- Classroom CRUD APIs ---
export const getClassrooms = async (q = '') => {
    const response = await api.get(`/classrooms/?q=${encodeURIComponent(q)}`);
    return response.data;
};

export const createClassroom = async (classroom) => {
    const response = await api.post('/classrooms/', classroom);
    return response.data;
};

export const updateClassroom = async (id, classroom) => {
    const response = await api.put(`/classrooms/${id}`, classroom);
    return response.data;
};

export const deleteClassroom = async (id) => {
    const response = await api.delete(`/classrooms/${id}`);
    return response.data;
};

// --- Laboratory CRUD APIs ---
export const getLabs = async (q = '') => {
    const response = await api.get(`/labs/?q=${encodeURIComponent(q)}`);
    return response.data;
};

export const createLab = async (lab) => {
    const response = await api.post('/labs/', lab);
    return response.data;
};

export const updateLab = async (id, lab) => {
    const response = await api.put(`/labs/${id}`, lab);
    return response.data;
};

export const deleteLab = async (id) => {
    const response = await api.delete(`/labs/${id}`);
    return response.data;
};

export default api;

