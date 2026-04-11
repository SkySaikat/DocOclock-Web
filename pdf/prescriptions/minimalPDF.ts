import jsPDF from 'jspdf';
import { PrescriptionData } from './types';

/**
 * MINIMAL PRESCRIPTION PDF
 * Clean, clinical two-column layout with dark patient strip, minimal typography.
 */
export function generateMinimalPDF(data: PrescriptionData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  // ── HEADER ─────────────────────────────────────────────
  // Rx square icon
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, 14, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('℞', margin + 3.5, y + 10);

  // Doctor info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(data.doctorName, margin + 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${data.doctorDegrees} · ${data.doctorSpecialty}`, margin + 18, y + 11);

  // Right side
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`BMDC ${data.doctorBmdc}`, W - margin, y + 6, { align: 'right' });
  if (data.doctorPhone) {
    doc.text(data.doctorPhone, W - margin, y + 11, { align: 'right' });
  }

  y += 18;

  // Thin separator
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(margin, y, W - margin, y);

  y += 1;

  // ── DARK PATIENT STRIP ─────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, y, W, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(data.patientName, margin + 2, y + 5.5);

  doc.setTextColor(148, 163, 184);
  doc.text(`Age: ${data.patientAge}`, margin + 55, y + 5.5);
  doc.text(data.patientGender, margin + 80, y + 5.5);
  doc.text(data.date, W - margin - 2, y + 5.5, { align: 'right' });

  y += 12;

  // ── TWO COLUMN LAYOUT ──────────────────────────────────
  const leftColW = 55;
  const dividerX = margin + leftColW;
  const rightX = dividerX + 5;

  // Draw column divider (full height)
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(dividerX, y, dividerX, H - 22);

  // ── LEFT COLUMN: Diagnosis, Advice, Follow-up, Clinic ──
  let leftY = y;

  if (data.diagnosis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CC / DIAGNOSIS', margin, leftY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const diagLines = doc.splitTextToSize(data.diagnosis, leftColW - 5);
    doc.text(diagLines, margin, leftY + 8);
    leftY += 8 + diagLines.length * 4 + 4;
  }

  if (data.advice) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ADVICE', margin, leftY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const advLines = doc.splitTextToSize(data.advice, leftColW - 5);
    doc.text(advLines, margin, leftY + 8);
    leftY += 8 + advLines.length * 3.5 + 4;
  }

  if (data.followUpDate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('FOLLOW-UP', margin, leftY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(data.followUpDate, margin, leftY + 8);
    leftY += 14;
  }

  if (data.hospitalName) {
    // Separator
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, leftY, dividerX - 3, leftY);
    leftY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CLINIC', margin, leftY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(data.hospitalName, margin, leftY + 8);

    if (data.hospitalAddress) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const adrLines = doc.splitTextToSize(data.hospitalAddress, leftColW - 5);
      doc.text(adrLines, margin, leftY + 12);
    }
  }

  // ── RIGHT COLUMN: Medications ──────────────────────────
  let rightY = y;
  const medColW = W - rightX - margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MEDICATIONS', rightX, rightY + 3);
  rightY += 8;

  data.medicines.forEach((med, i) => {
    if (rightY > H - 30) {
      doc.addPage();
      rightY = margin;
      // Redraw divider on new page
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(dividerX, margin, dividerX, H - 22);
    }

    // Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.text(`${i + 1}`, rightX, rightY + 3);

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(med.name, rightX + 7, rightY + 3);

    // Dosage chip
    doc.setFillColor(241, 245, 249);
    const dosText = med.dosage;
    const dosW = doc.getTextWidth(dosText) * 1.3 + 3;
    doc.roundedRect(rightX + 7, rightY + 5, dosW, 4.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(dosText, rightX + 8.5, rightY + 8.2);

    // Duration
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`× ${med.duration}`, rightX + 7 + dosW + 3, rightY + 8.2);

    // Instructions
    if (med.instructions) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(med.instructions, rightX + 7, rightY + 12.5);
      rightY += 16;
    } else {
      rightY += 12;
    }

    // Dashed separator between medicines
    if (i < data.medicines.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(rightX, rightY, W - margin, rightY);
      doc.setLineDashPattern([], 0);
      rightY += 3;
    }
  });

  // ── BOTTOM BAR ─────────────────────────────────────────
  const footerY = H - 18;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(0, footerY, W, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated by DocOclock · ${new Date().getFullYear()}`, margin, footerY + 8);

  // Signature
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(W - margin - 45, footerY + 6, W - margin, footerY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Signature', W - margin - 22.5, footerY + 11, { align: 'center' });

  return doc;
}
