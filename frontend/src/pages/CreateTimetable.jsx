import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTimetable } from '../services/api';
import { TextInput, NumberInput, SelectInput } from '../components/FormInputs';
import MultiDivisionForm from '../components/MultiDivisionForm'; // Import the new component
import { Plus, Trash, ChevronRight, ChevronLeft, Save, Loader2, Users } from 'lucide-react';

import { Step1Metadata, Step2GlobalResources } from '../components/TimetableSteps';

const CreateTimetable = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data State
    const [metadata, setMetadata] = useState({
        institution_name: '', department: '', semester: 1, academic_year: '2025-2026', periods_per_day: 7, working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });
    const [lecturers, setLecturers] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [divisions, setDivisions] = useState([{ name: 'A', strength: 60, subjects: [] }]);

    const handleMetadataChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                metadata,
                divisions,
                lecturers,
                classrooms,
                subjects: []
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white shadow-sm p-4 mb-6 border-b">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center">
                        <Users className="h-6 w-6 mr-2 text-indigo-600" /> Multi-Division Generator
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
                                Generate All Timetables
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTimetable;
