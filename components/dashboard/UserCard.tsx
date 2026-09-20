/**
 * User Card (Figma 368:15036): queue patient row card — white (Arrived), muted (Cancelled) or sage (Late), r32, shadow 12/9/20/.04, p20 gap24.
 * <UserCard name sessionLabel="45 Mins Session" serialNo avatarSrc status="arrived|cancelled|late" statusLabel onStatusClick onOpen onCall />
 * Presentational: top row = avatar + name/session + serial number; bottom row = status chip (opens the "Update Status" sheet via `onStatusClick`)
 * + ring buttons (`onCall` optional, `onOpen` = arrow). No hover styling exists in Figma. Status dots: arrived = primary (Figma's legacy blue is
 * intentionally not ported, tokens.md D8), cancelled = fixed status red, late = Text/secondary.
 */
import React from 'react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS, dsAsset } from './assets';

export type UserCardStatus = 'arrived' | 'cancelled' | 'late';

interface UserCardProps {
  name: string;
  sessionLabel?: string;
  serialNo?: string | number;
  avatarSrc?: string;
  status: UserCardStatus;
  statusLabel?: string;
  onStatusClick?: () => void;
  onOpen?: () => void;
  onCall?: () => void;
  className?: string;
}

const CARD: Record<UserCardStatus, string> = {
  arrived: 'bg-white',
  cancelled: 'bg-page',
  late: 'bg-content-disabled/40',
};
const DOT: Record<UserCardStatus, string> = {
  arrived: 'bg-primary-500',
  cancelled: 'bg-[#e35e5e]', // fixed semantic status red
  late: 'bg-content-secondary',
};
const LABEL: Record<UserCardStatus, string> = { arrived: 'Arrived', cancelled: 'Cancelled', late: 'Late' };

export const UserCard: React.FC<UserCardProps> = ({ name, sessionLabel, serialNo, avatarSrc, status, statusLabel, onStatusClick, onOpen, onCall, className = '' }) => {
  const muted = status === 'cancelled';
  const ring = `size-[42px] rounded-full border border-ink-200 grid place-items-center shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${muted ? 'text-steel' : 'text-content-secondary'}`;
  return (
    <div className={`w-full max-w-[367px] min-w-[280px] rounded-ds-xl p-5 flex flex-col justify-center gap-6 shadow-ds-row ${CARD[status]} ${className}`}>
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <img src={avatarSrc ?? dsAsset('user-card-avatar-sample.png')} alt="" className="size-12 rounded-full object-cover shrink-0" />
          <div className="min-w-0 flex flex-col gap-1">
            <p className="font-display text-ds-title-20 text-content-primary truncate">{name}</p>
            {sessionLabel && <p className="font-display text-ds-small text-content-secondary">{sessionLabel}</p>}
          </div>
        </div>
        {serialNo !== undefined && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-display text-ds-small text-content-secondary">Serial No.</span>
            <span className="font-display text-ds-title-24 text-content-primary">{serialNo}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between w-full gap-2">
        <button
          type="button"
          onClick={onStatusClick}
          disabled={!onStatusClick}
          aria-label={`Status: ${statusLabel ?? LABEL[status]}. Change status`}
          className={`inline-flex items-center rounded-full p-2 cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${status === 'late' ? 'bg-surface' : 'bg-ink-50'}`}
        >
          <span className="flex items-center gap-1">
            <i className={`size-2 rounded-full ${DOT[status]}`} />
            <span className={`px-1 font-display text-ds-small ${muted ? 'text-steel' : 'text-content-secondary'}`}>{statusLabel ?? LABEL[status]}</span>
          </span>
          <MaskIcon src={DS_ICONS.change} size={16} className={muted ? 'text-steel' : 'text-content-secondary'} />
        </button>
        <div className="flex items-center gap-1">
          {onCall && (
            <button type="button" onClick={onCall} aria-label="Call patient" className={ring}>
              <MaskIcon src={dsAsset('user-card-icon-call.svg')} size={16} />
            </button>
          )}
          <button type="button" onClick={onOpen} aria-label="Open patient" className={ring}>
            <MaskIcon src={dsAsset('user-card-icon-arrow-up-right.svg')} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
