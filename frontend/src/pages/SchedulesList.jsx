import React, { useState, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject, getLecturers } from '../services/api';
import { Loader2, BookOpen, Clock, Hash, Search, Plus, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

const SchedulesList = () => {
    const [subjects, setSubjects] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');

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
        assigned_lecturer_id: ''
    });

    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchLecturers();
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

    const fetchLecturers = async () => {
        try {
            const data = await getLecturers();
            setLecturers(data);
        } catch (error) {
            console.error("Failed to load lecturers list", error);
        }
    };

    const handleOpenAdd = () => {
        setError('');
        setFormData({
            code: '',
            name: '',
            type: 'Theory',
            periods_per_week: 4,
            assigned_lecturer_id: ''
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
            assigned_lecturer_id: subject.assigned_lecturer_id || ''
        });
        setIsEditOpen(true);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.code || !formData.name) {
            setError("Code and Name are required");
            return;
        }
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                code: formData.code.trim(),
                name: formData.name.trim(),
                type: formData.type,
                periods_per_week: parseInt(formData.periods_per_week),
                assigned_lecturer_id: formData.assigned_lecturer_id || null
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
            setError("Name is required");
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
                assigned_lecturer_id: formData.assigned_lecturer_id || null
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

    const handleDelete = async (code) => {
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
        if (!filterType) return true;
        return s.type === filterType;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-indigo-600" />
                        Subjects Catalog
                    </h1>
                    <p className="text-gray-500 mt-1">Manage global curriculum parameters, class types, and teacher assignments.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all text-sm self-start sm:self-center"
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Subject
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search subjects by Code or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filter Type:</span>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        <option value="">All Types</option>
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                    </select>
                </div>
            </div>

            {/* Subjects Table */}
            {loading ? (
                <div className="h-60 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Subject Code</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Subject Name</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Periods/Wk</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Default Lecturer</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredSubjects.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-indigo-50 text-indigo-700">
                                                {s.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{s.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.type === 'Lab' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                {s.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span className="font-semibold text-gray-700">{s.periods_per_week}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {s.assigned_lecturer_id ? (
                                                <span className="text-green-600 font-semibold bg-green-50 border border-green-100 px-2.5 py-1 rounded-full text-xs">
                                                    {lecturers.find(l => l.id === s.assigned_lecturer_id)?.name || s.assigned_lecturer_id}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Auto (AI Assigned)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(s)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit Subject"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.code)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Subject"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredSubjects.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No subjects found. Add a subject to populate this catalog.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ADD SUBJECT MODAL */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-zoom-in border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-indigo-600" />
                                Add New Subject
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

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Code (Unique)</label>
                                    <input
                                        type="text"
                                        placeholder="CS101"
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        placeholder="Algorithms"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Class Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Theory">Theory</option>
                                        <option value="Lab">Lab</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Periods per Week</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        required
                                        value={formData.periods_per_week}
                                        onChange={e => setFormData({ ...formData, periods_per_week: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Default Lecturer (Optional)</label>
                                <select
                                    value={formData.assigned_lecturer_id}
                                    onChange={e => setFormData({ ...formData, assigned_lecturer_id: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Auto (AI Scheduler decides)</option>
                                    {lecturers.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
                                    ))}
                                </select>
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
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 text-sm font-semibold shadow-md flex items-center"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                    Add Subject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT SUBJECT MODAL */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-zoom-in border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-indigo-600" />
                                Edit Subject Details
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
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Code (Read-Only)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={formData.code}
                                    className="w-full p-2.5 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    placeholder="Algorithms"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Class Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Theory">Theory</option>
                                        <option value="Lab">Lab</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Periods per Week</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        required
                                        value={formData.periods_per_week}
                                        onChange={e => setFormData({ ...formData, periods_per_week: e.target.value })}
                                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Default Lecturer (Optional)</label>
                                <select
                                    value={formData.assigned_lecturer_id}
                                    onChange={e => setFormData({ ...formData, assigned_lecturer_id: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Auto (AI Scheduler decides)</option>
                                    {lecturers.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
                                    ))}
                                </select>
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
                                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 text-sm font-semibold shadow-md flex items-center"
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

export default SchedulesList;
