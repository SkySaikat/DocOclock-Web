import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');

  return (
    <footer
      className="relative overflow-hidden flex flex-col items-center gap-[80px] md:gap-[120px] py-16 md:py-[64px]"
      style={{ backgroundImage: 'linear-gradient(180deg, rgb(48,47,52) 0%, rgb(10,10,10) 100%)' }}
    >
      {/* Landscape photo overlay — exact Figma asset, darkened via mix-blend-multiply */}
      <div className="absolute inset-0 mix-blend-multiply pointer-events-none">
        <img src="/assets/figma/footer-bg.png" alt="" className="w-full h-full object-cover" />
      </div>
      {/* Decorative texture overlay — exact Figma asset */}
      <div className="absolute -inset-x-1/2 -inset-y-1/3 mix-blend-exclusion pointer-events-none opacity-60">
        <img src="/assets/figma/footer-texture.svg" alt="" className="w-full h-full object-cover" />
      </div>

      {/* CTA band */}
      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-[808px] px-6 text-center">
        <span className="inline-flex items-center gap-2.5 bg-white/10 px-3 py-2 rounded-full">
          <span className="w-[21px] h-2 rounded-full bg-medical-500" />
          <span className="text-white text-[14px] font-normal">Join Dococlock</span>
        </span>
        <h2 className="font-sans font-normal text-white text-[32px] md:text-[46px] leading-[1.2] md:leading-[58px] tracking-[0.92px]">
          Healthcare made simple with smarter appointment scheduling.
        </h2>
        <p className="text-ink-400 text-[16px] tracking-[0.32px] max-w-[600px]">
          Book verified doctors, track your live queue, and manage prescriptions — all from one account.
        </p>
        <button
          onClick={() => onNavigate('/patient/doctors')}
          className="inline-flex items-center rounded-full text-white overflow-hidden mt-2 hover:brightness-105 active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(180deg, #88BEFF 0%, #2E8CFF 100%)' }}
        >
          <span className="pl-6 text-[16px] font-display">Register</span>
          <span className="flex items-center justify-center px-[18px] py-4">
            <ArrowRight size={16} />
          </span>
        </button>
      </div>

      {/* Logo/description + newsletter */}
      <div className="relative z-10 flex flex-col gap-[120px] w-full max-w-[1200px] px-6">
        <div className="flex flex-col md:flex-row gap-10 md:gap-[80px] items-start justify-between">
          <div className="flex flex-col gap-7 w-full md:w-[375px] shrink-0">
            <div className="flex items-center gap-1">
              <img src="/assets/figma/logo-mark.svg" alt="" className="w-[50px] h-[50px]" />
              <span className="text-white text-[28px] font-sans">Dococlock</span>
            </div>
            <p className="text-ink-400 text-[16px] tracking-[0.32px] leading-relaxed">
              Dococlock is a doctor-appointment platform that helps patients find BMDC-verified doctors,
              track their live queue position, and manage digital prescriptions in one place.
            </p>
          </div>
          <div className="flex flex-col gap-7 w-full md:w-[492px] shrink-0">
            <p className="text-ink-400 text-[16px] tracking-[0.32px]">
              "Subscribe to receive appointment reminders, health tips, and product updates."
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
              className="bg-white flex items-center justify-between pl-4 pr-1 py-1 rounded-full w-full"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="flex-1 min-w-0 text-[#2b2929] text-[16px] outline-none bg-transparent"
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-full text-white shrink-0"
                style={{ background: 'linear-gradient(180deg, #88BEFF 0%, #2E8CFF 100%)' }}
              >
                <span className="pl-4 text-[16px] font-display">Subscribe</span>
                <span className="flex items-center justify-center px-[18px] py-4">
                  <ArrowRight size={16} />
                </span>
              </button>
            </form>
          </div>
        </div>

        <p className="text-ink-400 text-[16px] tracking-[0.32px] text-center md:text-left">
          © {new Date().getFullYear()} Dococlock. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
