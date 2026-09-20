/**
 * Avatar button + Profile menu (Figma 317:13569 + frame 368:17693).
 * <AvatarMenu imageUrl name items={[{id,label,icon,onSelect,mobileOnly?}]} logout={{label?,onSelect}} />
 * Avatar = 44x49 cell (36px round photo, falls back to a user glyph). Clicking opens the 260px panel 6px below it (`right:-35px` on md+):
 * white r12 card, p12 gap16, 14px rows (gap 28) + a red Logout row; fades in 300ms EASE_OUT. Closes on outside click, Esc (focus returns to the
 * avatar) and after a selection. Arrow keys move between rows. `mobileOnly` rows render below `lg` only (extra routes the phone bottom bar lacks).
 */
import React, { useCallback, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS } from './assets';
import { useDismiss } from './useDismiss';

export interface AvatarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  mobileOnly?: boolean;
}

interface AvatarMenuProps {
  imageUrl?: string | null;
  name?: string;
  items: AvatarMenuItem[];
  logout?: { label?: string; onSelect: () => void };
  className?: string;
}

export const AvatarMenu: React.FC<AvatarMenuProps> = ({ imageUrl, name, items, logout, className = '' }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    if (panelRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
    setOpen(false);
  }, []);
  useDismiss(wrapRef, open, close);

  // Keyboard users (trigger focused via keyboard) land on the first row when the panel opens.
  const onPanelRef = (el: HTMLDivElement | null) => {
    panelRef.current = el;
    if (el && document.activeElement === triggerRef.current && triggerRef.current?.matches(':focus-visible')) {
      el.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const found = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    const rows: HTMLElement[] = found ? Array.from<HTMLElement>(found).filter(r => r.offsetParent !== null) : [];
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % rows.length : (i - 1 + rows.length) % rows.length;
    rows[next].focus();
  };

  const select = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={wrapRef} className={`relative flex-1 h-full ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={name ? `Account menu for ${name}` : 'Account menu'}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full h-full flex items-center justify-center p-1 rounded-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="size-9 rounded-full bg-primary-500 text-white grid place-items-center"><User size={18} /></span>
        )}
      </button>

      {open && (
        <div
          ref={onPanelRef}
          role="menu"
          aria-label="Account"
          className="ds-fade-in absolute top-[calc(100%+6px)] right-0 md:right-[-35px] z-[60] w-[260px] rounded-xl bg-white p-3 flex flex-col gap-4 shadow-[7px_5px_13.7px_0_rgba(0,0,0,0.04)]"
        >
          <div className="p-3 flex flex-col gap-7">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={select(item.onSelect)}
                className={`relative flex items-center gap-2 h-5 text-left font-display text-ds-body text-content-secondary hover:text-content-primary focus-visible:text-content-primary transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none cursor-pointer before:content-[''] before:absolute before:inset-x-0 before:-inset-y-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 rounded-sm ${item.mobileOnly ? 'lg:hidden' : ''}`}
              >
                <span className="size-5 shrink-0 grid place-items-center">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
          {logout && (
            // Danger row: Figma literals #ffeaea / #ce4747 are fixed semantic (status) colours, not brand colours.
            <button
              type="button"
              role="menuitem"
              onClick={select(logout.onSelect)}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-[#ffeaea] text-[#ce4747] font-display text-[16px] leading-[normal] text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <MaskIcon src={DS_ICONS.menuLogout} size={20} />
              <span>{logout.label ?? 'Logout'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
