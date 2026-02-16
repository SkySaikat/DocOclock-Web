
import { Patient, Doctor, Appointment, Prescription, MedicineAlert } from './types';

export interface DoctorPracticeSettings {
  dailyBookingLimit: number;
  reportFreeDays: number;
  chambers: PracticeChamber[];
}

export type WeeklyDaySchedule = {
  day: number; // 0-6
  startTime: string;
  endTime: string;
  dailyLimit: number;
};


export interface PracticeChamber {
  id: string;
  hospitalName: string;
  address: string;
  schedule: WeeklyDaySchedule[];
  scheduleDays?: number[]; // [0, 1, 3] etc
  feeNormal: number;
  feeReport: number;
}



export interface DoctorClosureSettings {
  isClosed: boolean;
  reason: string;
}

export interface DoctorChamber {
  id: string;
  hospitalName: string;
  address: string;
  daysOfWeek: string[]; // e.g., ["Sun", "Tue", "Thu"]
  startTime: string; // "17:00"
  endTime: string;   // "21:00"
  consultationFee: number;
  dailyBookingLimit: number;
}




const KEYS = {
  PATIENTS: 'demo_patients',
  DOCTORS: 'demo_doctors',
  APPOINTMENTS: 'demo_appointments',
  PRESCRIPTIONS: 'demo_prescriptions',
  PATIENT_SESSION: 'demo_patient_session',
  DOCTOR_SESSION: 'demo_doctor_session',
  MEDICINE_ALERTS: 'demo_medicine_alerts',
};

const getPracticeSettingsKey = (doctorId: string) => `doctor_practice_settings_${doctorId}`;
const getClosureSettingsKey = (doctorId: string) => `doctor_closure_settings_${doctorId}`;
const getChambersKey = (doctorId: string) => `doctor_chambers_${doctorId}`;




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
export const getAppointments = (): Appointment[] => {
  const appointments = getFromStorage<Appointment>(KEYS.APPOINTMENTS);
  return appointments.map(app => ({
    ...app,
    category: app.category || 'normal',
    cancelledAt: app.cancelledAt || null,
    completedAt: app.completedAt || null
  }));
};


/**
 * Unified helper for strict doctor isolation.
 * Used by Dashboard, Queue, and Analytics.
 */
export const getDoctorAppointments = (doctorId: string): Appointment[] => {
  const all = getAppointments();
  return all.filter(a => String(a.doctorId) === String(doctorId));
};

export const getPrescriptions = (): Prescription[] => getFromStorage<Prescription>(KEYS.PRESCRIPTIONS);

export const getMedicineAlerts = (): MedicineAlert[] => getFromStorage<MedicineAlert>(KEYS.MEDICINE_ALERTS);

export const savePrescriptionWithAlerts = (prescription: Prescription) => {
  // 1. Save Prescription
  const prescriptions = getPrescriptions();
  saveToStorage(KEYS.PRESCRIPTIONS, [...prescriptions, prescription]);

  // 2. Update Appointment
  const appointments = getAppointments();
  const appIndex = appointments.findIndex(a => a.id === prescription.appointmentId);
  if (appIndex !== -1) {
    appointments[appIndex] = {
      ...appointments[appIndex],
      hasPrescription: true,
      prescriptionId: prescription.id
    };
    saveAppointments(appointments);
  }

  // 3. Generate Medicine Alerts
  const existingAlerts = getMedicineAlerts();
  const newAlerts: MedicineAlert[] = prescription.medicines.map(med => ({
    id: `alert-${crypto.randomUUID()}`,
    patientId: prescription.patientId,
    appointmentId: prescription.appointmentId,
    medicineName: med.name,
    dosage: med.dosage,
    startDate: med.startDate,
    durationDays: med.durationDays,
    completed: false
  }));

  saveToStorage(KEYS.MEDICINE_ALERTS, [...existingAlerts, ...newAlerts]);
};

export const toggleMedicineAlert = (alertId: string) => {
  const alerts = getMedicineAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  if (index !== -1) {
    alerts[index].completed = !alerts[index].completed;
    saveToStorage(KEYS.MEDICINE_ALERTS, alerts);
  }
};

/**
 * Filtered helper for hospital-level segmentation inside doctor scope.
 */
export const getDoctorAppointmentsByHospital = (doctorId: string, hospitalId: string | null): Appointment[] => {
  if (!hospitalId) return [];
  const all = getDoctorAppointments(doctorId);
  return all.filter(a => String(a.hospitalId) === String(hospitalId));
};


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

