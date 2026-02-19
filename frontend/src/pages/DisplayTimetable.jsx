import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTimetable } from '../services/api';
import TimetableTable from '../components/TimetableTable';
import { Download, ArrowLeft, Loader2, FileText, File } from 'lucide-react';
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
        const divSlots = timetable.slots.filter(s => s.division === div.name);
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
                    body.push({ content: [slot.time, slot.name, ...Array(days.length - 1).fill("")], type: "BREAK" });
                } else {
                    const row = [slot.time];
                    days.forEach(day => {
                        const fullDay = metadata.working_days.find(d => d.toUpperCase().startsWith(day.charAt(0)) && d.toUpperCase().includes(day.substring(1, 2))) || day;
                        const s = divSlots.find(x => x.day === fullDay && x.period === slot.period);
                        row.push(s ? `${subjectMap[s.subject] || s.subject}\n(${lecturerMap[s.lecturer] || s.lecturer}) - ${s.room}` : "-");
                    });
                    body.push({ content: row, type: "DATA" });
                }
            });

            autoTable(doc, {
                startY: y, head, body: body.map(b => b.content), theme: 'grid',
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center' },
                styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', lineColor: [0, 0, 0], lineWidth: 0.1, valign: 'middle', halign: 'center', textColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' } },
                didParseCell: (data) => {
                    if (body[data.row.index]?.type === "BREAK") {
                        if (data.column.index === 1) { data.cell.colSpan = days.length; data.cell.styles.halign = 'center'; data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = [240, 240, 240]; }
                        if (data.column.index > 1) data.cell.styles.display = 'none';
                    }
                }
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
    if (!timetable) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Timetable not found.</div>;

    const activeData = getActiveDivisionData();
    const viewTimetable = activeData ? { ...timetable, metadata: { ...timetable.metadata, section: activeData.div.name }, slots: activeData.divSlots, subjects: activeData.div.subjects } : null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 flex items-center mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard</button>
                        <h1 className="text-2xl font-bold text-gray-800">{timetable.metadata.department} - Semester {timetable.metadata.semester}</h1>
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
                <div className="flex justify-end gap-3 mb-6">
                    <button onClick={handleExportDOCX} className="flex items-center bg-white border border-gray-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 shadow-sm transition-all text-sm"><File className="h-4 w-4 mr-2" /> Word (Div {timetable.divisions?.[activeTab]?.name})</button>
                    <button onClick={handleDownloadPDF} className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all text-sm"><Download className="h-4 w-4 mr-2" /> PDF (Div {timetable.divisions?.[activeTab]?.name})</button>
                    <button onClick={() => navigate(`/update/${id}`)} className="flex items-center bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-100 shadow-sm transition-all text-sm"><FileText className="h-4 w-4 mr-2" /> Edit</button>
                </div>
                {viewTimetable ? <TimetableTable timetable={viewTimetable} /> : <div className="text-center py-10 text-gray-400">Select a division.</div>}
            </div>
        </div>
    );
};

export default DisplayTimetable;
