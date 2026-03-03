
import { Patient, Doctor, Appointment, Prescription, MedicineAlert, UserRole, AppointmentStatus } from './types';

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
  dailyBookingLimit: number;
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

// --- Medicine Alerts (Sync with Supabase Prescriptions) ---

/**
 * Tracks "taken" status locally for medical instances.
 * Map: { [alertId: string]: boolean }
 */
const getMedicineTakenMap = (): Record<string, boolean> => {
  if (!isBrowser) return {};
  const raw = localStorage.getItem('dococlock_medicine_taken_map');
  return raw ? JSON.parse(raw) : {};
};

const saveMedicineTakenMap = (map: Record<string, boolean>) => {
  if (!isBrowser) return;
  localStorage.setItem('dococlock_medicine_taken_map', JSON.stringify(map));
};

export const fetchMedicineAlerts = async (patientId: string): Promise<MedicineAlert[]> => {
  if (!patientId) return [];

  try {
    // 1. Fetch prescriptions with medicines
    const prescriptions = await fetchPrescriptions(patientId);
    if (!prescriptions || prescriptions.length === 0) return [];

    // 2. Get completion map
    const takenMap = getMedicineTakenMap();

    // 3. Flatten and transform to MedicineAlerts
    const alerts: MedicineAlert[] = [];

    prescriptions.forEach(rx => {
      rx.medicines.forEach((med, idx) => {
        // Create a unique stable ID based on Prescription ID + Medicine Index
        // This is necessary because prescription_medicines IDs might not be intuitive or available at this layer easily
        const alertId = `${rx.id}-med-${idx}`;

        alerts.push({
          id: alertId,
          patientId: patientId,
          appointmentId: rx.appointmentId,
          doctorId: rx.doctorId,
          hospitalId: rx.hospitalId,
          medicineName: med.name,
          dosage: med.dosage,
          startDate: med.startDate,
          durationDays: med.durationDays,
          completed: !!takenMap[alertId]
        });
      });
    });

    return alerts;
  } catch (err) {
    console.error('[CRITICAL] fetchMedicineAlerts: Sync failed.', err);
    return [];
  }
};

/**
 * Legacy support for components importing old name
 */
export const getMedicineAlerts = (): MedicineAlert[] => {
  console.warn('getMedicineAlerts is deprecated. Use fetchMedicineAlerts(patientId) instead.');
  return [];
};

export const toggleMedicineAlert = (alertId: string) => {
  if (!isBrowser) return;
  const takenMap = getMedicineTakenMap();
  takenMap[alertId] = !takenMap[alertId];
  saveMedicineTakenMap(takenMap);
};

