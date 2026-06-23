import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Calendar, Users, BookOpen, Loader2, Sparkles, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { getDashboardStats, getAllTimetables, deleteTimetable } from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState({
        total_timetables: 0,
        active_classes: 0,
        active_lecturers: 0
    });
    const [recentTimetables, setRecentTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats & recent lists in parallel
                const [stats, list] = await Promise.all([
                    getDashboardStats(),
                    getAllTimetables()
                ]);
                setStatsData(stats);
                setRecentTimetables(list.slice(0, 3)); // show top 3
            } catch (error) {
                console.error("Failed to load dashboard metrics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this timetable?")) return;
        setDeletingId(id);
        try {
            await deleteTimetable(id);
            setRecentTimetables(prev => prev.filter(t => t.timetable_id !== id));
            // reload stats
            const stats = await getDashboardStats();
            setStatsData(stats);
        } catch (error) {
            console.error(error);
            alert("Failed to delete timetable");
        } finally {
            setDeletingId(null);
        }
    };

    const stats = [
        { 
            title: 'Total Timetables', 
            value: statsData.total_timetables, 
            icon: Calendar, 
            gradient: 'from-blue-600 to-indigo-600',
            glow: 'rgba(59, 130, 246, 0.15)'
        },
        { 
            title: 'Classes Scheduled', 
            value: statsData.active_classes, 
            icon: BookOpen, 
            gradient: 'from-emerald-500 to-teal-600',
            glow: 'rgba(16, 185, 129, 0.15)'
        },
        { 
            title: 'Active Lecturers', 
            value: statsData.active_lecturers, 
            icon: Users, 
            gradient: 'from-purple-500 to-indigo-600',
            glow: 'rgba(139, 92, 246, 0.15)'
        },
    ];

    const actions = [
        {
            title: 'Create Timetable',
            desc: 'Generate a new conflict-free schedule using AI and local heuristics.',
            icon: Plus,
            path: '/create',
            gradient: 'from-indigo-600 to-purple-600 hover:shadow-indigo-500/20'
        },
        {
            title: 'View All Timetables',
            desc: 'Browse, manage, and download generated schedules as Word/PDF.',
            icon: Eye,
            path: '/timetables',
            gradient: 'from-purple-600 to-pink-600 hover:shadow-purple-500/20'
        },
        {
            title: 'Update Timetable',
            desc: 'Fine-tune constraints and manually adjust active timetables.',
            icon: Edit,
            path: '/update',
            gradient: 'from-orange-500 to-amber-600 hover:shadow-orange-500/20'
        },
    ];

    return (
        <div className="space-y-10 pb-12 animate-fade-in">
            {/* Executive Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 text-white shadow-xl">
                <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute left-1/3 bottom-0 h-28 w-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="h-4 w-4 animate-spin-slow" />
                            Academic Operations Console
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                            Welcome Back Administrator
                        </h1>
                        <p className="text-slate-400 text-sm max-w-xl">
                            Create, manage, and refine collision-free division timetables using advanced automated LLM constraints matching.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 self-start md:self-center">
                        <Clock className="h-5 w-5 text-indigo-400" />
                        <div className="text-left">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">System Date</div>
                            <div className="text-sm font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 3xl:gap-10">
                {stats.map((stat, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 3xl:p-8 flex justify-between items-center transition-all duration-300 hover:shadow-lg"
                        style={{ boxShadow: `0 4px 20px ${stat.glow}` }}
                    >
                        <div>
                            <p className="text-xs 3xl:text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                            {loading ? (
                                <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg"></div>
                            ) : (
                                <p className="text-3xl 3xl:text-4xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                            )}
                        </div>
                        <div className={`p-4 3xl:p-6 rounded-2xl text-white bg-gradient-to-br ${stat.gradient} shadow-md`}>
                            <stat.icon className="h-6 w-6 3xl:h-8 3xl:w-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Action Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 3xl:gap-12">
                {/* Actions Grid */}
                <div className="lg:col-span-8 space-y-6">
                    <h2 className="text-lg 3xl:text-xl font-bold text-slate-800 flex items-center gap-2">
                        Quick Launch Deck
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 3xl:gap-8">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(action.path)}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] border border-slate-100 transition-all duration-300 overflow-hidden group text-left flex flex-col justify-between h-56 3xl:h-72"
                            >
                                <div className={`h-2 w-full bg-gradient-to-r ${action.gradient}`} />
                                <div className="p-6 3xl:p-8 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="p-3 rounded-xl bg-slate-50 w-fit group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300">
                                            <action.icon className="h-6 w-6 3xl:h-8 3xl:w-8 text-slate-700 group-hover:text-indigo-600" />
                                        </div>
                                        <h3 className="text-md 3xl:text-lg font-bold text-slate-800 mt-4 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{action.title}</h3>
                                        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{action.desc}</p>
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-indigo-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        Open Wizard <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Timetables Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        Recent Schedules
                    </h2>
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                        {loading ? (
                            <div className="flex flex-col gap-3 py-6 justify-center items-center">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                <span className="text-xs text-slate-400">Fetching recently built timetables...</span>
                            </div>
                        ) : recentTimetables.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {recentTimetables.map((t) => (
                                    <div 
                                        key={t.timetable_id}
                                        onClick={() => navigate(`/display/${t.timetable_id}`)}
                                        className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer flex justify-between items-center transition-all"
                                    >
                                        <div className="truncate">
                                            <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                                {t.metadata?.department || 'Unnamed Dept'}
                                            </h4>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                Sem {t.metadata?.semester} • {t.metadata?.academic_year}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => handleDelete(t.timetable_id, e)}
                                                disabled={deletingId === t.timetable_id}
                                                className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            >
                                                {deletingId === t.timetable_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                            </button>
                                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-slate-400 flex flex-col items-center">
                                <Calendar className="h-10 w-10 text-slate-200 mb-2" />
                                <span className="text-sm font-semibold text-slate-500">No schedules built yet</span>
                                <button 
                                    onClick={() => navigate('/create')}
                                    className="text-xs text-indigo-600 hover:underline mt-2 font-bold"
                                >
                                    Build your first schedule &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
