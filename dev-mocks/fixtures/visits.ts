/**
 * Appointments (every AppointmentStatus, today + 60 days of history + upcoming), queue sessions,
 * prescriptions (+ medicines), reviews and the other rows that hang off visits.
 *
 * Generated relative to "now" with a seeded RNG, so the preview is stable between reloads on the same day
 * and always has: a live queue today, 60 days of completed visits, and a few future bookings.
 */
import { CHAMBER_DEFS, ChamberDef, chamberId, doctorIdOf } from './facilities';
import { FALLBACK_RX, RX_BY_SPECIALTY, RxTemplate } from './clinical';
import { DOCTORS, PATIENTS, DOCTOR_ID, PATIENT_ID } from './people';
import { NS, Rows, Seed, addDays, at, dayOffset, hhmmToMinutes, rng, startOfToday, uuid, weekday } from './util';

interface Party { id: string; name: string; phone: string; age: number; gender: string }
const partyOf = (p: Record<string, any>): Party => ({ id: p.id, name: p.full_name, phone: p.phone, age: p.age, gender: p.gender });

const NADIA = partyOf(PATIENTS[0]);
const POOL = PATIENTS.slice(1).map(partyOf); // random history never uses the primary patient (her visits are explicit)
const RESERVED_TODAY = 2; // Dr. Sarah's Demo Central queue keeps serials 1-2 for manual registry

const COMPLAINTS = ['Fever for 2 days', 'Follow-up after tests', 'Persistent cough', 'Headache and dizziness', 'Routine check-up', 'Chest discomfort', 'Skin rash', 'Joint pain', 'Stomach ache'];
const REVIEW_COMMENTS = [
  'Very patient and explained everything clearly. The live queue meant I barely waited.',
  'Booked in two minutes and the doctor started on time. Highly recommended.',
  'Great experience — prescription was available in the app before I left the chamber.',
  'Professional and kind. Follow-up reminders were really helpful.',
  'Excellent diagnosis. I liked being able to see my serial number live.',
  'Clean chamber, short wait, and a thorough consultation.',
];

