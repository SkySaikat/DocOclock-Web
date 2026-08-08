import React, { useState, useMemo } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Search, Activity, ArrowRight, Star, MapPin, GraduationCap, ShieldCheck } from 'lucide-react';
import { UserRole, Doctor } from '../types';
import { fetchDoctors } from '../storage';

interface LandingProps {
  onNavigate: (path: string) => void;
  onLoginRequest?: (role: UserRole) => void;
  onSelectDoctor?: (doctor: Doctor) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate, onLoginRequest, onSelectDoctor }) => {
  const [searchValue, setSearchValue] = useState('');

  // Fetch doctors from storage (demo_doctors)
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  React.useEffect(() => {
    fetchDoctors().then(setDoctors);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('/patient/home');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-16 pt-8 pb-20">

      {/* Hero Section */}
      <div className="text-center max-w-4xl space-y-8 relative w-full px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-50 text-medical-700 text-sm font-bold shadow-ds-pill mb-4">
          <span className="w-2 h-2 rounded-full bg-medical-500"></span>
          #1 Doctor Appointment Platform in Bangladesh
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold text-ink-800 tracking-tight leading-[1.1]">
          Less Delay. <br />
          <span className="text-medical-500">
            More Care.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-ink-500 max-w-2xl mx-auto leading-relaxed">
          The easiest way to book specialists and track live serials. <br className="hidden md:block" />
          <span className="font-bold text-ink-800 underline decoration-medical-200 decoration-4">No login needed</span> to browse.
        </p>

        {/* SEARCH BAR (FIXED: CLEARER, MORE CLICKABLE) */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto w-full z-20 mt-10">
          <div className="absolute -inset-2 bg-medical-200/40 rounded-ds-xl blur-xl opacity-40 group-focus-within:opacity-60 transition duration-500"></div>
          <div className="relative bg-white p-3 rounded-ds-xl shadow-ds-soft flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-medical-50">
            <div className="bg-medical-500 text-white p-4 rounded-2xl shadow-lg shadow-medical-200 shrink-0">
              <Search size={28} />
            </div>
            <div className="flex-1 text-left flex flex-col">
              <span className="text-[10px] font-black text-ink-500 uppercase tracking-widest ml-1 mb-0.5">Search Specialist</span>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Doctors, Specialties, or Hospitals..."
                className="w-full py-1 text-xl font-bold text-ink-800 placeholder:text-slate-300 outline-none bg-transparent cursor-text focus:placeholder:opacity-0 transition-all"
              />
            </div>
            <Button type="submit" className="hidden md:flex items-center gap-2 h-14 px-10 font-display font-black shrink-0 text-lg shadow-xl shadow-medical-100">
              Find Doctor <ArrowRight size={20} />
            </Button>
          </div>
        </form>
      </div>

      {/* FEATURED DOCTORS SECTION (IMPROVED CONTRAST) */}
      <div className="w-full max-w-7xl mx-auto mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 px-4 gap-4">
          <div>
            <h2 className="font-display text-4xl font-bold text-ink-800 tracking-tight">Top Rated Specialists</h2>
            <p className="text-ink-500 font-bold mt-2 text-lg">Book confirmed appointments with the best experts.</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate('/patient/home')} className="flex items-center gap-2 font-black border-slate-300 bg-white px-8 h-12 text-slate-700 hover:text-medical-600 hover:border-medical-500 transition-all">
            View All Doctors <ArrowRight size={18} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {doctors.map((doctor) => (
            <GlassCard
              key={doctor.id}
              className="p-0 overflow-hidden flex flex-col hover:shadow-ds-soft hover:-translate-y-2 transition-all duration-300 cursor-pointer group h-full rounded-ds-lg"
              onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
            >
              {/* Image and basic info */}
              <div className="p-6 flex gap-5 items-start bg-white">
                <img
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-2xl object-cover bg-slate-100 shadow-md border-2 border-white"
                />
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-ink-800 text-xl leading-tight mb-1 truncate group-hover:text-medical-600 transition-colors">{doctor.name}</h3>
                  <p className="text-sm text-teal-600 font-black mb-2 uppercase tracking-wide">{doctor.specialty}</p>
                  <div className="flex items-center gap-1.5 text-sm font-black text-slate-700">
                    <Star size={16} fill="currentColor" className="text-amber-500" />
                    <span>{doctor.rating}</span>
                    <span className="text-ink-500 font-bold">({doctor.totalPatients}+ Patients)</span>
                  </div>
                </div>
              </div>

              {/* Details with High Contrast */}
              <div className="px-6 pb-6 space-y-4 flex-1 bg-white">
                <div className="flex items-start gap-3 text-sm text-slate-800 font-bold leading-relaxed">
                  <GraduationCap size={20} className="text-medical-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{doctor.degrees}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-800 font-bold leading-relaxed">
                  <MapPin size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{doctor.chambers[0]?.name}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-ink-500 uppercase font-black tracking-widest leading-none mb-1">Visiting Fee</p>
                  <p className="font-stat text-2xl font-bold text-ink-800">৳ {doctor.chambers[0]?.fee}</p>
                </div>
                <Button className="px-6 font-black h-12 shadow-lg shadow-medical-100">Book Now</Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ARE YOU A DOCTOR SECTION — dark closing CTA band (brand navy) */}
      <div className="w-full px-4 max-w-7xl mx-auto mt-12">
        <div className="relative rounded-ds-xl bg-navy-900 p-8 md:p-16 overflow-hidden shadow-2xl">
          {/* Decorative Blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-widest border border-white/30 backdrop-blur-sm w-fit mx-auto lg:mx-0">
                <Activity size={16} /> Practice Management
              </div>
              <h2 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">
                Are you a Doctor?
              </h2>
              <p className="text-[#93d3fd] text-xl md:text-2xl font-bold leading-relaxed opacity-90">
                Manage your practice, patient queue, and digital prescriptions effortlessly with our all-in-one portal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 shrink-0 w-full lg:w-auto">
              <Button
                onClick={() => onNavigate('/for-doctors')}
                className="bg-white text-medical-600 hover:bg-medical-50 hover:scale-105 active:scale-95 transition-all h-16 px-12 text-xl font-display font-black shadow-2xl border-none w-full sm:w-auto"
              >
                Join Now
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('/doctor-login')}
                className="h-16 px-12 text-xl font-display font-black border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md w-full sm:w-auto"
              >
                Doctor Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};