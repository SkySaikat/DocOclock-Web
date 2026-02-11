import { savePatients, saveDoctors, getPatients, getDoctors } from './storage';
import { Doctor, PrescriptionTemplate } from './types';

const TEMPLATE_SQUARE: PrescriptionTemplate = {
  id: 'tpl_sq',
  hospitalName: 'Square Hospital Ltd.',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/5996/5996258.png',
  themeColor: '#2563eb',
  address: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205',
  phone: '10616, 09610010616',
  email: 'info@squarehospital.com',
  layout: 'modern',
  watermarkOpacity: 0.05,
  footerDisclaimer: 'This prescription is computer generated and does not require a signature. Valid for 7 days.'
};

const TEMPLATE_POPULAR: PrescriptionTemplate = {
  id: 'tpl_pop',
  hospitalName: 'Popular Diagnostic Center',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063205.png',
  themeColor: '#059669',
  address: 'House #16, Road #2, Dhanmondi R/A, Dhaka 1205',
  phone: '+880 9613 787801',
  email: 'info@populardiagnostic.com',
  layout: 'classic',
  watermarkOpacity: 0.08,
  footerDisclaimer: 'Not valid for medico-legal purposes. Consult doctor for any confusion.'
};

const DEMO_DOCTORS: Doctor[] = [
  {
    id: 'd-1',
    name: 'Dr. Sarah Ahmed',
    specialty: 'Cardiologist',
    degrees: 'MBBS, FCPS (Cardiology), MD',
    bmdcNumber: 'A-12345',
    imageUrl: 'https://picsum.photos/200/200?random=1',
    experienceYears: 12,
    totalPatients: 15400,
    rating: 4.8,
    about: 'Dr. Sarah Ahmed is a leading cardiologist specializing in interventional cardiology. She has over a decade of experience in treating complex heart conditions.',
    chambers: [
      {
        id: 'c-1',
        name: 'Square Hospital (Panthapath)',
        address: '18/F, West Panthapath, Dhaka 1205',
        fee: 1500,
        visitingHours: '5:00 PM - 9:00 PM',
        visitingDays: ['Sun', 'Tue', 'Thu'],
        template: TEMPLATE_SQUARE
      }
    ],
  },
  {
    id: 'd-2',
    name: 'Dr. Rafiqul Islam',
    specialty: 'Neurologist',
    degrees: 'MBBS, FCPS (Neurology)',
    bmdcNumber: 'A-67890',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    experienceYears: 15,
    totalPatients: 12000,
    rating: 4.7,
    about: 'Dr. Rafiqul Islam is a renowned neurologist with extensive experience in neuro-rehabilitation and treatment of stroke and epilepsy.',
    chambers: [
      {
        id: 'c-2',
        name: 'Popular Diagnostic Center',
        address: 'Road #2, Dhanmondi R/A, Dhaka 1205',
        fee: 1200,
        visitingHours: '4:00 PM - 8:00 PM',
        visitingDays: ['Sat', 'Mon', 'Wed'],
        template: TEMPLATE_POPULAR
      }
    ],
  }
];

/**
 * Initializes localStorage with demo data if it doesn't already exist.
 * This should only be called in a browser environment.
 */
export function initializeDemoData() {
  if (typeof window === 'undefined') return;

  const existingDoctors = getDoctors();

  if (existingDoctors.length === 0) {
    console.log('[DocOclock] Seeding demo doctors...');
    saveDoctors(DEMO_DOCTORS);
  }
}
