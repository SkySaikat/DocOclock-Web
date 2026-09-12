import React, { useId } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ArcGaugeProps {
  /** Fraction of the arc that's "complete", 0-1. */
  progress: number;
  size?: number;
}

/**
 * A rounded semicircle progress gauge (Figma's "Queue Status" arc), built as a
 * real SVG path sized to actual data rather than Figma's static decorative
 * asset — so it stays accurate as queue counts change instead of just being
 * illustrative.
 */
export const ArcGauge: React.FC<ArcGaugeProps> = ({ progress, size = 200 }) => {
  const { colors } = useTheme();
  const uid = useId().replace(/:/g, '');
  const clamped = Math.max(0, Math.min(1, progress));

  const strokeWidth = size * 0.11;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + strokeWidth / 4;
  const circumference = Math.PI * r;
  const dash = circumference * clamped;

  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
      <defs>
        <linearGradient id={`${uid}-arc`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.secondaryColor} />
          <stop offset="100%" stopColor={colors.primaryColor} />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="#eef2f0" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke={`url(#${uid}-arc)`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
      />
    </svg>
  );
};
