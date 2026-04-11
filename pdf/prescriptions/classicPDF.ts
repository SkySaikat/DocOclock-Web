import jsPDF from 'jspdf';
import { PrescriptionData } from './types';

/**
 * CLASSIC PRESCRIPTION PDF
 * Traditional, formal style with serif-like fonts, double-line borders, and ℞ symbol.
 */
export function generateClassicPDF(data: PrescriptionData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // ── HEADER ──────────────────────────────────────────────
  // Double border line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 28, W - margin, y + 28);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 29.5, W - margin, y + 29.5);

  // Doctor info (left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(data.doctorName, margin, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(data.doctorDegrees, margin, y + 14);
  doc.text(data.doctorSpecialty, margin, y + 19);

  doc.setFontSize(8);
  doc.text(`BMDC Reg: ${data.doctorBmdc}`, margin, y + 25);

  // Hospital info (right)
  if (data.hospitalName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(data.hospitalName, W - margin, y + 8, { align: 'right' });

    if (data.hospitalAddress) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const addrLines = doc.splitTextToSize(data.hospitalAddress, 55);
      doc.text(addrLines, W - margin, y + 13, { align: 'right' });
    }
  }

  if (data.doctorPhone) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`☎ ${data.doctorPhone}`, W - margin, y + 25, { align: 'right' });
  }

  y += 35;

  // ── PATIENT INFO BAR ───────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, W - margin * 2, 10, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, W - margin * 2, 10, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Patient:', margin + 3, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.patientName, margin + 18, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Age:', margin + 70, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.patientAge, margin + 80, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Gender:', margin + 95, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.patientGender, margin + 112, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Date:', W - margin - 35, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(data.date, W - margin - 3, y + 6.5, { align: 'right' });

  y += 16;

  // ── Rx SYMBOL ──────────────────────────────────────────
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(40);
  doc.setTextColor(203, 213, 225);
  doc.text('℞', margin, y + 12);

  const rxOffset = margin + 20;

  // ── DIAGNOSIS ──────────────────────────────────────────
  if (data.diagnosis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('DIAGNOSIS:', rxOffset, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(data.diagnosis, rxOffset, y + 5);

    doc.setDrawColor(226, 232, 240);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(rxOffset, y + 8, W - margin, y + 8);
    doc.setLineDashPattern([], 0);

    y += 14;
  }

  // ── MEDICINES LIST ─────────────────────────────────────
  data.medicines.forEach((med, i) => {
    if (y > H - 50) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${i + 1}.`, rxOffset, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(med.name, rxOffset + 7, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Dosage: ${med.dosage}`, rxOffset + 7, y + 9);
    doc.text(`Duration: ${med.duration}`, rxOffset + 60, y + 9);

    if (med.instructions) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(med.instructions, rxOffset + 7, y + 13.5);
      y += 18;
    } else {
      y += 14;
    }
  });

  // ── FOOTER ─────────────────────────────────────────────
  y = H - 35;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(margin, y, W - margin, y);

  if (data.advice) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('ADVICE:', margin, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const adviceLines = doc.splitTextToSize(data.advice, 100);
    doc.text(adviceLines, margin, y + 11);
  }

  if (data.followUpDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Follow-up: ${data.followUpDate}`, margin, y + 20);
  }

  // Signature line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(W - margin - 50, y + 15, W - margin, y + 15);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Signature', W - margin - 25, y + 20, { align: 'center' });

  return doc;
}
