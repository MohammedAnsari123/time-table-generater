import React from 'react';
import { Edit3, Plus } from 'lucide-react';

const TimetableTable = ({ timetable, isEditing = false, onEditSlot = null }) => {
    if (!timetable || !timetable.slots) return <div className="text-gray-500">No timetable data available.</div>;

    const { metadata, slots, lecturers = [], subjects = [] } = timetable;
    const days = metadata.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = Array.from({ length: metadata.periods_per_day || 7 }, (_, i) => i + 1);

    // Create lookup maps for simple O(1) access
    const lecturerMap = (lecturers || []).reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {});
    const subjectMap = (subjects || []).reduce((acc, s) => ({ ...acc, [s.code]: s.name }), {});

    // Helper to find slot data
    const getSlotData = (day, period) => {
        return slots.find(s => s.day === day && s.period === period);
    };

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="min-w-max">
                {/* Header Row */}
                <div className="flex bg-gray-50 rounded-t-lg border-b border-gray-200">
                    <div className="w-32 3xl:w-48 flex-shrink-0 p-4 font-bold text-gray-700 uppercase text-xs 3xl:text-sm tracking-wider">Day / Period</div>
                    {periods.map(p => (
                        <div key={p} className="flex-1 min-w-[120px] 3xl:min-w-[200px] p-4 font-bold text-gray-700 text-center uppercase text-xs 3xl:text-sm tracking-wider border-l border-gray-200">
                            Period {p}
                        </div>
                    ))}
                </div>

                {/* Days Rows */}
                {days.map(day => (
                    <div key={day} className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <div className="w-32 3xl:w-48 flex-shrink-0 p-4 font-bold text-gray-800 flex items-center bg-gray-50/50 border-r border-gray-200 text-xs 3xl:text-sm">
                            {day}
                        </div>
                        {periods.map(period => {
                            const slot = getSlotData(day, period);
                            return (
                                <div key={period} className={`flex-1 min-w-[120px] 3xl:min-w-[200px] p-2 border-l border-gray-100 relative group ${isEditing ? 'hover:bg-orange-50/10' : ''}`}>
                                    {slot ? (
                                        <div 
                                            onClick={() => isEditing && onEditSlot && onEditSlot(day, period, slot)}
                                            className={`
                                                h-full w-full rounded-lg p-3 3xl:p-5 shadow-sm transition-all hover:shadow-md cursor-pointer relative
                                                ${slot.type === 'Lab' ? 'bg-gradient-to-br from-blue-700 to-blue-900 border-l-4 border-blue-500 text-white' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 text-gray-800'}
                                                ${isEditing ? 'ring-2 ring-orange-300 hover:ring-orange-500' : ''}
                                            `}
                                        >
                                            <p className={`font-bold text-sm 3xl:text-base ${slot.type === 'Lab' ? 'text-white' : 'text-gray-800'}`}>
                                                {subjectMap[slot.subject] || slot.subject}
                                            </p>
                                            <p className={`text-xs 3xl:text-sm mt-1 flex items-center gap-1 ${slot.type === 'Lab' ? 'text-blue-100' : 'text-gray-600'}`}>
                                                <span className="font-medium">
                                                    {lecturerMap[slot.lecturer] || slot.lecturer}
                                                </span>
                                            </p>
                                            <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] 3xl:text-xs bg-white bg-opacity-60 text-gray-700 font-mono">
                                                {slot.room}
                                            </div>

                                            {isEditing && (
                                                <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white p-1 rounded-full shadow-md scale-90 hover:scale-100 transition-transform">
                                                    <Edit3 className="h-3 w-3" />
                                                </div>
                                            )}

                                            {/* Tooltip */}
                                            {!isEditing && (
                                                <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 top-0 left-1/2 transform -translate-x-1/2 -translate-y-full whitespace-nowrap mb-1">
                                                    {slot.type} Session
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => isEditing && onEditSlot && onEditSlot(day, period, null)}
                                            className={`
                                                h-full w-full flex flex-col items-center justify-center text-xs font-medium rounded-lg border transition-all duration-200 min-h-[72px] cursor-pointer
                                                ${isEditing 
                                                    ? 'border-dashed border-orange-300 bg-orange-50/20 text-orange-600 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 hover:shadow-sm' 
                                                    : 'bg-green-50 text-green-700 border-green-100 italic'
                                                }
                                            `}
                                        >
                                            {isEditing ? (
                                                <>
                                                    <Plus className="h-4 w-4 mb-1 text-orange-500 animate-pulse" />
                                                    <span>Add Lecture</span>
                                                </>
                                            ) : (
                                                "Free"
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimetableTable;
