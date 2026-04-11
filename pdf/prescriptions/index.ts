/**
 * DocOclock Prescription PDF Generator
 * 
 * 3 Templates available:
 *   • classic  — Traditional, formal style with serif-like fonts and ℞ symbol
 *   • modern   — Gradient header, card-based layout, blue accent color
 *   • minimal  — Two-column clinical layout, dark patient strip, minimal typography
 * 
 * Usage:
 *   import { downloadPrescriptionPDF } from './pdf/prescriptions';
 *   downloadPrescriptionPDF(prescriptionData, 'modern');
 */

export type { PrescriptionData, PrescriptionTemplate } from './types';
import { PrescriptionData, PrescriptionTemplate } from './types';

import { generateClassicPDF } from './classicPDF';
import { generateModernPDF } from './modernPDF';
import { generateMinimalPDF } from './minimalPDF';

export { generateClassicPDF } from './classicPDF';
export { generateModernPDF } from './modernPDF';
export { generateMinimalPDF } from './minimalPDF';

/**
 * Generate and download a prescription PDF.
 * 
 * @param data - The prescription data to render
 * @param template - Which visual template to use ('classic' | 'modern' | 'minimal')
 * @param filename - Optional custom filename (without extension)
 */
export function downloadPrescriptionPDF(
  data: PrescriptionData,
  template: PrescriptionTemplate = 'modern',
  filename?: string
): void {
  let doc;

  switch (template) {
    case 'classic':
      doc = generateClassicPDF(data);
      break;
    case 'modern':
      doc = generateModernPDF(data);
      break;
    case 'minimal':
      doc = generateMinimalPDF(data);
      break;
    default:
      doc = generateModernPDF(data);
  }

  const safeName = filename || `Rx_${data.patientName.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}`;
  doc.save(`${safeName}.pdf`);
}

/**
 * Generate a prescription PDF and return as a Blob (for preview or sharing).
 */
export function getPrescriptionPDFBlob(
  data: PrescriptionData,
  template: PrescriptionTemplate = 'modern'
): Blob {
  let doc;

  switch (template) {
    case 'classic':
      doc = generateClassicPDF(data);
      break;
    case 'modern':
      doc = generateModernPDF(data);
      break;
    case 'minimal':
      doc = generateMinimalPDF(data);
      break;
    default:
      doc = generateModernPDF(data);
  }

  return doc.output('blob');
}

/**
 * Generate a prescription PDF and return as Data URL (for embedding/previewing).
 */
export function getPrescriptionPDFDataUrl(
  data: PrescriptionData,
  template: PrescriptionTemplate = 'modern'
): string {
  let doc;

  switch (template) {
    case 'classic':
      doc = generateClassicPDF(data);
      break;
    case 'modern':
      doc = generateModernPDF(data);
      break;
    case 'minimal':
      doc = generateMinimalPDF(data);
      break;
    default:
      doc = generateModernPDF(data);
  }

  return doc.output('datauristring');
}
