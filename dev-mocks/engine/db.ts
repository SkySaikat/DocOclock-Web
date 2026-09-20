/**
 * In-memory "database" behind the mock Supabase client.
 *
 *  - `store`       table name -> array of rows (plain objects, snake_case columns exactly like Postgres)
 *  - `TABLE_META`  primary keys, unique columns, foreign keys (drives embedded selects like
 *                  `select('*, chambers!doctor_id(*)')`), and per-table insert defaults
 *
 * Nothing here ever touches the network or localStorage: a page reload re-seeds everything.
 */
import type { Row } from './filters';

export interface ForeignKey {
  column: string;
  ref: string;               // referenced table (always by its `id`, unless refColumn given)
  refColumn?: string;
  onDelete?: 'cascade' | 'set null';
}

export interface TableMeta {
  pk: string[];
  unique?: string[];
  fks?: ForeignKey[];
  /** Fill in server-side defaults (uuid ids, timestamps, status columns...). Mutates `row`. */
  defaults?: (row: Row) => void;
  /** Columns bumped by the `update_modified_column` trigger on UPDATE. */
  touchOnUpdate?: string[];
}

const nowIso = () => new Date().toISOString();
export const newId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));

const withId = (row: Row) => { if (row.id == null) row.id = newId(); };
const withCreated = (row: Row) => { if (row.created_at == null) row.created_at = nowIso(); };
const fill = (row: Row, defaults: Row) => {
  for (const [k, v] of Object.entries(defaults)) if (row[k] === undefined) row[k] = typeof v === 'function' ? v() : v;
};

