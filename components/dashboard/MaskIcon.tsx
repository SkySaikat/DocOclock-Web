/**
 * MaskIcon — recolourable icon from an exported Figma SVG (docs/figma/specs/dashboard-components.md §5.12).
 * Props: `src` (asset url, see ./assets DS_ICONS), `size` (px, default 16), `className`, `style`.
 * The SVG is used as a CSS mask over `background: currentColor`, so ONE asset serves every colour:
 * set the colour with a text-* class on the icon or its parent (theme tokens keep working).
 * Decorative by default (`aria-hidden`); wrap in a labelled button for meaning.
 */
import React from 'react';

interface MaskIconProps {
  src: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const MaskIcon: React.FC<MaskIconProps> = ({ src, size = 16, className = '', style }) => (
  <span
    aria-hidden="true"
    className={`inline-block shrink-0 bg-current ${className}`}
    style={{
      width: size,
      height: size,
      WebkitMaskImage: `url(${src})`,
      maskImage: `url(${src})`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      ...style,
    }}
  />
);
