import React, { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../services/api';
import { Loader2, Users, Mail, BookOpen, Clock, Calendar, Search, Plus, Trash2, Edit2, X, AlertCircle, Shield, CheckCircle, HelpCircle } from 'lucide-react';

const StaffList = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        department: '',
        designation: '',
        subjects: '',
        max_periods_per_day: 4,
        max_periods_per_week: 20,
        available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        preferred_slots: '',
        status: 'Active'
    });

    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const departments = ["Computer Science", "Information Technology", "Electrical", "Electronics", "Mechanical", "Civil", "Basic Sciences"];
    const designations = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab Assistant"];

    useEffect(() => {
        fetchData();
    }, [searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getStaff(searchQuery);
            setStaffList(data);
        } catch (error) {
            console.error("Failed to load staff list", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setError('');
        setFormData({
            id: '',
            name: '',
            email: '',
            department: departments[0],
            designation: designations[2],
            subjects: '',
            max_periods_per_day: 4,
            max_periods_per_week: 20,
            available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            preferred_slots: '',
            status: 'Active'
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (member) => {
        setError('');
        setCurrentMember(member);
        setFormData({
            id: member.id,
            name: member.name,
            email: member.email || '',
            department: member.department || departments[0],
            designation: member.designation || designations[2],
            subjects: member.subjects?.join(', ') || '',
            max_periods_per_day: member.max_periods_per_day || 4,
            max_periods_per_week: member.max_periods_per_week || 20,
            available_days: member.available_days || weekdays,
            preferred_slots: member.preferred_slots?.join(', ') || '',
            status: member.status || 'Active'
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

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.id || !formData.name || !formData.email) {
            setError("Staff ID, Name, and Email are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                id: formData.id.trim(),
                name: formData.name.trim(),
                email: formData.email.trim(),
                department: formData.department,
                designation: formData.designation,
                subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
                max_periods_per_day: parseInt(formData.max_periods_per_day),
                max_periods_per_week: parseInt(formData.max_periods_per_week),
                available_days: formData.available_days,
                preferred_slots: formData.preferred_slots ? formData.preferred_slots.split(',').map(s => s.trim()).filter(Boolean) : null,
                status: formData.status
            };
            await createStaff(payload);
            setIsAddOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create staff member");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            setError("Name and Email are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                id: currentMember.id,
                name: formData.name.trim(),
                email: formData.email.trim(),
                department: formData.department,
                designation: formData.designation,
                subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
                max_periods_per_day: parseInt(formData.max_periods_per_day),
                max_periods_per_week: parseInt(formData.max_periods_per_week),
                available_days: formData.available_days,
                preferred_slots: formData.preferred_slots ? formData.preferred_slots.split(',').map(s => s.trim()).filter(Boolean) : null,
                status: formData.status
            };
            await updateStaff(currentMember.id, payload);
            setIsEditOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update staff member");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm(`Are you sure you want to delete staff member ${id}?`)) return;
        try {
            await deleteStaff(id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete staff member: " + (err.response?.data?.detail || err.message));
        }
    };

    const filteredStaff = staffList.filter(s => {
        const deptMatch = !filterDepartment || s.department === filterDepartment;
        const statusMatch = !filterStatus || s.status === filterStatus;
        return deptMatch && statusMatch;
    });

    return (
        <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto space-y-8 animate-fade-in text-slate-800">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 shadow-md">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center gap-3">
                        <Users className="h-9 w-9 text-indigo-600 animate-pulse" />
                        Staff Directory
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-sm md:text-base">Manage institutional staff members, contact records, department listings, workload restrictions, and calendars.</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all text-sm shrink-0 self-start sm:self-center"
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Staff Member
                </button>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search staff by ID, name, email, department, designation..."
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
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
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
                    {filteredStaff.map((member) => (
                        <div 
                            key={member.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group relative"
                        >
                            {/* Card Header Color Ribbon */}
                            <div className={`h-1.5 w-full ${member.status === 'Active' ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                            
                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col space-y-4">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors truncate pr-2" title={member.name}>
                                            {member.name}
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            member.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">{member.designation}</p>
                                    <p className="text-xs text-slate-400">{member.department}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-50 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="font-mono text-slate-500 truncate">ID: {member.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate" title={member.email}>{member.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>Max workload: {member.max_periods_per_day} p.d. / {member.max_periods_per_week} p.w.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">Available: {member.available_days?.join(', ') || 'None'}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subjects Handled</div>
                                    <div className="flex flex-wrap gap-1">
                                        {member.subjects?.map((sub, i) => (
                                            <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">
                                                {sub}
                                            </span>
                                        )) || <span className="text-xs text-slate-400 italic">None assigned</span>}
                                    </div>
                                </div>
                                
                                {member.preferred_slots && member.preferred_slots.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Slots</div>
                                        <div className="text-xs text-slate-500 font-mono bg-slate-50/50 p-1.5 rounded border border-slate-100/50 truncate">
                                            {member.preferred_slots.join(', ')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex gap-2 shrink-0">
                                <button 
                                    onClick={() => handleOpenEdit(member)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-xs font-semibold shadow-sm transition-all"
                                >
                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(member.id)}
                                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-400 shadow-sm transition-all"
                                    aria-label="Delete member"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredStaff.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400 bg-white/55 rounded-2xl border border-dashed border-slate-200 shadow-sm">
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">No staff members found</p>
                            <p className="text-sm text-slate-400 mt-1">Try refining your search query or add a new staff member.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                Add Staff Member
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff ID (Unique)</label>
                                    <input 
                                        type="text" 
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                        placeholder="ST-101"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Dr. Rajesh Kumar"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="rajesh.kumar@institution.edu"
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</label>
                                    <select 
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subjects Handled (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        value={formData.subjects}
                                        onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                                        placeholder="DBMS, Data Structures, CS101"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Periods/Day</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="8"
                                        value={formData.max_periods_per_day}
                                        onChange={e => setFormData({ ...formData, max_periods_per_day: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Periods/Week</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="40"
                                        value={formData.max_periods_per_week}
                                        onChange={e => setFormData({ ...formData, max_periods_per_week: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Time Slots (comma-separated, optional)</label>
                                    <input 
                                        type="text" 
                                        value={formData.preferred_slots}
                                        onChange={e => setFormData({ ...formData, preferred_slots: e.target.value })}
                                        placeholder="Monday P1, Tuesday P2"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                    />
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employment Status</label>
                                    <div className="flex gap-4 mt-1">
                                        {['Active', 'Inactive'].map(s => (
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
                                    Create Staff
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                Edit Staff Member
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff ID (ReadOnly)</label>
                                    <input 
                                        type="text" 
                                        value={formData.id}
                                        disabled
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 font-mono"
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Dr. Rajesh Kumar"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="rajesh.kumar@institution.edu"
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</label>
                                    <select 
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                    >
                                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subjects Handled (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        value={formData.subjects}
                                        onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                                        placeholder="DBMS, Data Structures, CS101"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Periods/Day</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="8"
                                        value={formData.max_periods_per_day}
                                        onChange={e => setFormData({ ...formData, max_periods_per_day: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Periods/Week</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="40"
                                        value={formData.max_periods_per_week}
                                        onChange={e => setFormData({ ...formData, max_periods_per_week: e.target.value })}
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col space-y-1 sm:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Time Slots (comma-separated, optional)</label>
                                    <input 
                                        type="text" 
                                        value={formData.preferred_slots}
                                        onChange={e => setFormData({ ...formData, preferred_slots: e.target.value })}
                                        placeholder="Monday P1, Tuesday P2"
                                        className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50/30"
                                    />
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employment Status</label>
                                    <div className="flex gap-4 mt-1">
                                        {['Active', 'Inactive'].map(s => (
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

export default StaffList;
