import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has scrolled into view (and stays true). Resolves immediately for
 * prefers-reduced-motion users and when IntersectionObserver is unavailable, so content never stays hidden.
 */
export function useInView<T extends Element>(threshold = 0.25) {
   const ref = useRef<T>(null);
   const [inView, setInView] = useState(false);

   useEffect(() => {
      const el = ref.current;
      if (!el) return;
      if (typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
         setInView(true);
         return;
      }
      const observer = new IntersectionObserver(
         ([entry]) => {
            if (entry.isIntersecting) {
               setInView(true);
               observer.disconnect();
            }
         },
         { threshold }
      );
      observer.observe(el);
      return () => observer.disconnect();
   }, [threshold]);

   return { ref, inView };
}

/** Eases a number from 0 to `target` whenever `restartKey` changes. Instant for reduced-motion users. */
export function useCountUp(target: number, restartKey: unknown = 0, duration = 900) {
   const [value, setValue] = useState(0);

   useEffect(() => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
         setValue(target);
         return;
      }
      setValue(0);
      let frame = 0;
      const start = performance.now();
      const tick = (now: number) => {
         const t = Math.min((now - start) / duration, 1);
         setValue(target * (1 - Math.pow(1 - t, 3)));
         if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
   }, [target, restartKey, duration]);

   return value;
}
