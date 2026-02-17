import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import {
   Search, Heart, Activity, Brain, Stethoscope, Star, MapPin,
   ShieldCheck, Users, Clock, ArrowRight, X, GraduationCap,
   ChevronRight, Calendar, Sparkles, Bell, Pill, BriefcaseMedical
} from 'lucide-react';
import { Doctor, UserRole } from '../../types';
import { DoctorCard } from '../../components/ui/DoctorCard';
import { SpecialtyCard } from '../../components/ui/SpecialtyCard';
import { getAppointments, PatientStorage, getDoctors, getArrivalStatus } from '../../storage';
import { getLocalISODate } from '../../utils/date';
import { BrowseSpecialtySection } from '../../components/ui/BrowseSpecialtySection';
import { RecommendedDoctorsSection } from '../../components/ui/RecommendedDoctorsSection';

interface HomeProps {
   onNavigate: (path: string) => void;
   onSelectDoctor?: (doctor: Doctor) => void;
   userRole?: UserRole;
   focusSearchTrigger?: number;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onSelectDoctor, userRole, focusSearchTrigger }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedSpecialty, setSelectedSpecialty] = useState('All');
   const [showDropdown, setShowDropdown] = useState(false);

   const searchContainerRef = useRef<HTMLDivElement>(null);
   const searchInputRef = useRef<HTMLInputElement>(null);

   const session = useMemo(() => PatientStorage.get(), []);
   const doctors = useMemo(() => getDoctors(), []);

   useEffect(() => {
      if (focusSearchTrigger && searchContainerRef.current) {
         searchContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
         searchInputRef.current?.focus();
      }
   }, [focusSearchTrigger]);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowDropdown(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const isPatient = userRole === UserRole.PATIENT;

   const activeAppointment = useMemo(() => {
      if (!session) return null;
      const apps = getAppointments();
      const today = getLocalISODate();

      // Rules: Patient Appointments must filter by patientPhone
      const futureApps = apps.filter(a =>
         a.patientPhone === session.phone &&
         a.date &&
         a.date >= today &&
         a.status !== 'cancelled'
      );

      if (futureApps.length === 0) return null;

      const sorted = futureApps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const earliest = sorted[0];
      if (!earliest) return null;

      const doc = doctors.find(d => d.id === earliest.doctorId);

      const isArrived = (earliest.doctorId && earliest.hospitalId && earliest.date === today)
         ? getArrivalStatus(earliest.doctorId, earliest.hospitalId, today)
         : false;

      return {
         doctorName: doc?.name || 'Doctor',
         time: earliest.time || 'N/A',
         date: earliest.date === today ? 'Today' : earliest.date,
         serialNumber: earliest.serialNumber ? earliest.serialNumber.toString().padStart(2, '0') : '00',
         chamber: doc?.chambers.find(c => c.id === earliest.hospitalId)?.name || earliest.chamberName || 'Chamber',
         isArrived,
         hospitalId: earliest.hospitalId
      };
   }, [session, doctors]);

   const categories = [
      { name: 'General Physician', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
      { name: 'Cardiology', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
      { name: 'Neurology', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { name: 'Pediatrics', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { name: 'Dermatology', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
      { name: 'Orthopedics', icon: Activity, color: 'text-sky-600', bg: 'bg-sky-50' },
   ];

   const handleCategoryClick = (categoryName: string) => {
      const keywords: Record<string, string> = {
         'General Physician': 'Physician',
         'Cardiology': 'Cardiologist',
         'Neurology': 'Neurologist',
         'Pediatrics': 'Pediatrician',
         'Dermatology': 'Dermatologist',
         'Orthopedics': 'Orthopedics'
      };
      const specialty = keywords[categoryName] || categoryName;
      setSelectedSpecialty(specialty === selectedSpecialty ? 'All' : specialty);
   };

   const browseList = useMemo(() => {
      const filtered = doctors.filter(doc => {
         const matchesSearch = searchTerm === '' ||
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesSpecialty = selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
         return matchesSearch && matchesSpecialty;
      });

      // Prioritize Real Doctors (!isDemo) over Demo Doctors (isDemo)
      // Secondary sort by rating (descending)
      return [...filtered].sort((a, b) => {
         // Sort by Demo status: Real doctors first (isDemo: false/undefined)
         const aDemo = !!a.isDemo;
         const bDemo = !!b.isDemo;

         if (!aDemo && bDemo) return -1;
         if (aDemo && !bDemo) return 1;

         // Within same group, sort by rating
         return (b.rating || 0) - (a.rating || 0);
      });
   }, [doctors, searchTerm, selectedSpecialty]);

   return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
         {/* HERO SECTION */}
         <div className="max-w-6xl mx-auto px-4 pt-10 pb-20 md:pt-16 md:pb-28">
            <div className="relative overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_40px_80px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] border border-white/5"
               style={{
                  background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 50%), linear-gradient(135deg, #0F172A, #1E293B)'
               }}>
               {/* Background elements */}
               <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px] animate-blob"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
               </div>

               <div className="relative z-10 px-8 py-16 md:px-16 md:py-24 max-w-4xl">
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 px-4 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider mb-8 border border-blue-500/20 backdrop-blur-sm">
                     <ShieldCheck size={14} />
                     <span>BMDC Verified Doctors Only</span>
                  </div>

                  <h1 className="text-[clamp(32px,6vw,48px)] font-bold tracking-[-0.5px] text-white leading-[1.1] mb-6">
                     Healthcare, <br />
                     <span className="bg-gradient-to-br from-[#5B8CFF] to-[#2ED6A1] bg-clip-text text-transparent">Simplified.</span>
                  </h1>

                  <p className="text-[15px] text-slate-300 font-medium mb-10 max-w-[90%] leading-relaxed opacity-85">
                     Book top specialists instantly, track your live serial status, and manage your health records in one premium platform.
                  </p>

                  {/* Search Bar - Luxury Glassmorphism */}
                  <div ref={searchContainerRef} className="relative group/search max-w-2xl">
                     <div className="backdrop-blur-xl bg-white/10 p-2 flex items-center gap-3 shadow-2xl rounded-3xl border border-white/10 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-500/30">
                           <Search size={24} />
                        </div>
                        <input
                           ref={searchInputRef}
                           className="flex-1 py-2 text-lg outline-none text-white placeholder:text-slate-400 font-medium bg-transparent"
                           placeholder="Doctor or Specialty..."
                           value={searchTerm}
                           onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                           onFocus={() => setShowDropdown(true)}
                        />
                        {searchTerm && (
                           <button onClick={() => { setSearchTerm(''); setShowDropdown(false); }} className="p-2 text-slate-300 hover:text-white transition-colors">
                              <X size={20} />
                           </button>
                        )}
                     </div>

                     {showDropdown && searchTerm && browseList.length > 0 && (
                        <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                           <div className="divide-y divide-slate-100/50">
                              {browseList.slice(0, 5).map(doc => (
                                 <div key={doc.id} onClick={() => { onSelectDoctor?.(doc); setShowDropdown(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex gap-4 items-center group transition-colors">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                       {doc.imageUrl && <img src={doc.imageUrl} className="w-full h-full object-cover" alt={doc.name} />}
                                    </div>
                                    <div className="flex-1">
                                       <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                                       <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wider">{doc.specialty}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-6xl mx-auto px-4">
            {/* STATS STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 -mt-12 mb-20 relative z-20">
               {[
                  { icon: Users, label: "Specialists", value: "1.7k+", color: "bg-blue-600/10 text-blue-600" },
                  { icon: ShieldCheck, label: "BMDC Verified", value: "100%", color: "bg-emerald-600/10 text-emerald-600" },
                  { icon: Clock, label: "Live Queue", value: "24/7", color: "bg-indigo-600/10 text-indigo-600" },
                  { icon: Heart, label: "Happy Patients", value: "99%", color: "bg-rose-600/10 text-rose-600" }
               ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-[20px] shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
                     <div className={`w-12 h-12 rounded-[14px] ${stat.color} flex items-center justify-center shrink-0 shadow-sm font-bold`}>
                        <stat.icon size={24} />
                     </div>
                     <div>
                        <p className="text-[11px] font-bold text-slate-900/60 uppercase tracking-[1px]">{stat.label}</p>
                        <h4 className="text-[22px] font-bold text-slate-900 leading-none mt-1">{stat.value}</h4>
                     </div>
                  </div>
               ))}
            </div>

            {/* UPCOMING APPOINTMENT (IF ANY) */}
            {isPatient && activeAppointment && (
               <div className="mb-12">
                  <div className="mb-6">
                     <h2 className="text-[24px] font-bold tracking-[-0.3px] text-slate-900 leading-tight">Your Schedule</h2>
                     <p className="text-[14px] text-slate-500 font-medium mt-1 opacity-60">Your confirmed medical visits</p>
                  </div>
                  <div className="bg-white rounded-[28px] shadow-lg border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
                     <div className="flex flex-col md:flex-row">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 md:w-48 flex flex-col items-center justify-center text-white text-center">
                           <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Serial Now</span>
                           <span className="text-6xl font-bold tracking-tighter leading-none">{activeAppointment.serialNumber}</span>
                           <div className="mt-4 flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ring-1 ring-white/10">
                              {activeAppointment.isArrived ? <Activity size={12} className="animate-pulse" /> : <Clock size={12} />}
                              <span>{activeAppointment.isArrived ? 'Live' : 'Expected'}</span>
                           </div>
                        </div>
                        <div className="flex-1 p-8 flex flex-col justify-between">
                           <div className="space-y-5">
                              <div className="space-y-1">
                                 <p className="text-[12px] text-blue-600 font-bold uppercase tracking-widest">Appointment Details</p>
                                 <h2 className="text-[22px] font-bold text-slate-900">{activeAppointment.doctorName}</h2>
                              </div>
                              <div className="flex flex-wrap gap-x-8 gap-y-3">
                                 <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-600"><Calendar size={18} className="text-blue-500" /> {activeAppointment.date}</span>
                                 <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-600"><Clock size={18} className="text-emerald-500" /> {activeAppointment.time}</span>
                                 <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-600"><MapPin size={18} className="text-rose-500" /> {activeAppointment.chamber}</span>
                              </div>
                           </div>
                           <div className="mt-8 flex gap-3">
                              <Button onClick={() => onNavigate('/live-serial')} className="h-12 rounded-2xl px-10 bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 font-bold transition-all">Track Live Queue</Button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* MODULAR SECTIONS */}
            <BrowseSpecialtySection
               categories={categories}
               onCategoryClick={handleCategoryClick}
               selectedSpecialty={selectedSpecialty}
            />

            <RecommendedDoctorsSection
               doctors={browseList}
               selectedSpecialty={selectedSpecialty}
               onSelectDoctor={onSelectDoctor}
               onClearFilters={() => { setSelectedSpecialty('All'); setSearchTerm(''); }}
            />

            {/* DOCTOR PARTNERSHIP Section */}
            {!isPatient && (
               <section className="py-12 mb-12">
                  <div className="bg-slate-900 rounded-[32px] p-8 md:p-20 relative overflow-hidden shadow-2xl border border-white/5"
                     style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.15), transparent 60%), #0F172A' }}>
                     <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
                     <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/5 text-blue-300 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider mb-8 border border-white/10 backdrop-blur-sm">
                           <BriefcaseMedical size={14} />
                           <span>Doctor Partnership</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-6 tracking-tight">Are you a Doctor?</h2>
                        <p className="text-[16px] text-slate-400 font-medium mb-12 leading-relaxed opacity-80">
                           Join DocOclock to modernize your practice, manage patient queues, and issue professional digital prescriptions effortlessly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
                           <Button onClick={() => onNavigate('/for-doctors')} className="h-14 px-12 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-500 transition-all active:scale-95">Join DocOclock</Button>
                           <Button variant="outline" onClick={() => onNavigate('/doctor-login')} className="h-14 px-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-lg backdrop-blur-sm transition-all active:scale-95">Partner Login</Button>
                        </div>
                     </div>
                  </div>
               </section>
            )}
         </div>
      </div>
   );
};
