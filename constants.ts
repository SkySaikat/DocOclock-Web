import { Doctor, Medicine, Serial, Contact, PatientProfile, DoctorPatientLog } from './types';

const TEMPLATE_SQUARE = {
  id: 'tpl_sq',
  hospitalName: 'Square Hospital Ltd.',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/5996/5996258.png',
  themeColor: '#2563eb',
  address: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205',
  phone: '10616, 09610010616',
  email: 'info@squarehospital.com',
  layout: 'modern' as const,
  watermarkOpacity: 0.05,
  footerDisclaimer: 'This prescription is computer generated and does not require a signature. Valid for 7 days.'
};

const TEMPLATE_POPULAR = {
  id: 'tpl_pop',
  hospitalName: 'Popular Diagnostic Center',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063205.png',
  themeColor: '#059669',
  address: 'House #16, Road #2, Dhanmondi R/A, Dhaka 1205',
  phone: '+880 9613 787801',
  email: 'info@populardiagnostic.com',
  layout: 'classic' as const,
  watermarkOpacity: 0.08,
  footerDisclaimer: 'Not valid for medico-legal purposes. Consult doctor for any confusion.'
};

export const MOCK_CONTACTS: Contact[] = [];
export const MOCK_PATIENT_PROFILES: PatientProfile[] = [];
export const MOCK_DOCTOR_PATIENT_LOGS: DoctorPatientLog[] = [];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
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
        id: 'c1',
        name: 'Square Hospital (Panthapath)',
        address: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, Dhaka 1205',
        visitingDays: ['Sun', 'Tue', 'Thu'],
        visitingHours: '5:00 PM - 9:00 PM',
        fee: 1500,
        lat: 23.7528,
        lng: 90.3816,
        template: TEMPLATE_SQUARE
      }
    ]
  }
];

export const MOCK_MEDICINES: Medicine[] = [
  { id: 'm1', brandName: 'Napa', genericName: 'Paracetamol', type: 'Tablet', strength: '500mg', company: 'Beximco', route: 'Oral' },
  { id: 'm6', brandName: 'Seclo', genericName: 'Omeprazole', type: 'Capsule', strength: '20mg', company: 'Square', route: 'Oral' }
];

export const MOCK_SERIALS: Serial[] = [
  { id: 's1', tokenNumber: 1, patientId: 'pat-1', patientName: 'Rahim Uddin', gender: 'Male', phone: '01712345678', status: 'completed', paymentStatus: 'Paid', estimatedTime: 'Done' },
  { id: 's2', tokenNumber: 2, patientId: 'pat-2', patientName: 'Nasreen Akter', gender: 'Female', phone: '01712345678', status: 'current', paymentStatus: 'Paid', estimatedTime: 'Now' },
  { id: 's3', tokenNumber: 3, patientId: 'pat-4', patientName: 'Unknown Patient', gender: 'Male', phone: '01800000000', status: 'waiting', paymentStatus: 'Unpaid', estimatedTime: '15 mins' }
];

export const COMMON_DOSAGES = ['1+0+1', '1+1+1', '1+0+0', '0+0+1'];
export const COMMON_INSTRUCTIONS = ['After meal', 'Before meal', 'Empty stomach'];
