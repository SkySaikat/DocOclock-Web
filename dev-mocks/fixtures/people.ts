/**
 * Static people fixtures (profiles table). No dates relative to "now" here on purpose — this file is
 * also imported by vite.mock.config.ts to build the ?as=... session bootstrap, so it must stay pure data.
 *
 * Everything is fictional: names, phones (01000-000NNN), e-mails (@example.test), BMDC numbers (DEMO-xxxx).
 * Every account's password is  Demo@1234  (bcrypt hash below) so the real login forms also work in the preview.
 */
import { NS, uuid } from './util';

export const DEMO_PASSWORD = 'Demo@1234';
const HASH = '$2b$10$tEkY8ec3W/j4PNsTp6y3mOpJssiNKrVuSTmlOQQ7Mcnmike9CvD/G';

const PHOTOS = {
  d1: '/assets/figma/doctor-card-1.png',
  d2: '/assets/figma/doctor-card-2.png',
  d3: '/assets/figma/doctor-card-3.png',
  hero: '/assets/figma/hero-doctor.png',
  badge1: '/assets/figma/badge-photo-1.png',
  badge2: '/assets/figma/badge-photo-2.png',
  a1: '/assets/figma/avatar-stack-1.png',
  a2: '/assets/figma/avatar-stack-2.png',
  a3: '/assets/figma/avatar-stack-3.png',
};

const CREATED = '2025-11-03T09:00:00.000Z';

const doctor = (n: number, o: Record<string, any>) => ({
  id: uuid(NS.doctor, n),
  role: 'DOCTOR',
  registration_status: 'approved',
  password: HASH,
  relationship: 'Self',
  city: 'Dhaka',
  created_at: CREATED,
  updated_at: CREATED,
  ...o,
});

