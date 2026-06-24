import React, { useState, useEffect } from 'react';
import { getLabs, createLab, updateLab, deleteLab, getSubjects } from '../services/api';
import { Loader2, FlaskConical, Calendar, Search, Plus, Trash2, Edit2, X, AlertCircle, CheckCircle, XCircle, Shield, BookOpen } from 'lucide-react';

const LabsList = () => {
    const [labs, setLabs] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentLab, setCurrentLab] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        capacity: 30,
        department: '',
        supported_subjects: [],
        available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        status: 'Available'
    });

    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const departments = ["Computer Science", "Information Technology", "Electrical", "Electronics", "Mechanical", "Civil", "Basic Sciences"];

    useEffect(() => {
        fetchData();
        fetchSubjects();
    }, [searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getLabs(searchQuery);
            setLabs(data);
        } catch (error) {
            console.error("Failed to load labs", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const data = await getSubjects();
            // Filter only Lab type subjects
            setSubjectsList(data.filter(s => s.type === 'Lab'));
        } catch (error) {
            console.error("Failed to load subjects", error);
        }
    };

    const handleOpenAdd = () => {
        setError('');
        setFormData({
            id: '',
            name: '',
            capacity: 30,
            department: departments[0],
            supported_subjects: [],
            available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            status: 'Available'
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (lab) => {
        setError('');
        setCurrentLab(lab);
        setFormData({
            id: lab.id,
            name: lab.name,
            capacity: lab.capacity || 30,
            department: lab.department || departments[0],
            supported_subjects: lab.supported_subjects || [],
            available_days: lab.available_days || weekdays,
            status: lab.status || 'Available'
        });
        setIsEditOpen(true);
    };

    const handleDayToggle = (day) => {
        const currentDays = [...formData.available_days];
        if (currentDays.includes(day)) {
            setFormData({
                ...formData,
                available_days: currentDays.filter(d => d !== day)
            });
        } else {
            setFormData({
                ...formData,
                available_days: [...currentDays, day]
            });
        }
    };

    const handleSubjectToggle = (subCode) => {
        const currentSubs = [...formData.supported_subjects];
        if (currentSubs.includes(subCode)) {
            setFormData({
                ...formData,
                supported_subjects: currentSubs.filter(c => c !== subCode)
            });
        } else {
            setFormData({
                ...formData,
                supported_subjects: [...currentSubs, subCode]
            });
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.id || !formData.name || !formData.department) {
            setError("Lab Number, Name, and Department are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                id: formData.id.trim().toUpperCase(),
                name: formData.name.trim(),
                capacity: parseInt(formData.capacity),
                department: formData.department,
                supported_subjects: formData.supported_subjects,
                available_days: formData.available_days,
                status: formData.status
            };
            await createLab(payload);
            setIsAddOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create laboratory");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.department) {
            setError("Lab Name and Department are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                id: currentLab.id,
                name: formData.name.trim(),
                capacity: parseInt(formData.capacity),
                department: formData.department,
                supported_subjects: formData.supported_subjects,
                available_days: formData.available_days,
                status: formData.status
            };
            await updateLab(currentLab.id, payload);
            setIsEditOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update laboratory");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm(`Are you sure you want to delete laboratory ${id}?`)) return;
        try {
            await deleteLab(id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete laboratory: " + (err.response?.data?.detail || err.message));
        }
    };

    const filteredLabs = labs.filter(l => {
        const deptMatch = !filterDepartment || l.department === filterDepartment;
        const statusMatch = !filterStatus || l.status === filterStatus;
        return deptMatch && statusMatch;
    });

    return (
        <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto space-y-8 animate-fade-in text-slate-800">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-md">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center gap-3">
                        <FlaskConical className="h-9 w-9 text-indigo-600 animate-pulse" />
                        Laboratories Pool
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-sm md:text-base">Configure academic lab rooms, seating capacity limits, subject support parameters, and availability schedules.</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all text-sm shrink-0 self-start sm:self-center"
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Laboratory
                </button>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search labs by number, name, department, supported subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">Dept:</span>
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">Status:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Unavailable">Unavailable</option>
                    </select>
                </div>
            </div>

            {/* List Grid */}
            {loading ? (
                <div className="py-20 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6">
                    {filteredLabs.map((lab) => (
                        <div 
                            key={lab.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative"
                        >
                            {/* Card Header Color Ribbon */}
                            <div className={`h-1.5 w-full ${lab.status === 'Available' ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                            
                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col space-y-4">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors truncate pr-2" title={lab.name}>
                                            {lab.name}
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                            lab.status === 'Available' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>
                                            {lab.status === 'Available' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-600" />}
                                            {lab.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{lab.department}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-50 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="font-mono text-slate-500">Lab Number: {lab.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>Max Capacity: {lab.capacity} stations</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">Available Days: {lab.available_days?.join(', ') || 'None'}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supported Subjects</div>
                                    <div className="flex flex-wrap gap-1">
                                        {lab.supported_subjects?.map((sub, i) => (
                                            <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">
                                                {sub}
                                            </span>
                                        )) || <span className="text-xs text-slate-400 italic">None configured</span>}
                                        {lab.supported_subjects?.length === 0 && (
                                            <span className="text-xs text-slate-400 italic">General/All Lab Subjects</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex gap-2 shrink-0">
                                <button 
                                    onClick={() => handleOpenEdit(lab)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-semibold shadow-sm transition-all"
                                >
                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(lab.id)}
                                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-400 shadow-sm transition-all"
                                    aria-label="Delete lab"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredLabs.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400 bg-white/55 rounded-2xl border border-dashed border-slate-200 shadow-sm">
                            <FlaskConical className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">No laboratories found</p>
                            <p className="text-sm text-slate-400 mt-1">Try refining your search query or add a new laboratory.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-indigo-600" />
                                Add Laboratory Room
                            </h2>
                            <button onClick={() => setIsAddOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {error && (
                                <div className="p-3.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Number (Unique ID)</label>
                                    <input 
                                        type="text" 
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                        placeholder="LAB-01"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Computer Network Lab"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                                    <select 
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity (Stations)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="200"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Supported Subjects (Lab Type Only)</label>
                                    <div className="max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/20">
                                        {subjectsList.map(s => {
                                            const active = formData.supported_subjects.includes(s.code);
                                            return (
                                                <label key={s.code} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        checked={active}
                                                        onChange={() => handleSubjectToggle(s.code)}
                                                        className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span>{s.name} ({s.code})</span>
                                                </label>
                                            );
                                        })}
                                        {subjectsList.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No lab-type subjects found in the database. Add them in the Subjects module first.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Available Days</label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {weekdays.map(d => {
                                            const active = formData.available_days.includes(d);
                                            return (
                                                <button
                                                    type="button"
                                                    key={d}
                                                    onClick={() => handleDayToggle(d)}
                                                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                                        active 
                                                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' 
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Availability Status</label>
                                    <div className="flex gap-4 mt-1">
                                        {['Available', 'Unavailable'].map(s => (
                                            <label key={s} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="status"
                                                    value={s}
                                                    checked={formData.status === s}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                />
                                                {s}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-indigo-500/10 flex items-center transition-all disabled:opacity-75"
                                >
                                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Create Laboratory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-indigo-600" />
                                Edit Laboratory Room
                            </h2>
                            <button onClick={() => setIsEditOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <form onSubmit={handleEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {error && (
                                <div className="p-3.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Number (ReadOnly)</label>
                                    <input 
                                        type="text" 
                                        value={formData.id}
                                        disabled
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 font-mono"
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Computer Network Lab"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                                    <select 
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity (Stations)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="200"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Supported Subjects (Lab Type Only)</label>
                                    <div className="max-h-36 overflow-y-auto p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/20">
                                        {subjectsList.map(s => {
                                            const active = formData.supported_subjects.includes(s.code);
                                            return (
                                                <label key={s.code} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        checked={active}
                                                        onChange={() => handleSubjectToggle(s.code)}
                                                        className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span>{s.name} ({s.code})</span>
                                                </label>
                                            );
                                        })}
                                        {subjectsList.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No lab-type subjects found in the database. Add them in the Subjects module first.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Available Days</label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {weekdays.map(d => {
                                            const active = formData.available_days.includes(d);
                                            return (
                                                <button
                                                    type="button"
                                                    key={d}
                                                    onClick={() => handleDayToggle(d)}
                                                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                                        active 
                                                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' 
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Availability Status</label>
                                    <div className="flex gap-4 mt-1">
                                        {['Available', 'Unavailable'].map(s => (
                                            <label key={s} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="status"
                                                    value={s}
                                                    checked={formData.status === s}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                />
                                                {s}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-indigo-500/10 flex items-center transition-all disabled:opacity-75"
                                >
                                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabsList;