// --- (REMOVED: registerPatient, registerDoctor, authenticateDoctor are now in AuthContext.tsx) ---

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

    // 1. Fetch Queue Session for Capacity Guard (New Reservation System)
    const session = await fetchQueueSession(doctorId, hospitalId, date);
    const reservedCount = session.reservedSlotsCount;

    // 2. Fetch Chamber for Max Capacity
    const chambers = await fetchDoctorChambers(doctorId);
    const chamber = chambers.find(c => c.id === hospitalId);
    const maxCapacity = chamber?.dailyBookingLimit || 30;
    const availableCapacity = maxCapacity - reservedCount;

    if (activeApps.length >= availableCapacity) {
      throw new Error(`Booking limit reached. ${reservedCount} slots are reserved for manual registry.`);
    }

    // Gap-filling logic: Public pool range starts AFTER the reserved slots [reservedCount + 1, maxCapacity]
    const takenSerials = new Set(activeApps.map(a => Number(a.serialNumber)));
    let nextSerial = reservedCount + 1;
    while (takenSerials.has(nextSerial) && nextSerial <= maxCapacity) {
      nextSerial++;
    }

    // Safety check: Ensure we haven't exceeded total capacity
    if (nextSerial > maxCapacity) {
      throw new Error(`Booking limit reached (${maxCapacity} slots). No available serials found in the public pool.`);
    }

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
      completedAt: null,
      arrivalTime: null,
      consultationStartTime: null,
      consultationEndTime: null
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
        feeReport: c.fee_report || Math.floor(c.consultation_fee * 0.6),
        schedule,
        scheduleDays: schedule.map(s => s.day),
        dailyBookingLimit: c.daily_booking_limit || 30
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
      consultation_fee: chamber.feeNormal,
      fee_report: chamber.feeReport,
      daily_booking_limit: chamber.dailyBookingLimit
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
      .select('*, chambers!doctor_id(*)')
      .eq('role', 'DOCTOR');

    if (error) {
      console.error('[CRITICAL] fetchDoctors: Supabase Query Error:', error.message);
      throw error;
    }

    console.log(`[DEBUG] fetchDoctors: Success. Received ${doctorsData?.length || 0} profiles.`);

    return (doctorsData || []).map((d: any) => ({
      ...d,
      id: d.id,
      name: d.full_name,
      imageUrl: d.image_url,
      image: d.image_url,
      chambers: (d.chambers || []).map((c: any) => ({
        id: c.id,
        name: c.hospital_name,
        address: c.address,
        fee: c.consultation_fee
      }))
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

export async function fetchAppointments(filters?: { id?: string; doctorId?: string; hospitalId?: string; date?: string; patientId?: string }): Promise<Appointment[]> {
  try {
    console.log('[DEBUG] fetchAppointments: Fetching with supabase-js client...', filters);
    let query = supabase.from('appointments').select('*');

    if (filters?.id) query = query.eq('id', filters.id);
    if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
    if (filters?.hospitalId) query = query.eq('hospital_id', filters.hospitalId);
    if (filters?.date) query = query.eq('appointment_date', filters.date);

    if (filters?.patientId) {
      if (filters.patientId.includes('-')) {
        // Broad match for family members if patientId looks like a phone/prefix
        const phone = filters.patientId.split('-')[1] || filters.patientId;
        query = query.or(`patient_id.eq.${filters.patientId},patient_id.ilike.family-${phone}%`);
      } else {
        // Phone number case
        query = query.or(`patient_id.eq.${filters.patientId},patient_id.ilike.family-${filters.patientId}%`);
      }
    }

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
      arrivalTime: row.arrival_time ? new Date(row.arrival_time).getTime() : null,
      consultationStartTime: row.consultation_start_time ? new Date(row.consultation_start_time).getTime() : null,
      consultationEndTime: row.consultation_end_time ? new Date(row.consultation_end_time).getTime() : null,
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
  // 1. Fetch current version to validate transitions and serial immutability
  const { data: current, error: fetchError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', app.id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // Enforce serial immutability if appointment already exists
  if (current && current.serial_number !== app.serialNumber) {
    console.warn(`[SECURITY] Serial number immutability violation for ${app.id}. Reverting to ${current.serial_number}.`);
    app.serialNumber = current.serial_number;
  }

  // Validate status transition
  const v = (s: string | null) => s as AppointmentStatus || 'waiting';
  const from = v(current?.status);
  const to = v(app.status);

  const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    'waiting': ['consulting', 'cancelled', 'late'],
    'late': ['consulting', 'cancelled'],
    'consulting': ['completed'],
    'completed': [],
    'cancelled': []
  };

  if (current && from !== to && !allowedTransitions[from].includes(to)) {
    throw new Error(`Invalid queue transition: ${from} -> ${to}`);
  }

  // Tracking timestamps logic
  if (from !== to) {
    if (to === 'consulting') app.consultationStartTime = Date.now();
    if (to === 'completed') app.consultationEndTime = Date.now();
  }

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
    serial_number: app.serialNumber, // Immutable after block above
    is_reserved: app.isReserved,
    is_visible_to_patient: app.isVisibleToPatient,
    category: app.category,
    has_prescription: app.hasPrescription,
    prescription_id: app.prescriptionId,
    cancelled_at: app.cancelledAt ? new Date(app.cancelledAt).toISOString() : (app.status === 'cancelled' ? new Date().toISOString() : null),
    completed_at: app.completedAt ? new Date(app.completedAt).toISOString() : (app.status === 'completed' ? new Date().toISOString() : null),
    arrival_time: app.arrivalTime ? new Date(app.arrivalTime).toISOString() : null,
    consultation_start_time: app.consultationStartTime ? new Date(app.consultationStartTime).toISOString() : null,
    consultation_end_time: app.consultationEndTime ? new Date(app.consultationEndTime).toISOString() : null,
    cancelled_by: app.cancelledBy
  };

  console.log('[DEBUG] upsertAppointment: Saving to Supabase...', app.id, `(${from} -> ${to})`);
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
    completedAt: null,
    arrivalTime: null,
    consultationStartTime: null,
    consultationEndTime: null
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
      clinicalFindings: row.clinical_findings,
      testsRecommended: row.tests_recommended,
      followUpDate: row.follow_up_date,
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
      clinical_findings: rx.clinicalFindings,
      tests_recommended: rx.testsRecommended,
      follow_up_date: rx.followUpDate,
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

export async function downloadPrescriptionPDF(prescriptionId: string): Promise<void> {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token || '';

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prescriptionId })
    });

    if (!response.ok) {
      console.error('[CRITICAL] downloadPrescriptionPDF: Function HTTP Error:', response.status);
      throw new Error(`Edge Function returned a non-2xx status code: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prescription_${prescriptionId}.pdf`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err: any) {
    console.error('[CRITICAL] downloadPrescriptionPDF: Download failed.', err);
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
  reservedSlotsCount: number;
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
        reservedSlotsCount: 0,
        meta: DEFAULT_SESSION_META
      };
    }

    return {
      doctorId: data.doctor_id,
      hospitalId: data.hospital_id,
      date: data.session_date,
      isDoctorArrived: data.is_doctor_arrived,
      sessionStatus: data.session_status,
      reservedSlotsCount: data.reserved_slots_count || 0,
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
      reservedSlotsCount: 0,
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
      reserved_slots_count: session.reservedSlotsCount,
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