export const DOCTORS = [
  doctor(1, {
    full_name: 'Dr. Sarah Rahman', specialty: 'Cardiologist', degrees: 'MBBS, FCPS (Cardiology), MD',
    bmdc_number: 'DEMO-0001', email: 'sarah.rahman@example.test', phone: '01000000001', gender: 'Female', age: 41,
    image_url: PHOTOS.d2, experience_years: 14, total_patients: 5200, rating: 4.8,
    about: 'Consultant cardiologist focused on preventive cardiology, hypertension and heart-failure follow-up. Runs an evening chamber at Demo Central Hospital and a weekend clinic at Lakeview Medical Centre.',
  }),
  doctor(2, {
    full_name: 'Dr. Imran Chowdhury', specialty: 'Dermatologist', degrees: 'MBBS, BCS (Health), MD (Dermatology)',
    bmdc_number: 'DEMO-0002', email: 'imran.chowdhury@example.test', phone: '01000000002', gender: 'Male', age: 38,
    image_url: PHOTOS.d1, experience_years: 11, total_patients: 3900, rating: 4.6,
    about: 'Skin, hair and nail specialist with a special interest in acne, eczema and pigmentation disorders.',
  }),
  doctor(3, {
    full_name: 'Dr. Nusrat Jahan', specialty: 'Dentist', degrees: 'BDS, MDS (Orthodontics)',
    bmdc_number: 'DEMO-0003', email: 'nusrat.jahan@example.test', phone: '01000000003', gender: 'Female', age: 34,
    image_url: PHOTOS.d3, experience_years: 8, total_patients: 2600, rating: 4.7,
    about: 'Family dentist offering braces, root-canal treatment and cosmetic dentistry.',
  }),
  doctor(4, {
    full_name: 'Dr. Tanvir Ahmed', specialty: 'Neurologist', degrees: 'MBBS, FCPS (Medicine), MD (Neurology)',
    bmdc_number: 'DEMO-0004', email: 'tanvir.ahmed@example.test', phone: '01000000004', gender: 'Male', age: 46,
    image_url: PHOTOS.d2, experience_years: 18, total_patients: 6100, rating: 4.9,
    about: 'Neurologist treating migraine, epilepsy, stroke recovery and movement disorders.',
  }),
  doctor(5, {
    full_name: 'Dr. Farhana Islam', specialty: 'Orthopedics', degrees: 'MBBS, MS (Orthopedic Surgery)',
    bmdc_number: 'DEMO-0005', email: 'farhana.islam@example.test', phone: '01000000005', gender: 'Female', age: 43,
    image_url: PHOTOS.hero, experience_years: 15, total_patients: 4800, rating: 4.5,
    about: 'Orthopedic surgeon for joint replacement, sports injuries and spine care.',
  }),
  doctor(6, {
    full_name: 'Dr. Kamal Hossain', specialty: 'Pediatrician', degrees: 'MBBS, DCH, FCPS (Pediatrics)',
    bmdc_number: 'DEMO-0006', email: 'kamal.hossain@example.test', phone: '01000000006', gender: 'Male', age: 50,
    image_url: PHOTOS.d1, experience_years: 21, total_patients: 9300, rating: 4.9,
    about: 'Child specialist covering newborn care, vaccination, growth monitoring and childhood asthma.',
  }),
  doctor(7, {
    full_name: 'Dr. Shirin Akter', specialty: 'Gynecologist', degrees: 'MBBS, FCPS (Obs & Gynae)',
    bmdc_number: 'DEMO-0007', email: 'shirin.akter@example.test', phone: '01000000007', gender: 'Female', age: 45,
    image_url: PHOTOS.d3, experience_years: 17, total_patients: 7000, rating: 4.7,
    about: 'Obstetrician and gynecologist: antenatal care, PCOS and minimally invasive surgery.',
  }),
  doctor(8, {
    full_name: 'Dr. Rashed Karim', specialty: 'ENT Specialist', degrees: 'MBBS, MS (ENT)',
    bmdc_number: 'DEMO-0008', email: 'rashed.karim@example.test', phone: '01000000008', gender: 'Male', age: 39,
    image_url: PHOTOS.badge1, experience_years: 10, total_patients: 3100, rating: 4.4,
    about: 'Ear, nose and throat specialist; sinus disease, hearing loss and tonsil surgery.',
  }),
  doctor(9, {
    full_name: 'Dr. Meher Sultana', specialty: 'Medicine Specialist', degrees: 'MBBS, FCPS (Medicine)',
    bmdc_number: 'DEMO-0009', email: 'meher.sultana@example.test', phone: '01000000009', gender: 'Female', age: 42,
    image_url: PHOTOS.d2, experience_years: 13, total_patients: 5600, rating: 4.6,
    about: 'Internal medicine: diabetes, thyroid, fever work-ups and chronic disease management.',
  }),
  doctor(10, {
    full_name: 'Dr. Zahid Alam', specialty: 'Surgeon', degrees: 'MBBS, FCPS (Surgery)',
    bmdc_number: 'DEMO-0010', email: 'zahid.alam@example.test', phone: '01000000010', gender: 'Male', age: 48,
    image_url: PHOTOS.badge2, experience_years: 19, total_patients: 4200, rating: 4.3,
    about: 'General and laparoscopic surgeon; hernia, gallbladder and appendix procedures.',
  }),
  // Awaiting Super Admin approval (shows up in admin queues; hidden from patient search).
  doctor(11, {
    full_name: 'Dr. Anika Tabassum', specialty: 'Psychiatrist', degrees: 'MBBS, MD (Psychiatry)',
    bmdc_number: 'DEMO-0011', email: 'anika.tabassum@example.test', phone: '01000000011', gender: 'Female', age: 36,
    image_url: '', experience_years: 6, total_patients: 0, rating: 5, registration_status: 'pending',
    id_photo_url: '/assets/figma/badge-photo-1.png',
    about: 'Passionate healthcare provider.',
  }),
] as Record<string, any>[];

const patient = (n: number, o: Record<string, any>) => ({
  id: uuid(NS.patient, n),
  role: 'PATIENT',
  registration_status: 'approved',
  password: HASH,
  relationship: 'Self',
  city: 'Dhaka',
  created_at: CREATED,
  updated_at: CREATED,
  ...o,
});

