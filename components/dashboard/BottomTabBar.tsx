/**
 * Phone bottom tab bar (Figma "Card 4" 570:20777 + Bottom Bar Tab 572:20938): 68px white bar, top corners r24, shadow 0 0 12 .06,
 * padding-x 36, hug-width tabs spread with space-between. Active tab = 2px primary top border + primary Medium 10px label + primary icon;
 * inactive = Text/disabled Regular 10px. Colours fade 300ms EASE_OUT.
 * <BottomTabBar items={[{id,label,icon:assetUrl,iconSize?}]} activeId onSelect(id) ariaLabel />
 * Renders `fixed bottom-0` (index.css hides `.fixed.bottom-0` while a modal is open) and pads for the iOS/Android safe area.
 * Hide it at desktop widths from the caller with `lg:hidden` (className).
 */
import React from 'react';
import { MaskIcon } from './MaskIcon';

export interface BottomTabItem {
  id: string;
  label: string;
  /** Exported Figma SVG url (tinted through a CSS mask, see MaskIcon). */
  icon: string;
  /** Rendered glyph box in px (Figma icon sizes differ per tab). Default 16. */
  iconSize?: number;
}

interface BottomTabBarProps {
  items: BottomTabItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ items, activeId, onSelect, ariaLabel = 'Primary', className = '' }) => (
  <nav
    aria-label={ariaLabel}
    className={`fixed bottom-0 inset-x-0 z-50 h-[calc(68px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-9 flex items-stretch justify-between bg-white rounded-t-3xl shadow-ds-queue ${className}`}
  >
    {items.map(item => {
      const active = item.id === activeId;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          aria-current={active ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-2 pt-[14px] pb-4 border-t-2 font-display text-[10px] leading-[normal] whitespace-nowrap cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500 ${active ? 'border-primary-500 text-primary-500 font-medium' : 'border-transparent text-content-disabled font-normal'}`}
        >
          <span className="size-4 grid place-items-center"><MaskIcon src={item.icon} size={item.iconSize ?? 16} /></span>
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
);
