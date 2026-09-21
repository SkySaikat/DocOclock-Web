/**
 * "It's 09:00 PM" clock + stethoscope badge (Figma Card 4 in Queue Manage Row). `size="lg"` = LIVE (64px), `size="md"` = PAUSED (36px).
 * Owns only its own once-a-second tick (display state, nothing from the queue). `note` = the line under the clock
 * ("Doctor hasn't arrived yet" in the PAUSED frame).
 * <QueueClock size="lg" note="..." />
 */
import React, { useEffect, useState } from 'react';
import { MaskIcon } from '../../dashboard';
import { formatClock } from './queueUtils';

const STETHOSCOPE = '/assets/figma/doctor-queue/icon-stethoscope.svg';

interface QueueClockProps {
  size?: 'lg' | 'md';
  note?: string;
}

export const QueueClock: React.FC<QueueClockProps> = ({ size = 'lg', note }) => {
  const [label, setLabel] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setLabel(formatClock(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 px-2">
        <div className="flex flex-col gap-1 min-w-0">
          <p className={`font-display text-ds-body ${size === 'lg' ? 'text-content-tertiary' : 'text-ink-600'}`}>It’s</p>
          <p className={`font-display text-content-primary ${size === 'lg' ? 'text-ds-display' : 'text-ds-h36'} whitespace-nowrap`} aria-live="off">{label}</p>
        </div>
        <span aria-hidden="true" className="grid place-items-center size-10 shrink-0 rounded-full bg-white p-1 shadow-ds-pill text-primary-500">
          <MaskIcon src={STETHOSCOPE} size={32} />
        </span>
      </div>
      {note && <p className="font-display text-[16px] leading-[normal] text-content-primary">{note}</p>}
    </div>
  );
};
