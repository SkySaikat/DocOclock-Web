/**
 * Helpers shared by all fixture modules: deterministic ids, seeded randomness, local-date math.
 * Fixtures are generated *relative to "now"* in the browser, so "today" always has a live queue
 * and "the last 60 days" always has history no matter when the preview is opened.
 */

export const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** Local YYYY-MM-DD (same convention as utils/date.ts getLocalISODate). */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** "YYYY-MM-DD" for `n` days from today (negative = past). */
export const dayOffset = (n: number) => isoDate(addDays(startOfToday(), n));

/** ISO timestamp for a local date + "HH:mm" (or minutes-from-midnight). */
export function at(dateStr: string, time: string | number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const mins = typeof time === 'number' ? time : hhmmToMinutes(time);
  return new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0, 0).toISOString();
}

export const hhmmToMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
export const minutesToHHMM = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

export const weekday = (dateStr: string) => new Date(dateStr + 'T00:00:00').getDay();
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const hex = (n: number, len: number) => n.toString(16).padStart(len, '0');
/**
 * Deterministic UUID-shaped id. `ns` is 4 hex chars (entity kind), `n` the ordinal.
 * The 2nd segment is also unique per ordinal on purpose: storage.ts derives "family-<segment>" patient ids
 * from it, and those must not collide between two patients.
 */
export const uuid = (ns: string, n: number) => `${ns}${hex(n, 4)}-${hex(n, 4)}-4000-8000-${hex(n, 12)}`;

export const NS = {
  doctor: 'd0c7',
  patient: '9a71',
  admin: 'ad51',
  hospital: '605b',
  branch: 'b4a3',
  sector: '5ec7',
  chamber: 'c4a3',
  schedule: '5c0d',
  appt: 'a99f',
  review: '4e71',
  notif: '2071',
  request: '4e90',
  banner: 'ba22',
  blog: 'b109',
  med: '3ed1',
  userMed: '0e3d',
  sub: '5b5c',
  pay: '9a1d',
  reward: '4e3a',
  store: 'aaaa',
} as const;

/** mulberry32 — small, fast, seedable. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)],
    chance: (p: number) => next() < p,
  };
}

export type Rows = Record<string, any>[];
export type Seed = Record<string, Rows>;
