import React, { useState } from 'react';
import { TextInput, NumberInput, SelectInput } from './FormInputs';
import { Plus, Trash } from 'lucide-react';

// --- Step 1: Metadata ---
export const Step1Metadata = ({ metadata, handleMetadataChange }) => (
    <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Metadata</h2>
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
    const [tempLecturer, setTempLecturer] = useState({ name: '', id: '', subjects: '' });
    const [tempClassroom, setTempClassroom] = useState({ id: '', capacity: 60, type: 'Classroom' });

    const addLecturer = () => {
        if (!tempLecturer.name || !tempLecturer.id) return;
        if (lecturers.some(l => l.id === tempLecturer.id)) {
            alert("Lecturer ID must be unique!");
            return;
        }
        setLecturers([...lecturers, { ...tempLecturer, subjects: tempLecturer.subjects.split(',').map(s => s.trim()).filter(Boolean) }]);
        setTempLecturer({ name: '', id: '', subjects: '' });
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
            {/* Lecturers */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">1. Global Lecturer Pool</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <TextInput label="Name" value={tempLecturer.name} onChange={e => setTempLecturer({ ...tempLecturer, name: e.target.value })} placeholder="Dr. Smith" />
                        <TextInput label="ID (Unique)" value={tempLecturer.id} onChange={e => setTempLecturer({ ...tempLecturer, id: e.target.value })} placeholder="L01" />
                        <TextInput label="Subjects (comma sep)" value={tempLecturer.subjects} onChange={e => setTempLecturer({ ...tempLecturer, subjects: e.target.value })} placeholder="CS101, CS102" />
                    </div>
                    <button onClick={addLecturer} className="text-sm bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 flex items-center">
                        <Plus className="h-4 w-4 mr-1" /> Add Lecturer
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {lecturers.map((l, idx) => (
                        <div key={idx} className="bg-white border rounded px-3 py-1 text-sm flex items-center gap-2 shadow-sm">
                            <span className="font-semibold">{l.name}</span> <span className="text-gray-500">({l.id})</span>
                            <button onClick={() => setLecturers(lecturers.filter((_, i) => i !== idx))} className="text-red-500"><Trash className="h-3 w-3" /></button>
                        </div>
                    ))}
                    {lecturers.length === 0 && <span className="text-gray-400 italic text-sm">No lecturers yet.</span>}
                </div>
            </div>

            {/* Classrooms */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">2. Global Classroom/Lab Pool</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <TextInput label="Room ID" value={tempClassroom.id} onChange={e => setTempClassroom({ ...tempClassroom, id: e.target.value })} placeholder="R101" />
                        <NumberInput label="Capacity" value={tempClassroom.capacity} onChange={e => setTempClassroom({ ...tempClassroom, capacity: e.target.value })} />
                        <SelectInput label="Type" value={tempClassroom.type} onChange={e => setTempClassroom({ ...tempClassroom, type: e.target.value })} options={[{ label: 'Classroom', value: 'Classroom' }, { label: 'Lab', value: 'Lab' }]} />
                    </div>
                    <button onClick={addClassroom} className="text-sm bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 flex items-center">
                        <Plus className="h-4 w-4 mr-1" /> Add Room
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {classrooms.map((c, idx) => (
                        <div key={idx} className="bg-white border rounded px-3 py-1 text-sm flex items-center gap-2 shadow-sm">
                            <span className="font-semibold">{c.id}</span> <span className="text-gray-500">({c.type})</span>
                            <button onClick={() => setClassrooms(classrooms.filter((_, i) => i !== idx))} className="text-red-500"><Trash className="h-3 w-3" /></button>
                        </div>
                    ))}
                    {classrooms.length === 0 && <span className="text-gray-400 italic text-sm">No rooms yet.</span>}
                </div>
            </div>
        </div>
    );
};
