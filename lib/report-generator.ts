import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { CheckupRecord } from "./vault";

interface AnalysisResult {
    summary?: string;
    patterns: { name: string; prevalence: string }[];
    severity: { level: string; advice: string[] };
    confidence: { level: string; note: string };
    // v2.1 Professional Data
    urgency_summary?: string;
    key_findings?: string[];
    differential_diagnosis?: { condition: string; likelihood: string; rationale: string }[];
    suggested_focus?: string[];
    follow_up_questions?: string[];
}

export function generateMedicalReport(
    symptoms: string,
    result: AnalysisResult,
    id?: string,
    timestamp?: number
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Pluto Health", margin, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateStr = timestamp ? new Date(timestamp).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Report Date: ${dateStr}`, pageWidth - margin, y, { align: "right" });

    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // --- Section 1: Clinical Triage Summary (Urgency) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102); // Dark Blue
    doc.text("Clinical Triage Summary", margin, y);
    y += 8;

    // Urgency Badge Text
    doc.setFontSize(11);
    doc.setTextColor(result.severity.level.includes("URGENT") ? 200 : 0, 0, 0);
    doc.text(`Status: ${result.severity.level}`, margin, y);
    y += 6;

    // Urgency Rationale ("One Glance")
    if (result.urgency_summary) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        const splitUrgency = doc.splitTextToSize(`Rationale: ${result.urgency_summary}`, contentWidth);
        doc.text(splitUrgency, margin, y);
        y += (splitUrgency.length * 5) + 6;
    }

    // Chief Complaint (Brief)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Presenting Complaint:", margin, y);
    doc.setFont("helvetica", "normal");
    const splitSymptoms = doc.splitTextToSize(symptoms, contentWidth - 45); // Indent slightly? No, just reduce width
    doc.text(splitSymptoms, margin + 40, y);
    y += (splitSymptoms.length * 5) + 10;

    // --- Section 2: Key Clinical Findings ---
    // (Replaces "Observed Patterns")
    const findings = result.key_findings || result.patterns.map(p => `${p.name} (${p.prevalence})`);

    if (findings.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Key Clinical Findings", margin, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        findings.forEach(finding => {
            doc.text(`• ${finding}`, margin + 5, y);
            y += 5;
        });
        y += 5;
    }

    // --- Section 3: Differential Diagnosis Table ---
    if (result.differential_diagnosis && result.differential_diagnosis.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Differential Diagnosis", margin, y);
        y += 5; // autoTable handles y? No, pass it startY

        autoTable(doc, {
            startY: y,
            head: [['Condition', 'Likelihood', 'Supporting Features']],
            body: result.differential_diagnosis.map(d => [d.condition, d.likelihood, d.rationale]),
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 40, fontStyle: 'bold' },
                1: { cellWidth: 30 },
                2: { cellWidth: 'auto' }
            }
        });

        // Update Y after table
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Section 4: Suggested Focus Areas ---
    if (result.suggested_focus && result.suggested_focus.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Suggested Clinical Focus", margin, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Consider evaluating:", margin, y);
        y += 5;
        result.suggested_focus.forEach(area => {
            doc.text(`[ ] ${area}`, margin + 5, y); // Checkbox style
            y += 5;
        });
        y += 5;
    }

    // --- Disclaimer Footer ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const disclaimer = "DISCLAIMER: This report is generated by the Pluto Clinical Intelligence layer for patient education and preliminary triage support. It is NOT a medical diagnosis. The provider must verify all findings.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth);

    doc.text(splitDisclaimer, margin, pageHeight - 15);

    // Save
    doc.save(`Pluto_Report_${id?.slice(0, 6) || "draft"}.pdf`);
}
