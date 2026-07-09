import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTimetable, updateTimetableSlots } from '../services/api';
import TimetableTable from '../components/TimetableTable';
import { Download, ArrowLeft, Loader2, FileText, File, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";

const DisplayTimetable = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0); // Index of active division
    
    // Interactive Edit Mode States
    const [isEditing, setIsEditing] = useState(false);
    const [editedSlots, setEditedSlots] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modalSubject, setModalSubject] = useState('');
    const [modalLecturer, setModalLecturer] = useState('');
    const [modalRoom, setModalRoom] = useState('');
    const [modalType, setModalType] = useState('Theory');

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const data = await getTimetable(id);
                setTimetable(data);
                if (data.divisions && data.divisions.length > 0) setActiveTab(0);
            } catch (error) {
                console.error("Failed to fetch timetable", error);
                setTimetable(null);
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, [id]);

    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = reject;
        });
    };

    const timeSlots = [
        { period: 1, time: "8:00 AM TO 9:00 AM" },
        { period: 2, time: "9:00 AM TO 10:00 AM" },
        { period: 3, time: "10:00 AM TO 11:00 AM" },
        { period: 4, time: "11:00 AM TO 12:00 PM" },
        { type: "BREAK", name: "RECESS", time: "12:00 PM TO 12:30 PM" },
        { period: 5, time: "12:30 PM TO 1:30 PM" },
        { period: 6, time: "1:30 PM TO 2:30 PM" },
        { type: "BREAK", name: "SHORT BREAK", time: "2:30 PM TO 2:45 PM" },
        { period: 7, time: "2:45 PM TO 3:45 PM" },
        { period: 8, time: "3:45 PM TO 4:45 PM" }
    ];

    const getActiveDivisionData = () => {
        if (!timetable || !timetable.divisions || timetable.divisions.length === 0) return null;
        const div = timetable.divisions[activeTab];
        const slotsToUse = isEditing ? editedSlots : (timetable.slots || []);
        const divSlots = slotsToUse.filter(s => s.division === div.name);
        return { div, divSlots };
    };

    const handleExportDOCX = async () => {
        const activeData = getActiveDivisionData();
        if (!activeData) return;
        const { div, divSlots } = activeData;

        try {
            const headerImageBase64 = await loadImage('/TPoly-Header.jpeg');
            const imageResponse = await fetch(headerImageBase64);
            const imageBlob = await imageResponse.blob();
            const imageBuffer = await imageBlob.arrayBuffer();

            const { metadata, lecturers = [] } = timetable;
            const days = metadata.working_days || ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
            const lecturerMap = (lecturers || []).reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {});
            const subjectMap = (div.subjects || []).reduce((acc, s) => ({ ...acc, [s.code]: s.name }), {});
            const subjectCodeMap = (div.subjects || []).reduce((acc, s) => ({ ...acc, [s.code]: s.code }), {});

            const tableRows = [];
            const headerCells = [
                new TableCell({ children: [new Paragraph({ text: "Time \\ Day", bold: true, size: 20 })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "E0E0E0" } }),
                ...days.map(day => new TableCell({ children: [new Paragraph({ text: day, bold: true, alignment: "center" })], width: { size: 85 / days.length, type: WidthType.PERCENTAGE }, shading: { fill: "E0E0E0" } }))
            ];
            tableRows.push(new TableRow({ children: headerCells }));

            timeSlots.forEach(slot => {
                const rowCells = [];
                if (slot.type === "BREAK") {
                    rowCells.push(new TableCell({ children: [new Paragraph({ text: slot.time, bold: true, size: 18 })], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6" } }));
                    rowCells.push(new TableCell({ children: [new Paragraph({ text: slot.name, bold: true, alignment: "center", size: 24 })], columnSpan: days.length, width: { size: 85, type: WidthType.PERCENTAGE }, shading: { fill: "F3F4F6" } }));
                } else {
                    rowCells.push(new TableCell({ children: [new Paragraph({ text: slot.time, bold: true, size: 18 })], width: { size: 15, type: WidthType.PERCENTAGE } }));
                    days.forEach(day => {
                        const fullDay = metadata.working_days.find(d => d.toUpperCase().startsWith(day.charAt(0)) && d.toUpperCase().includes(day.substring(1, 2))) || day;
                        const actualSlot = divSlots.find(x => x.day === fullDay && x.period === slot.period);
                        let content = [new Paragraph({ text: "-", alignment: "center" })];
                        if (actualSlot) {
                            const subName = subjectMap[actualSlot.subject] || actualSlot.subject;
                            const lecName = lecturerMap[actualSlot.lecturer] || actualSlot.lecturer;
                            content = [new Paragraph({ text: subName, bold: true, alignment: "center", size: 20 }), new Paragraph({ text: `(${lecName}) - ${actualSlot.room}`, alignment: "center", size: 18 })];
                        }
                        rowCells.push(new TableCell({ children: content }));
                    });
                }
                tableRows.push(new TableRow({ children: rowCells }));
            });

            const footerRows = [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Staff Name", bold: true })], shading: { fill: "E0E0E0" } }), new TableCell({ children: [new Paragraph({ text: "Subject Name", bold: true })], shading: { fill: "E0E0E0" } }), new TableCell({ children: [new Paragraph({ text: "Subject Code", bold: true })], shading: { fill: "E0E0E0" } })] })];
            const uniqueSubjects = [...new Set(divSlots.map(s => s.subject))];
            uniqueSubjects.forEach(subCode => {
                const subName = subjectMap[subCode] || subCode;
                const realCode = subjectCodeMap[subCode] || "";
                const lecsForSub = [...new Set(divSlots.filter(s => s.subject === subCode).map(s => lecturerMap[s.lecturer] || s.lecturer))].join(", ");
                footerRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph(lecsForSub)] }), new TableCell({ children: [new Paragraph(subName)] }), new TableCell({ children: [new Paragraph(realCode)] })] }));
            });

            const doc = new Document({
                sections: [{
                    properties: { page: { margin: { top: 500, right: 500, bottom: 500, left: 500 } } },
                    children: [
                        new Paragraph({ children: [new ImageRun({ data: imageBuffer, transformation: { width: 700, height: 120 } })], alignment: "center", spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: "CLASS TIME TABLE", bold: true, size: 32, underline: {} })], alignment: "center", spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: `Academic Year: ${metadata.academic_year} (EVEN Semester)`, bold: true, size: 24 })], alignment: "center", spacing: { after: 50 } }),
                        new Paragraph({ children: [new TextRun({ text: `Year / Branch: ${metadata.department} (Div ${div.name})`, bold: true, size: 24 }), new TextRun({ text: `    W.E.F: 15th Dec 2025`, bold: true, size: 24 })], spacing: { after: 200, before: 200 }, border: { bottom: { style: "single", size: 6, color: "000000" } } }),
                        new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                        new Paragraph({ text: "", spacing: { after: 300 } }),
                        new Table({ rows: footerRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                        new Paragraph({ children: [new TextRun({ text: "____________________            ____________________            ____________________" })], alignment: "center" }),
                        new Paragraph({ children: [new TextRun({ text: "   Prepared By                  I/C HOD                      Principal    " })], alignment: "center", spacing: { after: 200 } })
                    ],
                }],
            });
            Packer.toBlob(doc).then(blob => saveAs(blob, `${metadata.institution_name}_${div.name}_Timetable.docx`));
        } catch (error) { console.error("DOCX Error:", error); alert("Failed to export DOCX"); }
    };

    const handleDownloadPDF = async () => {
        const activeData = getActiveDivisionData();
        if (!activeData) return;
        const { div, divSlots } = activeData;
        try {
            const headerImageBase64 = await loadImage('/TPoly-Header.jpeg');
            const { metadata, lecturers = [] } = timetable;
            const days = metadata.working_days || ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
            const lecturerMap = (lecturers || []).reduce((acc, l) => ({ ...acc, [l.id]: l.name }), {});
            const subjectMap = (div.subjects || []).reduce((acc, s) => ({ ...acc, [s.code]: s.name }), {});
            const subjectCodeMap = (div.subjects || []).reduce((acc, s) => ({ ...acc, [s.code]: s.code }), {});

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const imgWidth = 190; const imgHeight = 35;
            doc.addImage(headerImageBase64, 'JPEG', 10, 5, imgWidth, imgHeight);
            let y = imgHeight + 10;
            doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text("CLASS TIME TABLE", pageWidth / 2, y, { align: "center" }); y += 6;
            doc.setFontSize(11); doc.text(`Academic Year: ${metadata.academic_year} (EVEN Semester)`, pageWidth / 2, y, { align: "center" }); y += 6;
            doc.text(`W.E.F: 15th Dec 2025`, pageWidth / 2, y, { align: "center" }); y += 8;
            doc.setFontSize(11); doc.text(`Year / Branch : ${metadata.department} (Div ${div.name})`, 14, y); doc.line(10, y + 2, pageWidth - 10, y + 2); y += 5;

            const head = [["Time \\ Day", ...days]];
            const body = [];
            timeSlots.forEach(slot => {
                if (slot.type === "BREAK") {
                    body.push([
                        slot.time,
                        { 
                            content: slot.name, 
                            colSpan: days.length, 
                            styles: { 
                                halign: 'center', 
                                fontStyle: 'bold', 
                                fillColor: [240, 240, 240],
                                textColor: [0, 0, 0]
                            } 
                        }
                    ]);
                } else {
                    const row = [slot.time];
                    days.forEach(day => {
                        const fullDay = metadata.working_days.find(d => d.toUpperCase().startsWith(day.charAt(0)) && d.toUpperCase().includes(day.substring(1, 2))) || day;
                        const s = divSlots.find(x => x.day === fullDay && x.period === slot.period);
                        row.push(s ? `${subjectMap[s.subject] || s.subject}\n(${lecturerMap[s.lecturer] || s.lecturer}) - ${s.room}` : "-");
                    });
                    body.push(row);
                }
            });

            autoTable(doc, {
                startY: y, 
                head, 
                body, 
                theme: 'grid',
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center' },
                styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', lineColor: [0, 0, 0], lineWidth: 0.1, valign: 'middle', halign: 'center', textColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' } }
            });

            y = doc.lastAutoTable.finalY + 10;
            const footerHead = [["Staff Name", "Subject Name", "Subject Code"]];
            const footerBody = [];
            const uniqueSubjects = [...new Set(divSlots.map(s => s.subject))];
            uniqueSubjects.forEach(subCode => {
                const subName = subjectMap[subCode] || subCode;
                const realCode = subjectCodeMap[subCode] || "";
                const lecsForSub = [...new Set(divSlots.filter(s => s.subject === subCode).map(s => lecturerMap[s.lecturer] || s.lecturer))].join(", ");
                footerBody.push([lecsForSub, subName, realCode]);
            });
            autoTable(doc, { startY: y, head: footerHead, body: footerBody, theme: 'grid', headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] }, styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] } });

            y = doc.lastAutoTable.finalY + 25;
            doc.setFontSize(10);
            doc.text("___________________", 40, y, { align: "center" }); doc.text("___________________", pageWidth / 2, y, { align: "center" }); doc.text("___________________", pageWidth - 40, y, { align: "center" });
            y += 5;
            doc.text("Prepared By", 40, y, { align: "center" }); doc.text("I/C HOD", pageWidth / 2, y, { align: "center" }); doc.text("Principal", pageWidth - 40, y, { align: "center" });
            doc.save(`${metadata.institution_name}_${div.name}_Timetable.pdf`);
        } catch (error) { console.error("PDF Error:", error); alert("Failed to generate PDF"); }
    };

    // Start Interactive Editing
    const handleStartEdit = () => {
        setEditedSlots([...(timetable.slots || [])]);
        setIsEditing(true);
    };

    // Cancel Interactive Editing
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedSlots([]);
    };

    // Save Manually Edited Slots to Backend
    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const updatedData = await updateTimetableSlots(id, editedSlots);
            setTimetable(updatedData);
            setIsEditing(false);
            alert("Timetable saved successfully!");
        } catch (error) {
            console.error("Failed to save timetable changes", error);
            alert("Failed to save changes: " + (error.response?.data?.detail || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Triggered when clicking a cell in edit mode
    const handleEditSlot = (day, period, slot) => {
        setSelectedCell({ day, period });
        setSelectedSlot(slot);
        if (slot) {
            setModalSubject(slot.subject);
            setModalLecturer(slot.lecturer);
            setModalRoom(slot.room);
            setModalType(slot.type);
        } else {
            setModalSubject('');
            setModalLecturer('');
            setModalRoom('');
            setModalType('Theory');
        }
        setShowModal(true);
    };

    // Apply Changes inside modal
    const handleApplySlotChanges = () => {
        if (!modalSubject || !modalLecturer || !modalRoom) {
            alert("Please select subject, lecturer, and room.");
            return;
        }

        const activeDiv = timetable.divisions?.[activeTab]?.name;
        if (!activeDiv) return;

        if (selectedSlot) {
            // Update existing slot in editedSlots
            setEditedSlots(prev => prev.map(s => {
                if (s.division === activeDiv && s.day === selectedCell.day && s.period === selectedCell.period) {
                    return {
                        ...s,
                        subject: modalSubject,
                        lecturer: modalLecturer,
                        room: modalRoom,
                        type: modalType
                    };
                }
                return s;
            }));
        } else {
            // Create new slot
            const newSlot = {
                division: activeDiv,
                day: selectedCell.day,
                period: selectedCell.period,
                subject: modalSubject,
                lecturer: modalLecturer,
                room: modalRoom,
                type: modalType
            };
            setEditedSlots(prev => [...prev, newSlot]);
        }
        setShowModal(false);
    };

    // Remove lecture inside modal
    const handleDeleteSlot = () => {
        const activeDiv = timetable.divisions?.[activeTab]?.name;
        if (!activeDiv) return;

        setEditedSlots(prev => prev.filter(s => 
            !(s.division === activeDiv && s.day === selectedCell.day && s.period === selectedCell.period)
        ));
        setShowModal(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
    if (!timetable) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Timetable not found.</div>;

    const activeData = getActiveDivisionData();
    const viewTimetable = activeData ? { ...timetable, metadata: { ...timetable.metadata, section: activeData.div.name }, slots: activeData.divSlots, subjects: activeData.div.subjects } : null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 flex items-center mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard</button>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {timetable.metadata.department} - Semester {timetable.metadata.semester}
                            {isEditing && <span className="ml-3 text-sm font-semibold bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200 animate-pulse">Edit Mode</span>}
                        </h1>
                        <p className="text-gray-500 text-sm">{timetable.metadata.institution_name}</p>
                    </div>
                </div>
                {timetable.divisions && timetable.divisions.length > 0 && (
                    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                        {timetable.divisions.map((div, idx) => (
                            <button key={idx} className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === idx ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab(idx)}>
                                Division {div.name}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Control Panel / Actions */}
                <div className="flex justify-end gap-3 mb-6">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={handleCancelEdit} 
                                className="flex items-center bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 shadow-sm transition-all text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveChanges} 
                                className="flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-md transition-all text-sm font-semibold"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleExportDOCX} className="flex items-center bg-white border border-gray-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 shadow-sm transition-all text-sm"><File className="h-4 w-4 mr-2" /> Word (Div {timetable.divisions?.[activeTab]?.name})</button>
                            <button onClick={handleDownloadPDF} className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all text-sm"><Download className="h-4 w-4 mr-2" /> PDF (Div {timetable.divisions?.[activeTab]?.name})</button>
                            <button onClick={handleStartEdit} className="flex items-center bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-100 shadow-sm transition-all text-sm"><FileText className="h-4 w-4 mr-2" /> Edit</button>
                        </>
                    )}
                </div>
                
                {/* Editable Timetable Grid */}
                {viewTimetable ? (
                    <TimetableTable 
                        timetable={viewTimetable} 
                        isEditing={isEditing} 
                        onEditSlot={handleEditSlot} 
                    />
                ) : (
                    <div className="text-center py-10 text-gray-400">Select a division.</div>
                )}

            {/* Premium Glassmorphic Modal Dialog for Editing Slot */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative overflow-hidden transform scale-100 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4 border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {selectedSlot ? "Edit Lecture Slot" : "Add Lecture Slot"}
                                </h3>
                                <p className="text-xs font-semibold text-indigo-600 mt-1 uppercase tracking-wider font-mono">
                                    {selectedCell?.day} | Period {selectedCell?.period}
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
                                <select
                                    value={modalSubject}
                                    onChange={(e) => {
                                        setModalSubject(e.target.value);
                                        // Auto-populate lecturer and session type
                                        const sub = timetable.divisions?.[activeTab]?.subjects.find(s => s.code === e.target.value);
                                        if (sub) {
                                            setModalLecturer(sub.assigned_lecturer_id || '');
                                            setModalType(sub.type || 'Theory');
                                        }
                                    }}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-800 bg-gray-50/50"
                                >
                                    <option value="">Select Subject</option>
                                    {timetable.divisions?.[activeTab]?.subjects.map(s => (
                                        <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Lecturer */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lecturer</label>
                                <select
                                    value={modalLecturer}
                                    onChange={(e) => setModalLecturer(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-800 bg-gray-50/50"
                                >
                                    <option value="">Select Lecturer</option>
                                    {timetable.lecturers?.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Room */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Classroom / Lab</label>
                                <select
                                    value={modalRoom}
                                    onChange={(e) => setModalRoom(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-800 bg-gray-50/50"
                                >
                                    <option value="">Select Room</option>
                                    <optgroup label="Classrooms">
                                        {timetable.classrooms?.filter(c => c.type === 'Classroom').map(c => (
                                            <option key={c.id} value={c.id}>{c.name || c.id} ({c.id})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Laboratories">
                                        {(timetable.labs || []).map(l => (
                                            <option key={l.id} value={l.id}>{l.name || l.id} ({l.id})</option>
                                        ))}
                                        {timetable.classrooms?.filter(c => c.type === 'Lab').map(c => (
                                            <option key={c.id} value={c.id}>{c.name || c.id} ({c.id})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Session Type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Session Type</label>
                                <select
                                    value={modalType}
                                    onChange={(e) => setModalType(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-800 bg-gray-50/50"
                                >
                                    <option value="Theory">Theory</option>
                                    <option value="Lab">Lab</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer actions */}
                        <div className="mt-6 flex justify-between items-center gap-2 border-t pt-4">
                            {selectedSlot ? (
                                <button 
                                    onClick={handleDeleteSlot} 
                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-semibold transition-colors duration-200"
                                >
                                    Remove Lecture
                                </button>
                            ) : (
                                <div />
                            )}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowModal(false)} 
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors duration-200"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={handleApplySlotChanges} 
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors duration-200"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisplayTimetable;
