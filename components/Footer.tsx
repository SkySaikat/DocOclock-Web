import React, { useState } from 'react';
import { Button } from './ui/Button';
import { SectionEyebrowHeader } from './ui/SectionEyebrowHeader';

// Figma "Footer" 80:1932 (1460 x 897.73, clip): dark CTA band + logo / newsletter row + legal line.
export const Footer: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');

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

      {/* CTA band 80:1939 (808 wide, gap 28) */}
      <div className="relative z-10 flex w-full max-w-[808px] flex-col items-center gap-7 px-6 text-center">
        <SectionEyebrowHeader
          variant="figma"
          tone="light"
          center
          eyebrow="Join to Dococlock"
          title="Healthcare made simple with smarter appointment scheduling."
          titleClassName="max-w-[759px]"
        />
        <div className="flex w-full flex-col items-center gap-9">
          <p className="text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary md:max-w-[808px]">
            Book verified doctors, track your live queue, and manage prescriptions — all from one account.
          </p>
          <div className="flex items-center justify-center gap-[10px]">
            <Button variant="figma-primary" onClick={() => onNavigate('/patient/doctors')}>Register</Button>
            <Button variant="figma-secondary" onClick={() => onNavigate('/patient/doctors')}>Register</Button>
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
