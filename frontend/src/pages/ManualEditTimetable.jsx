import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { generateTimetable, getTimetable } from '../services/api';
import { Step1Metadata, Step2GlobalResources } from '../components/TimetableSteps';
import MultiDivisionForm from '../components/MultiDivisionForm';
import { ChevronRight, ChevronLeft, Save, Loader2, Users, ArrowLeft } from 'lucide-react';

const ManualEditTimetable = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Data State
    const [metadata, setMetadata] = useState({
        institution_name: '', department: '', semester: 1, academic_year: '2025-2026', periods_per_day: 7, working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });
    const [lecturers, setLecturers] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [divisions, setDivisions] = useState([{ name: 'A', strength: 60, subjects: [] }]);

    // Fetch existing data
    useEffect(() => {
        const loadTimetable = async () => {
            try {
                const data = await getTimetable(id);
                console.log("Fetched Timetable Data:", data);

                if (data.metadata) {
                    setMetadata(prev => ({ ...prev, ...data.metadata }));
                }

                if (data.lecturers) {
                    setLecturers(data.lecturers);
                }

                if (data.classrooms) {
                    setClassrooms(data.classrooms);
                }

                // Handle Divisions (New Structure) vs Subjects (Old Structure)
                if (data.divisions && data.divisions.length > 0) {
                    setDivisions(data.divisions);
                } else if (data.subjects && data.subjects.length > 0) {
                    // Backward compatibility: Migration from single-division format
                    console.warn("Legacy data detected: helper mapping subjects to Division A");
                    setDivisions([{
                        name: 'A',
                        strength: 60, // Default
                        subjects: data.subjects
                    }]);
                }
            } catch (error) {
                console.error("Failed to load timetable", error);
                alert("Failed to load timetable data: " + (error.response?.data?.detail || error.message));
                // Optional: navigate('/') if critical, but let user see error for now
            } finally {
                setFetching(false);
            }
        };
        loadTimetable();
    }, [id]);

    const handleMetadataChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                metadata,
                divisions,
                lecturers,
                classrooms,
                constraints: [] // Preserve or allow editing constraints later? For now empty.
            };

            const response = await generateTimetable(payload);
            if (response.timetable_id) navigate(`/display/${response.timetable_id}`);
            else alert("Generation successful (check console)");
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || "Failed to generate";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading Timetable Details...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white shadow-sm p-4 mb-6 border-b">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center">
                        <button onClick={() => navigate('/update/latest')} className="text-gray-500 hover:text-gray-700 mr-3">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <Users className="h-6 w-6 mr-2 text-indigo-600" /> Edit & Regenerate
                    </h1>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-2 w-8 rounded-full ${step >= i ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-12">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {step === 1 && <Step1Metadata metadata={metadata} handleMetadataChange={handleMetadataChange} />}
                    {step === 2 && <Step2GlobalResources lecturers={lecturers} setLecturers={setLecturers} classrooms={classrooms} setClassrooms={setClassrooms} />}
                    {step === 3 && <MultiDivisionForm divisions={divisions} setDivisions={setDivisions} lecturers={lecturers} />}

                    {/* Footer Navigation */}
                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between">
                        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">
                            <ChevronLeft className="h-5 w-5 mr-1" /> Back
                        </button>
                        {step < 3 ? (
                            <button onClick={() => setStep(s => s + 1)} className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">
                                Next <ChevronRight className="h-5 w-5 ml-1" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={loading} className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md disabled:opacity-75">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                Regenerate Timetable
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualEditTimetable;
