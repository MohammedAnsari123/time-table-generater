import React from 'react';

const TimetableTable = ({ timetable }) => {
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
                    <div className="w-32 flex-shrink-0 p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Day / Period</div>
                    {periods.map(p => (
                        <div key={p} className="flex-1 min-w-[120px] p-4 font-bold text-gray-700 text-center uppercase text-xs tracking-wider border-l border-gray-200">
                            Period {p}
                        </div>
                    ))}
                </div>

                {/* Days Rows */}
                {days.map(day => (
                    <div key={day} className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="w-32 flex-shrink-0 p-4 font-bold text-gray-800 flex items-center bg-gray-50/50 border-r border-gray-200">
                            {day}
                        </div>
                        {periods.map(period => {
                            const slot = getSlotData(day, period);
                            return (
                                <div key={period} className="flex-1 min-w-[120px] p-2 border-l border-gray-100 relative group">
                                    {slot ? (
                                        <div className={`
                                            h-full w-full rounded-lg p-3 shadow-sm transition-all hover:shadow-md cursor-pointer
                                            ${slot.type === 'Lab' ? 'bg-gradient-to-br from-blue-700 to-blue-900 border-l-4 border-blue-500 text-white' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 text-gray-800'}
                                        `}>
                                            <p className={`font-bold text-sm ${slot.type === 'Lab' ? 'text-white' : 'text-gray-800'}`}>
                                                {subjectMap[slot.subject] || slot.subject} {/* Show Name if found, else ID/Code */}
                                            </p>
                                            <p className={`text-xs mt-1 flex items-center gap-1 ${slot.type === 'Lab' ? 'text-blue-100' : 'text-gray-600'}`}>
                                                <span className="font-medium">
                                                    {lecturerMap[slot.lecturer] || slot.lecturer} {/* Show Name if found, else ID */}
                                                </span>
                                            </p>
                                            <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] bg-white bg-opacity-60 text-gray-700 font-mono">
                                                {slot.room}
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 top-0 left-1/2 transform -translate-x-1/2 -translate-y-full whitespace-nowrap mb-1">
                                                {slot.type} Session
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100 italic">
                                            Free
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
