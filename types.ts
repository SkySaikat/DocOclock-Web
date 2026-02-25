
/**
 * Role-based access control for users.
 */
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export type Relationship = 'Self' | 'Daughter' | 'Son' | 'Spouse' | 'Parent' | 'Other';
// Statuses updated for strict queue management
export type AppointmentStatus = 'waiting' | 'consulting' | 'completed' | 'cancelled' | 'late';
export type Gender = 'Male' | 'Female' | 'Other';

/**
 * Basic patient entity.
 */
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  password?: string;
  relationship: Relationship;
  createdAt: string;
}

/**
 * Contact record for patients.
 */
export interface Contact {
  id: string;
  phoneNumber: string;
  createdAt: string;
  lastActiveAt: string;
}

/**
 * Profile of a patient or family member.
 */
export interface PatientProfile {
  id: string;
  contactId: string;
  name: string;
  gender: Gender;
  relationship: Relationship;
  createdAt: string;
}

/**
 * Visual configuration for prescription documents.
 */
export interface PrescriptionTemplate {
  id: string;
  hospitalName: string;
  logoUrl: string;
  themeColor: string;
  address: string;
  phone: string;
  email: string;
  layout: 'modern' | 'classic';
  watermarkOpacity: number;
  footerDisclaimer: string;
}

/**
 * Chamber details for a doctor.
 */
export interface Chamber {
  id: string;
  name: string;
  address: string;
  fee: number;
  visitingHours: string;
  visitingDays: string[];
  lat?: number;
  lng?: number;
  template: PrescriptionTemplate;
}

/**
 * Doctor profile including experience and rating.
 */
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  degrees: string;
  bmdcNumber: string;
  imageUrl: string;
  chambers: Chamber[];
  experienceYears: number;
  totalPatients: number;
  rating: number;
  about: string;
  isDemo?: boolean;
}

/**
 * Internal log of doctor-patient interactions.
 */
export interface DoctorPatientLog {
  doctorId: string;
  patientId: string;
  totalVisits: number;
  lastVisitDate: string;
  firstVisitDate: string;
  flags: string[];
}

/**
 * Confirmed appointment details.
 */
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string; // Renamed from chamberId
  hospitalName?: string;
  chamberName?: string;
  chamberLocation?: string;
  fee?: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  serialNumber: number; // Renamed from tokenNumber
  isReserved?: boolean;
  isVisibleToPatient?: boolean;
  category?: "normal" | "report";
  hasPrescription?: boolean;
  prescriptionId?: string;
  patientAge?: number;
  patientGender?: Gender;
  cancelledAt: number | null;
  completedAt: number | null;
  arrivalTime: number | null;
  consultationStartTime: number | null;
  consultationEndTime: number | null;
  cancelledBy?: "patient" | "doctor";
}


/**
 * Master data for available medicines.
 */
export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  type: string;
  strength: string;
  company: string;
  route: string;
}

/**
 * Live queue serial entry.
 */
export interface Serial {
  id: string;
  serialNumber: number;
  patientId: string;
  patientName: string;
  gender: Gender;
  phone: string;
  status: AppointmentStatus;
  paymentStatus: 'Paid' | 'Unpaid';
  estimatedTime: string;
  age?: number;
  isReserved?: boolean;
  isVisibleToPatient?: boolean;
}

/**
 * Medicine entry in a prescription editor context.
 */
export interface PrescriptionMedicine {
  medicine: Medicine;
  morningDose: string;
  noonDose: string;
  nightDose: string;
  duration: string;
  instruction: string;
}

/**
 * Finalized digital prescription.
 */
export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  hospitalId: string;
  date: string;
  diagnosis: string;
  clinicalFindings?: string;
  testsRecommended?: string;
  followUpDate?: string;
  notes: string;
  medicines: {
    name: string;
    dosage: string;
    durationDays: number;
    beforeAfterMeal: "before" | "after";
    startDate: string;
  }[];
  createdAt: number;
}

export interface MedicineAlert {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId?: string;
  hospitalId?: string;
  medicineName: string;
  dosage: string;
  startDate: string;
  durationDays: number;
  completed: boolean;
}
