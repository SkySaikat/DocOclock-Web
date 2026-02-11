
/**
 * Role-based access control for users.
 */
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export type Relationship = 'Self' | 'Daughter' | 'Son' | 'Spouse' | 'Parent' | 'Other';
// Statuses updated for strict queue management
export type AppointmentStatus = 'pending' | 'consulting' | 'completed' | 'cancelled' | 'waiting';
export type SerialStatus = 'waiting' | 'current' | 'completed' | 'no-show';
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
  chamberId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  tokenNumber: number; // This is the Serial Number
  isReserved?: boolean;
  isVisibleToPatient?: boolean;
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
  tokenNumber: number;
  patientId: string;
  patientName: string;
  gender: Gender;
  phone: string;
  status: SerialStatus;
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
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string[];
  medicines: PrescriptionMedicine[];
  advice: string;
  followUpDate?: string;
}
