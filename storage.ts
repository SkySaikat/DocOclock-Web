
import { Patient, Doctor, Appointment, Prescription, MedicineAlert, UserRole, AppointmentStatus } from './types';
import { downloadPrescriptionPDF as generatePDF, PrescriptionData } from './pdf/prescriptions';

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
  linkedHospitalId?: string; // ID of a registered hospital from the hospitals table
  consultationDurationMinutes?: number; // 0 = no time slots, just serial numbers
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
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const PatientStorage = {
  get: () => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem(KEYS.PATIENT_SESSION);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.sessionExpiresAt && Date.now() > data.sessionExpiresAt) {
        PatientStorage.clear();
        // [P7] Notify user of session expiration
        window.dispatchEvent(new CustomEvent('session-expired'));
        return null;
      }
      return data;
    } catch {
      PatientStorage.clear();
      return null;
    }
  },
  set: (data: any) => {
    if (!isBrowser) return;
    const sessionData = { ...data, role: 'PATIENT', sessionExpiresAt: Date.now() + SESSION_DURATION };
    localStorage.setItem(KEYS.PATIENT_SESSION, JSON.stringify(sessionData));
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
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.sessionExpiresAt && Date.now() > data.sessionExpiresAt) {
        DoctorStorage.clear();
        window.dispatchEvent(new CustomEvent('session-expired'));
        return null;
      }
      return data;
    } catch {
      DoctorStorage.clear();
      return null;
    }
  },
  set: (data: any) => {
    if (!isBrowser) return;
    const sessionData = { ...data, role: 'DOCTOR', sessionExpiresAt: Date.now() + SESSION_DURATION };
    localStorage.setItem(KEYS.DOCTOR_SESSION, JSON.stringify(sessionData));
  },
  clear: () => {
    if (!isBrowser) return;
    localStorage.removeItem(KEYS.DOCTOR_SESSION);
  },
};

export const AdminStorage = {
  get: () => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem('demo_admin_session');
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.sessionExpiresAt && Date.now() > data.sessionExpiresAt) {
        AdminStorage.clear();
        window.dispatchEvent(new CustomEvent('session-expired'));
        return null;
      }
      return data;
    } catch {
      AdminStorage.clear();
      return null;
    }
  },
  set: (data: any) => {
    if (!isBrowser) return;
    const sessionData = { ...data, role: data.role || 'SUPER_ADMIN', sessionExpiresAt: Date.now() + SESSION_DURATION };
    localStorage.setItem('demo_admin_session', JSON.stringify(sessionData));
  },
  clear: () => {
    if (!isBrowser) return;
    localStorage.removeItem('demo_admin_session');
  },
};

