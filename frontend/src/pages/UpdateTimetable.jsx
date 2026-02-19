import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllTimetables } from '../services/api';
import { Loader2, ArrowLeft, Edit, AlertCircle } from 'lucide-react';

const UpdateTimetable = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [timetables, setTimetables] = useState([]);
    const [selectedId, setSelectedId] = useState(id || '');
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const fetchAll = async () => {
            try {
                const data = await getAllTimetables();
                setTimetables(data);
                if ((!selectedId || selectedId === 'latest') && data.length > 0) {
                    setSelectedId(data[0].timetable_id);
                }
            } catch (error) {
                console.error("Failed to fetch timetables", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Update URL when selection changes
    useEffect(() => {
        if (selectedId && selectedId !== 'latest' && selectedId !== id) {
            navigate(`/update/${selectedId}`, { replace: true });
        }
    }, [selectedId, navigate, id]);

    const handleManualEdit = () => {
        navigate(`/manual-edit/${selectedId}`);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );

    const selectedTimetable = timetables.find(t => t.timetable_id === selectedId);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 flex items-center mb-6">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-6">Update & Refine Timetable</h1>

                {/* 1. Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Timetable to Update</label>
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {timetables.map(t => (
                            <option key={t.timetable_id} value={t.timetable_id}>
                                {t.metadata ? `${t.metadata.department} - ${t.metadata.semester} (${t.metadata.academic_year})` : 'Untitled Timetable'}
                            </option>
                        ))}
                    </select>
                    {selectedTimetable && (
                        <p className="mt-2 text-sm text-gray-500">
                            Selected: {selectedTimetable.metadata.institution_name} | {selectedTimetable.metadata.section}
                        </p>
                    )}
                </div>

                <div className="flex justify-center">
                    {/* Manual Edit Only */}
                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col w-full md:w-2/3">
                        <div className="flex items-center mb-4 text-orange-800">
                            <Edit className="h-6 w-6 mr-2" />
                            <h2 className="font-semibold text-lg">Manual Edit</h2>
                        </div>
                        <p className="text-sm text-orange-600 mb-6 flex-grow">
                            Launch the full editor to manually add/remove lecturers, subjects, or change metadata.
                            This is the recommended way to refine your timetable.
                        </p>

                        <button
                            onClick={handleManualEdit}
                            disabled={!selectedId}
                            className="w-full flex items-center justify-center bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all shadow-md font-medium"
                        >
                            Open Manual Editor
                        </button>
                        <div className="mt-4 flex items-start gap-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <p>Note: Manual changes are saved directly. You can re-verify the timetable afterwards if needed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateTimetable;
