import React from 'react';
import '../landing/figma-button.css';

type LegacyVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'gradient';
/**
 * Figma-exact pill buttons (component set "Buttons" 80:4641 + its hover wrappers):
 *  - figma-primary   Button Usual Hover, Primary  (green fill, white sheen ellipse rises on hover)
 *  - figma-secondary Button Usual Hover, Secondary (white fill, dark label)
 *  - figma-gradient  Buttons / Gradient (Accent-400 -> Accent-600, no hover motion in Figma)
 *  - figma-featured  Button Featured Hover (icon-only circle that expands to reveal the label)
 * The legacy variants above are untouched, so out-of-scope views keep their current look.
 */
type FigmaVariant = 'figma-primary' | 'figma-secondary' | 'figma-gradient' | 'figma-featured';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LegacyVariant | FigmaVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** figma-* variants: drop the trailing chevron frame. */
  hideArrow?: boolean;
  /** figma-featured only: keep the label revealed (the "Hovered" variant Figma places on the landing). */
  expanded?: boolean;
}

// Every figma variant shares the same 44.728px pill: label frame (pad 16, gap -24) + 43.778px chevron frame.
const figmaBase =
  "fbtn relative isolate inline-flex h-[44.728px] shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-normal text-[16px] leading-[normal] whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const figmaVariants: Record<FigmaVariant, string> = {
  'figma-primary': 'fbtn-sheen bg-primary-500 text-white',
  'figma-secondary': 'fbtn-sheen bg-white text-ink-800',
  'figma-gradient': 'bg-gradient-to-b from-primary-400 to-primary-600 text-white',
  'figma-featured': 'fbtn-featured bg-primary-500 text-white',
};

const ARROW_LIGHT = '/assets/figma/booking-arrow-right-btn.svg';
const ARROW_DARK = '/assets/figma/landing-components/button-arrow-dark.svg';

const isFigmaVariant = (v: string): v is FigmaVariant => v.startsWith('figma-');

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  hideArrow = false,
  expanded = false,
  className = '',
  ...props
}) => {
  if (isFigmaVariant(variant)) {
    const arrow = (
      <img
        src={variant === 'figma-secondary' ? ARROW_DARK : ARROW_LIGHT}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-[44.728px] w-[43.778px] shrink-0"
      />
    );
    const featured = variant === 'figma-featured';
    return (
      <button
        className={`${figmaBase} ${figmaVariants[variant]} ${featured && expanded ? 'fbtn-featured--expanded' : ''} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {featured ? (
          <span className="fbtn-featured__label">
            <span>
              <span>{children}</span>
            </span>
          </span>
        ) : (
          <span className={`px-4 ${hideArrow ? '' : '-mr-6'}`}>{children}</span>
        )}
        {!hideArrow && arrow}
      </button>
    );
  }

  const baseStyles = "inline-flex items-center justify-center rounded-full font-display font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  // `btn-sheen` (index.css) is Figma's documented hover treatment for filled
  // pill buttons — a soft radial highlight that fades in on hover. Figma
  // applies it to solid accent-colored CTAs specifically (confirmed on both
  // the generic Button component and the Doctor Card's "Get an Appointment"
  // button), not on light/outline/secondary variants.
  const variants: Record<LegacyVariant, string> = {
    primary: "btn-sheen bg-medical-500 text-white hover:bg-medical-600 shadow-md shadow-medical-200",
    secondary: "bg-sky-100 text-medical-700 hover:bg-sky-200",
    accent: "btn-sheen bg-teal-500 text-white hover:bg-teal-600 shadow-md shadow-teal-200",
    outline: "border-2 border-medical-500 text-medical-500 hover:bg-medical-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    // Dococlock brand gradient CTA (navbar/hero/closing-band pill buttons)
    gradient: "btn-sheen bg-gradient-to-b from-medical-500 to-medical-600 text-white hover:brightness-105 shadow-md shadow-medical-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg"
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
