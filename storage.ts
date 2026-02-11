
import { Patient, Doctor, Appointment, Prescription } from './types';

const KEYS = {
  PATIENTS: 'demo_patients',
  DOCTORS: 'demo_doctors',
  APPOINTMENTS: 'demo_appointments',
  PRESCRIPTIONS: 'demo_prescriptions',
  PATIENT_SESSION: 'demo_patient_session',
  DOCTOR_SESSION: 'demo_doctor_session',
};

/**
 * Helper to check if running in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Generic safe read from localStorage
 */
function getFromStorage<T>(key: string): T[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error reading from storage key "${key}":`, error);
    return [];
  }
}

/**
 * Generic safe write to localStorage
 */
function saveToStorage<T>(key: string, data: T[]): void {
  if (!isBrowser) return;
  try {
    if (!Array.isArray(data)) {
      console.warn(`Attempted to save non-array data to key "${key}"`);
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to storage key "${key}":`, error);
  }
}

// --- Role-Separated Session Storage ---
export const PatientStorage = {
  get: () => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem(KEYS.PATIENT_SESSION);
    return raw ? JSON.parse(raw) : null;
  },
  set: (data: any) => {
    if (!isBrowser) return;
    localStorage.setItem(KEYS.PATIENT_SESSION, JSON.stringify({ ...data, role: 'patient' }));
  },
  clear: () => {
    if (!isBrowser) return;
    localStorage.removeItem(KEYS.PATIENT_SESSION);
  },
};

export const DoctorStorage = {
  get: () => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem(KEYS.DOCTOR_SESSION);
    return raw ? JSON.parse(raw) : null;
  },
  set: (data: any) => {
    if (!isBrowser) return;
    localStorage.setItem(KEYS.DOCTOR_SESSION, JSON.stringify({ ...data, role: 'doctor' }));
  },
  clear: () => {
    if (!isBrowser) return;
    localStorage.removeItem(KEYS.DOCTOR_SESSION);
  },
};

// Add getCurrentSession export to fix missing member error in patient views.
/**
 * Retrieves the currently active session (either patient or doctor).
 */
export const getCurrentSession = () => {
  return PatientStorage.get() || DoctorStorage.get();
};

// --- Specific Getters ---
export const getPatients = (): Patient[] => getFromStorage<Patient>(KEYS.PATIENTS);
export const getDoctors = (): Doctor[] => getFromStorage<Doctor>(KEYS.DOCTORS);
export const getAppointments = (): Appointment[] => getFromStorage<Appointment>(KEYS.APPOINTMENTS);
export const getPrescriptions = (): Prescription[] => getFromStorage<Prescription>(KEYS.PRESCRIPTIONS);

// --- Specific Setters ---
export const savePatients = (data: Patient[]) => saveToStorage(KEYS.PATIENTS, data);
export const saveDoctors = (data: Doctor[]) => saveToStorage(KEYS.DOCTORS, data);
export const saveAppointments = (data: Appointment[]) => saveToStorage(KEYS.APPOINTMENTS, data);

export const saveAppointment = (appointment: Appointment) => {
  const appointments = getAppointments();
  const exists = appointments.findIndex(a => a.id === appointment.id);
  if (exists !== -1) {
    appointments[exists] = appointment;
    saveToStorage(KEYS.APPOINTMENTS, appointments);
  } else {
    saveToStorage(KEYS.APPOINTMENTS, [...appointments, appointment]);
  }
};

export const savePrescriptions = (data: Prescription[]) => saveToStorage(KEYS.PRESCRIPTIONS, data);

// --- Patient Helpers ---
export const registerPatient = (patient: Omit<Patient, 'id' | 'createdAt'>): Patient => {
  const patients = getPatients();
  const existing = patients.find(p => p.phone === patient.phone);
  if (existing) return existing;

  const newPatient: Patient = {
    ...patient,
    id: `p-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  savePatients([...patients, newPatient]);
  return newPatient;
};

// --- Doctor Helpers ---
export const registerDoctor = (doctorData: any): Doctor => {
  const doctors = getDoctors();
  const existing = doctors.find(d => d.bmdcNumber === doctorData.bmdcNumber);
  if (existing) return existing;

  const newDoctor: Doctor & { password?: string } = {
    id: `d-${Date.now()}`,
    name: doctorData.name,
    specialty: doctorData.specialty,
    degrees: doctorData.degrees || 'MBBS',
    bmdcNumber: doctorData.bmdcNumber,
    imageUrl: `https://picsum.photos/200/200?random=${doctors.length + 10}`,
    experienceYears: 1,
    totalPatients: 0,
    rating: 5.0,
    about: 'Passionate healthcare provider.',
    chambers: [
      {
        id: `c-${Date.now()}`,
        name: 'General Consultation Center',
        address: 'Dhaka, Bangladesh',
        fee: 500,
        visitingHours: '6:00 PM - 9:00 PM',
        visitingDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
        template: {
          id: `tpl-${Date.now()}`,
          hospitalName: 'DocOclock Clinic',
          logoUrl: 'https://cdn-icons-png.flaticon.com/512/5996/5996258.png',
          themeColor: '#14b8a6',
          address: 'Digital Practice',
          phone: doctorData.phone,
          email: doctorData.email,
          layout: 'modern',
          watermarkOpacity: 0.05,
          footerDisclaimer: 'Computer generated prescription.'
        }
      }
    ],
    password: doctorData.password
  };

  saveDoctors([...doctors, newDoctor]);
  return newDoctor;
};

export const authenticateDoctor = (identifier: string, password?: string): Doctor | null => {
  const doctors = getDoctors() as (Doctor & { password?: string })[];
  const found = doctors.find(d =>
    (d.bmdcNumber === identifier || d.id === identifier) &&
    (password ? d.password === password : true)
  );
  return found || null;
};

