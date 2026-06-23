import React, { useState, useEffect } from 'react';
import { TextInput, NumberInput, SelectInput } from './FormInputs';
import { Plus, Trash, Check, UserPlus, Loader2, Sparkles } from 'lucide-react';
import { getLecturers, createLecturer } from '../services/api';

// --- Step 1: Metadata ---
export const Step1Metadata = ({ metadata, handleMetadataChange }) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
            Academic Metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Institution Name" value={metadata.institution_name} onChange={e => handleMetadataChange('institution_name', e.target.value)} />
            <TextInput label="Department" value={metadata.department} onChange={e => handleMetadataChange('department', e.target.value)} />
            <NumberInput label="Semester" value={metadata.semester} onChange={e => handleMetadataChange('semester', parseInt(e.target.value))} />
            <TextInput label="Academic Year" value={metadata.academic_year} onChange={e => handleMetadataChange('academic_year', e.target.value)} />
            <NumberInput label="Periods Per Day" value={metadata.periods_per_day} onChange={e => handleMetadataChange('periods_per_day', parseInt(e.target.value))} />
        </div>
    </div>
);

// --- Step 2: Global Resources ---
export const Step2GlobalResources = ({ lecturers, setLecturers, classrooms, setClassrooms }) => {
    const [dbLecturers, setDbLecturers] = useState([]);
    const [loadingDb, setLoadingDb] = useState(true);
    const [tempLecturer, setTempLecturer] = useState({ name: '', id: '', subjects: '' });
    const [tempClassroom, setTempClassroom] = useState({ id: '', capacity: 60, type: 'Classroom' });
    const [quickAddError, setQuickAddError] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadDbLecturers();
    }, []);

    const loadDbLecturers = async () => {
        setLoadingDb(true);
        try {
            const data = await getLecturers();
            setDbLecturers(data);
            
            // Auto-select all by default if lecturers is empty
            if (lecturers.length === 0 && data.length > 0) {
                setLecturers(data);
            }
        } catch (err) {
            console.error("Failed to load db lecturers", err);
        } finally {
            setLoadingDb(false);
        }
    };

    const toggleLecturerSelection = (lecturer) => {
        if (lecturers.some(l => l.id === lecturer.id)) {
            setLecturers(lecturers.filter(l => l.id !== lecturer.id));
        } else {
            setLecturers([...lecturers, lecturer]);
        }
    };

    const handleQuickAddLecturer = async () => {
        if (!tempLecturer.name || !tempLecturer.id) {
            setQuickAddError("Name and ID are required");
            return;
        }
        setAdding(true);
        setQuickAddError('');
        try {
            const payload = {
                id: tempLecturer.id.trim(),
                name: tempLecturer.name.trim(),
                subjects: tempLecturer.subjects.split(',').map(s => s.trim()).filter(Boolean),
                max_periods_per_day: 4,
                available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            };
            const newLec = await createLecturer(payload);
            
            // Add to selections & refresh list
            setLecturers([...lecturers, newLec]);
            setTempLecturer({ name: '', id: '', subjects: '' });
            loadDbLecturers();
        } catch (err) {
            setQuickAddError(err.response?.data?.detail || "Failed to add lecturer");
        } finally {
            setAdding(false);
        }
    };

    const addClassroom = () => {
        if (!tempClassroom.id) return;
        if (classrooms.some(c => c.id === tempClassroom.id)) {
            alert("Room ID must be unique!");
            return;
        }
        setClassrooms([...classrooms, { ...tempClassroom }]);
        setTempClassroom({ id: '', capacity: 60, type: 'Classroom' });
    };

    return (
        <div className="space-y-8">
            {/* Lecturers Selection */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-purple-600" />
                    Assign Lecturers for Timetable
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select which lecturers from the database pool should be scheduled in this timetable.</p>

                {loadingDb ? (
                    <div className="py-6 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {dbLecturers.map((l) => {
                            const isSelected = lecturers.some(sel => sel.id === l.id);
                            return (
                                <div 
                                    key={l.id}
                                    onClick={() => toggleLecturerSelection(l)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-gray-800">{l.name}</div>
                                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'}`}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">ID: {l.id}</div>
                                    <div className="text-xs text-purple-600 mt-2 font-medium truncate">
                                        {l.subjects?.join(', ') || 'No subjects'}
                                    </div>
                                </div>
                            );
                        })}
                        {dbLecturers.length === 0 && (
                            <div className="col-span-full py-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                No lecturers in the database. Add one below.
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Add Lecturer Form */}
                <div className="bg-gray-50/50 border border-gray-200 p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Quick Add Lecturer to Database</h3>
                    {quickAddError && <p className="text-xs text-red-500 mb-2">{quickAddError}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <TextInput label="Name" value={tempLecturer.name} onChange={e => setTempLecturer({ ...tempLecturer, name: e.target.value })} placeholder="Dr. Smith" />
                        <TextInput label="ID (Unique)" value={tempLecturer.id} onChange={e => setTempLecturer({ ...tempLecturer, id: e.target.value })} placeholder="L01" />
                        <TextInput label="Subjects (comma sep)" value={tempLecturer.subjects} onChange={e => setTempLecturer({ ...tempLecturer, subjects: e.target.value })} placeholder="CS101, CS102" />
                    </div>
                    <button 
                        type="button"
                        onClick={handleQuickAddLecturer} 
                        disabled={adding}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center shadow-md transition-colors"
                    >
                        {adding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                        Add & Select Lecturer
                    </button>
                </div>
            </div>

            {/* Classrooms */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Trash className="h-5 w-5 text-indigo-600 rotate-180" /> {/* Reused icon for Classroom/rooms */}
                    2. Global Classroom/Lab Pool
                </h2>
                <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <TextInput label="Room ID" value={tempClassroom.id} onChange={e => setTempClassroom({ ...tempClassroom, id: e.target.value })} placeholder="R101" />
                        <NumberInput label="Capacity" value={tempClassroom.capacity} onChange={e => setTempClassroom({ ...tempClassroom, capacity: e.target.value })} />
                        <SelectInput label="Type" value={tempClassroom.type} onChange={e => setTempClassroom({ ...tempClassroom, type: e.target.value })} options={[{ label: 'Classroom', value: 'Classroom' }, { label: 'Lab', value: 'Lab' }]} />
                    </div>
                    <button onClick={addClassroom} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center shadow-md transition-colors">
                        <Plus className="h-3 w-3 mr-1" /> Add Room
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {classrooms.map((c, idx) => (
                        <div key={idx} className="bg-white border rounded-xl px-4 py-2 text-sm flex items-center gap-2 shadow-sm border-gray-100">
                            <span className="font-semibold text-gray-800">{c.id}</span> 
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">({c.type})</span>
                            <button onClick={() => setClassrooms(classrooms.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"><Trash className="h-3 w-3" /></button>
                        </div>
                    ))}
                    {classrooms.length === 0 && <span className="text-gray-400 italic text-sm">No rooms added yet.</span>}
                </div>
            </div>
        </div>
    );
};
