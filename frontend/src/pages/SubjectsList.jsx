import React, { useState, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject, getStaff } from '../services/api';
import { Loader2, BookOpen, Clock, Hash, Shield, Search, Plus, Trash2, Edit2, X, AlertCircle, Award, CheckCircle } from 'lucide-react';

const SubjectsList = () => {
    const [subjects, setSubjects] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'Theory',
        periods_per_week: 4,
        assigned_lecturer_id: '',
        semester: 1,
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
        department: '',
        credits: 3,
        lab_requirement: false
    });

    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const departments = ["Computer Science", "Information Technology", "Electrical", "Electronics", "Mechanical", "Civil", "Basic Sciences"];

    useEffect(() => {
        fetchData();
        fetchStaff();
    }, [searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getSubjects(searchQuery);
            setSubjects(data);
        } catch (error) {
            console.error("Failed to load subjects", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const data = await getStaff();
            setStaffList(data);
        } catch (error) {
            console.error("Failed to load staff list", error);
        }
    };

    const handleOpenAdd = () => {
        setError('');
        setFormData({
            code: '',
            name: '',
            type: 'Theory',
            periods_per_week: 4,
            assigned_lecturer_id: '',
            semester: 1,
            semesters: [1, 2, 3, 4, 5, 6, 7, 8],
            department: departments[0],
            credits: 3,
            lab_requirement: false
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (subject) => {
        setError('');
        setCurrentSubject(subject);
        setFormData({
            code: subject.code,
            name: subject.name,
            type: subject.type || 'Theory',
            periods_per_week: subject.periods_per_week || 4,
            assigned_lecturer_id: subject.assigned_lecturer_id || '',
            semester: subject.semester || 1,
            semesters: subject.semesters || [1, 2, 3, 4, 5, 6, 7, 8],
            department: subject.department || departments[0],
            credits: subject.credits || 3,
            lab_requirement: subject.lab_requirement || false
        });
        setIsEditOpen(true);
    };

    const handleSemesterToggle = (sem) => {
        const currentSems = [...formData.semesters];
        if (currentSems.includes(sem)) {
            setFormData({
                ...formData,
                semesters: currentSems.filter(s => s !== sem)
            });
        } else {
            setFormData({
                ...formData,
                semesters: [...currentSems, sem].sort((a, b) => a - b)
            });
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.code || !formData.name) {
            setError("Subject Code and Name are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                code: formData.code.trim().toUpperCase(),
                name: formData.name.trim(),
                type: formData.type,
                periods_per_week: parseInt(formData.periods_per_week),
                assigned_lecturer_id: formData.assigned_lecturer_id || null,
                semester: parseInt(formData.semester),
                semesters: formData.semesters,
                department: formData.department,
                credits: parseInt(formData.credits),
                lab_requirement: formData.lab_requirement
            };
            await createSubject(payload);
            setIsAddOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create subject");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setError("Subject Name is required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                code: currentSubject.code,
                name: formData.name.trim(),
                type: formData.type,
                periods_per_week: parseInt(formData.periods_per_week),
                assigned_lecturer_id: formData.assigned_lecturer_id || null,
                semester: parseInt(formData.semester),
                semesters: formData.semesters,
                department: formData.department,
                credits: parseInt(formData.credits),
                lab_requirement: formData.lab_requirement
            };
            await updateSubject(currentSubject.code, payload);
            setIsEditOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update subject");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = async (code) => {
        if (!window.confirm(`Are you sure you want to delete subject ${code}?`)) return;
        try {
            await deleteSubject(code);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete subject: " + (err.response?.data?.detail || err.message));
        }
    };

    const filteredSubjects = subjects.filter(s => {
        const typeMatch = !filterType || s.type === filterType;
        const deptMatch = !filterDepartment || s.department === filterDepartment;
        return typeMatch && deptMatch;
    });

    return (
        <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto space-y-8 animate-fade-in text-slate-800">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-md">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center gap-3">
                        <BookOpen className="h-9 w-9 text-indigo-600 animate-pulse" />
                        Subjects Directory
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-sm md:text-base">Configure academic curriculum subjects, department tags, credit points, lab settings, and assigned staff members.</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all text-sm shrink-0 self-start sm:self-center"
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Subject
                </button>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search subjects by code, name, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">Type:</span>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="">All Types</option>
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                    </select>
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
            </div>

            {/* List Grid */}
            {loading ? (
                <div className="py-20 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6">
                    {filteredSubjects.map((subject) => {
                        const assignedStaff = staffList.find(st => st.id === subject.assigned_lecturer_id);
                        return (
                            <div 
                                key={subject.code}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative"
                            >
                                {/* Card Header Color Ribbon */}
                                <div className={`h-1.5 w-full ${subject.type === 'Lab' ? 'bg-blue-600' : 'bg-indigo-500'}`}></div>
                                
                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col space-y-4">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors truncate pr-2" title={subject.name}>
                                                {subject.name}
                                            </h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                subject.type === 'Lab' 
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                            }`}>
                                                {subject.type}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-slate-400 mt-0.5">Code: {subject.code}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {subject.department} • Semesters: {subject.semesters && subject.semesters.length > 0 ? subject.semesters.join(', ') : (subject.semester || 'All')}
                                        </p>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-slate-50 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span>Weekly Requirement: {subject.periods_per_week} Periods</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Award className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span>Credits: {subject.credits} Credits</span>
                                        </div>
                                        {subject.lab_requirement && (
                                            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/50 px-2 py-1 rounded border border-blue-100/50 self-start">
                                                <CheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                                <span className="font-semibold text-[10px]">Requires Laboratory Room</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1 pt-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Lecturer</div>
                                        <div className="text-xs font-semibold text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 truncate">
                                            {assignedStaff ? assignedStaff.name : (
                                                <span className="text-slate-400 font-medium italic">Auto-assigned (AI Scheduling Pool)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex gap-2 shrink-0">
                                    <button 
                                        onClick={() => handleOpenEdit(subject)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-semibold shadow-sm transition-all"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(subject.code)}
                                        className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-400 shadow-sm transition-all"
                                        aria-label="Delete subject"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredSubjects.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400 bg-white/55 rounded-2xl border border-dashed border-slate-200 shadow-sm">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">No subjects found</p>
                            <p className="text-sm text-slate-400 mt-1">Try refining your search query or add a new subject.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                Add Academic Subject
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code</label>
                                    <input 
                                        type="text" 
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="CS-302"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Database Systems"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value, lab_requirement: e.target.value === 'Lab' })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="Theory">Theory</option>
                                        <option value="Lab">Lab</option>
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periods Per Week</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10"
                                        value={formData.periods_per_week}
                                        onChange={e => setFormData({ ...formData, periods_per_week: e.target.value })}
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="8"
                                        value={formData.semester}
                                        onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="6"
                                        value={formData.credits}
                                        onChange={e => setFormData({ ...formData, credits: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Lecturer</label>
                                    <select 
                                        value={formData.assigned_lecturer_id}
                                        onChange={e => setFormData({ ...formData, assigned_lecturer_id: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Auto (AI Scheduler decides)</option>
                                        {staffList.filter(s => s.status === 'Active').map(st => (
                                            <option key={st.id} value={st.id}>{st.name} ({st.designation})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Offered Semesters</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
                                            const active = formData.semesters.includes(s);
                                            return (
                                                <button
                                                    type="button"
                                                    key={s}
                                                    onClick={() => handleSemesterToggle(s)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                                        active 
                                                            ? 'bg-purple-500 text-white border-purple-500 shadow-sm' 
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    Sem {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="lab_req"
                                        checked={formData.lab_requirement}
                                        onChange={e => setFormData({ ...formData, lab_requirement: e.target.checked })}
                                        className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="lab_req" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                        Requires Laboratory Classroom / Room (Lab Requirement)
                                    </label>
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
                                    Create Subject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                Edit Academic Subject
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code (ReadOnly)</label>
                                    <input 
                                        type="text" 
                                        value={formData.code}
                                        disabled
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 font-mono"
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Database Systems"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value, lab_requirement: e.target.value === 'Lab' })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="Theory">Theory</option>
                                        <option value="Lab">Lab</option>
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periods Per Week</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10"
                                        value={formData.periods_per_week}
                                        onChange={e => setFormData({ ...formData, periods_per_week: e.target.value })}
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="8"
                                        value={formData.semester}
                                        onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="6"
                                        value={formData.credits}
                                        onChange={e => setFormData({ ...formData, credits: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Lecturer</label>
                                    <select 
                                        value={formData.assigned_lecturer_id}
                                        onChange={e => setFormData({ ...formData, assigned_lecturer_id: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="">Auto (AI Scheduler decides)</option>
                                        {staffList.filter(s => s.status === 'Active').map(st => (
                                            <option key={st.id} value={st.id}>{st.name} ({st.designation})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Offered Semesters</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
                                            const active = formData.semesters.includes(s);
                                            return (
                                                <button
                                                    type="button"
                                                    key={s}
                                                    onClick={() => handleSemesterToggle(s)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                                        active 
                                                            ? 'bg-purple-500 text-white border-purple-500 shadow-sm' 
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    Sem {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="lab_req_edit"
                                        checked={formData.lab_requirement}
                                        onChange={e => setFormData({ ...formData, lab_requirement: e.target.checked })}
                                        className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="lab_req_edit" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                        Requires Laboratory Classroom / Room (Lab Requirement)
                                    </label>
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

export default SubjectsList;