// --- Doctor Policy Helpers ---
export interface DoctorPolicy {
  reservedSlotsEnabled: boolean;
  reservedSlotCount: number;
}

export const getDoctorPolicy = (doctorId: string): DoctorPolicy => {
  if (!isBrowser) return { reservedSlotsEnabled: false, reservedSlotCount: 0 };
  const key = `doctor_booking_policy_${doctorId}`;
  const raw = localStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : { reservedSlotsEnabled: false, reservedSlotCount: 0 };
  } catch {
    return { reservedSlotsEnabled: false, reservedSlotCount: 0 };
  }
};

export const saveDoctorPolicy = (doctorId: string, policy: DoctorPolicy): void => {
  if (!isBrowser) return;
  const key = `doctor_booking_policy_${doctorId}`;
  localStorage.setItem(key, JSON.stringify(policy));
};

// --- Arrival Status Helpers ---
export const getArrivalStatus = (doctorId: string, date: string): boolean => {
  if (!isBrowser) return false;
  const key = `demo_arrival_status_${doctorId}_${date}`;
  return localStorage.getItem(key) === 'true';
};

export const saveArrivalStatus = (doctorId: string, date: string, status: boolean): void => {
  if (!isBrowser) return;
  const key = `demo_arrival_status_${doctorId}_${date}`;
  localStorage.setItem(key, String(status));
};

// --- Unified Session Meta Helpers ---
export type SessionStatus = 'IDLE' | 'DELAYED' | 'BREAK' | 'ACTIVE';

export interface DoctorSessionMeta {
  status: SessionStatus;
  delayMinutes: number | null;
  delayStartedAt: string | null; // ISO timestamp
  note?: string;
}

export const DEFAULT_SESSION_META: DoctorSessionMeta = {
  status: 'IDLE',
  delayMinutes: null,
  delayStartedAt: null,
  note: ''
};

export const getSessionMeta = (doctorId: string, date: string): DoctorSessionMeta => {
  if (!isBrowser) return DEFAULT_SESSION_META;
  const key = `demo_session_meta_${doctorId}_${date}`;
  const raw = localStorage.getItem(key);
  try {
    if (!raw) return DEFAULT_SESSION_META;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SESSION_META,
      ...parsed
    };
  } catch {
    return DEFAULT_SESSION_META;
  }
};

export const saveSessionMeta = (doctorId: string, date: string, meta: DoctorSessionMeta): void => {
  if (!isBrowser) return;
  const key = `demo_session_meta_${doctorId}_${date}`;
  localStorage.setItem(key, JSON.stringify(meta));
};

// --- (Legacy) Doctor Delay Helpers - Deprecated in favor of DoctorSessionMeta ---
export interface DoctorDelay {
  delayInMinutes: number;
  isActive: boolean;
  note?: string;
}

export const getDoctorDelay = (doctorId: string, date: string): DoctorDelay => {
  const meta = getSessionMeta(doctorId, date);
  return {
    delayInMinutes: meta.delayMinutes || 0,
    isActive: meta.status === 'DELAYED' || meta.status === 'BREAK',
    note: meta.note || ''
  };
};

// --- Queue Session Status Helpers ---
export type QueueSessionStatus = 'NOT_STARTED' | 'RUNNING';

export const getQueueSessionStatus = (doctorId: string, date: string): QueueSessionStatus => {
  if (!isBrowser) return 'NOT_STARTED';
  const key = `demo_queue_session_${doctorId}_${date}`;
  const status = localStorage.getItem(key);
  return (status === 'RUNNING' ? 'RUNNING' : 'NOT_STARTED') as QueueSessionStatus;
};

export const saveQueueSessionStatus = (doctorId: string, date: string, status: QueueSessionStatus): void => {
  if (!isBrowser) return;
  const key = `demo_queue_session_${doctorId}_${date}`;
  localStorage.setItem(key, status);
};

// --- (Legacy) Break Status Helpers - Deprecated in favor of DoctorSessionMeta ---
export interface BreakStatus {
  onBreak: boolean;
  breakDuration: number;
}

// --- Appointment Helpers ---
export const bookAppointment = (
  doctorId: string,
  doctorName: string,
  chamberId: string,
  date: string,
  time: string,
  patientId: string,
  patientName: string,
  patientPhone: string
) => {
  const appointments = getAppointments();
  // Filter only for this doctor on this day to find current count
  const doctorDateApps = appointments.filter(a => a.doctorId === doctorId && a.date === date);

  const policy = getDoctorPolicy(doctorId);
  const baseOffset = policy.reservedSlotsEnabled ? policy.reservedSlotCount : 0;

  // Serial calculation respects the persistent doctor policy
  const nextSerial = baseOffset + doctorDateApps.length + 1;

  const newApp: Appointment = {
    id: `app-${Date.now()}`,
    doctorId,
    doctorName,
    patientId,
    patientName,
    patientPhone,
    chamberId,
    date,
    time,
    status: 'waiting', // Single source of truth initial status
    tokenNumber: nextSerial,
    isReserved: false,
    isVisibleToPatient: true
  };

  saveAppointment(newApp);
  return newApp;
};


// --- Appointment Search & Filter ---

export const assignPatientToReservedSlot = (
  slotId: string,
  patientId: string,
  patientName: string,
  patientPhone: string
) => {
  const appointments = getAppointments();
  const index = appointments.findIndex(a => a.id === slotId);
  if (index !== -1) {
    appointments[index] = {
      ...appointments[index],
      patientId,
      patientName,
      patientPhone,
      isReserved: false,
      isVisibleToPatient: true
    };
    saveAppointments(appointments);
  }
};
