/**
 * "3 Buttons" view toggle (Figma 317:15075): 32x32 r24 icon toggles, active = primary fill + white glyph, inactive = tertiary glyph.
 * <ViewToggleButton active icon="list|grid|calendar" label="List view" onClick /> — `aria-pressed`, colour fades 300ms EASE_OUT.
 */
import React from 'react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS } from './assets';

const ICON = { list: DS_ICONS.listView, grid: DS_ICONS.grid, calendar: DS_ICONS.calendar } as const;
const SIZE = { list: 14, grid: 20, calendar: 16 } as const;

interface ViewToggleButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean;
  icon: keyof typeof ICON;
  label: string;
}

export const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ active = false, icon, label, className = '', type = 'button', ...rest }) => (
  <button
    type={type}
    aria-pressed={active}
    aria-label={label}
    className={`size-8 grid place-items-center rounded-3xl cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${active ? 'bg-primary-500 text-white' : 'bg-transparent text-content-tertiary'} ${className}`}
    {...rest}
  >
    <MaskIcon src={ICON[icon]} size={SIZE[icon]} />
  </button>
);
