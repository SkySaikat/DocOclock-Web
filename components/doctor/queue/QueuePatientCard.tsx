/**
 * Queue "User Card" (Figma 368:15036 as used in the Up Next strip): 320x154 r32 card, avatar + name + sub-line + "Serial No.",
 * status chip (opens the Update Status sheet) and ring buttons (call / open). Same look as the shared dashboard `UserCard`, but
 * the avatar is an initials circle (appointments have no photo) and the chip can be disabled for finished rows.
 * <QueuePatientCard name subtitle serialNo tone="arrived|late|cancelled" statusLabel onStatusClick onOpen phone />
 */
import React from 'react';
import { MaskIcon, DS_ICONS, dsAsset } from '../../dashboard';
import { PatientAvatar, AvatarTone } from './PatientAvatar';
import type { CardTone } from './queueUtils';

interface QueuePatientCardProps {
  name: string;
  subtitle?: string;
  serialNo: number | string;
  tone: CardTone;
  statusLabel: string;
  /** Opens the Update Status sheet; leave undefined when nothing can change (chip is then not clickable). */
  onStatusClick?: () => void;
  onOpen?: () => void;
  /** Real phone number -> renders the call ring as a `tel:` link. */
  phone?: string;
  className?: string;
}

// Figma: Arrived white, Late sage (#dde5e1 ~ content-disabled/40 as in the shared UserCard), Cancelled white in the LIVE frame.
const CARD: Record<CardTone, string> = { arrived: 'bg-white', late: 'bg-content-disabled/40', cancelled: 'bg-white' };
const DOT: Record<CardTone, string> = {
  arrived: 'bg-primary-500',
  late: 'bg-content-secondary',
  cancelled: 'bg-[#e35e5e]', // fixed semantic status red (same as UserCard)
};
const AVATAR: Record<CardTone, AvatarTone> = { arrived: 'default', late: 'late', cancelled: 'muted' };

const ringBase = 'size-[42px] rounded-full border border-ink-200 grid place-items-center shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';

export const QueuePatientCard: React.FC<QueuePatientCardProps> = ({ name, subtitle, serialNo, tone, statusLabel, onStatusClick, onOpen, phone, className = '' }) => {
  const muted = tone === 'cancelled';
  const ringColor = muted ? 'text-steel' : 'text-content-secondary';
  return (
    <div className={`w-[320px] min-w-[280px] shrink-0 rounded-ds-xl p-5 flex flex-col justify-center gap-6 shadow-ds-row ${CARD[tone]} ${className}`}>
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <PatientAvatar name={name} size={48} tone={AVATAR[tone]} />
          <div className="min-w-0 flex flex-col gap-1">
            <p className={`font-display text-ds-title-20 truncate ${muted ? 'text-steel line-through' : 'text-content-primary'}`}>{name}</p>
            {subtitle && <p className="font-display text-ds-small text-content-secondary truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-display text-ds-small text-content-secondary">Serial No.</span>
          <span className="font-display text-ds-title-24 text-content-primary">{serialNo}</span>
        </div>
      </div>
      <div className="flex items-center justify-between w-full gap-2">
        <button
          type="button"
          onClick={onStatusClick}
          disabled={!onStatusClick}
          aria-label={`Status: ${statusLabel}. ${onStatusClick ? 'Change status' : 'No further changes'}`}
          className={`inline-flex items-center rounded-full p-2 cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${tone === 'late' ? 'bg-surface' : 'bg-ink-50'}`}
        >
          <span className="flex items-center gap-1">
            <i className={`size-2 rounded-full ${DOT[tone]}`} />
            <span className={`px-1 font-display text-ds-small ${muted ? 'text-steel' : 'text-content-secondary'}`}>{statusLabel}</span>
          </span>
          {onStatusClick && <MaskIcon src={DS_ICONS.change} size={16} className={muted ? 'text-steel' : 'text-content-secondary'} />}
        </button>
        <div className="flex items-center gap-1">
          {phone && (
            <a href={`tel:${phone}`} aria-label={`Call ${name}`} className={`${ringBase} ${ringColor}`}>
              <MaskIcon src={dsAsset('user-card-icon-call.svg')} size={16} />
            </a>
          )}
          <button type="button" onClick={onOpen} aria-label={`Open ${name}`} className={`${ringBase} ${ringColor}`}>
            <MaskIcon src={dsAsset('user-card-icon-arrow-up-right.svg')} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
