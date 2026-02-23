
import { Patient, Doctor, Appointment, Prescription, MedicineAlert, UserRole } from './types';

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

const getClosureSettingsKey = (doctorId: string) => `doctor_closure_settings_${doctorId}`;




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

// --- Medicine Alerts (Local Storage Bridge for now) ---
export const getMedicineAlerts = (): MedicineAlert[] => {
  if (!isBrowser) return [];
  const raw = localStorage.getItem(KEYS.MEDICINE_ALERTS);
  return raw ? JSON.parse(raw) : [];
};

export const toggleMedicineAlert = (alertId: string) => {
  if (!isBrowser) return;
  const alerts = getMedicineAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  if (index !== -1) {
    alerts[index].completed = !alerts[index].completed;
    localStorage.setItem(KEYS.MEDICINE_ALERTS, JSON.stringify(alerts));
  }
};

// --- (REMOVED: registerPatient, registerDoctor, authenticateDoctor are now in AuthContext.tsx) ---

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



// --- Unified Session Meta Helpers ---
export type SessionStatus = 'IDLE' | 'DELAYED' | 'BREAK' | 'ACTIVE';
export type QueueSessionStatus = 'NOT_STARTED' | 'RUNNING';

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





// --- Appointment Helpers ---
export const bookAppointment = async (
  doctorId: string,
  doctorName: string,
  hospitalId: string,
  chamberName: string,
  chamberLocation: string,
  fee: number,
  date: string,
  time: string,
  patientId: string,
  patientName: string,
  patientPhone: string
) => {
  console.log('[DEBUG] bookAppointment: Starting booking flow...', { doctorId, hospitalId, date, patientId });

  try {
    const appointments = await fetchAppointments({ doctorId, hospitalId, date });
    const activeApps = appointments.filter(a => a.status !== 'cancelled');
    console.log(`[DEBUG] bookAppointment: Found ${activeApps.length} active appointments for this slot.`);

    const policy = getDoctorPolicy(doctorId);
    const baseOffset = policy.reservedSlotsEnabled ? policy.reservedSlotCount : 0;
    const nextSerial = baseOffset + activeApps.length + 1;
    console.log(`[DEBUG] bookAppointment: Calculated serial: ${nextSerial}`);

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

    console.log('[DEBUG] bookAppointment: Upserting appointment...', newApp.id);
    await upsertAppointment(newApp);
    console.log('[DEBUG] bookAppointment: Success!');
    return newApp;
  } catch (err: any) {
    console.error('[DEBUG] bookAppointment: Failed to book:', err.message);
    throw err;
  }
};

export const cancelAppointment = async (appointmentId: string, cancelledBy: "patient" | "doctor") => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy
      })
      .eq('id', appointmentId);

    if (error) throw error;
  } catch (err) {
    console.error('Error cancelling appointment in Supabase:', err);
    throw err;
  }
};


// --- Appointment Search & Filter ---

export const assignPatientToReservedSlot = async (
  slotId: string,
  patientId: string,
  patientName: string,
  patientPhone: string
) => {
  const appointments = await fetchAppointments(); // Generic fetch if needed, though usually filtered
  const target = appointments.find(a => a.id === slotId);
  if (target) {
    await upsertAppointment({
      ...target,
      patientId,
      patientName,
      patientPhone,
      isReserved: false,
      isVisibleToPatient: true
    });
  }
};



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

import { supabase } from './supabase';

export async function fetchDoctorChambers(doctorId: string): Promise<PracticeChamber[]> {
  if (!doctorId) return [];

  try {
    console.log('[DEBUG] Fetching chambers for Doctor ID:', doctorId);
    const { data: chambersData, error: chambersError } = await supabase
      .from('chambers')
      .select(`
        *,
        schedules (*)
      `)
      .eq('doctor_id', doctorId);

    if (chambersError) throw chambersError;

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };

    return (chambersData || []).map(c => {
      const schedule: WeeklyDaySchedule[] = (c.schedules || []).map((s: any) => ({
        day: dayMap[s.day_of_week] ?? 0,
        startTime: s.start_time,
        endTime: s.end_time,
        dailyLimit: s.max_patients
      }));

      return {
        id: c.id,
        hospitalName: c.hospital_name,
        address: c.address,
        feeNormal: c.consultation_fee,
        feeReport: Math.floor(c.consultation_fee * 0.6), // Derived for now
        schedule,
        scheduleDays: schedule.map(s => s.day)
      };
    });
  } catch (error) {
    console.error('Error fetching chambers:', error);
    return [];
  }
}

