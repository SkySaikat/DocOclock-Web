import React from 'react';
import { AppointmentStatus, Appointment } from '../../types';
import { generateGoogleCalendarLink, downloadICS } from '../../utils/calendar';
import { MaskIcon } from '../dashboard/MaskIcon';
import { DS_ICONS } from '../dashboard/assets';
import { CalendarDays, MapPin, Radio, Stethoscope } from 'lucide-react';

interface AppointmentCardProps {
    appointment: {
        id?: string;
        patientName: string;
        doctorName: string;
        doctorSpecialty?: string;
        hospitalName: string;
        chamberLocation?: string;
        category?: string;
        date: string;
        time: string;
        serialNumber?: number;
        fee?: number;
        status: AppointmentStatus;
    };
    onAction?: () => void;
    onTrack?: () => void;
    onReview?: () => void;
}

const ICON = '/assets/figma/patient-live-appts/';

// Figma status chips (Appointments 191:5570, 339:17082 family): 12px Instrument Sans + 12px glyph.
// Fixed semantic colours on purpose (status colours are allowed literals, docs/figma/tokens.md).
const STATUS_CHIP: Record<AppointmentStatus, { label: string; icon: string; className: string }> = {
    waiting: { label: 'Upcoming', icon: 'status-time.svg', className: 'text-[#4c8cdb]' },
    consulting: { label: 'Ongoing', icon: 'status-time.svg', className: 'text-[#4c8cdb]' },
    completed: { label: 'Completed', icon: 'status-check.svg', className: 'text-[#24b565]' },
    cancelled: { label: 'Cancelled', icon: 'status-close.svg', className: 'text-[#ed7272]' },
    late: { label: 'Late', icon: 'status-no-show.svg', className: 'text-[#7e7e7e]' },
};

export const StatusChip: React.FC<{ status: AppointmentStatus; className?: string }> = ({ status, className = '' }) => {
    const chip = STATUS_CHIP[status] ?? STATUS_CHIP.waiting;
    return (
        <span className={`inline-flex items-center gap-1 rounded-3xl px-2 py-1 font-display text-ds-small ${chip.className} ${className}`}>
            <MaskIcon src={ICON + chip.icon} size={12} />
            {chip.label}
        </span>
    );
};

const PILL = 'inline-flex h-10 items-center whitespace-nowrap justify-center rounded-full px-4 font-display text-[14px] transition-colors duration-ds-fast ease-ds-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';

const fmtCardDate = (d: string) => {
    const dt = new Date(`${d}T00:00:00`);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

// Grid-view card of the patient Appointments page: doctor header with icon tile + status, tinted info tiles, then actions.
export const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onAction,
    onTrack,
    onReview
}) => {
    const isUpcoming = appointment.status === 'waiting' || appointment.status === 'consulting';
    const serial = appointment.serialNumber != null ? `#${appointment.serialNumber.toString().padStart(2, '0')}` : 'N/A';
    return (
        <div className="group flex flex-col gap-5 rounded-ds-lg bg-white p-5 font-display shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100 transition-shadow duration-ds-fast ease-ds-out hover:shadow-ds-pill">
            <div className="flex items-start gap-4">
                <span className={`grid size-12 sm:size-14 shrink-0 place-items-center rounded-2xl ${isUpcoming ? 'bg-primary-50 text-primary-600' : 'bg-ink-50 text-content-secondary'}`}>
                    <Stethoscope size={26} />
                </span>
                <div className="min-w-0 flex-1">
                    <h4 className="break-words text-[20px] font-semibold leading-tight text-content-primary">{appointment.doctorName}</h4>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-content-tertiary">{appointment.doctorSpecialty || 'Specialist Consultation'}</p>
                    <StatusChip status={appointment.status} className="mt-2 bg-ink-50" />
                </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 font-inter">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-content-tertiary">Date &amp; Time</span>
                    <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
                        <CalendarDays size={18} className="shrink-0 text-primary-500" />
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-[14px] font-semibold text-content-primary">{fmtCardDate(appointment.date)}</p>
                            <p className="text-[13px] text-content-secondary">{appointment.time}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-content-tertiary">Serial</span>
                    <div className={`flex h-full min-w-[84px] items-center justify-center rounded-xl px-3 text-[22px] font-bold ${isUpcoming ? 'bg-primary-50 text-primary-600' : 'bg-ink-50 text-content-primary'}`}>
                        {serial}
                    </div>
                </div>
                <div className="col-span-2 flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
                    <MapPin size={18} className="shrink-0 text-primary-500" />
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-[14px] font-semibold text-content-primary">{appointment.hospitalName}</p>
                        {appointment.chamberLocation && <p className="truncate text-[13px] text-content-secondary">{appointment.chamberLocation}</p>}
                    </div>
                </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2">
                {onTrack && appointment.status === 'waiting' && (
                    <>
                        <button type="button" onClick={onTrack} className={`${PILL} btn-sheen relative basis-full gap-2 overflow-hidden bg-gradient-to-b from-primary-500 to-primary-600 font-semibold text-white`}>
                            <Radio size={16} /> Track Queue
                        </button>
                        <button
                            type="button"
                            onClick={() => downloadICS(appointment as unknown as Appointment)}
                            className={`${PILL} w-10 bg-ink-50 px-0 text-content-secondary hover:bg-primary-50`}
                            title="Download ICS"
                            aria-label="Download ICS"
                        >
                            <MaskIcon src={DS_ICONS.calendar} size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => window.open(generateGoogleCalendarLink(appointment as unknown as Appointment), '_blank')}
                            className={`${PILL} w-10 bg-ink-50 px-0 text-primary-500 hover:bg-primary-50`}
                            title="Add to Google Calendar"
                            aria-label="Add to Google Calendar"
                        >
                            <span className="font-sans text-base font-bold">G</span>
                        </button>
                    </>
                )}

                {onAction && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button
                        type="button"
                        onClick={onAction}
                        className={`${PILL} flex-1 border border-ink-100 bg-white font-semibold ${appointment.status === 'waiting' ? 'text-[#ed7272] hover:bg-[#fdecec]' : 'text-content-secondary'}`}
                    >
                        {appointment.status === 'waiting' ? 'Cancel' : 'Action'}
                    </button>
                )}

                {onReview && appointment.status === 'completed' && (
                    <button type="button" onClick={onReview} className={`${PILL} flex-1 bg-primary-50 font-semibold text-primary-600 hover:bg-primary-100`}>
                        Share Feedback
                    </button>
                )}
            </div>
        </div>
    );
};