export const cancelAppointment = (appointmentId: string, cancelledBy: "patient" | "doctor") => {
  const appointments = getAppointments();
  const index = appointments.findIndex(a => a.id === appointmentId);
  if (index !== -1) {
    appointments[index] = {
      ...appointments[index],
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancelledBy
    };
    saveAppointments(appointments);
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
export const getArrivalStatus = (doctorId: string, hospitalId: string, date: string): boolean => {
  if (!isBrowser) return false;
  const key = `demo_arrival_status_${doctorId}_${hospitalId}_${date}`;
  return localStorage.getItem(key) === 'true';
};

export const saveArrivalStatus = (doctorId: string, hospitalId: string, date: string, status: boolean): void => {
  if (!isBrowser) return;
  const key = `demo_arrival_status_${doctorId}_${hospitalId}_${date}`;
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

export const getSessionMeta = (doctorId: string, hospitalId: string, date: string): DoctorSessionMeta => {
  if (!isBrowser) return DEFAULT_SESSION_META;
  const key = `demo_session_meta_${doctorId}_${hospitalId}_${date}`;
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

export const saveSessionMeta = (doctorId: string, hospitalId: string, date: string, meta: DoctorSessionMeta): void => {
  if (!isBrowser) return;
  const key = `demo_session_meta_${doctorId}_${hospitalId}_${date}`;
  localStorage.setItem(key, JSON.stringify(meta));
};

// --- (Legacy) Doctor Delay Helpers - Deprecated in favor of DoctorSessionMeta ---
export interface DoctorDelay {
  delayInMinutes: number;
  status: SessionStatus;
  startTime: string | null;
  note?: string;
}

export const getDoctorDelay = (doctorId: string, hospitalId: string, date: string): DoctorDelay => {
  const meta = getSessionMeta(doctorId, hospitalId, date);
  return {
    delayInMinutes: meta.delayMinutes || 0,
    status: meta.status || 'ACTIVE',
    startTime: meta.delayStartedAt,
    note: meta.note
  };
};

// --- Queue Session Status Helpers ---
export type QueueSessionStatus = 'NOT_STARTED' | 'RUNNING';

export const getQueueSessionStatus = (doctorId: string, hospitalId: string, date: string): QueueSessionStatus => {
  if (!isBrowser) return 'NOT_STARTED';
  const key = `demo_queue_session_${doctorId}_${hospitalId}_${date}`;
  const status = localStorage.getItem(key);
  return (status === 'RUNNING' ? 'RUNNING' : 'NOT_STARTED') as QueueSessionStatus;
};

export const saveQueueSessionStatus = (doctorId: string, hospitalId: string, date: string, status: QueueSessionStatus): void => {
  if (!isBrowser) return;
  const key = `demo_queue_session_${doctorId}_${hospitalId}_${date}`;
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
  hospitalId: string, // Renamed from chamberId
  chamberName: string,
  chamberLocation: string,
  fee: number,
  date: string,
  time: string,
  patientId: string,
  patientName: string,
  patientPhone: string
) => {

  const appointments = getAppointments();
  // Filter only for this doctor+hospital on this day to find current count
  const doctorHospitalApps = appointments.filter(a =>
    a.doctorId === doctorId &&
    a.hospitalId === hospitalId &&
    a.date === date &&
    a.status !== 'cancelled'
  );

  const practice = getDoctorPracticeSettings(doctorId);
  const chamber = practice.chambers.find(c => c.id === hospitalId);

  const dayNumeric = new Date(date + "T00:00:00").getDay();
  const daySchedule = chamber?.schedule.find(s => s.day === dayNumeric);
  const dailyLimit = daySchedule?.dailyLimit || practice.dailyBookingLimit || 40;

  if (doctorHospitalApps.length >= dailyLimit) {
    alert("Today's booking limit for this hospital has been reached.");
    return;
  }

  const policy = getDoctorPolicy(doctorId);
  const baseOffset = policy.reservedSlotsEnabled ? policy.reservedSlotCount : 0;

  // Serial calculation respects the persistent doctor policy and is hospital-specific
  const nextSerial = baseOffset + doctorHospitalApps.length + 1;

  // Create the new appointment object strictly
  const newApp: Appointment = {
    id: crypto.randomUUID(),
    doctorId,
    doctorName,
    hospitalId,
    hospitalName: chamberName,
    chamberName,
    chamberLocation,
    patientId,
    patientName,
    patientPhone,
    date,
    time,
    status: 'waiting',
    serialNumber: nextSerial,
    fee,
    isReserved: false,
    isVisibleToPatient: true,
    category: 'normal',
    cancelledAt: null,
    completedAt: null
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

export function getDoctorPracticeSettings(doctorId: string): DoctorPracticeSettings {
  if (!doctorId) {
    return {
      dailyBookingLimit: 40,
      reportFreeDays: 7,
      chambers: []
    };
  }
  const key = getPracticeSettingsKey(doctorId);
  const raw = localStorage.getItem(key);


  if (!raw) {
    const defaultSettings: DoctorPracticeSettings = {
      dailyBookingLimit: 40,
      reportFreeDays: 7,
      chambers: []
    };
    localStorage.setItem(
      key,
      JSON.stringify(defaultSettings)
    );
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw);
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };

    return {
      dailyBookingLimit: parsed.dailyBookingLimit ?? 40,
      reportFreeDays: parsed.reportFreeDays ?? 7,
      chambers: (parsed.chambers || []).map((c: any) => {
        // Migration: Convert string days to numbers
        const normalizedSchedule = (c.schedule || []).map((s: any) => {
          if (typeof s.day === 'string') {
            return { ...s, day: dayMap[s.day] ?? 0 };
          }
          return s;
        });

        // Migration: Populate scheduleDays array for fast lookup
        const scheduleDays = Array.from(new Set(normalizedSchedule.map((s: any) => s.day as number)));

        return {
          ...c,
          schedule: normalizedSchedule,
          scheduleDays: c.scheduleDays || scheduleDays
        };
      })
    };

  } catch (error) {
    console.error("Failed to parse practice settings", error);
    return {
      dailyBookingLimit: 40,
      reportFreeDays: 7,
      chambers: []
    };
  }
}

export function saveDoctorPracticeSettings(doctorId: string, settings: DoctorPracticeSettings) {
  if (!doctorId) return;
  localStorage.setItem(
    getPracticeSettingsKey(doctorId),
    JSON.stringify(settings)
  );
}


export function updateDoctorPracticeSettings(
  doctorId: string,
  updates: Partial<DoctorPracticeSettings>
) {
  if (!doctorId) return;
  const current = getDoctorPracticeSettings(doctorId);
  const updated = { ...current, ...updates };

  localStorage.setItem(
    getPracticeSettingsKey(doctorId),
    JSON.stringify(updated)
  );
}

export function getDoctorClosureSettings(doctorId: string): DoctorClosureSettings {
  if (!doctorId) return { isClosed: false, reason: "" };
  const key = getClosureSettingsKey(doctorId);
  const raw = localStorage.getItem(key);

  if (!raw) {
    const defaultSettings: DoctorClosureSettings = {
      isClosed: false,
      reason: ""
    };

    localStorage.setItem(
      key,
      JSON.stringify(defaultSettings)
    );

    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      isClosed: parsed.isClosed ?? false,
      reason: parsed.reason ?? ""
    };
  } catch {
    return {
      isClosed: false,
      reason: ""
    };
  }
}

export function updateDoctorClosureSettings(
  doctorId: string,
  updates: Partial<DoctorClosureSettings>
) {
  if (!doctorId) return;
  const current = getDoctorClosureSettings(doctorId);
  const updated = { ...current, ...updates };

  localStorage.setItem(
    getClosureSettingsKey(doctorId),
    JSON.stringify(updated)
  );
}

export function getDoctorChambers(doctorId: string): DoctorChamber[] {
  if (!doctorId) return [];
  const key = getChambersKey(doctorId);
  const raw = localStorage.getItem(key);

  if (!raw) {
    const defaultValue: DoctorChamber[] = [];
    localStorage.setItem(
      key,
      JSON.stringify(defaultValue)
    );
    return defaultValue;
  }

  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function setDoctorChambers(doctorId: string, chambers: DoctorChamber[]) {
  if (!doctorId) return;
  localStorage.setItem(
    getChambersKey(doctorId),
    JSON.stringify(chambers)
  );
}

export function addDoctorChamber(doctorId: string, chamber: DoctorChamber) {
  if (!doctorId) return;
  const existing = getDoctorChambers(doctorId);
  setDoctorChambers(doctorId, [...existing, chamber]);
}



