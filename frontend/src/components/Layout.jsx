import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Users, LogOut, Menu, X, Sparkles, Building, FlaskConical } from 'lucide-react';

const Layout = ({ children }) => {
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/timetables', label: 'Timetables', icon: Calendar },
        { path: '/staff', label: 'Staff', icon: Users },
        { path: '/subjects', label: 'Subjects', icon: BookOpen },
        { path: '/classrooms', label: 'Classrooms', icon: Building },
        { path: '/labs', label: 'Laboratories', icon: FlaskConical },
    ];

    return (
        <div className="flex h-screen bg-slate-50/50 overflow-hidden w-full font-sans antialiased text-slate-800">
            {/* MOBILE ONLY: Backdrop Overlay with blur */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* SIDEBAR: Glassmorphism and modern indicator bar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full bg-white/80 backdrop-blur-xl border-r border-slate-100 shadow-2xl shadow-slate-100/50 transition-all duration-300 ease-in-out flex flex-col
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} w-64
                    md:relative md:translate-x-0 ${isDesktopOpen ? 'md:w-64' : 'md:w-20'}
                `}
            >
                {/* Logo Area */}
                <div className={`h-20 flex items-center px-5 border-b border-slate-100 shrink-0 gap-3 ${!isDesktopOpen && 'md:justify-center md:px-0'}`}>
                    <button
                        onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                        className="hidden md:flex p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-200"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu size={20} />
                    </button>

                    <div className={`flex items-center gap-2 transition-all duration-300 ${!isDesktopOpen && 'md:hidden'}`}>
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-tight">
                            AI Scheduler
                        </span>
                    </div>

                    {/* Mobile Close Button */}
                    <div className="flex-1 flex justify-end md:hidden">
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative font-medium text-sm
                                ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:translate-x-0.5'
                                }
                                ${!isDesktopOpen && 'md:justify-center'}
                            `}
                        >
                            <div className="min-w-[20px] flex justify-center shrink-0">
                                <item.icon size={18} />
                            </div>

                            <span className={`ml-3.5 transition-all duration-200 whitespace-nowrap ${!isDesktopOpen && 'md:hidden'}`}>
                                {item.label}
                            </span>

                            {/* Collapse Tooltip */}
                            {!isDesktopOpen && (
                                <div className="hidden md:block absolute left-full ml-4 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[60] shadow-xl whitespace-nowrap translate-x-[-10px] group-hover:translate-x-0">
                                    {item.label}
                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 font-medium text-sm
                            ${!isDesktopOpen && 'md:justify-center px-0'}
                        `}
                    >
                        <div className="min-w-[20px] flex justify-center shrink-0">
                            <LogOut size={18} />
                        </div>
                        <span className={`ml-3.5 ${!isDesktopOpen && 'md:hidden'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 backdrop-blur-md h-16 shadow-sm border-b border-slate-100 flex items-center px-4 justify-between shrink-0 z-30 sticky top-0 w-full">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                        aria-label="Open Mobile Menu"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-sm">
                            <Sparkles size={14} />
                        </div>
                        <span className="font-extrabold text-md bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                            AI Scheduler
                        </span>
                    </div>
                    <div className="w-8"></div>
                </header>

                {/* Page content wrapper with custom scrollbar and fade in animation */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative bg-slate-50/30">
                    <div className="max-w-[1600px] 2xl:max-w-[2000px] 3xl:max-w-[2560px] mx-auto w-full h-full p-4 md:p-6 lg:p-8 3xl:p-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