export async function saveChamberWithSchedules(doctorId: string, chamber: PracticeChamber) {
  if (!doctorId) return;

  try {
    // 1. Upsert Chamber
    const chamberRow = {
      doctor_id: doctorId,
      hospital_name: chamber.hospitalName,
      address: chamber.address,
      consultation_fee: chamber.feeNormal
    };

    let chamberId = chamber.id;
    const isNew = !chamberId || chamberId.length < 15; // Simple check for Date.now() vs UUID

    if (isNew) {
      const { data, error } = await supabase
        .from('chambers')
        .insert([chamberRow])
        .select()
        .single();
      if (error) throw error;
      chamberId = data.id;
    } else {
      const { error } = await supabase
        .from('chambers')
        .update(chamberRow)
        .eq('id', chamberId);
      if (error) throw error;
    }

    // 2. Clear existing schedules and re-insert
    const { error: delError } = await supabase
      .from('schedules')
      .delete()
      .eq('chamber_id', chamberId);
    if (delError) throw delError;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleRows = chamber.schedule.map(s => ({
      chamber_id: chamberId,
      day_of_week: dayNames[s.day],
      start_time: s.startTime,
      end_time: s.endTime,
      max_patients: s.dailyLimit
    }));

    if (scheduleRows.length > 0) {
      const { error: insError } = await supabase
        .from('schedules')
        .insert(scheduleRows);
      if (insError) throw insError;
    }

    return chamberId;
  } catch (error: any) {
    console.error('Error saving chamber:', error);
    if (error?.message?.includes('foreign key')) {
      throw new Error('Supabase Schema Error: Please ensure your "chambers" table references the "profiles" table, not "doctors". Follow the SQL in your implementation plan.');
    }
    throw error;
  }
}

export async function deleteChamberFromSupabase(chamberId: string) {
  if (!chamberId) return;
  const { error } = await supabase
    .from('chambers')
    .delete()
    .eq('id', chamberId);
  if (error) throw error;
}

// --- Supabase Profiles (Doctors) ---

export async function fetchDoctors(): Promise<Doctor[]> {
  try {
    console.log('[DEBUG] fetchDoctors: Fetching profiles with role DOCTOR strictly using supabase-js...');

    const { data: doctorsData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'DOCTOR');

    if (error) {
      console.error('[CRITICAL] fetchDoctors: Supabase Query Error:', error.message, error.details, error.hint);
      throw error;
    }


    // Now fetch chambers separately if needed or handle the join if schema supports it
    // For now, let's just get the profiles and add empty chambers to satisfy the interface
    // to isolate if the complex join is causing the CORS issue.

    console.log(`[DEBUG] fetchDoctors: Success. Received ${doctorsData?.length || 0} profiles.`);

    return (doctorsData || []).map((d: any) => ({
      ...d,
      id: d.id,
      name: d.full_name,
      imageUrl: d.image_url,
      image: d.image_url,
      chambers: [] // Simplified for CORS debugging
    }));
  } catch (err: any) {
    console.error('[CRITICAL] fetchDoctors: Fetch failed.', err);
    if (err.message === 'Failed to fetch') {
      console.error('[CORS] Connection blocked. Origin:', window.location.origin, 'Target:', import.meta.env.VITE_SUPABASE_URL);
    }
    return [];
  }
}


// --- Legacy localStorage removal for chambers ---
export function getDoctorChambers() { return []; }
export function setDoctorChambers() { }
export function addDoctorChamber() { }




// --- Supabase Appointments ---

