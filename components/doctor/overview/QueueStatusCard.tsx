import React from 'react';
import { ArcGauge } from '../../ui/ArcGauge';
import { CardHeader } from './CardHeader';

interface QueueStatusCardProps {
  completed: number;
  consulting: number;
  waiting: number;
  /** Today's non-cancelled patients: the denominator of the arc segments. */
  total: number;
  className?: string;
  /** Analytics reuses the card as "Appointment Status" with its period chip. */
  title?: string;
  chipLabel?: string;
  /** `column` = gauge above the legend (Analytics "Appointment Status", 336 wide); default `row` = Overview layout. */
  layout?: 'row' | 'column';
}

/**
 * Queue Status card (Figma 339:17573, phone 572:26172): white r24 card, pad 16, gap 16 — title + "Today" chip, then the arc gauge
 * (218x160 box, 137x101 on phone) beside the legend. Legend rows: 10px r5 colour chip + Instrument Sans 16 `#5e5e5e` label, Inter 16 value.
 */
export const QueueStatusCard: React.FC<QueueStatusCardProps> = ({ completed, consulting, waiting, total, className = '', title = 'Queue Status', chipLabel, layout = 'row' }) => {
  const rows = [
    // Figma chips: Accent-800 / Accent-400 / Accent-50 (the arc itself uses 700 / 400 / 50).
    { label: 'Completed', value: completed, chip: 'bg-primary-800' },
    { label: 'In consultation', value: consulting, chip: 'bg-primary-400' },
    { label: 'Waiting', value: waiting, chip: 'bg-primary-50' },
  ];

  return (
    <section aria-label={title} className={`flex flex-col items-center gap-4 rounded-ds-lg bg-white p-4 ${className}`}>
      <CardHeader title={title} chipTone="queue" chipLabel={chipLabel} />

      <div className={`flex w-full items-center justify-center gap-6 ${layout === 'column' ? 'flex-col !gap-4' : ''}`}>
        {/* The arc's box is taller than the arc: Figma insets the art 10.63% from the top of a 218x160 frame (137x101 on phone).
            On phone the box shrinks first when the legend needs its natural width (Layout's 24px gutters leave less room than Figma's 16px). */}
        <div className={layout === 'column' ? 'relative h-[140px] w-[190px]' : 'relative aspect-[137/101] min-w-[88px] flex-[0_1_137px] lg:aspect-auto lg:h-[160px] lg:w-[218px] lg:flex-none'}>
          <ArcGauge
            progress={total > 0 ? completed / total : 0}
            inConsultation={total > 0 ? consulting / total : 0}
            size={218}
            className="absolute left-0 top-[10.63%] h-auto w-[99.88%]"
            label={`${title} (${(chipLabel ?? 'Today').toLowerCase()}): ${completed} completed, ${consulting} in consultation, ${waiting} waiting`}
          />
        </div>

        <ul className={`flex min-w-0 flex-col gap-2 ${layout === 'column' ? 'w-full' : 'flex-[1_0.05_max-content] lg:flex-1'}`}>
          {rows.map(row => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className={`size-[10px] shrink-0 rounded-ds-xs ${row.chip}`} />
                <span className="truncate font-display text-[16px] leading-[normal] text-ink-600">{row.label}</span>
              </span>
              {/* Figma #515151 -> neutral-600 (#525252) */}
              <span className="shrink-0 font-inter text-[16px] leading-[19px] tracking-[-0.64px] text-neutral-600">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
