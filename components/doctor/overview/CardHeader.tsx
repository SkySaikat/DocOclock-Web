import React from 'react';

/**
 * Title row of the Queue Status / Earning cards (Figma 339:17574 / 339:17561): Instrument Sans Regular 24 `#171717` title on the left,
 * static "Today" chip on the right (58x23, r100, Instrument Sans 12 `#171717`; Figma's 12/4 padding includes the 1px inside stroke, hence px 11 / py 3 + border).
 * The two cards use different chip strokes in Figma: Queue Status `#eaeceb`, Earning `#f9f9f9`.
 */
export const CardHeader: React.FC<{ title: string; chipTone: 'queue' | 'earning' }> = ({ title, chipTone }) => (
  <div className="flex w-full items-center justify-between">
    <h3 className="font-display text-ds-title-24 font-normal text-ink-800">{title}</h3>
    <span
      className={`inline-flex items-center justify-center rounded-full border px-[11px] py-[3px] font-display text-ds-small text-ink-800 ${
        // #eaeceb ~ content-disabled (#a8b0ac) at 25% on white (within 1/255); #f9f9f9 ~ page (#fafafa)
        chipTone === 'queue' ? 'border-content-disabled/25' : 'border-page'
      }`}
    >
      Today
    </span>
  </div>
);
