/**
 * Hospitals, branches, sectors, chambers (+ weekly schedules), doctor<->hospital links,
 * chamber join-requests and the demo pharmacy store.
 *
 * Reminder (CLAUDE.md): appointments.hospital_id -> chambers.id, NOT hospitals.id.
 */
import { BRANCH_IDS, DOCTORS, HOSPITAL_IDS, ADMINS } from './people';
import { DAY_NAMES, NS, Seed, uuid } from './util';

export interface ChamberDef {
  n: number;
  doctorN: number;
  hospitalName: string;
  address: string;
  fee: number;
  feeReport: number;
  limit: number;
  /** minutes per patient; 0 = no time slots, serial numbers only */
  duration: number;
  /** getDay() numbers the chamber is open */
  days: number[];
  start: string;
  end: string;
  linked?: string;
  branch?: string;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const CHAMBER_DEFS: ChamberDef[] = [
  // Dr. Sarah Rahman (the primary doctor persona): open every day so "today" always has a live queue.
  { n: 1, doctorN: 1, hospitalName: 'Demo Central Hospital', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', fee: 1000, feeReport: 600, limit: 30, duration: 10, days: ALL_DAYS, start: '16:00', end: '21:00', linked: HOSPITAL_IDS.central, branch: BRANCH_IDS.centralMain },
  { n: 2, doctorN: 1, hospitalName: 'Lakeview Medical Centre', address: 'Plot 7, Lake Road, Gulshan-2, Dhaka 1212', fee: 1200, feeReport: 700, limit: 20, duration: 0, days: [1, 3, 6], start: '10:00', end: '13:00', linked: HOSPITAL_IDS.lakeview, branch: BRANCH_IDS.lakeviewMain },
  { n: 3, doctorN: 2, hospitalName: 'Riverside Clinic & Diagnostics', address: '45 Riverside Avenue, Mirpur-10, Dhaka 1216', fee: 800, feeReport: 500, limit: 20, duration: 15, days: [0, 2, 4], start: '17:00', end: '20:00', linked: HOSPITAL_IDS.riverside, branch: BRANCH_IDS.riversideMain },
  { n: 4, doctorN: 3, hospitalName: 'Demo Central Hospital', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', fee: 700, feeReport: 400, limit: 16, duration: 15, days: [0, 1, 2, 3, 4], start: '10:00', end: '14:00', linked: HOSPITAL_IDS.central, branch: BRANCH_IDS.centralMain },
  { n: 5, doctorN: 4, hospitalName: 'Lakeview Medical Centre', address: 'Plot 7, Lake Road, Gulshan-2, Dhaka 1212', fee: 1500, feeReport: 900, limit: 24, duration: 10, days: [1, 2, 4, 6], start: '17:00', end: '21:00', linked: HOSPITAL_IDS.lakeview, branch: BRANCH_IDS.lakeviewMain },
  { n: 6, doctorN: 5, hospitalName: 'Demo Central Hospital', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', fee: 1200, feeReport: 700, limit: 24, duration: 10, days: [0, 2, 4], start: '15:00', end: '19:00', linked: HOSPITAL_IDS.central, branch: BRANCH_IDS.centralNorth },
  { n: 7, doctorN: 6, hospitalName: 'Riverside Clinic & Diagnostics', address: '45 Riverside Avenue, Mirpur-10, Dhaka 1216', fee: 900, feeReport: 500, limit: 30, duration: 0, days: [0, 1, 2, 3, 4, 6], start: '16:00', end: '20:00', linked: HOSPITAL_IDS.riverside, branch: BRANCH_IDS.riversideMain },
  { n: 8, doctorN: 7, hospitalName: 'Lakeview Medical Centre', address: 'Plot 7, Lake Road, Gulshan-2, Dhaka 1212', fee: 1000, feeReport: 600, limit: 20, duration: 0, days: [1, 3, 5], start: '10:00', end: '13:00', linked: HOSPITAL_IDS.lakeview, branch: BRANCH_IDS.lakeviewMain },
  { n: 9, doctorN: 8, hospitalName: 'Demo Central Hospital', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', fee: 800, feeReport: 500, limit: 18, duration: 10, days: [0, 1, 3, 4], start: '18:00', end: '21:00', linked: HOSPITAL_IDS.central, branch: BRANCH_IDS.centralMain },
  { n: 10, doctorN: 9, hospitalName: 'Riverside Clinic & Diagnostics', address: '45 Riverside Avenue, Mirpur-10, Dhaka 1216', fee: 700, feeReport: 400, limit: 20, duration: 0, days: [0, 1, 2, 3, 4], start: '09:00', end: '12:00', linked: HOSPITAL_IDS.riverside, branch: BRANCH_IDS.riversideMain },
  { n: 11, doctorN: 10, hospitalName: 'Lakeview Medical Centre', address: 'Plot 7, Lake Road, Gulshan-2, Dhaka 1212', fee: 1500, feeReport: 900, limit: 12, duration: 10, days: [2, 4, 6], start: '19:00', end: '21:00', linked: HOSPITAL_IDS.lakeview, branch: BRANCH_IDS.lakeviewMain },
];

export const chamberId = (n: number) => uuid(NS.chamber, n);
export const doctorIdOf = (n: number) => DOCTORS[n - 1].id as string;

export function buildFacilities(): Seed {
  const hospitalAdmin = ADMINS[1];
  const branchManager = ADMINS[2];

  const hospitals = [
    { id: HOSPITAL_IDS.central, owner_id: hospitalAdmin.id, name: 'Demo Central Hospital', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', contact_info: '+880-1000-000700', created_at: '2025-11-05T09:00:00.000Z', updated_at: '2025-11-05T09:00:00.000Z' },
    { id: HOSPITAL_IDS.lakeview, owner_id: ADMINS[4].id, name: 'Lakeview Medical Centre', address: 'Plot 7, Lake Road, Gulshan-2, Dhaka 1212', contact_info: '+880-1000-000701', created_at: '2025-11-06T09:00:00.000Z', updated_at: '2025-11-06T09:00:00.000Z' },
    { id: HOSPITAL_IDS.riverside, owner_id: ADMINS[5].id, name: 'Riverside Clinic & Diagnostics', address: '45 Riverside Avenue, Mirpur-10, Dhaka 1216', contact_info: '+880-1000-000702', created_at: '2025-11-07T09:00:00.000Z', updated_at: '2025-11-07T09:00:00.000Z' },
    { id: uuid(NS.hospital, 4), owner_id: ADMINS[6].id, name: 'Harbor City Specialty Hospital', address: '9 Harbor Road, Agrabad, Chattogram 4100', contact_info: '+880-1000-000703', created_at: '2025-12-01T09:00:00.000Z', updated_at: '2025-12-01T09:00:00.000Z' },
  ];

  const hospital_branches = [
    { id: BRANCH_IDS.centralMain, hospital_id: HOSPITAL_IDS.central, name: 'Dhanmondi Main Campus', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', contact_info: '+880-1000-000710', manager_id: branchManager.id, created_at: '2025-11-05T10:00:00.000Z' },
    { id: BRANCH_IDS.centralNorth, hospital_id: HOSPITAL_IDS.central, name: 'Uttara North Wing', address: 'Sector 7, Uttara, Dhaka 1230', contact_info: '+880-1000-000711', manager_id: null, created_at: '2025-11-05T10:30:00.000Z' },
    { id: BRANCH_IDS.lakeviewMain, hospital_id: HOSPITAL_IDS.lakeview, name: 'Gulshan Main', address: 'Plot 7, Lake Road, Gulshan-2, Dhaka 1212', contact_info: '+880-1000-000712', manager_id: null, created_at: '2025-11-06T10:00:00.000Z' },
    { id: BRANCH_IDS.riversideMain, hospital_id: HOSPITAL_IDS.riverside, name: 'Mirpur Main', address: '45 Riverside Avenue, Mirpur-10, Dhaka 1216', contact_info: '+880-1000-000713', manager_id: null, created_at: '2025-11-07T10:00:00.000Z' },
  ];

  const sectorNames = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'General Medicine'];
  const hospital_sectors = [HOSPITAL_IDS.central, HOSPITAL_IDS.lakeview, HOSPITAL_IDS.riverside].flatMap((hid, hi) =>
    sectorNames.slice(0, 4 + (hi % 3)).map((name, si) => ({
      id: uuid(NS.sector, hi * 10 + si + 1),
      hospital_id: hid,
      branch_id: [BRANCH_IDS.centralMain, BRANCH_IDS.lakeviewMain, BRANCH_IDS.riversideMain][hi],
      name,
      created_at: '2025-11-08T09:00:00.000Z',
    })),
  );

  // Sarah has one approved request (backing chamber #1) and one pending request to Riverside.
  const chamber_requests = [
    { id: uuid(NS.request, 1), doctor_id: doctorIdOf(1), hospital_id: HOSPITAL_IDS.central, branch_id: BRANCH_IDS.centralMain, sector_id: hospital_sectors[0].id, proposed_fee: 1000, status: 'approved', reviewed_by: hospitalAdmin.id, reviewed_at: '2025-11-20T09:00:00.000Z', note: 'Welcome aboard.', created_at: '2025-11-18T09:00:00.000Z' },
    { id: uuid(NS.request, 2), doctor_id: doctorIdOf(1), hospital_id: HOSPITAL_IDS.riverside, branch_id: BRANCH_IDS.riversideMain, sector_id: null, proposed_fee: 1100, status: 'pending', reviewed_by: null, reviewed_at: null, note: null, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: uuid(NS.request, 3), doctor_id: doctorIdOf(6), hospital_id: HOSPITAL_IDS.central, branch_id: BRANCH_IDS.centralNorth, sector_id: null, proposed_fee: 900, status: 'pending', reviewed_by: null, reviewed_at: null, note: null, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: uuid(NS.request, 4), doctor_id: doctorIdOf(10), hospital_id: HOSPITAL_IDS.central, branch_id: null, sector_id: null, proposed_fee: 1800, status: 'rejected', reviewed_by: hospitalAdmin.id, reviewed_at: '2026-01-10T09:00:00.000Z', note: 'Fee outside the approved band.', created_at: '2026-01-08T09:00:00.000Z' },
  ];

  const chambers = CHAMBER_DEFS.map(c => ({
    id: chamberId(c.n),
    doctor_id: doctorIdOf(c.doctorN),
    hospital_name: c.hospitalName,
    address: c.address,
    consultation_fee: c.fee,
    fee_report: c.feeReport,
    daily_booking_limit: c.limit,
    consultation_duration_minutes: c.duration,
    linked_hospital_id: c.linked ?? null,
    branch_id: c.branch ?? null,
    sector_id: null,
    request_id: c.n === 1 ? uuid(NS.request, 1) : null,
    status: 'active',
    created_at: '2025-11-20T09:00:00.000Z',
  }));

  let s = 0;
  const schedules = CHAMBER_DEFS.flatMap(c =>
    c.days.map(day => ({
      id: uuid(NS.schedule, ++s),
      chamber_id: chamberId(c.n),
      day_of_week: DAY_NAMES[day],
      start_time: c.start,
      end_time: c.end,
      max_patients: c.limit,
    })),
  );

  const doctor_hospitals = CHAMBER_DEFS.filter(c => c.linked).map(c => ({
    doctor_id: doctorIdOf(c.doctorN),
    hospital_id: c.linked!,
    branch_id: c.branch ?? null,
    sector_id: null,
    is_active: true,
    joined_at: '2025-11-21T09:00:00.000Z',
  }));

  const pharmacy_stores = [
    { id: 'aaaaaaaa-0000-0000-0000-000000000001', name: 'Demo Pharmacy (Dhanmondi)', address: 'Road 5, Dhanmondi, Dhaka', phone: '01000000750', doctor_id: null, created_at: '2025-11-05T09:00:00.000Z' },
  ];

  return { hospitals, hospital_branches, hospital_sectors, chamber_requests, chambers, schedules, doctor_hospitals, pharmacy_stores, pharmacy_orders: [] };
}
