import React from 'react';

interface SectionEyebrowHeaderProps {
   eyebrow: string;
   title: React.ReactNode;
   titleClassName?: string;
   center?: boolean;
   /**
    * 'figma' renders the current design's `Header` component (80:4667) exactly: square 21x8 eyebrow bar,
    * 14px `Text/tertiary` eyebrow, Instrument Sans 48 / 58 / +2% `Text/Primary` title.
    * The default keeps the older look so marketing pages that have not been re-synced are unchanged.
    */
   variant?: 'default' | 'figma';
   /** figma variant: 'light' = white title + eyebrow, for the dark footer band. */
   tone?: 'dark' | 'light';
   /** figma variant: replaces the eyebrow label colour class (FAQ uses `#7c7b7b`). */
   eyebrowClassName?: string;
}

// Exact Figma "Eyebbrow" + section-title pattern, shared across marketing pages.
export const SectionEyebrowHeader: React.FC<SectionEyebrowHeaderProps> = ({
   eyebrow,
   title,
   titleClassName = '',
   center,
   variant = 'default',
   tone = 'dark',
   eyebrowClassName,
}) => {
   if (variant === 'figma') {
      const light = tone === 'light';
      return (
         <div className={`flex flex-col gap-4 font-display ${center ? 'items-center text-center' : 'items-start'}`}>
            {/* Eyebbrow / Variant2 (80:4637): no fill, pad 8/12, gap 10, bar 21x8 with radius 0 */}
            <span className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full">
               <span className="w-[21px] h-2 bg-primary-500 shrink-0" />
               <span className={`text-[14px] leading-[normal] ${light ? 'text-white' : (eyebrowClassName ?? 'text-content-tertiary')}`}>{eyebrow}</span>
            </span>
            <h2
               className={`font-normal text-[28px] leading-[1.3] md:text-[48px] md:leading-[58px] tracking-[0.02em] ${light ? 'text-white' : 'text-content-primary'} ${titleClassName}`}
            >
               {title}
            </h2>
         </div>
      );
   }

   return (
      <div className={`flex flex-col gap-4 ${center ? 'items-center text-center' : 'items-start'}`}>
         <span className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full">
            <span className="w-[21px] h-2 rounded-full bg-medical-500" />
            <span className="text-ink-500 text-[14px]">{eyebrow}</span>
         </span>
         <h2 className={`font-display font-normal text-[28px] md:text-[46px] text-[#131215] leading-[1.3] md:leading-[58px] tracking-[0.92px] ${titleClassName}`}>
            {title}
         </h2>
      </div>
   );
};
