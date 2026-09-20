/**
 * Who you are logged in as for each `?as=` value. Pure data (imported by vite.mock.config.ts at
 * config time to build the inline session-bootstrap script) — do not import browser-only code here.
 *
 * The shape mirrors what AuthContext.login() stores: the profiles row minus `password`, plus the
 * `name` / `imageUrl` / `image` aliases, and the role.
 */
import { ADMINS, DOCTORS, PATIENTS } from './fixtures/people';

type Profile = Record<string, any>;

const toSession = (row: Profile): Profile => {
  const { password: _pw, ...rest } = row;
  return { ...rest, name: row.full_name, imageUrl: row.image_url, image: row.image_url, chambers: [] };
};

export interface Identity {
  /** localStorage key read by storage.ts */
  storageKey: string;
  session: Profile;
  /** Default landing path when you open `/` with this identity (App.tsx redirects automatically for doctor/patient/assistant). */
  landing: string;
}

export const IDENTITIES: Record<string, Identity> = {
  doctor: { storageKey: 'demo_doctor_session', session: toSession(DOCTORS[0]), landing: '/doctor/dashboard' },
  patient: { storageKey: 'demo_patient_session', session: toSession(PATIENTS[0]), landing: '/patient/home' },
  admin: { storageKey: 'demo_admin_session', session: toSession(ADMINS[0]), landing: '/' },
  hospital: { storageKey: 'demo_admin_session', session: toSession(ADMINS[1]), landing: '/' },
  branch: { storageKey: 'demo_branch_manager_session', session: toSession(ADMINS[2]), landing: '/' },
  assistant: { storageKey: 'demo_assistant_session', session: toSession(ADMINS[3]), landing: '/assistant/dashboard' },
};

/** Every localStorage key that can hold a session (cleared when switching identity). */
export const SESSION_KEYS = Array.from(new Set(Object.values(IDENTITIES).map(i => i.storageKey)));

/** Accepted spellings for `?as=`. */
export const AS_ALIASES: Record<string, string> = {
  doctor: 'doctor', doc: 'doctor',
  patient: 'patient',
  admin: 'admin', superadmin: 'admin', super_admin: 'admin',
  hospital: 'hospital', hospitaladmin: 'hospital', hospital_admin: 'hospital',
  branch: 'branch', branchmanager: 'branch', branch_manager: 'branch',
  assistant: 'assistant',
  guest: 'guest', none: 'guest', logout: 'guest', out: 'guest',
};
