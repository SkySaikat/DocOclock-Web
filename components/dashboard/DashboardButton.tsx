/**
 * Buttons - Dashboard (Figma 303:13196): 48px pill, Inter Regular 16 / -2% tracking, 32px icon slot overlapping the label by 14px.
 * <DashboardButton variant="monochrome|secondary|primary|gradient" icon={false | ReactNode} ...buttonProps>Add Time</DashboardButton>
 * `icon` defaults to Figma's "+" glyph; pass `false` for a label-only pill. No shadow, no hover variant in Figma:
 * primary/gradient keep the app's `.btn-sheen` highlight; disabled = opacity 50. Gradient adds Figma's blurred glow ellipse.
 */
import React from 'react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS } from './assets';

export type DashboardButtonVariant = 'monochrome' | 'secondary' | 'primary' | 'gradient';

interface DashboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DashboardButtonVariant;
  icon?: React.ReactNode | false;
}

const VARIANT: Record<DashboardButtonVariant, string> = {
  monochrome: 'bg-ink-50 text-content-tertiary',
  secondary: 'bg-transparent text-content-secondary',
  primary: 'bg-primary-500 text-white btn-sheen',
  // Figma: opaque vertical #0ca768 -> #08925a on top; #08925a has no token so the end stop follows primary-600.
  gradient: 'bg-gradient-to-b from-primary-500 to-primary-600 text-white btn-sheen',
};

export const DashboardButton: React.FC<DashboardButtonProps> = ({ variant = 'primary', icon, className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={`relative inline-flex items-center justify-center h-12 py-2 pl-1 pr-1 rounded-full font-inter text-[16px] leading-[normal] tracking-[-0.32px] whitespace-nowrap overflow-hidden cursor-pointer transition-opacity duration-ds-fast ease-ds-out motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${VARIANT[variant]} ${className}`}
    {...rest}
  >
    {variant === 'gradient' && (
      // Figma `Ellipse 75`: 55x55 #c8db9c, layer blur 44.7 (= CSS blur 22.35px). Decorative and brand-independent
      // on purpose (tokens.md §1.2 pastel palette), so it is intentionally NOT a theme token.
      <span aria-hidden="true" className="pointer-events-none absolute left-[73px] top-[26px] size-[55px] rounded-full bg-[#c8db9c] blur-[22.35px]" />
    )}
    {icon !== false && (
      <span className="relative z-[1] size-8 -mr-[14px] shrink-0 grid place-items-center">
        {icon ?? <MaskIcon src={DS_ICONS.add} size={11.25} />}
      </span>
    )}
    <span className="relative z-[1] px-3">{children}</span>
  </button>
);
