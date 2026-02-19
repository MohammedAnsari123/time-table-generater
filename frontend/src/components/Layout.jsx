import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`bg-white shadow-xl z-20 transition-all duration-300 ease-in-out flex flex-col 
                ${isSidebarOpen ? 'w-64' : 'w-20'} fixed md:relative h-full`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    {isSidebarOpen ? (
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                            Generator Tool
                        </span>
                    ) : (
                        <span className="text-xl font-bold text-purple-600 mx-auto">GT</span>
                    )}
                    <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 md:hidden">
                        <X size={20} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                                }
                            `}
                        >
                            <item.icon size={20} className={`${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                            {isSidebarOpen && <span className="font-medium">{item.label}</span>}

                            {/* Tooltip for collapsed mode */}
                            {!isSidebarOpen && (
                                <div className="absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors
                            ${!isSidebarOpen && 'justify-center'}
                        `}
                    >
                        <LogOut size={20} className={`${isSidebarOpen ? 'mr-3' : ''}`} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>

                    {/* Access to toggle (desktop only mostly) */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden md:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50"
                    >
                        {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header for Menu */}
                <header className="md:hidden bg-white h-16 shadow-sm flex items-center px-4 justify-between">
                    <button onClick={toggleSidebar} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-800">Time Table Tool</span>
                    <div className="w-6"></div> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6 transition-all">
                    {children}
                </main>
            </div>
        </div>
    );
};

// Start icons
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default Layout;
