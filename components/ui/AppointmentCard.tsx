import React from 'react';
import { AppointmentStatus, Appointment } from '../../types';
import { generateGoogleCalendarLink, downloadICS } from '../../utils/calendar';
import { MaskIcon } from '../dashboard/MaskIcon';
import { DS_ICONS } from '../dashboard/assets';

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

// Grid-view card of the patient Appointments page, in the dashboard card language (white r24, shadow-ds-rise, label/value pairs).
export const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onAction,
    onTrack,
    onReview
}) => (
    <div className="flex flex-col gap-5 rounded-ds-lg bg-white p-5 font-display shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <h4 className="break-words text-ds-title-20 text-content-primary">{appointment.doctorName}</h4>
                <p className="text-ds-small text-content-tertiary">{appointment.doctorSpecialty || 'Specialist Consultation'}</p>
            </div>
            <StatusChip status={appointment.status} className="shrink-0 bg-ink-50" />
        </div>

        <dl className="grid grid-cols-2 gap-3 font-inter">
            <div className="flex flex-col gap-1">
                <dt className="text-ds-small tracking-[-0.72px] text-content-secondary">Date &amp; Time</dt>
                <dd className="text-[14px] tracking-[-0.28px] text-content-primary">{appointment.date} @ {appointment.time}</dd>
            </div>
            <div className="flex flex-col gap-1">
                <dt className="text-ds-small tracking-[-0.72px] text-content-secondary">Serial</dt>
                <dd className="text-[14px] tracking-[-0.28px] text-content-primary">#{appointment.serialNumber?.toString().padStart(2, '0') || 'N/A'}</dd>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
                <dt className="text-ds-small tracking-[-0.72px] text-content-secondary">Session</dt>
                <dd className="truncate text-[14px] tracking-[-0.28px] text-content-primary">{appointment.hospitalName}</dd>
            </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-2">
            {onTrack && appointment.status === 'waiting' && (
                <>
                    <button type="button" onClick={onTrack} className={`${PILL} btn-sheen relative flex-1 overflow-hidden bg-gradient-to-b from-primary-500 to-primary-600 text-white`}>
                        Track Queue
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
                    className={`${PILL} flex-1 bg-ink-50 ${appointment.status === 'waiting' ? 'text-[#ed7272] hover:bg-[#fdecec]' : 'text-content-secondary'}`}
                >
                    {appointment.status === 'waiting' ? 'Cancel' : 'Action'}
                </button>
            )}

            {onReview && appointment.status === 'completed' && (
                <button type="button" onClick={onReview} className={`${PILL} flex-1 bg-primary-50 text-primary-600 hover:bg-primary-100`}>
                    Share Feedback
                </button>
            )}
        </div>
    </div>
);
