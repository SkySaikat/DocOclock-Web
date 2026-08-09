import React from 'react';

// Exact Figma "Eyebbrow" + section-title pattern, shared across marketing pages.
export const SectionEyebrowHeader: React.FC<{ eyebrow: string; title: string; titleClassName?: string; center?: boolean }> = ({ eyebrow, title, titleClassName = '', center }) => (
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