export const TABLE_META: Record<string, TableMeta> = {
  profiles: {
    pk: ['id'],
    unique: ['email', 'phone', 'bmdc_number'],
    fks: [{ column: 'parent_id', ref: 'profiles', onDelete: 'cascade' }],
    touchOnUpdate: ['updated_at'],
    defaults: r => {
      withId(r); withCreated(r);
      fill(r, { role: 'PATIENT', registration_status: 'approved', relationship: 'Self', rating: 5, experience_years: 0, total_patients: 0, updated_at: nowIso });
    },
  },
  hospitals: {
    pk: ['id'],
    fks: [{ column: 'owner_id', ref: 'profiles' }],
    touchOnUpdate: ['updated_at'],
    defaults: r => { withId(r); withCreated(r); fill(r, { updated_at: nowIso }); },
  },
  hospital_branches: {
    pk: ['id'],
    fks: [{ column: 'hospital_id', ref: 'hospitals', onDelete: 'cascade' }, { column: 'manager_id', ref: 'profiles', onDelete: 'set null' }],
    defaults: r => { withId(r); withCreated(r); },
  },
  hospital_sectors: {
    pk: ['id'],
    fks: [{ column: 'hospital_id', ref: 'hospitals', onDelete: 'cascade' }, { column: 'branch_id', ref: 'hospital_branches', onDelete: 'cascade' }],
    defaults: r => { withId(r); withCreated(r); },
  },
  chamber_requests: {
    pk: ['id'],
    fks: [
      { column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' },
      { column: 'hospital_id', ref: 'hospitals', onDelete: 'cascade' },
      { column: 'branch_id', ref: 'hospital_branches', onDelete: 'set null' },
      { column: 'sector_id', ref: 'hospital_sectors', onDelete: 'set null' },
      { column: 'reviewed_by', ref: 'profiles', onDelete: 'set null' },
    ],
    defaults: r => { withId(r); withCreated(r); fill(r, { status: 'pending', proposed_fee: 0 }); },
  },
  chambers: {
    pk: ['id'],
    fks: [
      { column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' },
      { column: 'linked_hospital_id', ref: 'hospitals', onDelete: 'set null' },
      { column: 'branch_id', ref: 'hospital_branches', onDelete: 'set null' },
      { column: 'sector_id', ref: 'hospital_sectors', onDelete: 'set null' },
      { column: 'request_id', ref: 'chamber_requests', onDelete: 'set null' },
    ],
    defaults: r => { withId(r); withCreated(r); fill(r, { consultation_fee: 0, fee_report: 0, daily_booking_limit: 30, status: 'active', consultation_duration_minutes: 0 }); },
  },
  schedules: {
    pk: ['id'],
    fks: [{ column: 'chamber_id', ref: 'chambers', onDelete: 'cascade' }],
    defaults: r => { withId(r); fill(r, { max_patients: 20 }); },
  },
  appointments: {
    pk: ['id'],
    fks: [{ column: 'doctor_id', ref: 'profiles', onDelete: 'set null' }, { column: 'hospital_id', ref: 'chambers', onDelete: 'set null' }],
    touchOnUpdate: ['updated_at'],
    defaults: r => {
      withId(r); withCreated(r);
      fill(r, {
        status: 'waiting', fee: 0, is_reserved: false, is_visible_to_patient: true, category: 'normal',
        has_prescription: false, updated_at: nowIso, visit_type: 'new_patient',
      });
    },
  },
  prescriptions: {
    pk: ['id'],
    fks: [
      { column: 'appointment_id', ref: 'appointments', onDelete: 'set null' },
      { column: 'doctor_id', ref: 'profiles', onDelete: 'set null' },
      { column: 'hospital_id', ref: 'chambers', onDelete: 'set null' },
    ],
    defaults: r => { withCreated(r); },
  },
  prescription_medicines: {
    pk: ['id'],
    fks: [{ column: 'prescription_id', ref: 'prescriptions', onDelete: 'cascade' }],
    defaults: r => { withId(r); },
  },
  queue_sessions: {
    pk: ['doctor_id', 'hospital_id', 'session_date'],
    fks: [{ column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' }, { column: 'hospital_id', ref: 'chambers', onDelete: 'cascade' }],
    defaults: r => { fill(r, { is_doctor_arrived: false, session_status: 'NOT_STARTED', meta_status: 'IDLE', delay_minutes: 0, reserved_slots_count: 0 }); },
  },
  doctor_hospitals: {
    pk: ['doctor_id', 'hospital_id'],
    fks: [
      { column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' },
      { column: 'hospital_id', ref: 'hospitals', onDelete: 'cascade' },
      { column: 'branch_id', ref: 'hospital_branches', onDelete: 'set null' },
      { column: 'sector_id', ref: 'hospital_sectors', onDelete: 'set null' },
    ],
    defaults: r => { fill(r, { is_active: true, joined_at: nowIso }); },
  },
  reviews: {
    pk: ['id'],
    fks: [
      { column: 'patient_id', ref: 'profiles', onDelete: 'cascade' },
      { column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' },
      { column: 'appointment_id', ref: 'appointments', onDelete: 'set null' },
    ],
    defaults: r => { withId(r); withCreated(r); },
  },
  doctor_reviews: {
    pk: ['id'],
    fks: [{ column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' }, { column: 'patient_id', ref: 'profiles', onDelete: 'cascade' }],
    defaults: r => { withId(r); withCreated(r); },
  },
  medicines: {
    pk: ['id'],
    fks: [{ column: 'added_by_doctor_id', ref: 'profiles', onDelete: 'set null' }],
    defaults: r => { withId(r); fill(r, { category: 'General', form: 'Tablet', is_verified: true }); },
  },
  user_medicines: { pk: ['id'], defaults: r => { withId(r); withCreated(r); } },
  notifications: {
    pk: ['id'],
    fks: [{ column: 'recipient_id', ref: 'profiles', onDelete: 'cascade' }],
    defaults: r => { withId(r); withCreated(r); fill(r, { is_read: false, type: 'system' }); },
  },
  hero_banners: { pk: ['id'], defaults: r => { withId(r); withCreated(r); fill(r, { sort_order: 0, is_active: true }); } },
  blog_posts: { pk: ['id'], unique: ['slug'], defaults: r => { withId(r); withCreated(r); fill(r, { is_published: true, published_at: nowIso }); } },
  contact_messages: { pk: ['id'], defaults: r => { withId(r); withCreated(r); } },
  system_settings: { pk: ['key'] },
  theme_settings: { pk: ['id'] },
  pharmacy_stores: { pk: ['id'], defaults: r => { withId(r); withCreated(r); } },
  pharmacy_orders: {
    pk: ['id'],
    fks: [{ column: 'store_id', ref: 'pharmacy_stores' }, { column: 'doctor_id', ref: 'profiles', onDelete: 'set null' }],
    defaults: r => { withId(r); withCreated(r); fill(r, { status: 'pending' }); },
  },
  // Not read by the app today (payments/plan/rewards are derived or static) but seeded so a future
  // screen has data to bind to.
  subscriptions: { pk: ['id'], fks: [{ column: 'doctor_id', ref: 'profiles', onDelete: 'cascade' }], defaults: r => { withId(r); withCreated(r); } },
  payments: { pk: ['id'], fks: [{ column: 'appointment_id', ref: 'appointments', onDelete: 'set null' }], defaults: r => { withId(r); withCreated(r); } },
  reward_points: { pk: ['id'], defaults: r => { withId(r); withCreated(r); } },
  email_otps: { pk: ['id'], defaults: r => { withId(r); withCreated(r); } },
  login_attempts: { pk: ['identifier'] },
  audit_logs: { pk: ['id'], defaults: r => { withId(r); withCreated(r); } },
};

export const store: Record<string, Row[]> = {};

export const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function table(name: string): Row[] {
  return store[name] ?? (store[name] = []);
}

export function metaFor(name: string): TableMeta {
  return TABLE_META[name] ?? { pk: ['id'], defaults: (r: Row) => { withId(r); withCreated(r); } };
}

/** Replace the whole store with fresh seed data (deep-cloned). */
export function seedStore(seed: Record<string, Row[]>): void {
  for (const k of Object.keys(store)) delete store[k];
  for (const [name, rows] of Object.entries(seed)) store[name] = clone(rows);
}

/** Cascade / set-null bookkeeping after rows are deleted from `name`. */
export function applyDeleteCascades(name: string, removed: Row[]): void {
  if (!removed.length) return;
  for (const [childName, meta] of Object.entries(TABLE_META)) {
    for (const fk of meta.fks ?? []) {
      if (fk.ref !== name || !fk.onDelete) continue;
      const refCol = fk.refColumn ?? 'id';
      const gone = new Set(removed.map(r => String(r[refCol])));
      const rows = table(childName);
      if (fk.onDelete === 'cascade') {
        const doomed = rows.filter(r => r[fk.column] != null && gone.has(String(r[fk.column])));
        if (doomed.length) {
          store[childName] = rows.filter(r => !doomed.includes(r));
          applyDeleteCascades(childName, doomed);
        }
      } else {
        rows.forEach(r => { if (r[fk.column] != null && gone.has(String(r[fk.column]))) r[fk.column] = null; });
      }
    }
  }
}
