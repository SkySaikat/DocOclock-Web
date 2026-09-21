/**
 * Pure helpers for the doctor Queue screen (Figma "Doctor Q", docs/figma/specs/doctor-queue.md).
 * No state, no effects, no data access: formatting + the status-sheet option builder used by views/doctor/SerialManager.tsx.
 */
import type { Appointment, AppointmentStatus } from '../../../types';
import type { StatusOption } from '../../dashboard';

/** Figma "Rate" bar = 25 rounded segments. */
export const SEGMENT_COUNT = 25;

/** "09:00 PM" (Figma clock, 2-digit hour). */
export const formatClock = (d: Date): string => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

/** "10:30 am" (Figma "Started" value); an em dash when the time is unknown. */
export const formatStarted = (ms?: number | null): string =>
  ms ? new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase() : '—';

/** "12 mins" (Figma "Elapsed" / "Session" values). */
export const formatMins = (n: number): string => `${n} min${n === 1 ? '' : 's'}`;

/** Whole minutes between two timestamps (never negative). */
export const minutesBetween = (fromMs: number, toMs: number): number => Math.max(0, Math.floor((toMs - fromMs) / 60000));

/** Two initials for the avatar circle (appointments carry no patient photo). */
export const initialsOf = (name: string): string =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || '?';

/**
 * Split `total` bar segments between groups in proportion to `counts` (largest remainder).
 * Every non-empty group keeps at least one segment so a single cancelled patient is still visible.
 */
export function allocateSegments(counts: number[], total: number = SEGMENT_COUNT): number[] {
  const sum = counts.reduce((a, b) => a + b, 0);
  if (sum <= 0) return counts.map(() => 0);
  const raw = counts.map(c => (c / sum) * total);
  const seg = raw.map(r => Math.floor(r));
  counts.forEach((c, i) => { if (c > 0 && seg[i] === 0) seg[i] = 1; });
  let diff = total - seg.reduce((a, b) => a + b, 0);
  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .filter(o => counts[o.i] > 0)
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; diff > 0 && byRemainder.length > 0; k++, diff--) seg[byRemainder[k % byRemainder.length].i]++;
  // The "at least one" rule can overshoot: take segments back from the largest groups (never below one).
  while (diff < 0) {
    let idx = -1;
    seg.forEach((s, i) => { if (s > 1 && (idx < 0 || s > seg[idx])) idx = i; });
    if (idx < 0) break;
    seg[idx]--;
    diff++;
  }
  return seg;
}

export type CardTone = 'arrived' | 'late' | 'cancelled';

/** User Card colourway for an appointment status (Figma: Arrived white / Late sage / Cancelled muted chip label). */
export const toneOf = (status: AppointmentStatus): CardTone => (status === 'late' ? 'late' : status === 'cancelled' ? 'cancelled' : 'arrived');

/** Chip label. `waiting` reads "Arrived" (Figma: the patient is in the queue). */
export const statusLabelOf = (status: AppointmentStatus): string =>
  ({ waiting: 'Arrived', consulting: 'Consulting', completed: 'Completed', cancelled: 'Cancelled', late: 'Late' } as Record<AppointmentStatus, string>)[status];

/** A reserved slot that has not been assigned to a patient yet (real or virtual). */
export const isOpenReservedSlot = (a: Appointment): boolean => !!a.isReserved && a.patientId === 'RESERVED';

/**
 * Options of the "Update Status" sheet (shared StatusUpdateModal) for one queue row.
 * Only transitions storage.upsertAppointment allows are offered (waiting -> consulting|late|cancelled, late -> consulting|cancelled,
 * consulting -> completed); reserved slots get their three existing actions. `[]` = nothing to change (completed / cancelled).
 */
export function buildStatusOptions(app: Appointment): { options: StatusOption[]; value?: string } {
  if (isOpenReservedSlot(app)) {
    const options: StatusOption[] = [{ id: 'assign', title: 'Assign Patient', description: 'Register a walk-in for this slot' }];
    if (app.status === 'waiting') options.push({ id: 'push-late', title: 'Push to Late', description: 'Move this slot to the late list' });
    options.push({ id: 'release', title: 'Release to Public', description: 'Give this slot back to online booking' });
    return { options };
  }
  switch (app.status) {
    case 'waiting':
      return {
        value: 'waiting',
        options: [
          { id: 'consulting', title: 'Consulting', description: 'Start the consultation now' },
          { id: 'late', title: 'Late', description: "Patient hasn't arrived" },
          { id: 'waiting', title: 'Arrived', description: 'Patient has arrived' },
          { id: 'cancelled', title: 'Cancelled', description: 'Patient has cancelled' },
        ],
      };
    case 'late':
      return {
        value: 'late',
        options: [
          { id: 'consulting', title: 'Consulting', description: 'Start the consultation now' },
          { id: 'late', title: 'Late', description: "Patient hasn't arrived" },
          { id: 'cancelled', title: 'Cancelled', description: 'Patient has cancelled' },
        ],
      };
    case 'consulting':
      return {
        value: 'consulting',
        options: [
          { id: 'consulting', title: 'Consulting', description: 'Patient is with the doctor' },
          { id: 'completed', title: 'Completed', description: 'Consultation finished' },
        ],
      };
    default:
      return { options: [] };
  }
}
