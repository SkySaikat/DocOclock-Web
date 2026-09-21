/**
 * Round patient avatar for the Queue screen. Appointments carry no photo, so (unlike the Figma sample photos) it shows the patient's
 * initials on a theme tint. `tone`: default = primary tint, late = sage, muted = neutral (cancelled / completed / reserved).
 * <PatientAvatar name="Ahmed Khan" size={43} tone="default" />
 */
import React from 'react';
import { initialsOf } from './queueUtils';

export type AvatarTone = 'default' | 'late' | 'muted';

const TONE: Record<AvatarTone, string> = {
  default: 'bg-primary-100 text-primary-700',
  late: 'bg-content-disabled/40 text-content-secondary',
  muted: 'bg-ink-200 text-ink-500',
};

interface PatientAvatarProps {
  name: string;
  size?: number;
  tone?: AvatarTone;
  className?: string;
}

export const PatientAvatar: React.FC<PatientAvatarProps> = ({ name, size = 48, tone = 'default', className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-grid shrink-0 place-items-center rounded-full font-display font-medium select-none ${TONE[tone]} ${className}`}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
  >
    {initialsOf(name)}
  </span>
);
