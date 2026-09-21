/**
 * Queue Progress card (Figma Queue Card 368:14941): title + "Today" chip, the 25-segment "Rate" bar and the 4-count legend.
 * <QueueProgress completed remaining cancelled noShow />  Segments follow the counts (largest remainder, see queueUtils.allocateSegments).
 * Colours: Completed = primary-500, Remaining = primary-200, Cancelled = Fill Color, No Show = 1px outline.
 */
import React, { useMemo } from 'react';
import { DsText } from '../../dashboard';
import { allocateSegments } from './queueUtils';

interface QueueProgressProps {
  completed: number;
  remaining: number;
  cancelled: number;
  noShow: number;
}

const GROUPS = [
  { key: 'completed', label: 'Completed', bar: 'bg-primary-500', swatch: 'bg-primary-500' },
  { key: 'remaining', label: 'Remaining', bar: 'bg-primary-200', swatch: 'bg-primary-200' },
  { key: 'cancelled', label: 'Cancelled', bar: 'bg-surface', swatch: 'bg-surface' },
  { key: 'noShow', label: 'No Show', bar: 'border border-ink-500', swatch: 'border border-ink-500' },
] as const;

export const QueueProgress: React.FC<QueueProgressProps> = ({ completed, remaining, cancelled, noShow }) => {
  const counts = [completed, remaining, cancelled, noShow];
  const segments = useMemo(() => allocateSegments(counts), [completed, remaining, cancelled, noShow]);
  const bars = GROUPS.flatMap((g, gi) => Array.from({ length: segments[gi] }, (_, i) => ({ id: `${g.key}-${i}`, cls: g.bar })));
  const empty = bars.length === 0;

  return (
    <section aria-label="Queue progress" className="flex flex-col items-center gap-6 rounded-3xl p-[15px] w-full">
      <div className="flex items-center justify-between w-full">
        <DsText variant="title24" tone="primary">Queue Progress</DsText>
        <span className="rounded-full border border-page px-3 py-1 font-display text-ds-small text-content-secondary">Today</span>
      </div>
      <div
        role="img"
        aria-label={`${completed} completed, ${remaining} remaining, ${cancelled} cancelled, ${noShow} no show`}
        className="flex gap-1 w-full"
      >
        {empty
          ? Array.from({ length: 25 }, (_, i) => <span key={i} className="h-9 min-w-px flex-1 rounded-ds-sm bg-surface" />)
          : bars.map(b => <span key={b.id} className={`h-9 min-w-px flex-1 rounded-ds-sm ${b.cls}`} />)}
      </div>
      <ul className="flex items-center justify-between w-full">
        {GROUPS.map((g, gi) => (
          <li key={g.key} className="flex flex-col items-center gap-2">
            <span className="font-display text-ds-body text-content-primary">{counts[gi]}</span>
            <span className="flex items-center gap-1">
              <i aria-hidden="true" className={`size-[10px] rounded-ds-xs ${g.swatch}`} />
              <span className="font-display text-ds-small text-content-tertiary">{g.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
