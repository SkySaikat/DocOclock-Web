import React, { useState } from 'react';
import { Button } from './ui/Button';
import { SectionEyebrowHeader } from './ui/SectionEyebrowHeader';
import { useInView } from '../hooks/useInView';
import { ArrowRight, LogIn } from 'lucide-react';

// Figma "Footer" 80:1932 (1460 x 897.73, clip): dark CTA band + logo / newsletter row + legal line.
interface FooterProps {
  onNavigate: (path: string) => void;
  /** Visitors only: opens the register / login popups. Omitted for signed-in users, who get a single "Find a Doctor" button. */
  onRegister?: () => void;
  onLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onRegister, onLogin }) => {
  const [email, setEmail] = useState('');
  const { ref: ctaRef, inView } = useInView<HTMLDivElement>(0.3);
  const rise = (i: number) => ({ className: inView ? 'dc-rise' : 'opacity-0', style: { '--i': i * 1.6 } as React.CSSProperties });

  return (
    <footer
      // visible fill = linear #302f34 -> #0a0a0a top-to-bottom (Figma literals; the layers underneath are fully covered)
      className="relative flex flex-col items-center gap-16 overflow-hidden bg-[linear-gradient(180deg,#302f34_0%,#0a0a0a_100%)] py-16 font-display md:gap-[120px]"
    >
      {/* Rectangle 4995: landscape photo, blend MULTIPLY */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-multiply">
        <img src="/assets/figma/footer-bg.png" alt="" className="h-full w-full object-cover" />
      </div>
      {/* Group 1000009031: four blurred circles, blend EXCLUSION (opacity 0.4 is baked into the exported SVG,
          which is 3000.8 x 2341.8 at (-739.4, -846) from the footer's top-left) */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[-50.64%] top-[-846px] h-[2341.8px] w-[205.54%] mix-blend-exclusion">
        <img src="/assets/figma/footer-texture.svg" alt="" className="h-full w-full" />
      </div>

      {/* CTA band 80:1939 (808 wide, gap 28) — eases in on scroll; the buttons are a glowing primary + a glass "Login" */}
      <div ref={ctaRef} className="relative z-10 flex w-full max-w-[808px] flex-col items-center gap-7 px-6 text-center">
        <div {...rise(0)}>
          <SectionEyebrowHeader
            variant="figma"
            tone="light"
            center
            eyebrow="Join to Dococlock"
            title="Healthcare made simple with smarter appointment scheduling."
            titleClassName="max-w-[759px]"
          />
        </div>
        <div className="flex w-full flex-col items-center gap-9">
          <p {...rise(1)} className={`${rise(1).className} text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary md:max-w-[808px]`}>
            Book verified doctors, track your live queue, and manage prescriptions — all from one account.
          </p>
          <div {...rise(2)} className={`${rise(2).className} flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4`}>
            {onRegister ? (
              <>
                <button
                  type="button"
                  onClick={onRegister}
                  className="btn-sheen group relative inline-flex h-14 items-center gap-3 rounded-full bg-primary-500 pl-7 pr-2 text-[17px] font-semibold text-white shadow-[0_10px_30px_-8px_rgb(var(--color-primary-500)/0.7)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-400 hover:shadow-[0_14px_36px_-8px_rgb(var(--color-primary-500)/0.85)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-primary-500/25 [animation-duration:2.8s] motion-reduce:hidden" />
                  Register
                  <span className="grid size-10 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"><ArrowRight size={18} /></span>
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full border border-white/30 bg-white/10 px-7 text-[17px] font-semibold text-white backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <LogIn size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  Login
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('/patient/doctors')}
                className="btn-sheen group inline-flex h-14 items-center gap-3 rounded-full bg-primary-500 pl-7 pr-2 text-[17px] font-semibold text-white shadow-[0_10px_30px_-8px_rgb(var(--color-primary-500)/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-400 motion-reduce:transition-none"
              >
                Find a Doctor
                <span className="grid size-10 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={18} /></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logo / description + newsletter (80:1942) */}
      <div className="relative z-10 flex w-full max-w-[1248px] flex-col gap-16 px-6 md:gap-[120px]">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:gap-[80px]">
          <div className="flex w-full shrink-0 flex-col gap-7 md:w-[375px]">
            <div className="flex items-center gap-1">
              <img src="/assets/figma/logo-mark.svg" alt="" className="h-[50px] w-[50px]" />
              <span className="font-inter text-[28px] leading-[normal] text-white">Dococlock</span>
            </div>
            <p className="text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary">
              Dococlock is a doctor-appointment platform that helps patients find BMDC-verified doctors,
              track their live queue position, and manage digital prescriptions in one place.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-7 md:w-[492px]">
            <p className="text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary">
              "Subscribe to receive appointment reminders, health tips, and product updates."
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
              className="flex w-full items-center justify-between rounded-full bg-white py-1 pl-4 pr-1"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent font-inter text-[16px] text-[#2b2929] outline-none placeholder:text-[#2b2929]"
              />
              <Button variant="figma-gradient" type="submit">Subscribe</Button>
            </form>
          </div>
        </div>

        <p className="text-center text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary md:text-left">
          © {new Date().getFullYear()} Dococlock. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
