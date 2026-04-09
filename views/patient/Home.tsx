import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import {
   Search, Heart, Activity, Brain, Stethoscope, Star, MapPin,
   ShieldCheck, Users, Clock, ArrowRight, X, GraduationCap,
   ChevronRight, Calendar, Sparkles, Bell, Pill, BriefcaseMedical,
   Baby, BabyIcon, VenetianMask, Syringe, Thermometer, BrainCircuit,
   Microscope, Droplets, UserRound, Zap, Bone, HeartPulse, ClipboardPlus
} from 'lucide-react';
import { Doctor, UserRole } from '../../types';
import { DoctorCard } from '../../components/ui/DoctorCard';
import { SpecialtyCard } from '../../components/ui/SpecialtyCard';
import { fetchAppointments, PatientStorage, fetchQueueSession, fetchDoctors } from '../../storage';
import { getLocalISODate } from '../../utils/date';
import { BrowseSpecialtySection } from '../../components/ui/BrowseSpecialtySection';
import { RecommendedDoctorsSection } from '../../components/ui/RecommendedDoctorsSection';
import { FindDoctorsNearMe } from '../../components/patient/FindDoctorsNearMe';
import { supabase } from '../../supabase';

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
   const [doctors, setDoctors] = useState<Doctor[]>([]);
   const [activeAppointment, setActiveAppointment] = useState<any>(null);
   const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

   useEffect(() => {
      const loadDoctors = async () => {
         try {
            console.log('[Home] Fetching doctors from storage...');
            const data = await fetchDoctors();
            console.log('[Home] Doctors loaded:', data.length);
            setDoctors(data);
         } catch (err) {
            console.error('[Home] Error loading doctors:', err);
         }
      };

      loadDoctors();
   }, []);

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

   useEffect(() => {
      const loadActiveSchedule = async () => {
         if (!session || !doctors.length) return;
         setIsLoadingSchedule(true);
         try {
            const today = getLocalISODate();
            const apps = await fetchAppointments({ patientId: session.id, date: today });

            // Rules: Patient Appointments must filter by patient session
            const patientApps = apps.filter(a =>
               (a.patientId === session.id || a.patientId.startsWith('family-')) &&
               a.date === today &&
               a.status !== 'cancelled'
            );

            if (patientApps.length === 0) {
               setActiveAppointment(null);
               return;
            }

            const sorted = patientApps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const earliest = sorted[0];
            if (!earliest) {
               setActiveAppointment(null);
               return;
            }

            const doc = doctors.find(d => d.id === earliest.doctorId);

            let isArrived = false;
            if (earliest.doctorId && earliest.hospitalId) {
               const qSession = await fetchQueueSession(earliest.doctorId, earliest.hospitalId, today);
               isArrived = qSession.isDoctorArrived;
            }

            setActiveAppointment({
               doctorName: doc?.name || 'Doctor',
               time: earliest.time || 'N/A',
               date: earliest.date === today ? 'Today' : earliest.date,
               serialNumber: earliest.serialNumber ? earliest.serialNumber.toString().padStart(2, '0') : '00',
               chamber: (doc?.chambers || []).find(c => c.id === earliest.hospitalId)?.name || earliest.chamberName || 'Chamber',
               isArrived,
               hospitalId: earliest.hospitalId
            });
         } catch (error) {
            console.error('Error loading schedule on Home:', error);
         } finally {
            setIsLoadingSchedule(false);
         }
      };

      loadActiveSchedule();
   }, [session, doctors, userRole]);

   const categories = [
      { name: 'General Physician', subtitle: 'Primary Care Physician', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
      { name: 'Pediatrics', subtitle: 'Child Health Care', icon: Baby, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { name: 'Gynae & Obs', subtitle: "Women's Health Care", icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
      { name: 'Dermatology', subtitle: 'Skin, Hair & Sexual Health', icon: Sparkles, color: 'text-orange-600', bg: 'bg-orange-50' },
      { name: 'Internal Medicine', subtitle: 'General Health & Medicine', icon: ClipboardPlus, color: 'text-sky-600', bg: 'bg-sky-50' },
      { name: 'Endocrinology', subtitle: 'Diabetes, Thyroid & Hormone', icon: Droplets, color: 'text-teal-600', bg: 'bg-teal-50' },
      { name: 'Neurology', subtitle: 'Brain, Spine & Nerve', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
      { name: 'Gastroenterology', subtitle: 'Stomach, Liver & Gut', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { name: 'Cardiology', subtitle: 'Heart Disease & Vascular Disease', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
   ];

   const handleCategoryClick = (categoryName: string) => {
      const keywords: Record<string, string> = {
         'General Physician': 'Physician',
         'Cardiology': 'Cardiologist',
         'Neurology': 'Neurologist',
         'Pediatrics': 'Pediatrician',
         'Dermatology': 'Dermatologist',
         'Internal Medicine': 'Medicine',
         'Endocrinology': 'Endocrinology',
         'Gastroenterology': 'Gastroenterologist',
         'Gynae & Obs': 'Gynecologist'
      };
      const specialty = keywords[categoryName] || categoryName;
      setSelectedSpecialty(specialty === selectedSpecialty ? 'All' : specialty);
   };

   // 1. Refined browseList (Master List)
   const browseList = useMemo(() => {
      const filtered = doctors.filter(doc => {
         const term = searchTerm.toLowerCase();
         // Search in Name, Specialty, and ALL Chamber names
         const matchesName = doc.name.toLowerCase().includes(term);
         const matchesSpecialty = doc.specialty.toLowerCase().includes(term);
         const matchesHospitals = (doc.chambers || []).some(c => c.name.toLowerCase().includes(term));

         const matchesSearch = searchTerm === '' || matchesName || matchesSpecialty || matchesHospitals;

         const matchesSelectedSpecialty = selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

         return matchesSearch && matchesSelectedSpecialty;
      });

      // Prioritize Real Doctors (!isDemo) over Demo Doctors (isDemo)
      return [...filtered].sort((a, b) => {
         const aDemo = !!a.isDemo;
         const bDemo = !!b.isDemo;
         if (!aDemo && bDemo) return -1;
         if (aDemo && !bDemo) return 1;
         return (b.rating || 0) - (a.rating || 0);
      });
   }, [doctors, searchTerm, selectedSpecialty]);

   return (
      <div className="min-h-screen bg-white font-sans text-slate-900 pb-24" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
         <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* HERO SECTION - REFINED SHARPNESS */}
            <div className="pt-8 pb-12 md:pt-16 md:pb-20">
               <div className="relative rounded-[24px] bg-slate-900 border border-slate-800 shadow-2xl"
                  style={{
                     background: 'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.1), transparent 50%), #0F172A'
                  }}>

                  <div className="relative z-10 px-6 py-12 md:px-12 md:py-20 lg:pr-32">
                     <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/20">
                        <ShieldCheck size={12} />
                        <span>BMDC Verified Doctors</span>
                     </div>

                     <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
                        Healthcare, <br />
                        <span className="text-blue-500">Simplified.</span>
                     </h1>

                     <p className="text-sm md:text-base text-slate-400 font-medium mb-10 max-w-lg leading-relaxed">
                        Book top specialists instantly, track your live serial status, and manage your health records in one premium platform.
                     </p>

                     {/* Search Bar - Disciplined Integration */}
                     <div ref={searchContainerRef} className="relative max-w-xl group">
                        <div className="bg-white/5 backdrop-blur-md flex items-center gap-2 md:gap-3 p-1.5 rounded-[18px] border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all duration-300">
                           <div className="bg-blue-600 text-white p-2.5 md:p-3 rounded-[14px] shadow-lg shadow-blue-500/20 shrink-0">
                              <Search size={18} className="md:w-5 md:h-5" />
                           </div>
                           <input
                              ref={searchInputRef}
                              className="flex-1 min-w-0 py-2 text-sm md:text-base outline-none text-white placeholder:text-slate-500 font-bold bg-transparent"
                              placeholder="Search Doctor..."
                              value={searchTerm}
                              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                              onFocus={() => setShowDropdown(true)}
                           />
                           {searchTerm && (
                              <button onClick={() => { setSearchTerm(''); setShowDropdown(false); }} className="p-2 text-slate-400 hover:text-white transition-colors mr-2">
                                 <X size={18} />
                              </button>
                           )}
                        </div>

                        {showDropdown && searchTerm && browseList.length > 0 && (
                           <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="divide-y divide-slate-50">
                                 {browseList.slice(0, 5).map(doc => (
                                    <div key={doc.id} onClick={() => { onSelectDoctor?.(doc); setShowDropdown(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex gap-4 items-center group transition-colors">
                                       <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                          {doc.imageUrl && <img src={doc.imageUrl} className="w-full h-full object-cover" alt={doc.name} />}
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{doc.name}</h4>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.specialty}</p>
                                       </div>
                                       <div className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">View Profile</div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* NEW HIGH-IMPACT ATTENTION SECTION */}
            <div className="py-12 md:py-20 flex flex-col md:flex-row gap-12 items-center">
               <div className="flex-1 space-y-4">
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                     Your Time. Your Health. <br />
                     <span className="text-blue-600">Fully Controlled.</span>
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-md">
                     DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly.
                  </p>
               </div>
               <div className="flex-1 w-full max-w-md bg-slate-50/50 rounded-[24px] border border-slate-100 p-8 space-y-8">
                  {[
                     { icon: Activity, title: "Live Queue Tracking", desc: "Know exactly when to enter the chamber." },
                     { icon: ShieldCheck, title: "BMDC Verified", desc: "Every doctor on our platform is verified." },
                     { icon: Pill, title: "Digital Prescription", desc: "Archive and access your Rxs anytime." }
                  ].map((feat, i) => (
                     <div key={i} className="flex gap-5 items-start">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-blue-600 shrink-0">
                           <feat.icon size={20} />
                        </div>
                        <div>
                           <h4 className="text-[15px] font-black text-slate-900 mb-1">{feat.title}</h4>
                           <p className="text-[13px] text-slate-500 font-medium leading-normal">{feat.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* TRUST METRICS SECTION - STRUCTURED & PREMIUM */}
            <div className="mb-12">
               <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 p-8 md:p-10">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                     {[
                        { icon: Users, label: "Specialists", value: "1.7K+", color: "text-blue-600", bg: "bg-blue-100/50" },
                        { icon: ShieldCheck, label: "Verified", value: "100%", color: "text-emerald-600", bg: "bg-emerald-100/50" },
                        { icon: Clock, label: "Live Queue", value: "24/7", color: "text-indigo-600", bg: "bg-indigo-100/50" },
                        { icon: Heart, label: "Success Rate", value: "99%", color: "text-rose-600", bg: "bg-rose-100/50" }
                     ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center text-center group">
                           <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                              <stat.icon size={22} />
                           </div>
                           <h4 className="text-2xl md:text-3xl font-black text-slate-900 leading-none mb-2 tracking-tight">{stat.value}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* UPCOMING APPOINTMENT (IF ANY) */}
            {isPatient && activeAppointment && (
               <div className="mb-12">
                  <div className="mb-6">
                     <h2 className="text-[24px] font-bold tracking-[-0.3px] text-slate-900 leading-tight">Your Schedule</h2>
                     <p className="text-[14px] text-slate-500 font-medium mt-1 opacity-60">Your confirmed medical visits</p>
                  </div>
                  <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
                     <div className="flex flex-col md:flex-row">
                        <div className="bg-slate-900 p-8 md:w-48 flex flex-col items-center justify-center text-white text-center">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Serial Now</span>
                           <span className="text-6xl font-black tracking-tighter leading-none">{activeAppointment.serialNumber}</span>
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

            {/* LOCATION-BASED DISCOVERY */}
            <FindDoctorsNearMe onSelectDoctor={onSelectDoctor} />

            {/* MODULAR SECTIONS */}
            <RecommendedDoctorsSection
               doctors={browseList}
               selectedSpecialty={selectedSpecialty}
               onSelectDoctor={onSelectDoctor}
               onClearFilters={() => { setSelectedSpecialty('All'); setSearchTerm(''); }}
            />

            <BrowseSpecialtySection
               categories={categories}
               onCategoryClick={handleCategoryClick}
               selectedSpecialty={selectedSpecialty}
            />

            {/* DOCTOR PARTNERSHIP Section - Refined */}
            {!isPatient && (
               <section className="py-12 mb-12 animate-in fade-in duration-1000">
                  <div className="bg-slate-900 rounded-[24px] p-8 md:p-16 relative overflow-hidden shadow-2xl border border-slate-800"
                     style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.1), transparent 50%), #0F172A' }}>
                     <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/5 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/10 backdrop-blur-sm">
                           <BriefcaseMedical size={14} />
                           <span>Doctor Partnership</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">Are you a Doctor?</h2>
                        <p className="text-[15px] text-slate-400 font-medium mb-12 leading-relaxed opacity-80 max-w-md">
                           Join DocOclock to modernize your practice, manage patient queues, and issue professional digital prescriptions effortlessly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                           <Button onClick={() => onNavigate('/for-doctors')} className="h-14 px-12 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Join Now</Button>
                           <Button variant="outline" onClick={() => onNavigate('/doctor-login')} className="h-14 px-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-sm uppercase tracking-widest backdrop-blur-sm transition-all active:scale-95">Dashboard</Button>
                        </div>
                     </div>
                  </div>
               </section>
            )}
         </div>
      </div>
   );
};
