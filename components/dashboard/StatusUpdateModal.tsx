/**
 * "Update Status" sheet (Figma Bottombar 368:16140): 346px centred white card (r24, p16, gap 12, no shadow) on a 25% black scrim,
 * title 24px + close button, divider, radio options (selected = primary-50 fill, primary text + tick badge).
 * <StatusUpdateModal title="Update Status" options={[{id,title,description}]} value onSelect(id) onClose />
 * Presentational only: the caller owns the status handler and mounts/unmounts it. Scrim click + Esc + the close button call `onClose`;
 * selecting an option calls `onSelect(id)` (caller decides whether to close). Fades in 300ms EASE_OUT (DISSOLVE).
 */
import React, { useEffect, useRef } from 'react';
import { MaskIcon } from './MaskIcon';
import { DS_ICONS, dsAsset } from './assets';

export interface StatusOption {
  id: string;
  title: string;
  description: string;
}

interface StatusUpdateModalProps {
  title?: string;
  options: StatusOption[];
  value?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ title = 'Update Status', options, value, onSelect, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ds-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-black/25 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-[346px] max-w-full rounded-3xl bg-white p-4 flex flex-col gap-3 overflow-hidden outline-none"
      >
        <div className="flex items-center justify-between gap-6">
          <h2 className="font-display text-ds-title-24 text-ink-800 font-normal">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-10 rounded-full bg-white shadow-ds-pill grid place-items-center text-steel cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <MaskIcon src={DS_ICONS.close} size={11.5} />
          </button>
        </div>
        <hr className="border-0 h-px bg-ink-200" />
        <ul className="flex flex-col gap-1" role="radiogroup" aria-label={title}>
          {options.map(o => {
            const selected = o.id === value;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(o.id)}
                  className={`w-full flex items-center gap-3 p-[10px] rounded-2xl text-left cursor-pointer transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${selected ? 'bg-primary-50' : 'bg-transparent'}`}
                >
                  {selected ? (
                    <img src={dsAsset('bottombar-tick-badge.svg')} alt="" className="size-[29px] shrink-0" />
                  ) : (
                    <img src={dsAsset('bottombar-radio-dot.svg')} alt="" className="size-[18px] shrink-0 mx-[5.5px]" />
                  )}
                  <span className="flex flex-col gap-1 min-w-0">
                    <span className={`font-display text-ds-subtitle ${selected ? 'text-primary-500' : 'text-ink-800'}`}>{o.title}</span>
                    <span className={`font-display text-ds-small ${selected ? 'text-primary-500' : 'text-ink-600'}`}>{o.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
