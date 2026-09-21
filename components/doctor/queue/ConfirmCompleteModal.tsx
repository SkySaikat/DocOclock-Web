/**
 * Confirm modal (Figma Modal 368:14285, 411x142): "Do you want to complete this session?" with No / Yes, Complete.
 * Centred on a 30% black scrim (DISSOLVE 300ms EASE_OUT), r12, shadow 0 0 18.1px 15%. Presentational; the caller runs the completion.
 * <ConfirmCompleteModal onCancel onConfirm />  (scrim click, Esc and "No" call onCancel)
 */
import React, { useEffect, useRef } from 'react';
import { DashboardButton } from '../../dashboard';

interface ConfirmCompleteModalProps {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmCompleteModal: React.FC<ConfirmCompleteModalProps> = ({
  title = 'Do you want to complete this session?',
  description = 'Manage all your queues and get ready for the next ones ',
  confirmLabel = 'Yes, Complete',
  cancelLabel = 'No',
  onCancel,
  onConfirm,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="ds-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="queue-confirm-title"
        aria-describedby="queue-confirm-desc"
        tabIndex={-1}
        // Figma shadow 0 0 18.1px at 15% (the shared shadow-ds-modal token is 10%).
        className="flex w-[411px] max-w-full flex-col justify-center overflow-clip rounded-xl bg-white p-3 shadow-[0_0_18.1px_rgba(0,0,0,0.15)] outline-none"
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl p-3 text-center">
            <div className="flex w-full flex-col items-center justify-center gap-1">
              <h2 id="queue-confirm-title" className="font-display text-ds-title-20 font-normal text-content-primary">{title}</h2>
              <p id="queue-confirm-desc" className="font-display text-ds-small text-content-tertiary">{description}</p>
            </div>
          </div>
          <div className="flex w-full items-start gap-[10px]">
            <DashboardButton variant="secondary" icon={false} onClick={onCancel} className="!bg-white !text-steel w-[121px] shrink-0">{cancelLabel}</DashboardButton>
            <DashboardButton variant="primary" icon={false} onClick={onConfirm} className="min-w-0 flex-1">{confirmLabel}</DashboardButton>
          </div>
        </div>
      </div>
    </div>
  );
};
