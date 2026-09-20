/**
 * Search Component (Figma 303:13394): 538x41 row, gap 10 = grey search field (r16, #fbfbfb) + white filter button (r16).
 * <SearchField value onChange placeholder="Search Anything" onFilterClick filterLabel="Sort" filterSlot={<SortMenu/>} className />
 * The magnifier / funnel are exported Figma assets (MaskIcon). `filterSlot` is rendered inside the filter button's `relative`
 * wrapper so a <SortMenu> can be positioned with `absolute` (top:calc(100%+6px), left:-5px per Figma). Omit `onFilterClick` to hide the button.
 */
import React from 'react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS } from './assets';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  filterLabel?: string;
  filterExpanded?: boolean;
  filterSlot?: React.ReactNode;
  className?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({ value, onChange, placeholder = 'Search Anything', onFilterClick, filterLabel = 'Filter and sort', filterExpanded, filterSlot, className = '' }) => (
  <div className={`flex items-stretch gap-[10px] w-full max-w-[538px] ${className}`}>
    <label className="flex-1 min-w-0 flex items-center gap-2 h-[41px] px-4 py-3 rounded-2xl bg-ink-50 overflow-hidden focus-within:outline focus-within:outline-2 focus-within:outline-primary-500">
      <MaskIcon src={DS_ICONS.searchMagnifier} size={16.928} className="text-content-tertiary" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none font-display text-ds-body text-content-primary placeholder:text-content-tertiary"
      />
    </label>
    {onFilterClick && (
      <div className="relative">
        <button
          type="button"
          onClick={onFilterClick}
          aria-label={filterLabel}
          aria-haspopup={filterSlot ? 'menu' : undefined}
          aria-expanded={filterSlot ? !!filterExpanded : undefined}
          className="h-[41px] flex items-center justify-center px-4 py-2 rounded-2xl bg-white cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
        >
          <MaskIcon src={DS_ICONS.searchFilter} size={15} className="text-content-tertiary" />
        </button>
        {filterSlot}
      </div>
    )}
  </div>
);
