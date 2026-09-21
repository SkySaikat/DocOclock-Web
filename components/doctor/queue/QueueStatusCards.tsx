/**
 * The big left card of the Queue screen in its three states (Figma Queue Manage Row):
 *  - <LiveQueueCard/>   LIVE 368:14312 (524x341): Live tag, current patient, Started / Elapsed / Session, Serial No., Prescribe & End + End session
 *  - <IdleQueueCard/>   same shell with no consulting patient (no Figma frame): "No Active Patient" + the Consult Next call to action
 *  - <PausedQueueCard/> PAUSED 328:14902 (384x238): orange "Paused" tag + "Available in N Mins", plus the resume button that fills
 *                       Figma's hidden `Buttons - Dashboard` slot (368:16081)
 * Presentational: every action is a callback owned by views/doctor/SerialManager.tsx. Only the "elapsed minutes" tick is local.
 */
import React, { useEffect, useState } from 'react';
import { DashboardButton, MaskIcon, DS_ICONS, DsText } from '../../dashboard';
import { PatientAvatar } from './PatientAvatar';
import { formatMins, formatStarted, minutesBetween } from './queueUtils';

// 524px in Figma; shrinks (down to 400) so the 524 + 412 (+ 308 Availability) row never overflows a narrow desktop.
const SHELL = 'relative flex flex-col justify-between gap-6 overflow-clip rounded-ds-xl p-6 shadow-ds-queue w-full min-h-[341px] lg:w-auto lg:basis-[524px] lg:shrink lg:min-w-[400px]';
// Figma stop #eefff8 is a literal; derived from the theme's primary-50 so the card follows Branding.
const LIVE_BG = 'bg-[linear-gradient(218.36deg,rgb(var(--color-primary-50))_2.25%,#fff_54.4%)]';
const PILL_SOFT = 'inline-flex items-center justify-center h-10 rounded-full bg-ink-50 px-3 py-1 font-display text-[16px] leading-[normal] whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';

function useNowMs(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** "Live" tag: 17px ring dot + 20px label (Group 1000009032). Off duty = neutral dot. */
const StatusTag: React.FC<{ live: boolean }> = ({ live }) => (
  <div className="flex items-center justify-center gap-1 self-start">
    <span aria-hidden="true" className={`grid size-[17px] place-items-center rounded-full border ${live ? 'bg-primary-200 border-primary-100' : 'bg-ink-200 border-ink-100'}`}>
      <span className={`size-[11px] rounded-full ${live ? 'bg-primary-500' : 'bg-ink-400'}`} />
    </span>
    {/* Phone frames (341:18476, App 569:19676) label the tag "Live Queue"; the desktop frame says "Live". */}
    <span className={`font-display text-ds-title-20 ${live ? 'text-primary-500' : 'text-content-tertiary'}`}>{live ? <>Live<span className="sm:hidden"> Queue</span></> : 'Off Duty'}</span>
  </div>
);

// `suffix` = "(approx.)": plain 20px on desktop (368:14306), small italic on phone (368:17738) so all three columns fit in 320px.
const InfoCol: React.FC<{ label: string; value: string; suffix?: string }> = ({ label, value, suffix }) => (
  <div className="flex flex-col justify-center gap-2">
    <span className="font-display text-ds-body text-ink-600">{label}</span>
    <span className="font-display text-ds-title-20 text-content-primary whitespace-nowrap">
      {value}
      {suffix && <span className="ml-1 text-ds-small italic text-content-secondary sm:text-ds-title-20 sm:not-italic sm:text-content-primary">{suffix}</span>}
    </span>
  </div>
);

/** Figma `Verified` 368:14346: 154x40 gradient pill, label + white tick, decorative yellow-green glow top right. */
const EndSessionButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn-sheen relative inline-flex h-10 items-center justify-center overflow-clip rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-3 py-1 font-display text-[16px] leading-[normal] text-white whitespace-nowrap cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
  >
    {/* Figma `Ellipse 75` (55x55, layer blur 55.2): decorative and brand-independent on purpose (tokens.md §1.2). The SVG export says
        27.6px, but Figma's own render is tighter (measured peak alpha .48 vs .39), so 24px matches the reference PNG. */}
    <span aria-hidden="true" className="pointer-events-none absolute left-[120px] -top-[15px] size-[55px] rounded-full bg-[#e6dc9e] blur-[24px]" />
    <span className="relative -mr-[14px] px-3">End session</span>
    <span aria-hidden="true" className="relative grid size-8 place-items-center"><MaskIcon src={DS_ICONS.tick} size={12.718} /></span>
  </button>
);

interface LiveQueueCardProps {
  isArrived: boolean;
  name: string;
  subtitle: string;
  serialNo: number | string;
  startedAt: number | null;
  avgSessionMins: number | null;
  consultNextDisabled?: boolean;
  consultNextLabel?: string;
  onOpenRecords: () => void;
  onPrescribe: () => void;
  onConsultNext: () => void;
  onEndSession: () => void;
  className?: string;
}

