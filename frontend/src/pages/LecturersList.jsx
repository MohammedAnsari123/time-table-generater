import React, { useState, useEffect } from 'react';
import { getAllTimetables } from '../services/api';
import { Loader2, Users, BookOpen, Calendar } from 'lucide-react';

const LecturersList = () => {
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                const timetables = await getAllTimetables();
                // Aggregate active lecturers from all timetables
                const uniqueLecturers = new Map();

                timetables.forEach(t => {
                    t.lecturers?.forEach(l => {
                        // Use ID as key to ensure uniqueness
                        if (!uniqueLecturers.has(l.id)) {
                            uniqueLecturers.set(l.id, {
                                ...l,
                                associated_timetables: [t.metadata?.department || 'Unknown Dept']
                            });
                        } else {
                            // Merge metadata if needed (e.g., list departments)
                            const existing = uniqueLecturers.get(l.id);
                            if (!existing.associated_timetables.includes(t.metadata?.department)) {
                                existing.associated_timetables.push(t.metadata?.department);
                            }
                        }
                    });
                });

                setLecturers(Array.from(uniqueLecturers.values()));
            } catch (error) {
                console.error("Failed to fetch lecturers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLecturers();
    }, []);

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="h-8 w-8 text-purple-600" />
                        Active Lecturers
                    </h1>
                    <p className="text-gray-500 mt-1">List of all lecturers extracted from generated timetables.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="font-bold text-gray-800">{lecturers.length}</span> Total Lecturers
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lecturers.map((lecturer) => (
                    <div key={lecturer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">
                                {lecturer.name.charAt(0)}
                            </div>
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {lecturer.id}
                            </span>
                        </div>

                        <h3 className="font-bold text-gray-800 text-lg mb-1">{lecturer.name}</h3>

                        <div className="space-y-2 mt-4">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <BookOpen className="h-4 w-4 mt-1 flex-shrink-0" />
                                <span>{lecturer.subjects?.join(', ') || 'No specific subjects'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mt-1 flex-shrink-0" />
                                <span className="text-xs">
                                    Seen in: {lecturer.associated_timetables.join(', ')}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {lecturers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No active lecturers found. Create a timetable to add them.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LecturersList;
