/**
 * Lead / Trail Icon Button (Figma 303:13034 / 255:6656) with the prototype hover: the 40px circle widens to 122px and reveals
 * its label (SMART_ANIMATE EASE_OUT 300ms). Works on hover AND keyboard focus; disabled under reduced motion.
 * <LeadIconButton label="Add Time" icon={<optional node>} ...buttonProps/>  icon fixed left, label grows to the right, shadow 7px -> 4px/25%.
 * <TrailIconButton label="Add" icon=.../>  mirrored: icon fixed right, label appears on the left, shadow fades out.
 * Use only where the label is a REAL action name (never for a bare close button). Icon defaults to Figma's "+" glyph.
 */
import React from 'react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS } from './assets';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon?: React.ReactNode;
}

const base = 'relative inline-flex items-center h-10 p-1 rounded-full bg-white overflow-hidden cursor-pointer transition-shadow duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';
// Label reveal: max-width + opacity + padding, 300ms EASE_OUT (spec 5.2). `steel` stands in for Figma's literal #8a94a3.
const labelBase = 'block max-w-0 px-0 opacity-0 overflow-hidden whitespace-nowrap font-display text-[16px] leading-[normal] text-steel transition-[max-width,opacity,padding,margin] duration-ds-fast ease-ds-out motion-reduce:transition-none';

export const LeadIconButton: React.FC<IconButtonProps> = ({ label, icon, className = '', type = 'button', ...rest }) => (
  <button
    type={type}
    aria-label={label}
    className={`group/lead ${base} shadow-ds-pill hover:shadow-[0_0_4px_rgba(0,0,0,0.25)] focus-visible:shadow-[0_0_4px_rgba(0,0,0,0.25)] ${className}`}
    {...rest}
  >
    <span className="size-8 shrink-0 grid place-items-center text-content-tertiary">{icon ?? <MaskIcon src={DS_ICONS.add} size={11.25} />}</span>
    <span className={`${labelBase} group-hover/lead:max-w-[96px] group-hover/lead:opacity-100 group-hover/lead:px-3 group-hover/lead:-ml-[14px] group-focus-visible/lead:max-w-[96px] group-focus-visible/lead:opacity-100 group-focus-visible/lead:px-3 group-focus-visible/lead:-ml-[14px]`}>{label}</span>
  </button>
);

export const TrailIconButton: React.FC<IconButtonProps> = ({ label, icon, className = '', type = 'button', ...rest }) => (
  <button
    type={type}
    aria-label={label}
    className={`group/trail ${base} flex-row-reverse shadow-ds-pill hover:shadow-none focus-visible:shadow-none ${className}`}
    {...rest}
  >
    <span className="size-8 shrink-0 grid place-items-center text-content-tertiary">{icon ?? <MaskIcon src={DS_ICONS.add} size={11.25} />}</span>
    <span className={`${labelBase} group-hover/trail:max-w-[96px] group-hover/trail:opacity-100 group-hover/trail:px-3 group-hover/trail:-mr-[14px] group-focus-visible/trail:max-w-[96px] group-focus-visible/trail:opacity-100 group-focus-visible/trail:px-3 group-focus-visible/trail:-mr-[14px]`}>{label}</span>
  </button>
);
