import React, { useState, useEffect } from 'react';
import { TextInput, NumberInput } from './FormInputs';
import { Plus, Trash, Users } from 'lucide-react';

const MultiDivisionForm = ({ divisions, setDivisions, lecturers }) => {
    const [activeDivIndex, setActiveDivIndex] = useState(0);

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
        assigned_lecturer_id: ''
    });

    const addSubjectToDiv = () => {
        if (!tempSubject.code || !tempSubject.name) return;
        const newDivs = [...divisions];
        // Ensure subjects array exists
        if (!newDivs[activeDivIndex].subjects) newDivs[activeDivIndex].subjects = [];

        newDivs[activeDivIndex].subjects.push({
            ...tempSubject,
            periods_per_week: parseInt(tempSubject.periods)
        });
        setDivisions(newDivs);
        setTempSubject({ code: '', name: '', type: 'Theory', periods: 4, assigned_lecturer_id: '' });
    };

    const removeSubjectFromDiv = (subIndex) => {
        const newDivs = [...divisions];
        newDivs[activeDivIndex].subjects = newDivs[activeDivIndex].subjects.filter((_, i) => i !== subIndex);
        setDivisions(newDivs);
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
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Add Subject to Div {activeDiv.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                        <div className="md:col-span-4">
                            <TextInput label="Name" value={tempSubject.name} onChange={e => setTempSubject({ ...tempSubject, name: e.target.value })} placeholder="Mathematics" />
                        </div>
                        <div className="md:col-span-2">
                            <TextInput label="Code" value={tempSubject.code} onChange={e => setTempSubject({ ...tempSubject, code: e.target.value })} placeholder="M101" />
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select className="p-2 border rounded-md text-sm" value={tempSubject.type} onChange={e => setTempSubject({ ...tempSubject, type: e.target.value })}>
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
                                className="p-2 border rounded-md text-sm"
                                value={tempSubject.assigned_lecturer_id}
                                onChange={e => setTempSubject({ ...tempSubject, assigned_lecturer_id: e.target.value })}
                            >
                                <option value="">Auto (AI)</option>
                                {lecturers.map((l, i) => (
                                    <option key={`${l.id}-${i}`} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={addSubjectToDiv} className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center justify-center text-sm shadow-sm transition-colors">
                        <Plus className="h-4 w-4 mr-1" /> Add Subject to Division {activeDiv.name}
                    </button>
                </div>

                {/* Subject List */}
                <div className="space-y-2">
                    {activeDiv.subjects && activeDiv.subjects.length > 0 ? (
                        activeDiv.subjects.map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border hover:border-indigo-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-10 rounded-l ${s.type === 'Lab' ? 'bg-blue-800' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">{s.name}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{s.code}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex gap-4">
                                            <span>{s.type}</span>
                                            <span>{s.periods_per_week} periods/wk</span>
                                            {s.assigned_lecturer_id && (
                                                <span className="text-green-600 font-medium flex items-center">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {lecturers.find(l => l.id === s.assigned_lecturer_id)?.name || s.assigned_lecturer_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeSubjectFromDiv(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                                    <Trash className="h-4 w-4" />
                                </button>
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
