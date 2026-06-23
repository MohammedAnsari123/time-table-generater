import React, { useState, useEffect } from 'react';
import { getLecturers, createLecturer, updateLecturer, deleteLecturer } from '../services/api';
import { Loader2, Users, BookOpen, Calendar, Search, Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

const LecturersList = () => {
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDay, setFilterDay] = useState('');
    
    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentLecturer, setCurrentLecturer] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        subjects: '',
        max_periods_per_day: 4,
        available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    });
    
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    useEffect(() => {
        fetchData();
    }, [searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getLecturers(searchQuery);
            setLecturers(data);
        } catch (error) {
            console.error("Failed to load lecturers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setError('');
        setFormData({
            id: '',
            name: '',
            subjects: '',
            max_periods_per_day: 4,
            available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (lecturer) => {
        setError('');
        setCurrentLecturer(lecturer);
        setFormData({
            id: lecturer.id,
            name: lecturer.name,
            subjects: lecturer.subjects?.join(', ') || '',
            max_periods_per_day: lecturer.max_periods_per_day || 4,
            available_days: lecturer.available_days || weekdays
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
        if (!formData.id || !formData.name) {
            setError("ID and Name are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                id: formData.id.trim(),
                name: formData.name.trim(),
                subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
                max_periods_per_day: parseInt(formData.max_periods_per_day),
                available_days: formData.available_days
            };
            await createLecturer(payload);
            setIsAddOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to create lecturer");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setError("Name is required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                id: currentLecturer.id,
                name: formData.name.trim(),
                subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
                max_periods_per_day: parseInt(formData.max_periods_per_day),
                available_days: formData.available_days
            };
            await updateLecturer(currentLecturer.id, payload);
            setIsEditOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to update lecturer");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete lecturer ${id}?`)) return;
        try {
            await deleteLecturer(id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to delete lecturer: " + (err.response?.data?.detail || err.message));
        }
    };

    const filteredLecturers = lecturers.filter(l => {
        if (!filterDay) return true;
        return l.available_days?.includes(filterDay);
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-8 w-8 text-purple-600" />
                        Lecturers Directory
                    </h1>
                    <p className="text-gray-500 mt-1">Manage global pool of academic instructors, subjects taught, and schedules.</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all text-sm self-start sm:self-center"
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Lecturer
                </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search lecturers by ID, Name or subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Available Day:</span>
                    <select
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                        <option value="">All Days</option>
                        {weekdays.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lecturers Grid */}
            {loading ? (
                <div className="h-60 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6 3xl:gap-8">
                    {filteredLecturers.map((lecturer) => (
                        <div key={lecturer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-purple-200 transition-all duration-300 relative group flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-purple-700 font-bold text-lg">
                                        {lecturer.name.charAt(0)}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button 
                                            onClick={() => handleOpenEdit(lecturer)}
                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Edit Lecturer"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(lecturer.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Lecturer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-purple-700 transition-colors">{lecturer.name}</h3>
                                <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-semibold">
                                    ID: {lecturer.id}
                                </span>

                                <div className="space-y-3 mt-4">
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Subjects Taught</span>
                                        <div className="flex flex-wrap gap-1">
                                            {lecturer.subjects?.map((sub, i) => (
                                                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                                                    {sub}
                                                </span>
                                            )) || <span className="text-xs text-gray-400 italic">None assigned</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Availability</span>
                                        <div className="flex flex-wrap gap-1">
                                            {lecturer.available_days?.map((day, i) => (
                                                <span key={i} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded font-medium">
                                                    {day.substring(0, 3)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-50 pt-4 mt-6 flex justify-between items-center text-xs text-gray-500">
                                <span>Max periods/day</span>
                                <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{lecturer.max_periods_per_day}</span>
                            </div>
                        </div>
                    ))}

                    {filteredLecturers.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-700">No lecturers found</h3>
                            <p className="text-gray-400 text-sm mt-1">Try refining your search or filter options, or add a new lecturer.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-zoom-in border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="h-6 w-6 text-purple-600" />
                                Add New Lecturer
                            </h2>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAdd} className="p-6 space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-xs flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">ID (Unique)</label>
                                    <input 
                                        type="text" 
                                        placeholder="L101"
                                        required
                                        value={formData.id}
                                        onChange={e => setFormData({...formData, id: e.target.value})}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Dr. Rajesh"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Subjects (Comma separated)</label>
                                <input 
                                    type="text" 
                                    placeholder="CS101, CS102, MA201"
                                    value={formData.subjects}
                                    onChange={e => setFormData({...formData, subjects: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-[10px] text-gray-400 mt-1 block">Specify subject codes this lecturer can teach.</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Max Periods per Day</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="8"
                                    required
                                    value={formData.max_periods_per_day}
                                    onChange={e => setFormData({...formData, max_periods_per_day: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Available Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {weekdays.map(d => {
                                        const isSelected = formData.available_days.includes(d);
                                        return (
                                            <button
                                                type="button"
                                                key={d}
                                                onClick={() => handleDayToggle(d)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-500/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddOpen(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold shadow-md flex items-center"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    Add Lecturer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-zoom-in border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="h-6 w-6 text-purple-600" />
                                Edit Lecturer Info
                            </h2>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEdit} className="p-6 space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-xs flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">ID (Read-Only)</label>
                                <input 
                                    type="text" 
                                    disabled
                                    value={formData.id}
                                    className="w-full p-2.5 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Dr. Rajesh"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Subjects (Comma separated)</label>
                                <input 
                                    type="text" 
                                    placeholder="CS101, CS102, MA201"
                                    value={formData.subjects}
                                    onChange={e => setFormData({...formData, subjects: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-[10px] text-gray-400 mt-1 block">Specify subject codes this lecturer can teach.</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Max Periods per Day</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="8"
                                    required
                                    value={formData.max_periods_per_day}
                                    onChange={e => setFormData({...formData, max_periods_per_day: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Available Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {weekdays.map(d => {
                                        const isSelected = formData.available_days.includes(d);
                                        return (
                                            <button
                                                type="button"
                                                key={d}
                                                onClick={() => handleDayToggle(d)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-500/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold shadow-md flex items-center"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
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

export default LecturersList;
