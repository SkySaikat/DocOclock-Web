import React from 'react';
import { Microscope, Bell } from 'lucide-react';

export const LabDiagnosticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="pt-16 pb-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 bg-medical-500/10 text-medical-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-medical-500/20 mb-6">
            Coming Soon
          </span>
          <div className="w-16 h-16 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center mb-6">
            <Microscope size={28} />
          </div>
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-ink-900 leading-[1.08] mb-4">
            Lab &amp; Diagnostic
          </h1>
          <p className="text-ink-500 text-base max-w-xl leading-relaxed mb-10">
            We're building direct booking for lab tests and diagnostic imaging — same live-queue tracking and digital
            reports you already get from Dococlock doctor visits.
          </p>
          <div className="bg-medical-50/60 rounded-ds-lg p-6 flex items-center gap-4 max-w-md">
            <Bell size={20} className="text-medical-600 shrink-0" />
            <p className="text-sm text-ink-600 font-medium text-left">
              Want to be notified when this launches? Reach out from the Contact us page and we'll let you know.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
