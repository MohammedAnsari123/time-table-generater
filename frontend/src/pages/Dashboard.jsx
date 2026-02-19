import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Calendar, LogOut, Users, BookOpen, Loader2 } from 'lucide-react';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState({
        total_timetables: 0,
        active_classes: 0,
        active_lecturers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStatsData(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                // Keep default values on error
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const stats = [
        { title: 'Total Timetables', value: statsData.total_timetables, icon: Calendar, color: 'bg-blue-500' },
        { title: 'Total Classes Scheduled', value: statsData.active_classes, icon: BookOpen, color: 'bg-green-500' },
        { title: 'Active Lecturers', value: statsData.active_lecturers, icon: Users, color: 'bg-purple-500' },
    ];

    const actions = [
        {
            title: 'Create Timetable',
            desc: 'Generate a new schedule with AI',
            icon: Plus,
            path: '/create',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'View Timetables',
            desc: 'Browse existing schedules',
            icon: Eye,
            path: '/timetables',
            color: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Update Timetable',
            desc: 'Modify constraints & regenerate',
            icon: Edit,
            path: '/update',
            color: 'from-orange-500 to-red-500'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                    <div className="mt-1">
                                        {loading ? (
                                            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                                        ) : (
                                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                        )}
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg text-white ${stat.color} bg-opacity-90`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(action.path)}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group text-left border border-gray-100"
                        >
                            <div className={`h-2 w-full bg-gradient-to-r ${action.color}`} />
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-gray-50 group-hover:scale-110 transition-transform duration-300`}>
                                        <action.icon className="h-8 w-8 text-gray-700" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{action.title}</h3>
                                <p className="text-gray-500 text-sm">{action.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
