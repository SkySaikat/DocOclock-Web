import React from 'react';
import { ShieldCheck, HeartPulse, Users, Clock, Activity } from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const values = [
    { icon: ShieldCheck, title: 'Trust', desc: 'Every doctor on Dococlock is BMDC verified before they can accept a single patient.' },
    { icon: Clock, title: 'Time', desc: 'Live queue tracking means you spend less time waiting and more time being seen.' },
    { icon: HeartPulse, title: 'Care', desc: 'Digital prescriptions and records keep your health history with you, always.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-10 text-center">
          <span className="inline-flex items-center gap-2 bg-medical-500/10 text-medical-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-medical-500/20 mb-6">
            About Dococlock
          </span>
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-ink-900 leading-[1.08] mb-6">
            Your Time, Your Health,<br />Fully Controlled.
          </h1>
          <p className="text-ink-500 text-base max-w-xl mx-auto leading-relaxed">
            Dococlock brings transparency to clinical visits — patients search and book verified doctors and track their medicines, doctors run a live patient queue and issue prescriptions online, and hospitals manage it all in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {values.map((v) => (
            <div key={v.title} className="bg-white rounded-ds-lg p-8 shadow-ds-card flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center">
                <v.icon size={22} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink-800">{v.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="py-10 border-y border-ink-100 flex flex-wrap justify-center gap-x-4 gap-y-8 mb-16">
          {[
            { value: '15+', label: 'Years of Combined Experience' },
            { value: '5,000+', label: 'Happy Patients' },
            { value: '100%', label: 'BMDC Verified Doctors' },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <span className="text-ink-900 font-medium text-5xl leading-none">{stat.value}</span>
                <span className="text-ink-500 text-xs font-medium max-w-[160px] leading-snug">{stat.label}</span>
              </div>
              {i < arr.length - 1 && <div className="hidden sm:block w-px bg-ink-100 self-stretch" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-navy-900 rounded-ds-lg p-10 md:p-16 text-center">
          <Users size={28} className="text-medical-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight mb-4 max-w-lg mx-auto">
            Built by clinicians and engineers who were tired of waiting rooms.
          </h2>
          <p className="text-[#93d3fd] text-sm md:text-base font-medium max-w-md mx-auto">
            Dococlock started as a simple queue tracker for one clinic — today it connects patients, doctors and hospitals across the country.
          </p>
        </div>
      </div>
    </div>
  );
};
