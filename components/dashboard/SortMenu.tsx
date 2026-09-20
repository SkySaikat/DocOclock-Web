/**
 * Sort menu (Figma frame "4" 368:16699): 136px white popover, r16, 1px inside `surface` (Fill Color) stroke, shadow 0 -4 12 .04, rows 39px / 12px text,
 * selected row = primary-50 fill + secondary-500 text, 1px ink-50 dividers.
 * <SortMenu options={[{id,label}]} value onSelect(id) onClose /> — render it inside the filter button's `relative` wrapper (SearchField `filterSlot`);
 * it positions itself `absolute top-[calc(100%+6px)] left-[-5px]` and fades in 300ms (DISSOLVE). Dismissal (outside click / Esc) is the parent's job — see useDismiss.
 */
import React from 'react';

export interface SortMenuOption {
  id: string;
  label: string;
}

interface SortMenuProps {
  options: SortMenuOption[];
  value?: string;
  onSelect: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

export const SortMenu: React.FC<SortMenuProps> = ({ options, value, onSelect, onClose, className = '' }) => (
  <div
    role="menu"
    className={`ds-fade-in absolute top-[calc(100%+6px)] left-[-5px] z-30 w-[136px] rounded-2xl bg-white outline outline-1 -outline-offset-1 outline-surface shadow-ds-rise-lg overflow-hidden ${className}`}
  >
    {options.map((o, i) => {
      const selected = o.id === value;
      return (
        <button
          key={o.id}
          type="button"
          role="menuitemradio"
          aria-checked={selected}
          onClick={() => { onSelect(o.id); onClose?.(); }}
          className={`w-full h-[39px] px-4 flex items-center text-left font-display text-ds-small transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none ${i > 0 ? 'border-t border-ink-50' : ''} ${selected ? 'bg-primary-50 text-secondary-500' : 'bg-white text-content-primary'}`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);
