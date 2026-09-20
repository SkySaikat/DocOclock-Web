import React from 'react';
import { Button } from '../ui/Button';
import './doctor-reveal-card.css';

export interface DoctorRevealCardProps {
   name: string;
   specialty: string;
   /** e.g. "MBBS, FCPS(CARDIOLOGY)"; derived from the specialty when the doctor has none. */
   degrees?: string;
   image?: string;
   rating?: number | string;
   /** Years of experience (shown as "10+"). */
   experience?: number | string;
   /** Total patients treated (shown as "2.5K+"). */
   totalPatients?: number;
   ctaLabel?: string;
   /** Whole card (mouse / touch). */
   onClick?: () => void;
   /** "Get an Appointment" button revealed on hover / focus. */
   onCtaClick?: () => void;
   className?: string;
}

// "2500" -> "2.5K", "12000" -> "12K", 340 -> "340"
const formatPatients = (n: number): string =>
   n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n);

/**
 * Figma "Doctor Card - Final" (80:4685). Resting = Variant2 (photo, white chip, name / qualification / rating
 * underneath). Hover or keyboard focus = Default: the photo widens to the card edges, a screened gradient fades
 * the lower photo to the page colour, the info block slides up into the photo, the Experience / Patients
 * panels and the "Get an Appointment" pill fade in, and the chip turns blue. All of it is one DOM tree animated
 * by doctor-reveal-card.css (300ms, cubic-bezier(0,0,.58,1)).
 */
export const DoctorRevealCard: React.FC<DoctorRevealCardProps> = ({
   name,
   specialty,
   degrees,
   image,
   rating,
   experience,
   totalPatients,
   ctaLabel = 'Get an Appointment',
   onClick,
   onCtaClick,
   className = '',
}) => {
   const safeSpecialty = specialty || '';
   const qualification = degrees || `MBBS, FCPS(${safeSpecialty.toUpperCase()})`;
   const patients = totalPatients && totalPatients > 0 ? formatPatients(totalPatients) : '2.5K';
   const years = experience && Number(experience) > 0 ? String(experience) : '10';

   return (
      <div className={`dcf font-display ${className}`} onClick={onClick}>
         <div className="dcf__card">
            <div className="dcf__media">
               {image ? (
                  <img src={image} alt={name} draggable={false} className="absolute inset-0 h-full w-full object-cover object-top" />
               ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-display text-5xl font-bold text-primary-300">
                     {(name || '?').charAt(0)}
                  </div>
               )}
            </div>
            <div className="dcf__fade" />

            <div className="dcf__info">
               <div className="flex min-w-0 flex-col gap-2">
                  <p className="truncate font-medium text-[24px] leading-[29px] text-ink-800">{name}</p>
                  <p className="truncate text-[16px] leading-[22px] text-content-tertiary">{qualification}</p>
               </div>
               <div className="flex shrink-0 items-center gap-1 text-[16px] leading-5 text-ink-800">
                  {/* Star 39 (icon-star.svg, 15.2169 x 14.4721 inside a 16 x 16 frame, inset 0 2.45% 9.55% 2.45%) */}
                  <span className="relative block h-4 w-4">
                     <img src="/assets/figma/icon-star.svg" alt="" aria-hidden="true" className="absolute left-[2.45%] top-0 h-[90.45%] w-[95.1%]" />
                  </span>
                  <span>{rating || '4.5'}</span>
               </div>
            </div>

            <div className="dcf__stats font-inter font-medium">
               <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[24px] bg-ink-50">
                  <span className="text-[36px] leading-[44px] text-content-primary">{years}+</span>
                  <span className="flex items-center gap-1 text-[14px] leading-[17px] text-content-tertiary">
                     <img src="/assets/figma/landing-pages/icon-clock-16.svg" alt="" aria-hidden="true" className="h-4 w-4" />
                     Experience
                  </span>
               </div>
               <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[24px] bg-ink-50">
                  <span className="text-[36px] leading-[44px] text-content-primary">{patients}+</span>
                  <span className="flex items-center gap-1 text-[14px] leading-[17px] text-content-tertiary">
                     <img src="/assets/figma/landing-pages/icon-people-outline-16.svg" alt="" aria-hidden="true" className="h-4 w-4" />
                     Patients
                  </span>
               </div>
            </div>

            {/* Chip: resting (white, Instrument Sans) cross-fades into hovered (blue-50 / blue-600, Inter, uppercase) */}
            <span className="dcf__chip dcf__chip--rest bg-white text-content-primary">{safeSpecialty}</span>
            <span aria-hidden="true" className="dcf__chip dcf__chip--hover bg-blue-50 font-inter uppercase text-blue-600">{safeSpecialty}</span>

            <div className="dcf__cta">
               <Button
                  variant="figma-primary"
                  fullWidth
                  aria-label={`${ctaLabel} with ${name}`}
                  onClick={(e) => {
                     e.stopPropagation();
                     onCtaClick?.();
                  }}
               >
                  {ctaLabel}
               </Button>
            </div>
         </div>
      </div>
   );
};
