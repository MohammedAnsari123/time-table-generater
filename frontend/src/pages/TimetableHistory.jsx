import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTimetables, deleteTimetable } from '../services/api';
import { Trash2, Eye, Calendar, ArrowRight, BookOpen, User, Loader2 } from 'lucide-react';

const TimetableHistory = () => {
    const navigate = useNavigate();
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchTimetables();
    }, []);

    const fetchTimetables = async () => {
        try {
            const data = await getAllTimetables();
            setTimetables(data);
        } catch (error) {
            console.error("Failed to fetch timetables", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm("Are you sure you want to delete this timetable?")) return;

        setDeletingId(id);
        try {
            await deleteTimetable(id);
            // Optimistic update
            setTimetables(prev => prev.filter(t => t.timetable_id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete timetable");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Your Timetables</h1>
                        <p className="text-gray-500 mt-1">Manage and view your generated schedules ({timetables.length})</p>
                    </div>
                    <button
                        onClick={() => navigate('/create')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Create New
                    </button>
                </div>

                {timetables.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900">No timetables yet</h3>
                        <p className="text-gray-500 mt-2">Generate your first timetable to get started!</p>
                        <button
                            onClick={() => navigate('/create')}
                            className="mt-6 text-indigo-600 font-medium hover:underline"
                        >
                            Create Timetable &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {timetables.map((t) => (
                            <div
                                key={t.timetable_id}
                                onClick={() => navigate(`/display/${t.timetable_id}`)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {t.metadata.academic_year}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(t.timetable_id, e)}
                                            className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                                            disabled={deletingId === t.timetable_id}
                                        >
                                            {deletingId === t.timetable_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {t.metadata.department}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-4">
                                        Semester {t.metadata.semester} • Section {t.metadata.section}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4">
                                        <div className="flex items-center">
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            {t.subjects?.length || 0} Subjects
                                        </div>
                                        <div className="flex items-center">
                                            <User className="h-3 w-3 mr-1" />
                                            {t.lecturers?.length || 0} Lecturers
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-500">
                                        {t.metadata.institution_name}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimetableHistory;
