import React, { useState, useEffect } from 'react';
import { TextInput, NumberInput, SelectInput } from './FormInputs';
import { Plus, Trash, Check, UserPlus, Loader2, Sparkles, Building, AlertCircle } from 'lucide-react';
import { getStaff, getClassrooms, getLabs } from '../services/api';

// --- Step 1: Metadata ---
export const Step1Metadata = ({ metadata, handleMetadataChange }) => {
    const deptOptions = [
        { value: 'Computer Science', label: 'Computer Science' },
        { value: 'Information Technology', label: 'Information Technology' },
        { value: 'Electrical Engineering', label: 'Electrical Engineering' },
        { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
        { value: 'Civil Engineering', label: 'Civil Engineering' },
        { value: 'Other', label: 'Other (Custom)' }
    ];

    const semesterOptions = [
        { value: '1', label: 'Semester 1' },
        { value: '2', label: 'Semester 2' },
        { value: '3', label: 'Semester 3' },
        { value: '4', label: 'Semester 4' },
        { value: '5', label: 'Semester 5' },
        { value: '6', label: 'Semester 6' },
        { value: '7', label: 'Semester 7' },
        { value: '8', label: 'Semester 8' }
    ];

    const isPredefined = deptOptions.some(opt => opt.value === metadata.department && opt.value !== 'Other');
    const [isOther, setIsOther] = useState(metadata.department ? !isPredefined : false);
    const [customDept, setCustomDept] = useState(isOther ? metadata.department : '');

    const handleDeptSelect = (e) => {
        const val = e.target.value;
        if (val === 'Other') {
            setIsOther(true);
            handleMetadataChange('department', customDept);
        } else {
            setIsOther(false);
            handleMetadataChange('department', val);
        }
    };

    const handleCustomDeptChange = (e) => {
        const val = e.target.value;
        setCustomDept(val);
        handleMetadataChange('department', val);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                Academic Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput label="Institution Name" value={metadata.institution_name} onChange={e => handleMetadataChange('institution_name', e.target.value)} />
                
                <div className="flex flex-col">
                    <SelectInput 
                        label="Department" 
                        value={isOther ? 'Other' : metadata.department} 
                        onChange={handleDeptSelect} 
                        options={deptOptions} 
                    />
                    {isOther && (
                        <div className="mt-1">
                            <TextInput 
                                label="Custom Department Name" 
                                value={customDept} 
                                onChange={handleCustomDeptChange} 
                                placeholder="Enter department name" 
                                required 
                            />
                        </div>
                    )}
                </div>

                <SelectInput 
                    label="Semester" 
                    value={metadata.semester.toString()} 
                    onChange={e => handleMetadataChange('semester', parseInt(e.target.value))} 
                    options={semesterOptions} 
                />

                <TextInput label="Academic Year" value={metadata.academic_year} onChange={e => handleMetadataChange('academic_year', e.target.value)} />
                <NumberInput label="Periods Per Day" value={metadata.periods_per_day} onChange={e => handleMetadataChange('periods_per_day', parseInt(e.target.value))} />
            </div>
        </div>
    );
};


// --- Step 2: Global Resources ---
export const Step2GlobalResources = ({ lecturers, setLecturers, classrooms, setClassrooms, labs = [], setLabs, selectedSemester }) => {
    const [dbStaff, setDbStaff] = useState([]);
    const [dbRooms, setDbRooms] = useState([]);
    const [dbLabs, setDbLabs] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadResources();
    }, [selectedSemester]);

    const loadResources = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch all resources in parallel
            const [staffData, roomsData, labsData] = await Promise.all([
                getStaff(),
                getClassrooms(),
                getLabs()
            ]);

            // Filter out inactive ones
            const activeStaff = staffData.filter(s => s.status === 'Active');
            
            // Filter staff by semester
            const filteredStaff = activeStaff.filter(member => 
                !member.semesters || 
                member.semesters.length === 0 || 
                member.semesters.includes(selectedSemester)
            );

            const activeRooms = roomsData.filter(r => r.status === 'Available');
            const activeLabs = labsData.filter(l => l.status === 'Available');

            setDbStaff(filteredStaff);
            setDbRooms(activeRooms);
            setDbLabs(activeLabs);

            // Pre-select all by default if the state arrays are empty
            if (lecturers.length === 0) setLecturers(filteredStaff);
            if (classrooms.length === 0) setClassrooms(activeRooms);
            if (labs.length === 0) setLabs(activeLabs);

        } catch (err) {
            console.error("Failed to load global pool resources", err);
            setError("Failed to fetch Master Data resources from database. Make sure resources are configured.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStaff = (member) => {
        if (lecturers.some(l => l.id === member.id)) {
            setLecturers(lecturers.filter(l => l.id !== member.id));
        } else {
            setLecturers([...lecturers, member]);
        }
    };

    const toggleRoom = (room) => {
        if (classrooms.some(r => r.id === room.id)) {
            setClassrooms(classrooms.filter(r => r.id !== room.id));
        } else {
            setClassrooms([...classrooms, room]);
        }
    };

    const toggleLab = (lab) => {
        if (labs.some(l => l.id === lab.id)) {
            setLabs(labs.filter(l => l.id !== lab.id));
        } else {
            setLabs([...labs, lab]);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500 font-medium">Fetching Master Resources...</span>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* 1. Staff Section */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <UserPlus className="h-5.5 w-5.5 text-indigo-600" />
                    1. Select Available Staff ({lecturers.length} / {dbStaff.length} Selected)
                </h2>
                <p className="text-xs text-slate-500 mb-4">Choose which teaching staff members from the Master Database should be scheduled in this timetable.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {dbStaff.map(member => {
                        const selected = lecturers.some(l => l.id === member.id);
                        return (
                            <div
                                key={member.id}
                                onClick={() => toggleStaff(member)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                    selected 
                                        ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' 
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{member.name}</div>
                                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{member.designation}</div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                        {selected && <Check className="h-3 w-3" />}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 flex flex-col gap-0.5 border-t border-slate-100/50 pt-2 font-mono">
                                    <span>Dept: {member.department}</span>
                                    <span className="text-indigo-600 font-semibold text-[10px] uppercase mt-1 truncate">
                                        Handles: {member.subjects?.join(', ') || 'No subjects'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {dbStaff.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                            No active staff members found in the Master Database.
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Classrooms Section */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Building className="h-5.5 w-5.5 text-indigo-600" />
                    2. Select Available Classrooms ({classrooms.length} / {dbRooms.length} Selected)
                </h2>
                <p className="text-xs text-slate-500 mb-4">Choose which lecture classrooms from the database pool should be utilized.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {dbRooms.map(room => {
                        const selected = classrooms.some(r => r.id === room.id);
                        return (
                            <div
                                key={room.id}
                                onClick={() => toggleRoom(room)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                    selected 
                                        ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' 
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-slate-855 text-sm">{room.id}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{room.name}</div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                        {selected && <Check className="h-3 w-3" />}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 border-t border-slate-100/50 pt-2 flex flex-col gap-0.5">
                                    <span>Capacity: {room.capacity} seats</span>
                                    <span>{room.building} • Floor {room.floor}</span>
                                </div>
                            </div>
                        );
                    })}
                    {dbRooms.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                            No available classrooms found in the Master Database.
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Laboratories Section */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Plus className="h-5.5 w-5.5 text-indigo-600 rotate-180" />
                    3. Select Available Laboratories ({labs.length} / {dbLabs.length} Selected)
                </h2>
                <p className="text-xs text-slate-500 mb-4">Choose which specialized lab rooms should be utilized for practical lab periods.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {dbLabs.map(lab => {
                        const selected = labs.some(l => l.id === lab.id);
                        return (
                            <div
                                key={lab.id}
                                onClick={() => toggleLab(lab)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                                    selected 
                                        ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' 
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-slate-855 text-sm">{lab.id}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{lab.name}</div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                        {selected && <Check className="h-3 w-3" />}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 border-t border-slate-100/50 pt-2 flex flex-col gap-0.5">
                                    <span>Capacity: {lab.capacity} stations</span>
                                    <span className="text-[10px] font-semibold text-purple-600 truncate">{lab.department}</span>
                                </div>
                            </div>
                        );
                    })}
                    {dbLabs.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                            No available laboratories found in the Master Database.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

