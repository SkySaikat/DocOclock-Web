import React from 'react';

interface ArcGaugeProps {
  /** Fraction of the arc that's "complete" (drawn darkest), 0-1. */
  progress: number;
  /** Fraction currently in consultation (0-1), drawn right after `progress`. The rest of the arc stays the light "waiting" track. */
  inConsultation?: number;
  /** Rendered width in px (Figma: 217.73 on desktop, ~137 on phone). The height follows the arc. */
  size?: number;
  className?: string;
  /** Accessible summary. The graphic is decorative (aria-hidden) when omitted. */
  label?: string;
}

/**
 * Rounded arc gauge (Figma "Queue Status", Group 1000008930), built as a real SVG path sized to actual data rather than
 * Figma's static art — so it stays accurate as queue counts change.
 *
 * Geometry is Figma's, measured in its 217.73-wide design space and scaled with `size`: three stacked round-capped arcs
 * on one circle (outer radius 108.87, thickness 43, so the caps are 21.5 radius), drawn light -> dark so the lighter
 * caps peek out beyond the darker ones:
 *   Waiting (the whole track, primary-50) / In consultation (primary-400, up to completed + consulting) / Completed (primary-700).
 * Colours come from the live theme scale through Tailwind stroke classes (CSS variables), so a Super Admin re-brand recolours it.
 */
const DESIGN_W = 217.73;
const THICKNESS = 43;
const RADIUS = DESIGN_W / 2 - THICKNESS / 2; // centre-line radius 87.365
const CX = DESIGN_W / 2;
const CY = DESIGN_W / 2;
// Cap-centre angles, degrees clockwise from 9 o'clock. Figma's full (Waiting) arc runs 0.6 -> 182.6, i.e. a hair past 3 o'clock.
const START_DEG = 0.6;
const END_DEG = 182.6;

const rad = (deg: number) => (deg * Math.PI) / 180;
const point = (deg: number) => [CX - RADIUS * Math.cos(rad(deg)), CY - RADIUS * Math.sin(rad(deg))] as const;
const arcPath = (from: number, to: number) => {
  const [x0, y0] = point(from);
  const [x1, y1] = point(to);
  return `M${x0.toFixed(3)} ${y0.toFixed(3)}A${RADIUS} ${RADIUS} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`;
};
// Lowest point of any cap (the arc's right end sits below the left end in Figma).
const VIEW_H = Math.max(point(START_DEG)[1], point(END_DEG)[1]) + THICKNESS / 2;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export const ArcGauge: React.FC<ArcGaugeProps> = ({ progress, inConsultation = 0, size = 200, className = '', label }) => {
  const done = clamp01(progress);
  const consulting = Math.min(clamp01(inConsultation), 1 - done);
  const span = END_DEG - START_DEG;

  return (
    <svg
      width={size}
      height={(size * VIEW_H) / DESIGN_W}
      viewBox={`0 0 ${DESIGN_W} ${VIEW_H}`}
      fill="none"
      strokeWidth={THICKNESS}
      strokeLinecap="round"
      className={`overflow-visible ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={arcPath(START_DEG, END_DEG)} className="stroke-primary-50" />
      {consulting > 0 && <path d={arcPath(START_DEG, START_DEG + span * (done + consulting))} className="stroke-primary-400" />}
      {done > 0 && <path d={arcPath(START_DEG, START_DEG + span * done)} className="stroke-primary-700" />}
    </svg>
  );
};
