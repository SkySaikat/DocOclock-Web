import React from 'react';
import { CardHeader } from './CardHeader';

interface EarningCardProps {
  /** Fees of today's completed appointments. */
  earned: number;
  /** Fees of all of today's non-cancelled appointments (what the day is worth once everything is completed). */
  total: number;
  loading?: boolean;
  className?: string;
  chipLabel?: string;
}

// Inter has no glyph for the taka sign, so the browser falls back to a system Bengali font whose taller line box stretches Figma's 15px
// row to 18px (the card grew 123 -> 129). A zero-line-height wrapper keeps the row on Inter's own line box whichever font draws the sign.
const Taka: React.FC<{ amount: number }> = ({ amount }) => (
  <>
    <span className="leading-[0]">৳</span>
    {amount}
  </>
);

const Row: React.FC<{ label: string; dot: string; title?: string; loading?: boolean; children: React.ReactNode }> = ({ label, dot, title, loading, children }) => (
  <div className="flex items-center justify-between" title={title}>
    <span className="flex items-center gap-1">
      <span aria-hidden="true" className={`size-[10px] shrink-0 rounded-ds-xs ${dot}`} />
      <span className="font-inter text-[12px] leading-[normal] tracking-[-0.48px] text-neutral-600">{label}</span>
    </span>
    {loading ? (
      <span className="block h-3 w-10 animate-pulse rounded bg-ink-100" />
    ) : (
      <span className="font-inter text-[12px] leading-[normal] tracking-[-0.48px] text-neutral-600">{children}</span>
    )}
  </div>
);

/**
 * Earning card (Figma 339:17560, phone 572:26195): white r24 card, pad 16, gap 24 — title + "Today" chip, then two rows
 * (Inter 12, -4 % tracking, `#515151` -> neutral-600): Earning (primary dot) and Total (`ink-300` #d9d9d9 dot). The card hugs its content.
 */
export const EarningCard: React.FC<EarningCardProps> = ({ earned, total, loading, className = '', chipLabel }) => (
  <section aria-label="Earning" className={`flex flex-col gap-6 rounded-ds-lg bg-white p-4 ${className}`}>
    <CardHeader title="Earning" chipTone="earning" chipLabel={chipLabel} />
    <div className="flex w-full flex-col gap-2">
      <Row label="Earning" dot="bg-primary-500" loading={loading}><Taka amount={earned} /></Row>
      <Row
        label="Total"
        dot="bg-ink-300"
        title="What today's earning will be once every non-cancelled appointment is completed"
        loading={loading}
      >
        <Taka amount={total} />
      </Row>
    </div>
  </section>
);