export async function fetchAppointments(filters?: { doctorId?: string; hospitalId?: string; date?: string; patientId?: string }): Promise<Appointment[]> {
  try {
    console.log('[DEBUG] fetchAppointments: Fetching with supabase-js client...', filters);
    let query = supabase.from('appointments').select('*');

    if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId);
    if (filters?.date) query = query.eq('appointment_date', filters.date);
    if (filters?.patientId) query = query.eq('patient_id', filters.patientId);

    const { data, error } = await query.order('serial_number', { ascending: true });

    if (error) {
      console.error('[CRITICAL] fetchAppointments: Supabase Query Error:', error.message);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      chamberName: row.chamber_name,
      chamberLocation: row.chamber_location,
      fee: row.fee,
      date: row.appointment_date,
      time: row.appointment_time,
      status: row.status,
      serialNumber: row.serial_number,
      isReserved: row.is_reserved,
      isVisibleToPatient: row.is_visible_to_patient,
      category: row.category,
      hasPrescription: row.has_prescription,
      prescription_id: row.prescription_id,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).getTime() : null,
      completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
      cancelledBy: row.cancelled_by
    }));
  } catch (err) {
    console.error('[CRITICAL] fetchAppointments: Fetch failed.', err);
    return [];
  }
}


export const fetchDoctorAppointments = (doctorId: string) => fetchAppointments({ doctorId });
export const fetchDoctorAppointmentsByHospital = (doctorId: string, hospitalId: string | null) =>
  hospitalId ? fetchAppointments({ doctorId, hospitalId }) : Promise.resolve([]);

export async function upsertAppointment(app: Appointment): Promise<void> {
  const row = {
    id: app.id,
    patient_id: app.patientId,
    patient_name: app.patientName,
    patient_phone: app.patientPhone,
    doctor_id: app.doctorId,
    doctor_name: app.doctorName,
    hospital_id: app.hospitalId,
    hospital_name: app.hospitalName,
    chamber_name: app.chamberName,
    chamber_location: app.chamberLocation,
    fee: app.fee,
    appointment_date: app.date,
    appointment_time: app.time,
    status: app.status,
    serial_number: app.serialNumber,
    is_reserved: app.isReserved,
    is_visible_to_patient: app.isVisibleToPatient,
    category: app.category,
    has_prescription: app.hasPrescription,
    prescription_id: app.prescriptionId,
    cancelled_at: app.cancelledAt ? new Date(app.cancelledAt).toISOString() : null,

    completed_at: app.completedAt ? new Date(app.completedAt).toISOString() : null,
    cancelled_by: app.cancelledBy
  };

  console.log('[DEBUG] upsertAppointment: Saving to Supabase...', app.id);
  const { error } = await supabase.from('appointments').upsert([row]);
  if (error) {
    console.error('[CRITICAL] upsertAppointment: Supabase Upsert Error:', error.message);
    throw error;
  }
}


export async function bookManualAppointment(
  doctorId: string,
  doctorName: string,
  hospitalId: string,
  hospitalName: string,
  address: string,
  fee: number,
  date: string,
  time: string,
  patientId: string,
  patientName: string,
  patientPhone: string,
  serialNumber: number
): Promise<void> {
  const app: Appointment = {
    id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    patientId,
    patientName,
    patientPhone,
    doctorId,
    doctorName,
    hospitalId,
    hospitalName,
    chamberName: hospitalName,
    chamberLocation: address,
    fee,
    date,
    time,
    status: 'waiting',
    serialNumber,
    cancelledAt: null,
    completedAt: null
  };

  await upsertAppointment(app);
}

// --- Supabase Prescriptions ---

export async function fetchPrescriptions(patientId?: string, doctorId?: string): Promise<Prescription[]> {
  try {
    console.log('[DEBUG] fetchPrescriptions: Fetching from Supabase...', { patientId, doctorId });
    let query = supabase.from('prescriptions').select(`
      *,
      medicines:prescription_medicines(*)
    `);

    if (patientId) query = query.eq('patient_id', patientId);
    if (doctorId) query = query.eq('doctor_id', doctorId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[CRITICAL] fetchPrescriptions: Supabase Query Error:', error.message);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      appointmentId: row.appointment_id,
      doctorId: row.doctor_id,
      patientId: row.patient_id,
      hospitalId: row.hospital_id,
      date: row.date,
      diagnosis: row.diagnosis,
      notes: row.notes,
      medicines: (row.medicines || []).map((m: any) => ({
        name: m.name,
        dosage: m.dosage,
        durationDays: m.duration_days,
        beforeAfterMeal: m.before_after_meal,
        startDate: m.start_date
      })),
      createdAt: new Date(row.created_at).getTime()
    }));
  } catch (err) {
    console.error('[CRITICAL] fetchPrescriptions: Fetch failed.', err);
    return [];
  }
}


