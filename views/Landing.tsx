import React, { useState, useMemo } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Search, Activity, ArrowRight, Star, MapPin, GraduationCap, ShieldCheck } from 'lucide-react';
import { UserRole, Doctor } from '../types';
import { getDoctors } from '../storage';

interface LandingProps {
  onNavigate: (path: string) => void;
  onLoginRequest?: (role: UserRole) => void;
  onSelectDoctor?: (doctor: Doctor) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate, onLoginRequest, onSelectDoctor }) => {
  const [searchValue, setSearchValue] = useState('');

  // Fetch doctors from storage (demo_doctors)
  const doctors = useMemo(() => getDoctors(), []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('/patient/home');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-16 pt-8 pb-20">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl space-y-8 relative w-full px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold shadow-sm mb-4 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          #1 Doctor Appointment Platform in Bangladesh
        </div>
        
        <h1 className="text-5xl md:text-8xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
          Less Delay. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 animate-gradient-x">
            More Care.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The easiest way to book specialists and track live serials. <br className="hidden md:block" />
          <span className="font-extrabold text-slate-900 underline decoration-blue-200 decoration-4">No login needed</span> to browse.
        </p>

        {/* SEARCH BAR (FIXED: CLEARER, MORE CLICKABLE) */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto w-full z-20 mt-10">
           <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-teal-400 rounded-[2.5rem] blur-xl opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
           <div className="relative bg-white border-2 border-slate-200 p-3 rounded-[2rem] shadow-2xl flex items-center gap-4 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
              <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 shrink-0">
                 <Search size={28} />
              </div>
              <div className="flex-1 text-left flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-0.5">Search Specialist</span>
                 <input 
                   type="text"
                   value={searchValue}
                   onChange={(e) => setSearchValue(e.target.value)}
                   placeholder="Doctors, Specialties, or Hospitals..."
                   className="w-full py-1 text-xl font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent cursor-text focus:placeholder:opacity-0 transition-all"
                 />
              </div>
              <Button type="submit" className="hidden md:flex items-center gap-2 h-14 px-10 rounded-2xl font-black shrink-0 text-lg shadow-xl shadow-blue-100">
                 Find Doctor <ArrowRight size={20}/>
              </Button>
           </div>
        </form>
      </div>

      {/* FEATURED DOCTORS SECTION (IMPROVED CONTRAST) */}
      <div className="w-full max-w-7xl mx-auto mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 px-4 gap-4">
              <div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Top Rated Specialists</h2>
                 <p className="text-slate-600 font-bold mt-2 text-lg">Book confirmed appointments with the best experts.</p>
              </div>
              <Button variant="outline" onClick={() => onNavigate('/patient/home')} className="flex items-center gap-2 font-black border-slate-300 bg-white px-8 h-12 rounded-xl text-slate-700 hover:text-blue-600 hover:border-blue-500 transition-all">
                  View All Doctors <ArrowRight size={18}/>
              </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {doctors.map((doctor) => (
                  <GlassCard 
                    key={doctor.id} 
                    className="p-0 overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group h-full border-0 ring-1 ring-slate-200" 
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
                              <h3 className="font-black text-slate-900 text-xl leading-tight mb-1 truncate group-hover:text-blue-600 transition-colors">{doctor.name}</h3>
                              <p className="text-sm text-teal-600 font-black mb-2 uppercase tracking-wide">{doctor.specialty}</p>
                              <div className="flex items-center gap-1.5 text-sm font-black text-slate-700">
                                 <Star size={16} fill="currentColor" className="text-yellow-400"/>
                                 <span>{doctor.rating}</span>
                                 <span className="text-slate-400 font-bold">({doctor.totalPatients}+ Patients)</span>
                              </div>
                          </div>
                      </div>

                      {/* Details with High Contrast */}
                      <div className="px-6 pb-6 space-y-4 flex-1 bg-white">
                          <div className="flex items-start gap-3 text-sm text-slate-800 font-bold leading-relaxed">
                              <GraduationCap size={20} className="text-blue-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{doctor.degrees}</span>
                          </div>
                          <div className="flex items-start gap-3 text-sm text-slate-800 font-bold leading-relaxed">
                              <MapPin size={20} className="text-red-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{doctor.chambers[0]?.name}</span>
                          </div>
                      </div>

                      <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                          <div>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Visiting Fee</p>
                              <p className="text-2xl font-black text-slate-900">৳ {doctor.chambers[0]?.fee}</p>
                          </div>
                          <Button className="px-6 font-black h-12 rounded-xl shadow-lg shadow-blue-100">Book Now</Button>
                      </div>
                  </GlassCard>
              ))}
          </div>
      </div>

      {/* ARE YOU A DOCTOR SECTION (FIXED: HIGH VISIBILITY) */}
      <div className="w-full px-4 max-w-7xl mx-auto mt-12">
          <div className="relative rounded-[3rem] bg-teal-600 p-8 md:p-16 overflow-hidden shadow-2xl shadow-teal-200">
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                  <div className="text-center lg:text-left space-y-6 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-widest border border-white/30 backdrop-blur-sm w-fit mx-auto lg:mx-0">
                          <Activity size={16} /> Practice Management
                      </div>
                      <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                        Are you a Doctor?
                      </h2>
                      <p className="text-teal-50 text-xl md:text-2xl font-bold leading-relaxed opacity-90">
                        Manage your practice, patient queue, and digital prescriptions effortlessly with our all-in-one portal.
                      </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-5 shrink-0 w-full lg:w-auto">
                      <Button 
                        onClick={() => onNavigate('/for-doctors')}
                        className="bg-white text-teal-700 hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all h-16 px-12 text-xl font-black shadow-2xl shadow-teal-900/20 border-none rounded-2xl w-full sm:w-auto"
                      >
                         Join Now
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => onNavigate('/doctor-login')}
                        className="h-16 px-12 text-xl font-black border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md rounded-2xl w-full sm:w-auto"
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