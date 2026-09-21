/**
 * "Queue List" side panel (Figma Queue Card 255:9358, 363x801): opens from "View All (N)", docked top-right on a 25% black scrim,
 * slides in from the right edge in 300ms EASE_OUT (`ds-drawer-in`, Figma OVERLAY MOVE_IN 0.3s), closes on scrim click / Esc / the X button.
 * Rows = avatar + name + sub-line + Serial No.; selecting a row opens that patient's record (caller decides).
 * Additions Figma has no frame for (existing features): the status filter chips and "Export Queue List".
 * <QueueListPanel appointments filterStatus onFilter onSelect onClose onExport />
 */
import React, { useEffect, useRef } from 'react';
import type { Appointment, AppointmentStatus } from '../../../types';
import { DashboardButton, MaskIcon, DS_ICONS } from '../../dashboard';
import { PatientAvatar, AvatarTone } from './PatientAvatar';
import { statusLabelOf } from './queueUtils';

export const QUEUE_FILTERS = ['all', 'waiting', 'late', 'completed', 'cancelled'] as const;

interface QueueListPanelProps {
  appointments: Appointment[];
  filterStatus: AppointmentStatus | 'all';
  onFilter: (status: AppointmentStatus | 'all') => void;
  onSelect: (appointmentId: string) => void;
  onClose: () => void;
  onExport: () => void;
}

const avatarTone = (a: Appointment): AvatarTone =>
  a.isReserved || a.status === 'completed' || a.status === 'cancelled' ? 'muted' : a.status === 'late' ? 'late' : 'default';

export const QueueListPanel: React.FC<QueueListPanelProps> = ({ appointments, filterStatus, onFilter, onSelect, onClose, onExport }) => {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ds-fade-in fixed inset-0 z-[200] bg-black/25" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Queue List"
        tabIndex={-1}
        // Figma shadow -4px 0 12px 4% (cast to the left of a right-docked panel); to-ink-200 = #f2f2f2 gradient end.
        className="ds-drawer-in absolute bottom-4 right-4 top-4 flex w-[363px] max-w-[calc(100vw-2rem)] flex-col gap-6 overflow-clip rounded-3xl bg-gradient-to-b from-white to-ink-200 p-4 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] outline-none"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-ds-title-24 font-normal text-ink-800">Queue List</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue list"
            className="grid size-10 place-items-center rounded-full bg-white text-steel shadow-ds-pill cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <MaskIcon src={DS_ICONS.close} size={11.5} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {QUEUE_FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => onFilter(f)}
              aria-pressed={filterStatus === f}
              className={`rounded-full border px-2.5 py-1.5 font-display text-ds-small capitalize cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${filterStatus === f ? 'border-primary-500 text-primary-500' : 'border-surface text-content-secondary'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          {appointments.length > 0 ? appointments.map(app => {
            const title = app.isReserved ? 'Reserved Slot' : app.patientName;
            const sub = app.isReserved ? 'Restricted Action' : `${app.patientPhone} · ${statusLabelOf(app.status)}`;
            return (
              <li key={app.id}>
                <button
                  type="button"
                  onClick={() => onSelect(app.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-ds-sm text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <PatientAvatar name={title} size={48} tone={avatarTone(app)} />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className={`truncate font-display text-[16px] leading-[normal] ${app.status === 'cancelled' ? 'text-steel line-through' : app.isReserved ? 'text-steel italic' : 'text-ink-800'}`}>{title}</span>
                      <span className="truncate font-display text-ds-small text-steel">{sub}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display text-ds-small text-steel">Serial No.</span>
                    <span className="font-display text-ds-title-24 text-ink-800">{app.serialNumber}</span>
                  </span>
                </button>
              </li>
            );
          }) : (
            <li className="py-10 text-center font-display text-ds-body text-steel">No appointments found matching this filter.</li>
          )}
        </ul>

        <DashboardButton variant="monochrome" icon={false} onClick={onExport} className="w-full shrink-0">Export Queue List</DashboardButton>
      </aside>
    </div>
  );
};
