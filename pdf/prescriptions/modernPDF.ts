import jsPDF from 'jspdf';
import { PrescriptionData } from './types';

/**
 * MODERN PRESCRIPTION PDF
 * Gradient-inspired, card-based, rounded look with color accents.
 */
export function generateModernPDF(data: PrescriptionData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = 0;

  // ── GRADIENT HEADER ────────────────────────────────────
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, W, 42, 'F');

  // Circle decorations
  doc.setFillColor(59, 130, 246); // blue-500
  doc.circle(W - 20, -5, 30, 'F');
  doc.setFillColor(29, 78, 216); // blue-700
  doc.circle(-10, 35, 20, 'F');

  // DocOclock logo box
  doc.setFillColor(255, 255, 255, 0.2);
  doc.roundedRect(margin, 8, 14, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('D', margin + 4.5, 18);

  // Doctor name & details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.doctorName, margin + 18, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(191, 219, 254); // blue-200
  doc.text(data.doctorDegrees, margin + 18, 21);

  // Tags
  doc.setFillColor(255, 255, 255, 0.15);
  doc.roundedRect(margin, 28, doc.getTextWidth(data.doctorSpecialty) + 6, 6, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(219, 234, 254);
  doc.text(data.doctorSpecialty, margin + 3, 32);

  const bmdcText = `BMDC: ${data.doctorBmdc}`;
  const specW = doc.getTextWidth(data.doctorSpecialty) + 10;
  doc.roundedRect(margin + specW, 28, doc.getTextWidth(bmdcText) + 6, 6, 3, 3, 'F');
  doc.text(bmdcText, margin + specW + 3, 32);

  // Right side
  if (data.hospitalName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(data.hospitalName, W - margin, 14, { align: 'right' });
  }
  if (data.hospitalAddress) {
    doc.setFontSize(7);
    doc.setTextColor(191, 219, 254);
    doc.text(data.hospitalAddress, W - margin, 19, { align: 'right' });
  }
  if (data.doctorPhone) {
    doc.setFontSize(7);
    doc.text(data.doctorPhone, W - margin, 24, { align: 'right' });
  }

  y = 48;

  // ── PATIENT INFO CARDS ─────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, W - margin * 2, 18, 3, 3, 'F');

  const cardW = (W - margin * 2 - 9) / 4;
  const labels = ['Patient', 'Age', 'Gender', 'Date'];
  const values = [data.patientName, data.patientAge, data.patientGender, data.date];

  labels.forEach((label, i) => {
    const cx = margin + 2 + i * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cx, y + 2, cardW, 14, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(label.toUpperCase(), cx + 3, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(values[i], cx + 3, y + 12);
  });

  y += 24;

  // ── DIAGNOSIS ──────────────────────────────────────────
  if (data.diagnosis) {
    doc.setFillColor(255, 251, 235); // amber-50
    doc.roundedRect(margin, y, W - margin * 2, 12, 3, 3, 'F');
    doc.setDrawColor(253, 230, 138);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, W - margin * 2, 12, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(180, 83, 9);
    doc.text('DIAGNOSIS', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 53, 15);
    doc.text(data.diagnosis, margin + 4, y + 9.5);

    y += 16;
  }

  // ── MEDICINES HEADER ───────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('℞  PRESCRIBED MEDICATIONS', margin, y + 3);
  y += 7;

  // ── MEDICINE CARDS ─────────────────────────────────────
  data.medicines.forEach((med, i) => {
    if (y > H - 45) {
      doc.addPage();
      y = margin;
    }

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    const cardH = med.instructions ? 18 : 14;
    doc.roundedRect(margin, y, W - margin * 2, cardH, 2, 2, 'FS');

    // Number badge
    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(margin + 2, y + 2, 10, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text(`${i + 1}`, margin + 5.5, y + 9, { align: 'center' });

    // Medicine name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(med.name, margin + 16, y + 7);

    // Dosage & Duration chips
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + 16, y + 9, doc.getTextWidth(med.dosage) * 1.4 + 4, 5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(med.dosage, margin + 18, y + 12.5);

    const dosChipW = doc.getTextWidth(med.dosage) * 1.4 + 8;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + 16 + dosChipW, y + 9, doc.getTextWidth(med.duration) * 1.4 + 4, 5, 1.5, 1.5, 'F');
    doc.text(med.duration, margin + 18 + dosChipW, y + 12.5);

    if (med.instructions) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text(`📝 ${med.instructions}`, margin + 16, y + 17);
    }

    y += cardH + 3;
  });

  // ── FOOTER ─────────────────────────────────────────────
  y = H - 30;

  doc.setFillColor(248, 250, 252);
  doc.rect(0, y - 2, W, 32, 'F');
  doc.setDrawColor(241, 245, 249);
  doc.line(0, y - 2, W, y - 2);

  if (data.advice) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(margin, y, 100, 12, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(5, 150, 105);
    doc.text('ADVICE', margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(6, 95, 70);
    const advLines = doc.splitTextToSize(data.advice, 94);
    doc.text(advLines, margin + 3, y + 8.5);
  }

  if (data.followUpDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Next Visit: ${data.followUpDate}`, margin, y + 18);
  }

  // Signature
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(W - margin - 50, y + 12, W - margin, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Doctor's Signature", W - margin - 25, y + 17, { align: 'center' });

  return doc;
}