export function buildVisits(): Seed {
  const r = rng(20260920);
  const today = dayOffset(0);
  const nowMs = Date.now();

  const appointments: Rows = [];
  const prescriptions: Rows = [];
  const prescription_medicines: Rows = [];
  const queue_sessions: Rows = [];
  let apptN = 0;
  let rxN = 0;
  let medN = 0;

  const def = (n: number) => CHAMBER_DEFS.find(c => c.n === n)!;
  const doctorOf = (d: ChamberDef) => DOCTORS[d.doctorN - 1] as Record<string, any>;

  const slotMinutes = (c: ChamberDef, serial: number, reserved = 0) =>
    c.duration > 0 ? hhmmToMinutes(c.start) + (serial - 1) * c.duration : hhmmToMinutes(c.start) + Math.max(0, serial - 1 - reserved) * 8;
  // 12-hour "4:20 PM" strings: that is what the analytics / sorting helpers (utils/timeComparison, calculateEstimatedTime) parse.
  const to12h = (mins: number) => { const h = Math.floor(mins / 60); const m = mins % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const timeString = (c: ChamberDef, serial: number) => to12h(c.duration > 0 ? slotMinutes(c, serial) : hhmmToMinutes(c.start));
  const openOn = (c: ChamberDef, date: string) => c.days.includes(weekday(date));

  /** Closest date to `offset` (going backwards) on which the chamber is open. */
  const prevOpen = (c: ChamberDef, offset: number) => { let o = offset; while (!openOn(c, dayOffset(o))) o--; return dayOffset(o); };
  /** First date >= `offset` days from today on which the chamber is open. */
  const nextOpen = (c: ChamberDef, offset: number) => { let o = offset; while (!openOn(c, dayOffset(o))) o++; return dayOffset(o); };

  // ── prescription factory ───────────────────────────────────────────────
  function addRx(appt: Record<string, any>, c: ChamberDef, template?: RxTemplate, createdMs?: number) {
    const doc = doctorOf(c);
    const list = RX_BY_SPECIALTY[doc.specialty as string] ?? FALLBACK_RX;
    const t = template ?? r.pick(list);
    const id = `rx-${(++rxN).toString(16).padStart(8, '0')}`;
    const created = new Date(createdMs ?? new Date(appt.completed_at ?? appt.created_at).getTime() + 5 * 60000).toISOString();
    prescriptions.push({
      id,
      appointment_id: appt.id,
      doctor_id: appt.doctor_id,
      patient_id: appt.patient_id,
      hospital_id: appt.hospital_id,
      date: appt.appointment_date,
      diagnosis: t.dx,
      clinical_findings: t.findings,
      tests_recommended: t.tests === 'None' ? '' : t.tests,
      follow_up_date: r.chance(0.6) ? dayOffset(14 + Math.round((new Date(appt.appointment_date + 'T00:00:00').getTime() - startOfToday().getTime()) / 86400000)) : null,
      notes: t.notes,
      created_at: created,
    });
    t.meds.forEach(([name, dosage, days, meal]) => {
      prescription_medicines.push({
        id: uuid('7e5d', ++medN),
        prescription_id: id,
        name,
        dosage,
        duration_days: days,
        before_after_meal: meal,
        start_date: appt.appointment_date,
      });
    });
    appt.has_prescription = true;
    appt.prescription_id = id;
    return id;
  }

  // ── appointment factory ────────────────────────────────────────────────
  interface ApptOpts {
    c: ChamberDef;
    date: string;
    serial: number;
    status: 'waiting' | 'consulting' | 'completed' | 'cancelled' | 'late';
    who: Party;
    category?: 'normal' | 'report';
    reserved?: number;
    /** epoch-ms the consultation started (completed / consulting rows) */
    startMs?: number;
    endMs?: number;
    cancelledBy?: 'patient' | 'doctor';
    arrivalMs?: number | null;
    time?: string;
    complaint?: string;
    isReserved?: boolean;
  }
  function addAppt(o: ApptOpts) {
    const doc = doctorOf(o.c);
    const category = o.category ?? 'normal';
    const slotStart = at(o.date, slotMinutes(o.c, o.serial, o.reserved ?? 0));
    const startMs = o.startMs ?? new Date(slotStart).getTime() + r.int(0, 4) * 60000;
    const endMs = o.endMs ?? startMs + r.int(6, 12) * 60000;
    const row: Record<string, any> = {
      id: uuid(NS.appt, ++apptN),
      patient_id: o.who.id,
      patient_name: o.who.name,
      patient_phone: o.who.phone,
      patient_age: o.who.age,
      patient_gender: o.who.gender,
      doctor_id: doc.id,
      doctor_name: doc.full_name,
      hospital_id: chamberId(o.c.n),
      hospital_name: o.c.hospitalName,
      chamber_name: o.c.hospitalName,
      chamber_location: o.c.address,
      fee: category === 'report' ? o.c.feeReport : o.c.fee,
      appointment_date: o.date,
      appointment_time: o.time ?? timeString(o.c, o.serial),
      status: o.status,
      serial_number: o.serial,
      is_reserved: !!o.isReserved,
      is_visible_to_patient: true,
      category,
      has_prescription: false,
      prescription_id: null,
      cancelled_at: null,
      completed_at: null,
      arrival_time: o.arrivalMs === undefined ? (o.status === 'waiting' || o.status === 'cancelled' ? null : new Date(startMs - 12 * 60000).toISOString()) : (o.arrivalMs ? new Date(o.arrivalMs).toISOString() : null),
      consultation_start_time: null,
      consultation_end_time: null,
      cancelled_by: null,
      chief_complaint: o.complaint ?? r.pick(COMPLAINTS),
      visit_type: r.chance(0.3) ? 'follow_up' : 'new_patient',
      created_at: new Date(Math.min(startMs, nowMs) - 86400000).toISOString(),
      updated_at: new Date(Math.min(startMs, nowMs)).toISOString(),
    };
    if (o.status === 'consulting' || o.status === 'completed') row.consultation_start_time = new Date(startMs).toISOString();
    if (o.status === 'completed') { row.consultation_end_time = new Date(endMs).toISOString(); row.completed_at = row.consultation_end_time; }
    if (o.status === 'cancelled') { row.cancelled_at = new Date(Math.min(startMs, nowMs) - 3600000).toISOString(); row.cancelled_by = o.cancelledBy ?? r.pick(['patient', 'patient', 'doctor'] as const); }
    appointments.push(row);
    return row;
  }

  const session = (c: ChamberDef, date: string, extra: Record<string, any> = {}) =>
    queue_sessions.push({
      doctor_id: doctorIdOf(c.doctorN),
      hospital_id: chamberId(c.n),
      session_date: date,
      is_doctor_arrived: true,
      session_status: 'RUNNING',
      meta_status: 'ACTIVE',
      delay_minutes: 0,
      delay_started_at: null,
      reserved_slots_count: 0,
      note: '',
      ...extra,
    });

  // ══════════════════════════════════════════════════════════════════════
  // 1. History: last 60 days, every chamber on its open days
  // ══════════════════════════════════════════════════════════════════════
  for (let off = -60; off <= -1; off++) {
    const date = dayOffset(off);
    for (const c of CHAMBER_DEFS) {
      if (!openOn(c, date)) continue;
      const big = c.doctorN === 1;
      const raw = big ? (c.n === 1 ? r.int(4, 10) : r.int(3, 7)) : r.int(1, 3);
      // A growing practice: older weeks are a bit quieter, so "this month vs last month" trends read plausibly.
      const count = off < -30 ? Math.max(1, Math.round(raw * 0.7)) : raw;
      for (let s = 1; s <= count; s++) {
        const cancelled = r.chance(0.09);
        const appt = addAppt({
          c, date, serial: s, who: r.pick(POOL),
          status: cancelled ? 'cancelled' : 'completed',
          category: r.chance(0.12) ? 'report' : 'normal',
        });
        if (appt.status === 'completed' && r.chance(0.75)) addRx(appt, c);
      }
      session(c, date);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2. Nadia Karim (primary patient): explicit, hand-picked history
  // ══════════════════════════════════════════════════════════════════════
  const nadiaVisits: { chamber: number; off: number; serial: number; status: 'completed' | 'cancelled'; rx?: number; who?: Party }[] = [
    { chamber: 1, off: -3, serial: 5, status: 'completed', rx: 0 },   // Sarah — Hypertension (meds still running)
    { chamber: 5, off: -12, serial: 4, status: 'completed', rx: 0 },  // Dr. Tanvir — Migraine
    { chamber: 3, off: -25, serial: 3, status: 'completed', rx: 1 },  // Dr. Imran — Eczema
    { chamber: 10, off: -41, serial: 2, status: 'completed', rx: 1 }, // Dr. Meher — Gastritis
    { chamber: 4, off: -58, serial: 6, status: 'completed', rx: 0 },  // Dr. Nusrat — dental
    { chamber: 7, off: -20, serial: 9, status: 'cancelled' },         // Dr. Kamal — cancelled by patient
  ];
  for (const v of nadiaVisits) {
    const c = def(v.chamber);
    const date = prevOpen(c, v.off);
    const appt = addAppt({ c, date, serial: v.serial, who: NADIA, status: v.status, cancelledBy: 'patient', complaint: v.status === 'completed' ? 'Ongoing symptoms — review' : 'Could not make it' });
    if (v.status === 'completed' && v.rx !== undefined) {
      const list = RX_BY_SPECIALTY[doctorOf(c).specialty as string] ?? FALLBACK_RX;
      addRx(appt, c, list[v.rx % list.length]);
    }
  }
  // Family member (son) — patient_id follows the app's `family-<uuid segment>-<ts>` convention.
  {
    const c = def(7);
    const son: Party = { id: `family-${(PATIENT_ID.split('-')[1])}-1767225600000`, name: 'Rayan Karim', phone: NADIA.phone, age: 6, gender: 'Male' };
    const appt = addAppt({ c, date: prevOpen(c, -8), serial: 3, who: son, status: 'completed', complaint: 'Fever and cough' });
    addRx(appt, c, RX_BY_SPECIALTY.Pediatrician[0]);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 3. TODAY — Dr. Sarah Rahman @ Demo Central (chamber 1): a live, mid-session queue
  // ══════════════════════════════════════════════════════════════════════
  {
    const c = def(1);
    const min = 60000;
    const done = (serial: number, who: Party, startAgo: number, rx: boolean, category: 'normal' | 'report' = 'normal') => {
      const startMs = nowMs - startAgo * min;
      const a = addAppt({ c, date: today, serial, who, status: 'completed', reserved: RESERVED_TODAY, startMs, endMs: startMs + 9 * min, category });
      if (rx) addRx(a, c, RX_BY_SPECIALTY.Cardiologist[serial % 3], startMs + 12 * min);
    };
    done(3, POOL[0], 78, true);
    done(4, POOL[1], 64, true, 'report');
    done(5, POOL[2], 40, false);
    addAppt({ c, date: today, serial: 6, who: POOL[3], status: 'consulting', reserved: RESERVED_TODAY, startMs: nowMs - 7 * min, complaint: 'Chest discomfort' });
    addAppt({ c, date: today, serial: 7, who: POOL[4], status: 'late', reserved: RESERVED_TODAY, arrivalMs: null, complaint: 'Follow-up after tests' });
    addAppt({ c, date: today, serial: 8, who: POOL[5], status: 'waiting', reserved: RESERVED_TODAY, complaint: 'Routine check-up' });
    addAppt({ c, date: today, serial: 9, who: NADIA, status: 'waiting', reserved: RESERVED_TODAY, complaint: 'Blood pressure follow-up' });
    addAppt({ c, date: today, serial: 10, who: POOL[6], status: 'waiting', reserved: RESERVED_TODAY, category: 'report' });
    addAppt({ c, date: today, serial: 11, who: POOL[7], status: 'waiting', reserved: RESERVED_TODAY });
    addAppt({ c, date: today, serial: 12, who: POOL[8], status: 'cancelled', reserved: RESERVED_TODAY, cancelledBy: 'patient' });
    addAppt({ c, date: today, serial: 13, who: POOL[9], status: 'waiting', reserved: RESERVED_TODAY });
    // Walk-in registered by the receptionist (manual registry): app-style ids, time 'Walk-in'
    const walkIn = addAppt({ c, date: today, serial: 14, who: { id: 'p-manual-1', name: 'Kabir Hossain (walk-in)', phone: '01000000190', age: 45, gender: 'Male' }, status: 'waiting', reserved: RESERVED_TODAY, time: 'Walk-in', arrivalMs: nowMs - 5 * min });
    walkIn.visit_type = 'new_patient';

    session(c, today, { reserved_slots_count: RESERVED_TODAY });
  }

  // TODAY — Sarah's second chamber (only on its open days), plus light traffic for the other doctors
  for (const c of CHAMBER_DEFS) {
    if (c.n === 1 || !openOn(c, today)) continue;
    const big = c.doctorN === 1;
    const count = big ? 7 : r.int(2, 4);
    const min = 60000;
    for (let s = 1; s <= count; s++) {
      const status = s <= Math.floor(count / 2) ? 'completed' : s === Math.floor(count / 2) + 1 ? 'consulting' : 'waiting';
      const startAgo = (count - s + 1) * 12;
      const a = addAppt({ c, date: today, serial: s, who: POOL[(s + c.n) % POOL.length], status, startMs: nowMs - startAgo * min });
      if (status === 'completed' && r.chance(0.7)) addRx(a, c, undefined, nowMs - (startAgo - 9) * min);
    }
    session(c, today);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. UPCOMING bookings
  // ══════════════════════════════════════════════════════════════════════
  for (let off = 1; off <= 5; off++) {
    const date = dayOffset(off);
    for (const c of CHAMBER_DEFS.filter(x => x.doctorN === 1)) {
      if (!openOn(c, date)) continue;
      const count = r.int(2, 5);
      for (let s = 1; s <= count; s++) addAppt({ c, date, serial: s, who: r.pick(POOL), status: 'waiting' });
    }
  }
  // Nadia's own upcoming visits
  addAppt({ c: def(3), date: nextOpen(def(3), 1), serial: 4, who: NADIA, status: 'waiting', complaint: 'Skin review' });
  addAppt({ c: def(4), date: nextOpen(def(4), 3), serial: 2, who: NADIA, status: 'waiting', complaint: 'Dental cleaning' });

  // ══════════════════════════════════════════════════════════════════════
  // 5. Reviews
  // ══════════════════════════════════════════════════════════════════════
  const reviews: Rows = [];
  const doctor_reviews: Rows = [];
  const completed = appointments.filter(a => a.status === 'completed' && /^9a71/.test(a.patient_id));
  completed.slice(0, 14).forEach((a, i) => {
    reviews.push({
      id: uuid(NS.review, i + 1),
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      appointment_id: a.id,
      rating: i % 5 === 3 ? 4 : 5,
      comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
      created_at: new Date(new Date(a.completed_at).getTime() + 3600000).toISOString(),
    });
  });
  // Public profile "Reviews" tab (doctor_reviews: one per patient per doctor, denormalised patient_name)
  let dr = 0;
  DOCTORS.slice(0, 10).forEach((d, di) => {
    const n = di < 6 ? 5 - Math.floor(di / 2) : 2;
    for (let k = 0; k < n; k++) {
      const p = PATIENTS[(di + k * 2) % PATIENTS.length];
      doctor_reviews.push({
        id: uuid(NS.review, 100 + ++dr),
        doctor_id: d.id,
        patient_id: p.id,
        patient_name: p.full_name,
        rating: k % 4 === 3 ? 4 : 5,
        comment: REVIEW_COMMENTS[(di + k) % REVIEW_COMMENTS.length],
        created_at: new Date(nowMs - (k * 9 + di + 2) * 86400000).toISOString(),
      });
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // 6. Notifications, self-tracked medicines, rewards, plan + payouts (last three are not read by the app today)
  // ══════════════════════════════════════════════════════════════════════
  const ago = (min: number) => new Date(nowMs - min * 60000).toISOString();
  const notifications: Rows = [
    { id: uuid(NS.notif, 1), recipient_id: PATIENT_ID, title: 'Appointment Confirmed', body: 'Serial #9 with Dr. Sarah Rahman today at Demo Central Hospital.', type: 'appointment_booked', is_read: false, link: '/live-serial', metadata: {}, created_at: ago(180) },
    { id: uuid(NS.notif, 2), recipient_id: PATIENT_ID, title: 'Doctor Running 15 Min Late', body: 'Dr. Sarah Rahman will be 15 minutes late. Your serial #9 has been updated.', type: 'delay_alert', is_read: false, link: '/live-serial', metadata: { delay_minutes: 15 }, created_at: ago(95) },
    { id: uuid(NS.notif, 3), recipient_id: PATIENT_ID, title: 'Prescription Ready', body: 'Dr. Sarah Rahman has added a prescription to your account.', type: 'prescription_ready', is_read: true, link: '/patient/prescriptions', metadata: {}, created_at: ago(3 * 1440) },
    { id: uuid(NS.notif, 4), recipient_id: PATIENT_ID, title: 'How was your visit?', body: 'Rate your consultation with Dr. Tanvir Ahmed.', type: 'review_received', is_read: true, link: '/patient/consultations', metadata: {}, created_at: ago(11 * 1440) },
    { id: uuid(NS.notif, 5), recipient_id: PATIENT_ID, title: 'Welcome to DocOclock', body: 'Your account is ready. Find a specialist and book your first serial.', type: 'system', is_read: true, link: null, metadata: {}, created_at: ago(60 * 1440) },
    { id: uuid(NS.notif, 11), recipient_id: DOCTOR_ID, title: 'New Appointment Booked', body: 'Nadia Karim booked serial #9 for today.', type: 'appointment_booked', is_read: false, link: '/doctor/serial-manager', metadata: {}, created_at: ago(200) },
    { id: uuid(NS.notif, 12), recipient_id: DOCTOR_ID, title: 'New Review', body: 'Sumaiya Begum left you a 5-star review.', type: 'review_received', is_read: false, link: '/doctor/analytics', metadata: {}, created_at: ago(1440) },
    { id: uuid(NS.notif, 13), recipient_id: DOCTOR_ID, title: 'Chamber request pending', body: 'Your request to join Riverside Clinic & Diagnostics is awaiting approval.', type: 'approval_status', is_read: true, link: '/doctor/practice-settings', metadata: {}, created_at: ago(2 * 1440) },
    { id: uuid(NS.notif, 14), recipient_id: DOCTOR_ID, title: 'Welcome, Doctor', body: 'Your BMDC registration was verified and your account approved.', type: 'approval_status', is_read: true, link: null, metadata: {}, created_at: ago(90 * 1440) },
  ];

  const user_medicines: Rows = [
    { id: uuid(NS.userMed, 1), patient_id: PATIENT_ID, medicine_name: 'Vit D3 60K', dosage: '0+0+1', duration_days: 30, start_date: dayOffset(-5), created_at: ago(5 * 1440) },
    { id: uuid(NS.userMed, 2), patient_id: PATIENT_ID, medicine_name: 'Calci-D', dosage: '0+1+0', duration_days: 60, start_date: dayOffset(-9), created_at: ago(9 * 1440) },
  ];

  const reward_points = [
    { points: 100, reason: 'Welcome bonus', d: -60 }, { points: 50, reason: 'First booking', d: -58 }, { points: 50, reason: 'Booking completed', d: -25 },
    { points: 200, reason: 'Profile completed + 3 visits milestone', d: -12 }, { points: 50, reason: 'Booking completed', d: -3 },
  ].map((x, i) => ({ id: uuid(NS.reward, i + 1), patient_id: PATIENT_ID, points: x.points, reason: x.reason, created_at: at(dayOffset(x.d), '10:00') }));

  const subscriptions = [{ id: uuid(NS.sub, 1), doctor_id: DOCTOR_ID, plan: 'Free', status: 'active', price: 0, currency: 'BDT', started_at: '2025-11-20T09:00:00.000Z', renews_at: null, created_at: '2025-11-20T09:00:00.000Z' }];

  const payments: Rows = [];
  for (let m = 5; m >= 0; m--) {
    const d = addDays(startOfToday(), -30 * m);
    const gross = 42000 + ((m * 7331) % 9000);
    payments.push({ id: uuid(NS.pay, 6 - m), doctor_id: DOCTOR_ID, period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, gross_amount: gross, platform_fee: 0, net_amount: gross, method: 'bank_transfer', status: m === 0 ? 'pending' : 'paid', appointment_id: null, created_at: d.toISOString() });
  }

  return { appointments, prescriptions, prescription_medicines, queue_sessions, reviews, doctor_reviews, notifications, user_medicines, reward_points, subscriptions, payments };
}
