/**
 * Patient-dashboard list pieces shared by Appointments (Figma 191:5570) and Prescriptions (297:12584):
 * - useMenu(): anchored popover state that closes on outside click / Escape (Figma OVERLAY + DISSOLVE 0.3s).
 * - RowMenu: the row "more-line" (…) button + its action menu.
 * - TableHead / TableCell: #f6f6f6 head (Inter 14, -0.7px, #808080), rows 24px apart, 16px side padding.
 * - PaginationBar: "Rows per page" + Prev / "n of N" / Next (339:17166).
 */
import React, { useCallback, useRef, useState } from 'react';
import { MaskIcon, SortMenu, useDismiss } from '../dashboard';

const ICON = '/assets/figma/patient-live-appts/';

export const useMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return { open, setOpen, ref, close };
};

export interface RowMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export const RowMenu: React.FC<{ label: string; items: RowMenuItem[] }> = ({ label, items }) => {
  const menu = useMenu();
  if (items.length === 0) return <span className="px-[3px] text-ds-small text-content-disabled">—</span>;
  return (
    <div ref={menu.ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={menu.open}
        onClick={() => menu.setOpen(o => !o)}
        className="grid h-[23px] w-6 place-items-center rounded-md text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        <MaskIcon src={ICON + 'more-line.svg'} size={18} style={{ height: 3 }} />
      </button>
      {menu.open && (
        <div role="menu" className="ds-fade-in absolute left-0 top-[calc(100%+6px)] z-30 w-[176px] overflow-hidden rounded-2xl bg-white shadow-ds-rise-lg outline outline-1 -outline-offset-1 outline-surface">
          {items.map((it, i) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => { menu.close(); it.onClick(); }}
              className={`flex h-[39px] w-full items-center px-4 text-left font-display text-ds-small transition-colors duration-ds-fast ease-ds-out hover:bg-primary-50 disabled:opacity-50 ${i > 0 ? 'border-t border-ink-50' : ''} ${it.danger ? 'text-[#ed7272]' : 'text-content-primary'}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TableHead: React.FC<{ columns: string[] }> = ({ columns }) => (
  <thead>
    <tr className="bg-ink-100 font-inter text-[14px] tracking-[-0.7px] text-[#808080]">
      {columns.map((h, i) => (
        <th key={h} scope="col" className={`px-4 py-3 font-normal ${i === 0 ? 'rounded-tl-lg' : ''} ${i === columns.length - 1 ? 'w-[200px] rounded-tr-lg' : ''}`}>{h}</th>
      ))}
    </tr>
  </thead>
);

/** First row sits 20px under the head, later rows 24px apart (Figma List gap 20 + Rows gap 24). */
export const TableCell: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => (
  <td className={`px-4 ${first ? 'pt-5' : 'pt-6'}`}>{children}</td>
);

/** Closes the table body with the 20px bottom breathing room before the pagination bar. */
export const TableEnd: React.FC<{ span: number }> = ({ span }) => (
  <tr aria-hidden="true"><td colSpan={span} className="h-5" /></tr>
);

export const initials = (name: string) =>
  name.replace(/^dr\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/** 17px avatar dot + name (Figma `user` cell); initials because the lists have no doctor photo. */
export const PersonCell: React.FC<{ name: string }> = ({ name }) => (
  <span className="flex items-center gap-3">
    <span aria-hidden="true" className="grid size-[17px] shrink-0 place-items-center rounded-full bg-primary-100 text-[7px] text-primary-600">{initials(name)}</span>
    <span className="truncate">{name}</span>
  </span>
);

export const formatLongDate = (date: string) => {
  const d = new Date(date);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface PaginationBarProps {
  page: number;
  pageCount: number;
  perPage: number;
  perPageOptions?: number[];
  onPage: (page: number) => void;
  onPerPage: (n: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({ page, pageCount, perPage, perPageOptions = [6, 12, 24], onPage, onPerPage }) => {
  const rowsMenu = useMenu();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-lg bg-ink-100 px-4 py-3 text-[14px] text-[#6c6c6c]">
      <div className="flex items-center gap-4">
        <span>Rows per page</span>
        <div ref={rowsMenu.ref} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={rowsMenu.open}
            onClick={() => rowsMenu.setOpen(o => !o)}
            className="flex items-end gap-4 rounded border border-[#f5f8f7] px-2 py-1 text-[#333232] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            {perPage}
            <MaskIcon src={ICON + 'arrow-down-s-fill.svg'} size={16} className="text-[#6c6c6c]" />
          </button>
          {rowsMenu.open && (
            <SortMenu
              options={perPageOptions.map(n => ({ id: String(n), label: String(n) }))}
              value={String(perPage)}
              onSelect={id => onPerPage(Number(id))}
              onClose={rowsMenu.close}
              className="bottom-[calc(100%+6px)] top-auto w-[72px]"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="flex items-center gap-[5px] rounded border border-[#fafcfc] bg-[#fdffff] px-2 py-1 disabled:opacity-50">
          <MaskIcon src={ICON + 'arrow-drop-left.svg'} size={16} />Prev
        </button>
        <span>{page} of {pageCount}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)} className="flex items-end gap-1 rounded border border-[#eef1f0] px-2 py-1 disabled:opacity-50">
          Next<MaskIcon src={ICON + 'arrow-drop-right.svg'} size={16} />
        </button>
      </div>
    </div>
  );
};

/** Date "Action" pill of the Dashboard Header (calendar glyph + label + chevron) opening a single-choice menu. */
export const FilterPill: React.FC<{
  label: string;
  icon: string;
  chevron: string;
  options: { id: string; label: string }[];
  value: string;
  onSelect: (id: string) => void;
}> = ({ label, icon, chevron, options, value, onSelect }) => {
  const menu = useMenu();
  return (
    <div ref={menu.ref} className="relative flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        onClick={() => menu.setOpen(o => !o)}
        className="flex h-12 items-center gap-2 whitespace-nowrap rounded-3xl bg-white px-3 py-2 font-display text-ds-subtitle text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        <MaskIcon src={icon} size={16} />
        {label}
        <MaskIcon src={chevron} size={20} className={`transition-transform duration-ds-fast ease-ds-out ${menu.open ? '' : '-scale-y-100'}`} />
      </button>
      {menu.open && (
        <SortMenu options={options} value={value} onSelect={onSelect} onClose={menu.close} className="left-0 w-full min-w-[136px]" />
      )}
    </div>
  );
};
