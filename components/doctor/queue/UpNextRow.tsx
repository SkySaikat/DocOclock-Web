/**
 * "Up Next" row (Figma Queue Row 368:15600): title + chevron, "View All (N)" and the horizontally scrolling strip of patient cards.
 * <UpNextRow count={10} onViewAll={...} empty={boolean}>{cards}</UpNextRow>
 * The strip is the caller's list of <QueuePatientCard/>; `empty` renders the "no appointments" card instead.
 */
import React from 'react';
import { MaskIcon } from '../../dashboard';

const CHEVRON = '/assets/figma/doctor-queue/icon-chevron-down-s.svg';

interface UpNextRowProps {
  count: number;
  onViewAll: () => void;
  empty?: boolean;
  emptyText?: string;
  children?: React.ReactNode;
  className?: string;
}

export const UpNextRow: React.FC<UpNextRowProps> = ({ count, onViewAll, empty, emptyText = 'No appointments found matching this filter.', children, className = '' }) => (
  <section aria-label="Up next" className={`flex flex-col gap-4 w-full ${className}`}>
    <div className="flex items-center justify-between w-full">
      <h2 className="flex items-center gap-0.5 font-display text-[16px] leading-[normal] tracking-[0.16px] text-ink-600 font-normal">
        Up Next
        <MaskIcon src={CHEVRON} size={20} className="-rotate-90" />
      </h2>
      <button
        type="button"
        onClick={onViewAll}
        className="font-display text-ds-body text-ink-500 cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none hover:text-content-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 rounded"
      >
        View All ({count})
      </button>
    </div>
    {empty ? (
      <div className="w-full rounded-ds-xl bg-white p-6 shadow-ds-row text-center font-display text-ds-body text-content-tertiary">{emptyText}</div>
    ) : (
      // Figma: overflow-x auto + overflow-y clip, r24, gap 8; the scrollbar stays hidden (design shows none), cards are focusable.
      <div className="no-scrollbar flex items-start gap-2 w-full overflow-x-auto overflow-y-clip rounded-3xl">{children}</div>
    )}
  </section>
);
