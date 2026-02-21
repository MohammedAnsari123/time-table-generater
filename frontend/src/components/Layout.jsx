import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Users, LogOut, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
    // Desktop toggle (wide vs thin)
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    // Mobile toggle (hidden vs visible)
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Close mobile menu on route change automatically
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
        { path: '/schedules', label: 'Schedules', icon: BookOpen },
        { path: '/lecturers', label: 'Lecturers', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden w-full">

            {/* MOBILE ONLY: Backdrop Overlay when sidebar is open */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* SIDEBAR: Handles both mobile (offcanvas) and desktop (collapsible) */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full bg-white shadow-xl transition-all duration-300 ease-in-out flex flex-col border-r border-gray-100
                    /* Mobile styles */
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} w-64
                    /* Desktop styles */
                    md:relative md:translate-x-0 ${isDesktopOpen ? 'md:w-64' : 'md:w-20'}
                `}
            >
                {/* Header/Logo Area inside Sidebar */}
                <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 px-4 ${!isDesktopOpen && 'md:justify-center'}`}>

                    {/* Desktop Hamburger Toggle (Hidden on mobile) */}
                    <button
                        onClick={() => setIsDesktopOpen(!isDesktopOpen)}
                        className="hidden md:flex p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition-colors mr-2"
                        aria-label="Toggle Desktop Sidebar"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logo Text - hides on desktop when collapsed */}
                    <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 truncate transition-opacity ${!isDesktopOpen && 'md:hidden'}`}>
                        Generator Tool
                    </span>

                    {/* Mobile Close Button (Hidden on desktop) */}
                    <div className="flex-1 flex justify-end md:hidden">
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
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
                                ${!isDesktopOpen && 'md:justify-center'}
                            `}
                        >
                            <div className="min-w-[20px] flex justify-center shrink-0">
                                <item.icon size={20} />
                            </div>

                            {/* Label text - hides on desktop when collapsed */}
                            <span className={`font-medium whitespace-nowrap ml-4 transition-opacity ${!isDesktopOpen && 'md:hidden'}`}>
                                {item.label}
                            </span>

                            {/* Tooltip for desktop collapsed mode */}
                            {!isDesktopOpen && (
                                <div className="hidden md:block absolute left-full ml-4 bg-gray-800 text-white text-xs font-medium px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] shadow-lg whitespace-nowrap">
                                    {item.label}
                                    {/* Tooltip triangle pointer */}
                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Area */}
                <div className="p-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors
                            ${!isDesktopOpen && 'md:justify-center px-0'}
                        `}
                    >
                        <div className="min-w-[20px] flex justify-center shrink-0">
                            <LogOut size={20} />
                        </div>
                        <span className={`font-medium ml-4 ${!isDesktopOpen && 'md:hidden'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50">

                {/* Mobile Top Navbar (Hidden on desktop) */}
                <header className="md:hidden bg-white/80 backdrop-blur-md h-16 shadow-sm border-b border-gray-100 flex items-center px-4 justify-between shrink-0 z-30 sticky top-0 w-full">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                        aria-label="Open Mobile Menu"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">
                        Timetable Tool
                    </span>
                    <div className="w-8"></div> {/* Spacer for perfect centering */}
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative">
                    <div className="max-w-7xl mx-auto w-full h-full p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
};

export default Layout;
