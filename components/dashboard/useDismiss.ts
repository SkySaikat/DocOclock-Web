/**
 * useDismiss(ref, open, onClose) — closes an open popover on outside `mousedown` / touch and on Escape
 * (the same outside-click pattern Layout used, plus keyboard). Returns nothing; attach `ref` to the popover's positioned wrapper
 * (trigger + panel) so clicks on the trigger itself are not treated as "outside".
 */
import { useEffect, RefObject } from 'react';

export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onClose]);
}
