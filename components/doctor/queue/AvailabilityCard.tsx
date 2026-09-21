/**
 * "Availability" card (Figma Card 3 of the flow-start Queue frame 328:13919, 308x341): title + dark "Set Delay" chip, the pastel dashed
 * ring with the doctor's status in the middle ("In Hospital"), and the Arrived / Inactive tab group.
 * Presentational: Arrived / Inactive call the caller's existing arrive / away handlers, "Set Delay" opens the Queue Status modal.
 * The ring is Figma's exported asset (fixed pastel palette, brand-independent by design, tokens.md 1.2); only the label is live.
 * <AvailabilityCard isArrived onArrived onAway onSetDelay />
 */
import React from 'react';

const RING = '/assets/figma/doctor-queue/ring-availability.svg';

interface AvailabilityCardProps {
  isArrived: boolean;
  onArrived: () => void;
  onAway: () => void;
  onSetDelay: () => void;
  className?: string;
}

// Same tab group as the Queue Status modal (Figma Tab Buttons: Inter 12, px16 py12, r64, accent fill when active).
const TAB = 'rounded-full px-4 py-3 font-inter text-[12px] leading-[normal] cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';

export const AvailabilityCard: React.FC<AvailabilityCardProps> = ({ isArrived, onArrived, onAway, onSetDelay, className = '' }) => (
  <section
    aria-label="Availability"
    // Figma: drop-shadow 0 0 6px 6%, white -> primary-50 vertical gradient (the #eefff8 stop is a literal there; themed here).
    className={`flex min-h-[341px] w-full flex-col items-center gap-6 rounded-ds-lg p-6 drop-shadow-[0_0_6px_rgba(0,0,0,0.06)] bg-[linear-gradient(180deg,#fff_71.19%,rgb(var(--color-primary-50))_100.07%)] ${className}`}
  >
    <div className="flex w-full items-center justify-between gap-2">
      <h2 className="font-display text-ds-title-24 font-normal text-content-primary">Availability</h2>
      <button
        type="button"
        onClick={onSetDelay}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-content-secondary p-1 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <span className="flex h-5 items-center px-3 font-display text-ds-small font-medium text-ink-50 whitespace-nowrap">Set Delay</span>
      </button>
    </div>

    {/* Figma `Bottom` = px24, fills the space between the title row and the tabs; the 154px ring is centred in it (no vertical padding: 341px card). */}
    <div className="flex min-h-0 flex-1 items-center justify-center px-6">
      <div className="relative h-[154px] w-[156px]">
        <img src={RING} alt="" width={156} height={154} className="block size-full" />
        {/* Figma label: Inter 14 -1% #656565 at (47, 61) inside the ring group, i.e. 3.5px right of / 7px above the ring centre. */}
        <span className="absolute left-[calc(50%+3.5px)] top-[calc(50%-7px)] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-inter text-[14px] leading-[normal] tracking-[-0.14px] text-ink-600">
          {isArrived ? 'In Hospital' : 'Off Duty'}
        </span>
      </div>
    </div>

    <div role="radiogroup" aria-label="Availability" className="flex shrink-0 items-center justify-center gap-1 rounded-[20px] bg-page px-2 py-1">
      <button type="button" role="radio" aria-checked={isArrived} onClick={onArrived} className={`${TAB} ${isArrived ? 'bg-primary-500 font-semibold text-white' : 'text-ink-600'}`}>Arrived</button>
      <button type="button" role="radio" aria-checked={!isArrived} onClick={onAway} className={`${TAB} ${!isArrived ? 'bg-primary-500 font-semibold text-white' : 'text-ink-600'}`}>Inactive</button>
    </div>
  </section>
);
