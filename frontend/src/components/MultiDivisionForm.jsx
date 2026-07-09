import React, { useState, useEffect } from 'react';
import { TextInput, NumberInput } from './FormInputs';
import { Plus, Trash, Users, BookOpen, Sparkles, Loader2, Edit2, X } from 'lucide-react';
import { getSubjects, autoAllocateSubjects, getStaff } from '../services/api';

const MultiDivisionForm = ({ divisions, setDivisions, lecturers, semester, department }) => {
    const [activeDivIndex, setActiveDivIndex] = useState(0);
    const [dbSubjects, setDbSubjects] = useState([]);
    const [dbStaff, setDbStaff] = useState([]);
    const [dbStaffFull, setDbStaffFull] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [allocating, setAllocating] = useState(false);

    const getLecturerName = (lecturerId) => {
        if (!lecturerId) return '';
        const found = dbStaffFull.find(l => l.id === lecturerId || l._id === lecturerId || l.name === lecturerId);
        return found ? found.name : lecturerId;
    };

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const [subsData, staffData] = await Promise.all([
                    getSubjects(),
                    getStaff()
                ]);

                // Filter subjects by semester
                const filteredSubs = subsData.filter(sub => 
                    !sub.semesters || 
                    sub.semesters.length === 0 || 
                    sub.semesters.includes(semester)
                );
                setDbSubjects(filteredSubs);

                // Keep full list of staff to resolve names for display
                setDbStaffFull(staffData);

                // Filter active staff for current semester to display in dropdown options
                const activeStaff = staffData.filter(s => 
                    s.status === 'Active' && 
                    (!s.semesters || s.semesters.length === 0 || s.semesters.includes(semester))
                );
                setDbStaff(activeStaff);

            } catch (err) {
                console.error("Failed to load resources in MultiDivisionForm", err);
            }
        };
        fetchResources();
    }, [semester]);

    // Ensure at least one division exists
    useEffect(() => {
        if (divisions.length === 0) {
            setDivisions([{ name: 'A', strength: 60, subjects: [] }]);
        }
    }, [divisions, setDivisions]);

    const addDivision = () => {
        const name = String.fromCharCode(65 + divisions.length); // A, B, C...
        setDivisions([...divisions, { name, strength: 60, subjects: [] }]);
        setActiveDivIndex(divisions.length);
    };

    const removeDivision = (index) => {
        const newDivs = divisions.filter((_, i) => i !== index);
        setDivisions(newDivs);
        if (activeDivIndex >= newDivs.length) setActiveDivIndex(Math.max(0, newDivs.length - 1));
    };

    // Subject Management for Active Division
    const activeDiv = divisions[activeDivIndex] || { name: '?', subjects: [] };

    // Local state for the "Add Subject" form
    const [tempSubject, setTempSubject] = useState({
        code: '',
        name: '',
        type: 'Theory',
        periods: 4,
        assigned_lecturer_id: '',
        semester: 1,
        department: '',
        credits: 3,
        lab_requirement: false
    });

    const handleAutoAllocate = async () => {
        if (!department) {
            alert("Please select a department in Step 1 first.");
            return;
        }
        setAllocating(true);
        try {
            const res = await autoAllocateSubjects({
                department,
                semester,
                divisions,
                subjects: dbSubjects,
                lecturers: dbStaffFull
            });
            if (res && res.divisions) {
                setDivisions(res.divisions);
            }
        } catch (err) {
            console.error("Auto allocation error", err);
            alert("Failed to auto-allocate: " + (err.response?.data?.detail || err.message));
        } finally {
            setAllocating(false);
        }
    };

    const addSubjectToDiv = () => {
        if (!tempSubject.code || !tempSubject.name) return;
        const newDivs = [...divisions];
        if (!newDivs[activeDivIndex].subjects) newDivs[activeDivIndex].subjects = [];

        const subPayload = {
            code: tempSubject.code,
            name: tempSubject.name,
            type: tempSubject.type,
            periods_per_week: parseInt(tempSubject.periods),
            assigned_lecturer_id: tempSubject.assigned_lecturer_id || null,
            semester: parseInt(tempSubject.semester || 1),
            department: tempSubject.department || '',
            credits: parseInt(tempSubject.credits || 3),
            lab_requirement: tempSubject.lab_requirement || false
        };

        if (editingIndex !== null) {
            newDivs[activeDivIndex].subjects[editingIndex] = subPayload;
            setEditingIndex(null);
        } else {
            newDivs[activeDivIndex].subjects.push(subPayload);
        }

        setDivisions(newDivs);
        setTempSubject({ code: '', name: '', type: 'Theory', periods: 4, assigned_lecturer_id: '', semester: 1, department: '', credits: 3, lab_requirement: false });
    };

    const startEditingSubject = (sub, idx) => {
        setEditingIndex(idx);
        setTempSubject({
            code: sub.code,
            name: sub.name,
            type: sub.type,
            periods: sub.periods_per_week,
            assigned_lecturer_id: sub.assigned_lecturer_id || '',
            semester: sub.semester || 1,
            department: sub.department || '',
            credits: sub.credits || 3,
            lab_requirement: sub.lab_requirement || false
        });
    };

    const cancelEditingSubject = () => {
        setEditingIndex(null);
        setTempSubject({ code: '', name: '', type: 'Theory', periods: 4, assigned_lecturer_id: '', semester: 1, department: '', credits: 3, lab_requirement: false });
    };

    const removeSubjectFromDiv = (subIndex) => {
        const newDivs = [...divisions];
        newDivs[activeDivIndex].subjects = newDivs[activeDivIndex].subjects.filter((_, i) => i !== subIndex);
        setDivisions(newDivs);
        if (editingIndex === subIndex) setEditingIndex(null);
    };

    if (divisions.length === 0) return null;

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar: Division List */}
            <div className="w-full md:w-1/4 space-y-2">
                <h3 className="font-bold text-gray-700 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Divisions
                </h3>
                {divisions.map((div, idx) => (
                    <div key={idx}
                        className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center transition-all ${idx === activeDivIndex ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                        onClick={() => setActiveDivIndex(idx)}
                    >
                        <span className="font-bold">Division {div.name}</span>
                        {divisions.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); removeDivision(idx); }} className="text-gray-400 hover:text-red-600">
                                <Trash className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}
                 <button onClick={addDivision} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-indigo-400 hover:text-indigo-600 flex justify-center items-center transition-colors">
                    <Plus className="h-4 w-4 mr-1" /> Add Division
                </button>
                <button 
                    onClick={handleAutoAllocate}
                    disabled={allocating}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-sm hover:shadow flex justify-center items-center transition-all disabled:opacity-75 text-sm"
                >
                    {allocating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            Allocating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
                            Auto-Allocate Subjects (AI)
                        </>
                    )}
                </button>
            </div>

            {/* Main: Division Config */}
            <div className="w-full md:w-3/4 bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Division {activeDiv.name} Configuration</h2>
                        <p className="text-sm text-gray-500">Manage subjects and specific requirements</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Est. Strength:</span>
                        <input
                            type="number"
                            className="w-20 p-1 border rounded text-sm"
                            value={activeDiv.strength || 60}
                            onChange={(e) => {
                                const newDivs = [...divisions];
                                newDivs[activeDivIndex].strength = parseInt(e.target.value);
                                setDivisions(newDivs);
                            }}
                        />
                    </div>
                </div>

                {/* Subject Adder */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                        {editingIndex !== null ? `Edit Subject in Div ${activeDiv.name}` : `Add Subject to Div ${activeDiv.name}`}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                        <div className="md:col-span-4 flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Select Subject</label>
                            <select
                                className="p-2 border rounded-md text-sm bg-white"
                                value={tempSubject.code}
                                onChange={e => {
                                    const sub = dbSubjects.find(s => s.code === e.target.value);
                                    if (sub) {
                                        setTempSubject({
                                            code: sub.code,
                                            name: sub.name,
                                            type: sub.type,
                                            periods: sub.periods_per_week,
                                            assigned_lecturer_id: sub.assigned_lecturer_id || '',
                                            semester: sub.semester || 1,
                                            department: sub.department || '',
                                            credits: sub.credits || 3,
                                            lab_requirement: sub.lab_requirement || false
                                        });
                                    } else {
                                        setTempSubject({ code: '', name: '', type: 'Theory', periods: 4, assigned_lecturer_id: '', semester: 1, department: '', credits: 3, lab_requirement: false });
                                    }
                                }}

                            >
                                <option value="">-- Choose Subject --</option>
                                {dbSubjects.map(s => (
                                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <TextInput label="Code (Auto)" value={tempSubject.code} onChange={e => setTempSubject({ ...tempSubject, code: e.target.value })} placeholder="Code" required />
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Type (Auto)</label>
                            <select className="p-2 border rounded-md text-sm bg-gray-50 outline-none" value={tempSubject.type} onChange={e => setTempSubject({ ...tempSubject, type: e.target.value })}>
                                <option value="Theory">Theory</option>
                                <option value="Lab">Lab</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <NumberInput label="Periods/Wk" value={tempSubject.periods} onChange={e => setTempSubject({ ...tempSubject, periods: e.target.value })} />
                        </div>

                        {/* Lecturer Selection */}
                        <div className="md:col-span-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Lecturer</label>
                            <select
                                className="p-2 border rounded-md text-sm bg-white"
                                value={tempSubject.assigned_lecturer_id}
                                onChange={e => setTempSubject({ ...tempSubject, assigned_lecturer_id: e.target.value })}
                            >
                                <option value="">Auto (AI)</option>
                                {dbStaff.map((l, i) => {
                                    const val = l.id || l._id;
                                    return (
                                        <option key={`${val}-${i}`} value={val}>{l.name}</option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addSubjectToDiv} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center justify-center text-sm shadow-sm transition-colors">
                            {editingIndex !== null ? (
                                <>
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    Update Subject in Division {activeDiv.name}
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Subject to Division {activeDiv.name}
                                </>
                            )}
                        </button>
                        {editingIndex !== null && (
                            <button onClick={cancelEditingSubject} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm transition-colors">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Subject List */}
                <div className="space-y-2">
                    {activeDiv.subjects && activeDiv.subjects.length > 0 ? (
                        activeDiv.subjects.map((s, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded border hover:border-indigo-300 transition-colors gap-3">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className={`w-2 h-10 rounded-l shrink-0 ${s.type === 'Lab' ? 'bg-blue-800' : 'bg-blue-500'}`}></div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-gray-800 truncate max-w-[200px] sm:max-w-xs" title={s.name}>{s.name}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono shrink-0">{s.code}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                                            <span>{s.type}</span>
                                            <span>{s.periods_per_week} periods/wk</span>
                                            {s.assigned_lecturer_id && (
                                                <span className="text-green-600 font-medium flex items-center shrink-0">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {getLecturerName(s.assigned_lecturer_id)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                                    <button onClick={() => startEditingSubject(s, idx)} className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors" title="Edit subject">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => removeSubjectFromDiv(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Delete subject">
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
                            <p className="text-gray-400">No subjects added for Division {activeDiv.name} yet.</p>
                            <p className="text-xs text-gray-300 mt-1">Use the form above to add subjects</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultiDivisionForm;