export const BranchManagerStorage = {
  get: () => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem('demo_branch_manager_session');
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.sessionExpiresAt && Date.now() > data.sessionExpiresAt) {
        BranchManagerStorage.clear();
        window.dispatchEvent(new CustomEvent('session-expired'));
        return null;
      }
      return data;
    } catch {
      BranchManagerStorage.clear();
      return null;
    }
  },
  set: (data: any) => {
    if (!isBrowser) return;
    const sessionData = { ...data, role: 'BRANCH_MANAGER', sessionExpiresAt: Date.now() + SESSION_DURATION };
    localStorage.setItem('demo_branch_manager_session', JSON.stringify(sessionData));
  },
  clear: () => {
    if (!isBrowser) return;
    localStorage.removeItem('demo_branch_manager_session');
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
    
    // 2. Fetch manual user medicines
    let userMeds = [];
    try {
      const { data, error } = await supabase.from('user_medicines').select('*').eq('patient_id', patientId);
      if (!error && data) userMeds = data;
    } catch (e) {
      console.warn("User medicines table might not exist yet.", e);
    }

    const takenMap = getMedicineTakenMap();
    const alerts: MedicineAlert[] = [];

    // Prescription medicines
    if (prescriptions && prescriptions.length > 0) {
      prescriptions.forEach(rx => {
        rx.medicines.forEach((med, idx) => {
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
    }

    // Manual user medicines
    userMeds.forEach((med: any) => {
      const alertId = `manual-${med.id}`;
      alerts.push({
        id: alertId,
        patientId: patientId,
        appointmentId: '',
        doctorId: 'Manual Entry',
        hospitalId: 'N/A',
        medicineName: med.medicine_name,
        dosage: med.dosage,
        startDate: med.created_at,
        durationDays: med.duration_days,
        completed: !!takenMap[alertId]
      });
    });

    return alerts;
  } catch (err) {
    console.error('[CRITICAL] fetchMedicineAlerts: Sync failed.', err);
    return [];
  }
};

export async function saveUserMedicine(patientId: string, medicineName: string, dosage: string, durationDays: number): Promise<void> {
  try {
    const { error } = await supabase.from('user_medicines').insert({
      patient_id: patientId,
      medicine_name: medicineName,
      dosage,
      duration_days: durationDays
    });
    if (error) throw error;
  } catch (err) {
    console.error('Error saving user medicine:', err);
    throw err;
  }
}


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
  patientPhone: string,
  options?: {
    preferredSerial?: number;  // For time-slot booking — book a specific serial
    chiefComplaint?: string;
    visitType?: string;
  }
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

    const takenSerials = new Set(activeApps.map(a => Number(a.serialNumber)));

    // If a specific time slot serial is requested, validate and use it
    let nextSerial: number;
    if (options?.preferredSerial && options.preferredSerial > reservedCount) {
      if (takenSerials.has(options.preferredSerial)) {
        throw new Error('That time slot was just taken. Please select another slot.');
      }
      if (options.preferredSerial > maxCapacity) {
        throw new Error('Invalid time slot selected.');
      }
      nextSerial = options.preferredSerial;
    } else {
      // Gap-filling logic: Public pool range starts AFTER the reserved slots [reservedCount + 1, maxCapacity]
      nextSerial = reservedCount + 1;
      while (takenSerials.has(nextSerial) && nextSerial <= maxCapacity) {
        nextSerial++;
      }
      if (nextSerial > maxCapacity) {
        throw new Error(`Booking limit reached (${maxCapacity} slots). No available serials found in the public pool.`);
      }
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
      consultationEndTime: null,
      ...(options?.chiefComplaint && { chiefComplaint: options.chiefComplaint }),
      ...(options?.visitType && { visitType: options.visitType }),
    } as any;

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
        dailyBookingLimit: c.daily_booking_limit || 30,
        linkedHospitalId: c.linked_hospital_id || undefined,
        consultationDurationMinutes: c.consultation_duration_minutes || 0,
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
    const chamberRow: Record<string, any> = {
      doctor_id: doctorId,
      hospital_name: chamber.hospitalName,
      address: chamber.address,
      consultation_fee: chamber.feeNormal,
      fee_report: chamber.feeReport,
      daily_booking_limit: chamber.dailyBookingLimit,
      linked_hospital_id: chamber.linkedHospitalId || null,
      consultation_duration_minutes: chamber.consultationDurationMinutes || 0,
    };

    let chamberId = chamber.id;
    const isNew = !chamberId || chamberId.length < 15;

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

    // 1b. If linked to a registered hospital, upsert doctor_hospitals so the
    //     hospital admin can see this doctor in their roster.
    if (chamber.linkedHospitalId) {
      await supabase.from('doctor_hospitals').upsert(
        [{ doctor_id: doctorId, hospital_id: chamber.linkedHospitalId, is_active: true }],
        { onConflict: 'doctor_id,hospital_id' }
      );
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
      .eq('role', 'DOCTOR')
      .eq('registration_status', 'approved');

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
    cancelled_by: app.cancelledBy,
    ...((app as any).chiefComplaint != null && { chief_complaint: (app as any).chiefComplaint }),
    ...((app as any).visitType != null && { visit_type: (app as any).visitType }),
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


export async function createPharmacyOrder(
  rx: Prescription,
  patientName: string,
  patientPhone: string,
  doctorName: string,
  diagnosis: string
): Promise<string> {
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const orderNumber = `PH-${ts}-${rand}`;

  // Try to find a pharmacy store linked to this doctor; fall back to the demo store
  const { data: stores } = await supabase
    .from('pharmacy_stores')
    .select('id')
    .eq('doctor_id', rx.doctorId)
    .limit(1);
  const storeId = stores?.[0]?.id || 'aaaaaaaa-0000-0000-0000-000000000001';

  const items = rx.medicines.map(m => ({
    medicine_name: m.name,
    dosage: m.dosage,
    duration_days: m.durationDays,
    instruction: m.beforeAfterMeal === 'before' ? 'Before meal' : 'After meal',
    available: true,
    price: 0,
  }));

  const { error } = await supabase.from('pharmacy_orders').insert([{
    order_number: orderNumber,
    prescription_id: rx.id,
    store_id: storeId,
    patient_name: patientName,
    patient_phone: patientPhone || '',
    patient_id: rx.patientId,
    doctor_id: rx.doctorId,
    doctor_name: doctorName,
    diagnosis,
    items,
    status: 'pending',
    total_amount: 0,
  }]);

  if (error) throw error;
  return orderNumber;
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
    // 1. Fetch the prescription (with linked appointment for patient name)
    const { data: rx, error: rxError } = await supabase
      .from('prescriptions')
      .select('*, appointments(patient_name, patient_age, patient_gender, patient_phone)')
      .eq('id', prescriptionId)
      .single();

    if (rxError || !rx) {
      throw new Error(`Prescription not found: ${rxError?.message}`);
    }

    // 2. Fetch medicines for this prescription
    const { data: meds } = await supabase
      .from('prescription_medicines')
      .select('*')
      .eq('prescription_id', prescriptionId);

    // 3. Fetch doctor profile
    const { data: doctor } = rx.doctor_id
      ? await supabase.from('profiles').select('full_name, degrees, specialty, bmdc_number, phone').eq('id', rx.doctor_id).single()
      : { data: null };

    // 4. Fetch chamber (hospital) info
    const { data: chamber } = rx.hospital_id
      ? await supabase.from('chambers').select('hospital_name, address').eq('id', rx.hospital_id).single()
      : { data: null };

    // 5. Resolve patient info (from linked appointment or fallback)
    const appt: any = (rx as any).appointments;
    const patientName   = appt?.patient_name   || 'Patient';
    const patientAge    = appt?.patient_age    ? String(appt.patient_age) : '';
    const patientGender = appt?.patient_gender || '';

    // 6. Build PrescriptionData object
    const pdfData: PrescriptionData = {
      doctorName:      doctor?.full_name    || 'Dr.',
      doctorDegrees:   doctor?.degrees      || '',
      doctorSpecialty: doctor?.specialty    || '',
      doctorBmdc:      doctor?.bmdc_number  || '',
      doctorPhone:     doctor?.phone,
      hospitalName:    chamber?.hospital_name || '',
      hospitalAddress: chamber?.address      || '',
      patientName,
      patientAge,
      patientGender,
      date:            rx.date ? new Date(rx.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      diagnosis:       rx.diagnosis   || '',
      advice:          rx.notes       || '',
      followUpDate:    rx.follow_up_date || undefined,
      medicines: (meds || []).map((m: any) => ({
        name:         m.name,
        dosage:       m.dosage,
        duration:     `${m.duration_days} Days`,
        instructions: m.before_after_meal === 'before' ? 'Before meal' : 'After meal',
      })),
    };

    // 7. Generate and download the PDF using the local jsPDF library
    generatePDF(pdfData, 'modern', `Rx_${patientName.replace(/\s+/g, '_')}_${rx.date}`);
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

// --- Platform Utilities ---
export async function fetchMedicineCatalog(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('medicines').select('*').order('name');
    if (error) throw error;
    return (data || []).map((m: any) => ({
      id:          m.id,
      brandName:   m.name,
      genericName: m.generic_name || '',
      type:        m.category     || 'General',
      strength:    m.strength     || '',
      company:     m.manufacturer || '',
      route:       m.form         || 'Tablet',
    }));
  } catch (err) {
    console.warn('Medicine catalog failed to fetch:', err);
    return [];
  }
}

export async function addMedicineToCatalog(medicine: {
  name: string;
  generic_name?: string;
  category: string;
  form: string;
  strength?: string;
  manufacturer?: string;
  added_by_doctor_id?: string;
  is_verified?: boolean;
}): Promise<any> {
  const { data, error } = await supabase
    .from('medicines')
    .insert([{ ...medicine, is_verified: medicine.is_verified ?? true }])
    .select()
    .single();
  if (error) throw error;
  // Bust the session cache so MedicineManager and other doctors see it immediately
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('medicine_catalog');
  return {
    id:          data.id,
    brandName:   data.name,
    genericName: data.generic_name || '',
    type:        data.category     || 'General',
    strength:    data.strength     || '',
    company:     data.manufacturer || '',
    route:       data.form         || 'Tablet',
  };
}

// --- Chamber Requests ---

export async function submitChamberRequest(
  doctorId: string,
  hospitalId: string,
  proposedFee: number,
  branchId?: string,
  sectorId?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('chamber_requests')
    .insert([{
      doctor_id: doctorId,
      hospital_id: hospitalId,
      branch_id: branchId || null,
      sector_id: sectorId || null,
      proposed_fee: proposedFee,
      status: 'pending',
    }])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchChamberRequests(doctorId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('chamber_requests')
    .select(`
      *,
      hospital:hospital_id (id, name, address),
      branch:branch_id (id, name, address),
      sector:sector_id (id, name)
    `)
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// --- Doctor Reviews ---

export async function submitDoctorReview(
  doctorId: string,
  patientId: string,
  patientName: string,
  rating: number,
  comment: string
): Promise<void> {
  const { error } = await supabase
    .from('doctor_reviews')
    .upsert([{
      doctor_id: doctorId,
      patient_id: patientId,
      patient_name: patientName,
      rating,
      comment,
      created_at: new Date().toISOString(),
    }], { onConflict: 'doctor_id,patient_id' });
  if (error) throw error;

  // Update doctor's average rating
  const { data: reviews } = await supabase
    .from('doctor_reviews')
    .select('rating')
    .eq('doctor_id', doctorId);
  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
    await supabase.from('profiles').update({ rating: Math.round(avg * 10) / 10 }).eq('id', doctorId);
  }
}

export async function fetchDoctorReviews(doctorId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('doctor_reviews')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data || [];
}


// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: {
  recipient_id: string;
  title: string;
  body?: string;
  type?: string;
  link?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await supabase.from('notifications').insert([{
      ...data,
      type: data.type || 'system',
    }]);
  } catch {
    // Non-blocking — notification failure should never break the main flow
  }
}
