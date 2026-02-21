import React, { useState, useEffect } from 'react';
import { getAllTimetables } from '../services/api';
import { Loader2, BookOpen, Clock, Hash } from 'lucide-react';

const SchedulesList = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const timetables = await getAllTimetables();
                // Aggregate unique subjects
                const uniqueSubjects = new Map();

                timetables.forEach(t => {
                    const deptName = t.metadata?.department || 'Unknown';
                    // Loop over each division in the timetable
                    t.divisions?.forEach(d => {
                        // Loop over each subject in the division
                        d.subjects?.forEach(s => {
                            // Use Code as key
                            if (!uniqueSubjects.has(s.code)) {
                                uniqueSubjects.set(s.code, {
                                    ...s,
                                    associated_timetables: [deptName]
                                });
                            } else {
                                const existing = uniqueSubjects.get(s.code);
                                if (!existing.associated_timetables.includes(deptName)) {
                                    existing.associated_timetables.push(deptName);
                                }
                            }
                        });
                    });
                });

                setSubjects(Array.from(uniqueSubjects.values()));
            } catch (error) {
                console.error("Failed to fetch schedules", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, []);

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-indigo-600" />
                        Total Schedules (Subjects)
                    </h1>
                    <p className="text-gray-500 mt-1">List of all subjects and classes configured across your timetables.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="font-bold text-gray-800">{subjects.length}</span> Total Subjects
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periods/Week</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departments</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subjects.map((s, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {s.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded text-xs ${s.type === 'Lab' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {s.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        {s.periods_per_week}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {s.associated_timetables.join(', ')}
                                </td>
                            </tr>
                        ))}
                        {subjects.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    No subjects found. Create a timetable to populate this list.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SchedulesList;