export const PATIENTS = [
  patient(1, { full_name: 'Nadia Karim', email: 'nadia.karim@example.test', phone: '01000000101', age: 32, gender: 'Female', image_url: PHOTOS.a1 }),
  patient(2, { full_name: 'Rafiq Uddin', email: 'rafiq.uddin@example.test', phone: '01000000102', age: 54, gender: 'Male', image_url: PHOTOS.a2 }),
  patient(3, { full_name: 'Sumaiya Begum', email: 'sumaiya.begum@example.test', phone: '01000000103', age: 28, gender: 'Female', image_url: PHOTOS.a3 }),
  patient(4, { full_name: 'Jahid Hasan', email: 'jahid.hasan@example.test', phone: '01000000104', age: 41, gender: 'Male', image_url: '' }),
  patient(5, { full_name: 'Mitu Akhter', email: 'mitu.akhter@example.test', phone: '01000000105', age: 36, gender: 'Female', image_url: '' }),
  patient(6, { full_name: 'Sohel Rana', email: 'sohel.rana@example.test', phone: '01000000106', age: 62, gender: 'Male', image_url: '' }),
  patient(7, { full_name: 'Tania Sharmin', email: 'tania.sharmin@example.test', phone: '01000000107', age: 24, gender: 'Female', image_url: '' }),
  patient(8, { full_name: 'Arif Mahmud', email: 'arif.mahmud@example.test', phone: '01000000108', age: 47, gender: 'Male', image_url: '' }),
  patient(9, { full_name: 'Lipi Khatun', email: 'lipi.khatun@example.test', phone: '01000000109', age: 58, gender: 'Female', image_url: '' }),
  patient(10, { full_name: 'Babul Mia', email: 'babul.mia@example.test', phone: '01000000110', age: 33, gender: 'Male', image_url: '' }),
  patient(11, { full_name: 'Farzana Yasmin', email: 'farzana.yasmin@example.test', phone: '01000000111', age: 39, gender: 'Female', image_url: '' }),
  patient(12, { full_name: 'Masud Parvez', email: 'masud.parvez@example.test', phone: '01000000112', age: 29, gender: 'Male', image_url: '' }),
] as Record<string, any>[];

export const HOSPITAL_IDS = {
  central: uuid(NS.hospital, 1),
  lakeview: uuid(NS.hospital, 2),
  riverside: uuid(NS.hospital, 3),
};
export const BRANCH_IDS = {
  centralMain: uuid(NS.branch, 1),
  centralNorth: uuid(NS.branch, 2),
  lakeviewMain: uuid(NS.branch, 3),
  riversideMain: uuid(NS.branch, 4),
};

export const ADMINS = [
  {
    id: uuid(NS.admin, 1), full_name: 'Demo Super Admin', role: 'SUPER_ADMIN', registration_status: 'approved', password: HASH,
    email: 'superadmin@example.test', phone: '01000000901', created_at: CREATED, updated_at: CREATED,
  },
  {
    id: uuid(NS.admin, 2), full_name: 'Demo Hospital Admin', role: 'HOSPITAL_ADMIN', registration_status: 'approved', password: HASH,
    email: 'hospital.admin@example.test', phone: '01000000902', created_at: CREATED, updated_at: CREATED,
  },
  {
    id: uuid(NS.admin, 3), full_name: 'Demo Branch Manager', role: 'BRANCH_MANAGER', registration_status: 'approved', password: HASH,
    email: 'branch.manager@example.test', phone: '01000000903', branch_id: BRANCH_IDS.centralMain, created_at: CREATED, updated_at: CREATED,
  },
  {
    // Doctor's assistant: logs in with phone (see AuthContext), scoped to Dr. Sarah Rahman via parent_id.
    id: uuid(NS.admin, 4), full_name: 'Demo Assistant', role: 'ASSISTANT', registration_status: 'approved', password: HASH,
    phone: '01000000904', parent_id: uuid(NS.doctor, 1), permissions: { manage_queue: true, manage_appointments: true },
    created_at: CREATED, updated_at: CREATED,
  },
  // One HOSPITAL_ADMIN per hospital: useHospitalAdminData does `.eq('owner_id', me).single()`, so an admin may own exactly one.
  ...[['Lakeview', 5], ['Riverside', 6], ['Harbor City', 7]].map(([name, n]) => ({
    id: uuid(NS.admin, n as number), full_name: `${name} Hospital Admin`, role: 'HOSPITAL_ADMIN', registration_status: 'approved', password: HASH,
    email: `${String(name).toLowerCase().replace(/\s+/g, '.')}.admin@example.test`, phone: `0100000091${n}`, created_at: CREATED, updated_at: CREATED,
  })),
] as Record<string, any>[];

export const PROFILES: Record<string, any>[] = [...ADMINS, ...DOCTORS, ...PATIENTS];
export const DOCTOR_ID = DOCTORS[0].id as string;
export const PATIENT_ID = PATIENTS[0].id as string;
