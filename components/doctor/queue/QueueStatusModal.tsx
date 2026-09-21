/**
 * "Queue Status" modal (Figma Card 3 368:15791, 447x420): Set Availability (Arrived / Inactive tabs), Set Arrival Delay
 * (HH : MM boxes + preset chips) and Go Back / Yes, Update. Opens on a 25% black scrim (DISSOLVE 300ms EASE_OUT), closes on scrim / Esc / Go Back.
 * Presentational: the caller owns the delay state and the handlers (Arrived = existing arrive action, Inactive = existing away action,
 * Yes, Update = existing "set delay" save). The +/- 5 min steppers keep the old stepper affordance the Figma boxes do not draw.
 * <QueueStatusModal isArrived delayMinutes presets isSaving onArrived onAway onDelayChange onConfirm onClose />
 */
import React, { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { DashboardButton } from '../../dashboard';

const MAX_DELAY = 480;
const clampDelay = (n: number) => Math.max(0, Math.min(MAX_DELAY, n));

interface QueueStatusModalProps {
  isArrived: boolean;
  delayMinutes: number;
  presets: readonly number[];
  isSaving?: boolean;
  saveDisabled?: boolean;
  onArrived: () => void;
  onAway: () => void;
  onDelayChange: (minutes: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const boxCls = 'size-[72px] rounded-3xl bg-page p-1 text-center font-display text-ds-h36 text-ink-800 outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
const stepCls = 'grid size-8 shrink-0 place-items-center rounded-full bg-ink-50 text-content-secondary cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';
const tabCls = 'rounded-full px-4 py-3 font-inter text-[12px] leading-[normal] cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';

export const QueueStatusModal: React.FC<QueueStatusModalProps> = ({
  isArrived, delayMinutes, presets, isSaving, saveDisabled, onArrived, onAway, onDelayChange, onConfirm, onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hours = Math.floor(delayMinutes / 60);
  const minutes = delayMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const setHours = (h: number) => onDelayChange(clampDelay(Math.max(0, h) * 60 + minutes));
  const setMinutes = (m: number) => onDelayChange(clampDelay(hours * 60 + Math.max(0, Math.min(59, m))));
  const digits = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
  const stepKeys = (step: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); onDelayChange(clampDelay(delayMinutes + step)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); onDelayChange(clampDelay(delayMinutes - step)); }
  };

  return (
    <div className="ds-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-black/25 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-status-title"
        tabIndex={-1}
        // Figma: white -> primary-50 vertical gradient (#eefff8 literal there), shadow 0 0 6px 6% (drop-shadow) = ds-queue.
        className="flex max-h-full w-[447px] max-w-full flex-col items-start gap-6 overflow-y-auto rounded-3xl p-6 shadow-ds-queue outline-none bg-[linear-gradient(180deg,#fff_71.19%,rgb(var(--color-primary-50))_100.07%)]"
      >
        <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xl">
          <h2 id="queue-status-title" className="w-full font-display text-ds-title-20 font-normal text-content-primary">Queue Status</h2>
          <p className="w-full font-display text-ds-small text-content-tertiary">Manage all your queues and get ready for the next ones </p>
        </div>

        <div className="flex w-full items-center gap-[10px]">
          <p className="min-w-0 flex-1 font-display text-ds-subtitle text-content-primary">Set Availability</p>
          <div role="radiogroup" aria-label="Set availability" className="flex shrink-0 items-center justify-center gap-1 rounded-[20px] bg-page px-2 py-1">
            <button type="button" role="radio" aria-checked={isArrived} onClick={onArrived} className={`${tabCls} ${isArrived ? 'bg-primary-500 font-semibold text-white' : 'text-ink-600'}`}>Arrived</button>
            <button type="button" role="radio" aria-checked={!isArrived} onClick={onAway} className={`${tabCls} ${!isArrived ? 'bg-primary-500 font-semibold text-white' : 'text-ink-600'}`}>Inactive</button>
          </div>
        </div>

        <p className="w-full font-display text-ds-subtitle text-content-primary">Set Arrival Delay</p>

        <div className="flex w-full items-center justify-center gap-[10px]">
          <button type="button" onClick={() => onDelayChange(clampDelay(delayMinutes - 5))} aria-label="Decrease delay by 5 minutes" className={stepCls}><Minus size={14} /></button>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Delay hours"
            value={pad(hours)}
            onFocus={e => e.currentTarget.select()}
            onChange={e => setHours(digits(e.target.value))}
            onKeyDown={stepKeys(60)}
            className={boxCls}
          />
          <span aria-hidden="true" className="font-display text-ds-h36 text-ink-800">:</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Delay minutes"
            value={pad(minutes)}
            onFocus={e => e.currentTarget.select()}
            onChange={e => setMinutes(digits(e.target.value))}
            onKeyDown={stepKeys(5)}
            className={boxCls}
          />
          <button type="button" onClick={() => onDelayChange(clampDelay(delayMinutes + 5))} aria-label="Increase delay by 5 minutes" className={stepCls}><Plus size={14} /></button>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {presets.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onDelayChange(v)}
              aria-pressed={delayMinutes === v}
              className={`rounded-3xl border px-3 py-2 font-display text-ds-body cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${delayMinutes === v ? 'border-primary-500 text-primary-500' : 'border-surface text-content-secondary'}`}
            >
              {v} mins
            </button>
          ))}
        </div>

        <div className="flex w-full items-start gap-[10px]">
          <DashboardButton variant="secondary" icon={false} onClick={onClose} className="!bg-white !text-steel w-[121px] shrink-0">Go Back</DashboardButton>
          <DashboardButton variant="primary" icon={false} onClick={onConfirm} disabled={isSaving || saveDisabled} className="min-w-0 flex-1">{isSaving ? 'Updating…' : 'Yes, Update'}</DashboardButton>
        </div>
      </div>
    </div>
  );
};