export const LiveQueueCard: React.FC<LiveQueueCardProps> = ({
  isArrived, name, subtitle, serialNo, startedAt, avgSessionMins,
  consultNextDisabled, consultNextLabel = 'Consult Next', onOpenRecords, onPrescribe, onConsultNext, onEndSession, className = '',
}) => {
  const now = useNowMs();
  return (
    <section aria-label="Current patient" className={`${SHELL} ${LIVE_BG} ${className}`}>
      {/* Figma `top` (253px): [Live tag, patient row | Serial No.] then the info row directly under it at full card width (y=135). */}
      <div className="flex flex-1 flex-col items-start gap-9">
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-9">
            <StatusTag live={isArrived} />
            <div className="flex h-[43px] w-full items-center gap-2">
              <PatientAvatar name={name} size={43} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-display text-ds-title-20 text-content-primary truncate">{name}</p>
                <p className="font-display text-ds-small text-content-tertiary truncate">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onOpenRecords}
                aria-label="Open patient records"
                className="size-[42px] shrink-0 grid place-items-center rounded-full border border-ink-200 text-content-secondary cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                <MaskIcon src="/assets/figma/dashboard-components/user-card-icon-arrow-up-right.svg" size={16} />
              </button>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end justify-center">
            <span className="font-display text-ds-small text-primary-500">Serial No.</span>
            <span className="font-display text-ds-display text-primary-500">{serialNo}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <InfoCol label="Started" value={formatStarted(startedAt)} />
          <InfoCol label="Elapsed" value={startedAt ? formatMins(minutesBetween(startedAt, now)) : '—'} />
          <InfoCol label="Session" value={avgSessionMins != null ? formatMins(avgSessionMins) : '—'} suffix={avgSessionMins != null ? '(approx.)' : undefined} />
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2">
        {/* Phone (Figma 569:19676): [Prescribe & End | End session] on one row; "Consult Next" (app-only shortcut) wraps below. */}
        <button type="button" onClick={onPrescribe} className={`${PILL_SOFT} min-w-0 flex-1 basis-0 text-primary-500 sm:min-w-[150px]`}>Prescribe &amp; End</button>
        <button type="button" onClick={onConsultNext} disabled={consultNextDisabled} className={`${PILL_SOFT} text-content-secondary max-sm:order-last max-sm:basis-full sm:min-w-[120px] sm:flex-1`}>{consultNextLabel}</button>
        <EndSessionButton onClick={onEndSession} />
      </div>
    </section>
  );
};

interface IdleQueueCardProps {
  isArrived: boolean;
  hint?: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onConsultNext: () => void;
  className?: string;
}

export const IdleQueueCard: React.FC<IdleQueueCardProps> = ({ isArrived, hint, ctaLabel, ctaDisabled, onConsultNext, className = '' }) => (
  <section aria-label="Current patient" className={`${SHELL} ${LIVE_BG} ${className}`}>
    <div className="flex flex-1 flex-col items-start gap-9">
      <StatusTag live={isArrived} />
      <div className="flex flex-col justify-center gap-2">
        <DsText variant="header" tone="tertiary">No Active Patient</DsText>
        {hint && <DsText variant="subtitle" tone="tertiary">{hint}</DsText>}
      </div>
    </div>
    <DashboardButton variant="gradient" icon={false} onClick={onConsultNext} disabled={ctaDisabled} className="w-full">{ctaLabel}</DashboardButton>
  </section>
);

interface PausedQueueCardProps {
  minutes: number | null;
  resumeLabel: string;
  onResume: () => void;
}

export const PausedQueueCard: React.FC<PausedQueueCardProps> = ({ minutes, resumeLabel, onResume }) => (
  // Orange tint + tag = fixed "paused" status colours (not brand): gradient #fff8ee -> white, label #e66d2b, ring-dot asset.
  <section aria-label="Queue paused" className="flex w-full shrink-0 flex-col gap-6 overflow-clip rounded-ds-xl p-6 shadow-ds-queue md:w-[384px] bg-[linear-gradient(217deg,#fff8ee_2.25%,#fff_54.4%)]">
    <div className="flex items-center justify-center gap-1 self-start">
      <img src="/assets/figma/doctor-queue/status-dot-paused.svg" alt="" width={17} height={17} className="size-[17px]" />
      <span className="font-display text-ds-title-20 text-[#e66d2b]">Paused</span>
    </div>
    <div className="flex flex-col items-center justify-center rounded-[30px] bg-white py-4 text-center font-display">
      <p className="text-ds-small text-content-tertiary">Available in</p>
      <p className="text-ds-display text-content-primary whitespace-nowrap">{minutes ?? '—'}</p>
      <p className="text-ds-body text-content-tertiary">Mins</p>
    </div>
    <DashboardButton variant="primary" icon={false} onClick={onResume} className="w-full">{resumeLabel}</DashboardButton>
  </section>
);
