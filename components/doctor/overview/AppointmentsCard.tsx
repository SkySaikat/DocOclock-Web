import React from 'react';
import { MaskIcon } from '../../dashboard/MaskIcon';
import { OV_ICONS } from './assets';

interface AppointmentsCardProps {
  /** Today's non-cancelled appointments for the selected hospital. */
  today: number;
  /** This month's appointment count for the selected hospital. */
  month: number;
  /** This month vs last month, in percent; `null` = no last-month baseline. */
  progressionPct: number | null;
  loading?: boolean;
  className?: string;
}

// Figma stat number: Instrument Sans Medium 48, tracking -2 % (phone: 24). Desktop steps down to 36 below xl so three columns fit the narrower column.
const NUMBER = 'font-display leading-[normal] text-primary-500 text-[24px] lg:text-[36px] xl:text-[48px]';

// Desktop: number over label (label = Regular 12 `content-secondary`, gap 8). Phone (App Version V1): label left, number right, one row per stat.
const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between lg:flex-col lg:items-start lg:justify-start lg:gap-2">
    <span className="order-1 font-display text-ds-small text-content-secondary lg:order-2">{label}</span>
    <div className="order-2 lg:order-1">{children}</div>
  </div>
);

// Same box as the number it stands in for (line-height normal: 29 / 44 / 59px) so loading does not shift the layout.
const NumberSkeleton = () => <span className="block h-[29px] w-12 animate-pulse rounded-lg bg-ink-100 lg:h-[44px] lg:w-16 xl:h-[59px]" />;

/**
 * Appointments card (Figma 339:17471 "767", phone 572:26154): white -> `ink-100` gradient r32 card, pad 24, title + Today / This Month /
 * Progression. Two 1px `surface` dividers separate the stats on desktop.
 */
export const AppointmentsCard: React.FC<AppointmentsCardProps> = ({ today, month, progressionPct, loading, className = '' }) => {
  const declining = progressionPct != null && progressionPct < 0;

  return (
    <section
      aria-label="Appointments"
      // Gradient = Figma 210.96deg (desktop) / 234.39deg (phone), white 67.488% -> #f6f6f6 (ink-100) 96.269%; shadow = Figma drop-shadow(0 -1px 6px .04).
      className={`flex flex-col gap-4 rounded-ds-xl p-6 shadow-[0_-1px_6px_0_rgba(0,0,0,0.04)] bg-[linear-gradient(234.39deg,theme(colors.white)_67.488%,theme(colors.ink.100)_96.269%)] lg:min-h-[205px] lg:justify-between lg:gap-0 lg:bg-[linear-gradient(210.96deg,theme(colors.white)_67.488%,theme(colors.ink.100)_96.269%)] ${className}`}
    >
      <h3 className="font-inter text-ds-title-24 font-normal text-content-primary">Appointments</h3>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:px-6 xl:px-12">
        <Stat label="Today">
          {loading ? <NumberSkeleton /> : <p className={`${NUMBER} font-medium tracking-[-0.02em]`}>{today}</p>}
        </Stat>
        <span aria-hidden="true" className="hidden w-px self-stretch bg-surface lg:block" />
        <Stat label="This Month">
          {loading ? <NumberSkeleton /> : <p className={`${NUMBER} font-medium tracking-[-0.02em]`}>{month}</p>}
        </Stat>
        <span aria-hidden="true" className="hidden w-px self-stretch bg-surface lg:block" />
        <Stat label="Progression">
          <div className="flex items-center justify-center gap-[10px]">
            <p className={`${NUMBER} font-normal`}>
              {progressionPct == null ? '—' : `${progressionPct > 0 ? '+' : ''}${progressionPct}%`}
            </p>
            {progressionPct != null && (
              // Figma: 8.014px up-right arrow in an 11.333px slot, rotated 135deg (points down) for a decline.
              <span role="img" aria-label={declining ? 'Decrease' : 'Increase'} className="grid size-[11.333px] shrink-0 place-items-center">
                <MaskIcon src={OV_ICONS.progressArrow} size={8.014} className={`text-primary-500 ${declining ? 'rotate-[135deg]' : ''}`} />
              </span>
            )}
          </div>
        </Stat>
      </div>
    </section>
  );
};