export async function savePrescriptionToSupabase(rx: Prescription): Promise<void> {
  try {
    console.log('[DEBUG] savePrescriptionToSupabase: Saving prescription and medicines...', rx.id);
    // 1. Insert Prescription
    const { error: rxError } = await supabase.from('prescriptions').insert([{
      id: rx.id,
      appointment_id: rx.appointmentId,
      doctor_id: rx.doctorId,
      patient_id: rx.patientId,
      hospital_id: rx.hospitalId,
      date: rx.date,
      diagnosis: rx.diagnosis,
      notes: rx.notes,
      created_at: new Date(rx.createdAt).toISOString()
    }]);

    if (rxError) throw rxError;

    // 2. Insert Medicines
    const medicineRows = rx.medicines.map(m => ({
      prescription_id: rx.id,
      name: m.name,
      dosage: m.dosage,
      duration_days: m.durationDays,
      before_after_meal: m.beforeAfterMeal,
      start_date: m.startDate
    }));

    if (medicineRows.length > 0) {
      const { error: medError } = await supabase.from('prescription_medicines').insert(medicineRows);
      if (medError) throw medError;
    }

    // 3. Update Appointment
    const { error: appError } = await supabase
      .from('appointments')
      .update({ has_prescription: true, prescription_id: rx.id })
      .eq('id', rx.appointmentId);

    if (appError) throw appError;

  } catch (err: any) {
    console.error('[CRITICAL] savePrescriptionToSupabase: Save failed.', err);
    throw err;
  }
}


// --- Supabase Queue Sessions ---

export interface QueueSession {
  doctorId: string;
  hospitalId: string;
  date: string;
  isDoctorArrived: boolean;
  sessionStatus: QueueSessionStatus;
  meta: DoctorSessionMeta;
}

export async function fetchQueueSession(doctorId: string, hospitalId: string, date: string): Promise<QueueSession> {
  try {
    console.log('[DEBUG] fetchQueueSession: Fetching from Supabase...', { doctorId, hospitalId, date });
    const { data, error } = await supabase
      .from('queue_sessions')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('hospital_id', hospitalId)
      .eq('session_date', date)
      .maybeSingle();

    if (error) {
      console.error('[CRITICAL] fetchQueueSession: Supabase Query Error:', error.message);
      throw error;
    }

    if (!data) {
      return {
        doctorId,
        hospitalId,
        date,
        isDoctorArrived: false,
        sessionStatus: 'NOT_STARTED',
        meta: DEFAULT_SESSION_META
      };
    }

    return {
      doctorId: data.doctor_id,
      hospitalId: data.hospital_id,
      date: data.session_date,
      isDoctorArrived: data.is_doctor_arrived,
      sessionStatus: data.session_status,
      meta: {
        status: data.meta_status,
        delayMinutes: data.delay_minutes,
        delayStartedAt: data.delay_started_at,
        note: data.note
      }
    };
  } catch (err) {
    console.error('[CRITICAL] fetchQueueSession: Fetch failed.', err);
    return {
      doctorId,
      hospitalId,
      date,
      isDoctorArrived: false,
      sessionStatus: 'NOT_STARTED',
      meta: DEFAULT_SESSION_META
    };
  }
}


export async function upsertQueueSession(session: QueueSession): Promise<void> {
  try {
    const row = {
      doctor_id: session.doctorId,
      hospital_id: session.hospitalId,
      session_date: session.date,
      is_doctor_arrived: session.isDoctorArrived,
      session_status: session.sessionStatus,
      meta_status: session.meta.status,
      delay_minutes: session.meta.delayMinutes,
      delay_started_at: session.meta.delayStartedAt,
      note: session.meta.note
    };

    console.log('[DEBUG] upsertQueueSession: Saving to Supabase...', { doctorId: session.doctorId, date: session.date });
    const { error } = await supabase.from('queue_sessions').upsert([row]);
    if (error) {
      console.error('[CRITICAL] upsertQueueSession: Supabase Upsert Error:', error.message);
      throw error;
    }
  } catch (err: any) {
    console.error('[CRITICAL] upsertQueueSession: Save failed.', err);
    throw err;
  }
}
