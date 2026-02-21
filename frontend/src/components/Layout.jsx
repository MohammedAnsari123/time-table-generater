import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Users, LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Layout = ({ children }) => {
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Close mobile side menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/timetables', label: 'Total Timetables', icon: Calendar },
        { path: '/schedules', label: 'Total Schedules', icon: BookOpen },
        { path: '/lecturers', label: 'Active Lecturers', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative w-full">

            {/* Mobile Backdrop Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 md:relative z-50 h-full bg-white shadow-xl transition-all duration-300 ease-in-out flex flex-col
                    border-r border-gray-100
                    /* Mobile styles: hidden to the left by default, slide in when isMobileOpen */
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
                    /* Desktop styles: override mobile translation, use width to collapse */
                    md:translate-x-0 ${isDesktopOpen ? 'md:w-64' : 'md:w-20'}
                `}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
                    <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 transition-opacity ${!isDesktopOpen && 'md:hidden'}`}>
                        Generator Tool
                    </span>
                    <span className={`text-xl font-bold text-purple-600 mx-auto hidden ${!isDesktopOpen && 'md:block'}`}>
                        GT
                    </span>

                    {/* Mobile Close Button inside sidebar */}
                    <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 md:hidden">
                        <X size={20} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600 hover:scale-[1.02]'
                                }
                            `}
                        >
                            <div className="min-w-[20px] flex justify-center">
                                <item.icon size={20} className="shrink-0" />
                            </div>
                            <span className={`font-medium whitespace-nowrap ml-3 transition-opacity duration-200 ${!isDesktopOpen && 'md:opacity-0 md:hidden'}`}>
                                {item.label}
                            </span>

                            {/* Tooltip for collapsed mode (Desktop Only) */}
                            {!isDesktopOpen && (
                                <div className="hidden md:block absolute left-14 bg-gray-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] shadow-lg whitespace-nowrap">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100 relative shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors
                            ${!isDesktopOpen && 'md:justify-center px-0'}
                        `}
                    >
                        <div className="min-w-[20px] flex justify-center">
                            <LogOut size={20} className="shrink-0" />
                        </div>
                        <span className={`font-medium ml-3 ${!isDesktopOpen && 'md:hidden'}`}>Logout</span>
                    </button>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                        className="hidden md:flex absolute -right-4 top-[-20px] bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:shadow-md hover:bg-gray-50 hover:text-purple-600 transition-all text-gray-400 z-[70]"
                        aria-label="Toggle Sidebar"
                    >
                        {isDesktopOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative bg-gray-50/50">
                {/* Mobile Header for Menu */}
                <header className="md:hidden bg-white/80 backdrop-blur-md h-16 shadow-sm border-b border-gray-100 flex items-center px-4 justify-between shrink-0 z-30 sticky top-0 w-full transition-all">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors"
                        aria-label="Open Menu"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">Timetable Tool</span>
                    <div className="w-8"></div> {/* Spacer for exact centering */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 transition-all w-full relative z-0">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
