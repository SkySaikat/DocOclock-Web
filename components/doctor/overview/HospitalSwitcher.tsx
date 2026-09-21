/**
 * Hospital switcher of the Doctor Overview: the translucent pill with the active hospital + a primary icon circle (Figma 341:18166 / phone
 * 572:26252) and the popover it opens (Figma `7` 368:18696, phone 572:26261).
 *
 * Prototype behaviour (docs/figma/specs/doctor-overview.md §3-4): click -> OVERLAY with a 25% black scrim, closes on click outside.
 *  - lg+ : MANUAL popover, DISSOLVE 0.3s EASE_OUT, placed at offset (-145, +56) from the 42px icon circle (14px under it, right edge 8px inside its right edge).
 *  - <lg : App Version V1 BOTTOM_CENTER sheet (387 wide, 63px rows), MOVE_IN from the TOP 0.3s EASE_OUT.
 * Scrim + popover are portalled to <body> so the scrim really covers the sticky navbar / bottom bar whatever ancestor stacking contexts exist.
 * Presentational: the caller owns the hospital list, the selection and the per-hospital counts.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MaskIcon } from '../../dashboard/MaskIcon';
import { OV_ICONS } from './assets';
import './overview.css';

export interface SwitcherHospital {
  id: string;
  hospitalName: string;
}

interface HospitalSwitcherProps {
  hospitals: SwitcherHospital[];
  selectedId: string | null;
  /** Name shown in the pill; "Select Hospital" when empty. */
  selectedName?: string;
  /** Today's non-cancelled appointment count of a hospital (shown after its name in the popover). */
  getCount: (hospitalId: string) => number;
  onSelect: (hospitalId: string) => void;
  className?: string;
}

export const HospitalSwitcher: React.FC<HospitalSwitcherProps> = ({ hospitals, selectedId, selectedName, getCount, onSelect, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Desktop placement, re-measured on resize / scroll so the popover stays attached to the icon circle.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = iconRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 14, right: document.documentElement.clientWidth - r.right + 8 });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // Esc closes; focus moves into the list on open (selected row first) and returns to the pill on close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        pillRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const target = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? listRef.current?.querySelector<HTMLElement>('[role="option"]');
    target?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const choose = (id: string) => {
    setOpen(false);
    onSelect(id);
    pillRef.current?.focus();
  };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items: HTMLElement[] = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      items[next]?.focus();
    }
  };

  const name = selectedName || 'Select Hospital';

  return (
    <div className={className}>
      <button
        ref={pillRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${name}, change hospital`}
        onClick={() => setOpen(o => !o)}
        // Figma: rgba(255,255,255,.5) fill, r32, pad 16/12, 225 wide, shadow 0 -1 12 .04 (= shadow-ds-rise). Desktop grows for long names (right-aligned, so it extends leftwards).
        className="flex w-[225px] max-w-full cursor-pointer items-center justify-between gap-2 rounded-ds-xl bg-white/50 px-4 py-3 text-left shadow-ds-rise focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 lg:w-auto lg:min-w-[225px] lg:max-w-[360px]"
      >
        <span title={name} className="min-w-0 truncate font-inter text-[16px] leading-[19px] text-content-primary">{name}</span>
        <span ref={iconRef} aria-hidden="true" className="grid size-[42px] shrink-0 place-items-center rounded-[21px] bg-primary-500 text-white">
          <MaskIcon src={OV_ICONS.hospitalSwitch} size={16} />
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div aria-hidden="true" className="ds-fade-in fixed inset-0 z-[200] bg-black/25" onClick={close} />
          <div
            ref={listRef}
            role="listbox"
            aria-label="Select hospital"
            onKeyDown={onListKeyDown}
            style={pos ? ({ '--ov-top': `${pos.top}px`, '--ov-right': `${pos.right}px` } as React.CSSProperties) : undefined}
            className="ov-popover fixed inset-x-0 bottom-0 z-[201] mx-auto w-[387px] max-w-[calc(100vw-13px)] overflow-hidden rounded-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-ds-rise-lg outline outline-1 -outline-offset-1 outline-surface lg:inset-x-auto lg:bottom-auto lg:right-[var(--ov-right)] lg:top-[var(--ov-top)] lg:mx-0 lg:w-max lg:min-w-[179px] lg:max-w-[320px] lg:pb-0"
          >
            {hospitals.map(h => {
              const active = String(h.id) === String(selectedId);
              return (
                <button
                  key={h.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(h.id)}
                  // Rows: Figma 39 high (63 on phone); Instrument Sans 12; selected = primary-50 fill + primary text, others carry a 1px ink-50 divider.
                  className={`flex h-[63px] w-full cursor-pointer items-center gap-2 px-4 text-left font-display text-ds-small focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500 lg:h-[39px] ${
                    active ? 'bg-primary-50 text-primary-500' : 'border-b border-ink-50 bg-white text-content-secondary'
                  }`}
                >
                  <MaskIcon src={OV_ICONS.hospital} size={12.5} style={{ width: 10.278, height: 12.5 }} className={active ? 'text-primary-500' : 'text-content-tertiary'} />
                  <span className="min-w-0 truncate whitespace-nowrap">{h.hospitalName}</span>
                  <span className="shrink-0 font-bold">{getCount(String(h.id))}</span>
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
