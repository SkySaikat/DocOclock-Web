import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import {
   Search, Heart, Activity, Brain, Stethoscope, Star, MapPin,
   ShieldCheck, Users, Clock, ArrowRight, X, GraduationCap,
   ChevronRight, Calendar, Sparkles, Bell, Pill, FileText, BriefcaseMedical,
   Baby, BabyIcon, VenetianMask, Syringe, Thermometer, BrainCircuit,
   Microscope, Droplets, UserRound, Zap, Bone, HeartPulse, ClipboardPlus, Wind
} from 'lucide-react';
import { Doctor, UserRole } from '../../types';
import { DoctorCard } from '../../components/ui/DoctorCard';
import { SpecialtyCard } from '../../components/ui/SpecialtyCard';
import { fetchAppointments, PatientStorage, fetchQueueSession, fetchDoctors } from '../../storage';
import { getLocalISODate } from '../../utils/date';
import { BrowseSpecialtySection } from '../../components/ui/BrowseSpecialtySection';
import { RecommendedDoctorsSection } from '../../components/ui/RecommendedDoctorsSection';
import { FindDoctorsNearMe } from '../../components/patient/FindDoctorsNearMe';
import { HeroSlider } from '../../components/patient/HeroSlider';
import { supabase } from '../../supabase';

const HEALTH_TIPS = [
   { emoji: '💧', tip: 'Drink 8 glasses of water daily to stay hydrated and support kidney function.' },
   { emoji: '🚶', tip: 'A 30-minute walk each day reduces heart disease risk by up to 35%.' },
   { emoji: '😴', tip: 'Adults need 7–9 hours of quality sleep for optimal cognitive and immune function.' },
   { emoji: '🥦', tip: 'Eating 5 servings of vegetables daily can lower cancer risk by 20%.' },
   { emoji: '🧘', tip: 'Just 10 minutes of mindfulness daily significantly reduces cortisol levels.' },
   { emoji: '🩺', tip: 'Annual check-ups catch conditions early — prevention is always better than cure.' },
   { emoji: '🫁', tip: 'Deep breathing exercises 3× daily can lower blood pressure naturally.' },
   { emoji: '🦷', tip: 'Brushing for 2 minutes twice daily prevents gum disease linked to heart problems.' },
];

const HealthTipsSection: React.FC = () => {
   const [idx, setIdx] = useState(0);

   useEffect(() => {
      const t = setInterval(() => setIdx(i => (i + 1) % HEALTH_TIPS.length), 6000);
      return () => clearInterval(t);
   }, []);

   const tip = HEALTH_TIPS[idx];
   const next = HEALTH_TIPS[(idx + 1) % HEALTH_TIPS.length];

   return (
      <div className="mb-10">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-ink-500 uppercase tracking-widest px-1">Daily Health Tip</h2>
            <div className="flex gap-1">
               {HEALTH_TIPS.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                     className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'bg-medical-500 w-4' : 'bg-ink-100 w-1.5'}`} />
               ))}
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-medical-50 border border-medical-100 rounded-ds-md p-5 flex gap-4 items-start transition-all duration-500">
               <span className="text-2xl shrink-0">{tip.emoji}</span>
               <p className="text-sm font-medium text-ink-700 leading-relaxed">{tip.tip}</p>
            </div>
            <div className="bg-ink-50 border border-ink-100 rounded-ds-md p-5 flex gap-4 items-start opacity-60 hidden md:flex">
               <span className="text-2xl shrink-0">{next.emoji}</span>
               <p className="text-sm font-medium text-ink-500 leading-relaxed">{next.tip}</p>
            </div>
         </div>
      </div>
   );
};

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
   const [isLocationFeatureEnabled, setIsLocationFeatureEnabled] = useState(false);
   const [heroBanners, setHeroBanners] = useState<any[]>([]);

   useEffect(() => {
      const fetchSettings = async () => {
         try {
            const { data, error } = await supabase.from('system_settings').select('value').eq('key', 'location_search_enabled').single();
            if (!error && data) {
               setIsLocationFeatureEnabled(data.value === 'true');
            }
         } catch (err) {
            console.error('Failed to load system settings:', err);
         }
      };

      fetchSettings();
   }, []);

   useEffect(() => {
      supabase.from('hero_banners').select('*').eq('is_active', true).order('sort_order')
         .then(({ data }) => setHeroBanners(data || []));
   }, []);

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
      { name: 'General Physician', subtitle: 'Primary Care', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
      { name: 'Cardiology', subtitle: 'Heart Specialist', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
      { name: 'Pediatrics', subtitle: 'Child Health', icon: Baby, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { name: 'Gynae & Obs', subtitle: "Women's Health", icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
      { name: 'Dermatology', subtitle: 'Skin & Hair', icon: Sparkles, color: 'text-orange-600', bg: 'bg-orange-50' },
      { name: 'Internal Medicine', subtitle: 'General Health', icon: ClipboardPlus, color: 'text-sky-600', bg: 'bg-sky-50' },
      { name: 'Endocrinology', subtitle: 'Diabetes & Hormone', icon: Droplets, color: 'text-teal-600', bg: 'bg-teal-50' },
      { name: 'Neurology', subtitle: 'Brain & Spine', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
      { name: 'Gastroenterology', subtitle: 'Liver & Gut', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { name: 'Orthopedics', subtitle: 'Bone & Joints', icon: Bone, color: 'text-amber-600', bg: 'bg-amber-50' },
      { name: 'Ophthalmology', subtitle: 'Eye Specialist', icon: VenetianMask, color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { name: 'Psychiatry', subtitle: 'Mental Health', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50' },
      { name: 'ENT', subtitle: 'Ear, Nose, Throat', icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50' },
      { name: 'Nephrology', subtitle: 'Kidney Specialist', icon: Droplets, color: 'text-blue-700', bg: 'bg-blue-100' },
      { name: 'Pulmonology', subtitle: 'Chest & Lung', icon: Wind, color: 'text-sky-700', bg: 'bg-sky-100' },
   ];

   const handleCategoryClick = (categoryName: string) => {
      onNavigate('/patient/doctors', undefined, categoryName);
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

         const stem = (s: string) => s.toLowerCase().replace(/ologist$|ician$|ology$|ics$|ist$|ian$|y$/, '').slice(0, 6);
         const matchesSelectedSpecialty = selectedSpecialty === 'All' ||
            doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
            selectedSpecialty.toLowerCase().includes(doc.specialty.toLowerCase()) ||
            stem(doc.specialty) === stem(selectedSpecialty);

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
      <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
         <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* HERO SECTION - REFINED SHARPNESS */}
            <div className="pt-8 pb-12 md:pt-16 md:pb-20">
               <div className="relative rounded-ds-lg overflow-hidden shadow-ds-soft min-h-[320px] md:min-h-[420px]">

                  {/* Background slider — sits behind the content overlay */}
                  <HeroSlider banners={heroBanners} />

                  {/* Dark overlay — preserves readability of text on any image */}
                  <div className="absolute inset-0 z-[1]"
                     style={{ background: 'linear-gradient(to right, rgba(6,21,53,0.90) 40%, rgba(6,21,53,0.45))' }} />

                  <div className="relative z-10 px-6 py-12 md:px-12 md:py-20 lg:pr-32">
                     <div className="inline-flex items-center gap-2 bg-medical-500/10 text-medical-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-medical-500/20">
                        <ShieldCheck size={12} />
                        <span>BMDC Verified Doctors</span>
                     </div>

                     <h1 className="font-display text-4xl md:text-[52px] font-bold tracking-tight text-white leading-[1.08] mb-6">
                        Your Time, Your Health,<br />
                        <span className="text-medical-400">Fully Controlled.</span>
                     </h1>

                     <p className="text-sm md:text-base text-slate-400 font-medium mb-10 max-w-lg leading-relaxed">
                        Book top specialists instantly, track your live serial status, and manage your health records in one premium platform.
                     </p>

                     {/* Search Bar - Disciplined Integration */}
                     <div ref={searchContainerRef} className="relative max-w-xl group">
                        <div className="bg-white/5 backdrop-blur-md flex items-center gap-2 md:gap-3 p-1.5 rounded-ds-md border border-white/10 focus-within:border-medical-500/50 focus-within:bg-white/10 transition-all duration-300">
                           <div className="bg-medical-600 text-white p-2.5 md:p-3 rounded-ds-sm shadow-lg shadow-medical-500/20 shrink-0">
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
                           <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-ds-md shadow-ds-soft border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="divide-y divide-slate-50">
                                 {browseList.slice(0, 5).map(doc => (
                                    <div key={doc.id} onClick={() => { onSelectDoctor?.(doc); setShowDropdown(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex gap-4 items-center group transition-colors">
                                       <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                          {doc.imageUrl && <img src={doc.imageUrl} className="w-full h-full object-cover" alt={doc.name} />}
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="text-sm font-black text-ink-800 group-hover:text-medical-600 transition-colors tracking-tight">{doc.name}</h4>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.specialty}</p>
                                       </div>
                                       <div className="bg-medical-50 text-medical-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">View Profile</div>
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
                  <h2 className="font-display text-3xl md:text-4xl font-black text-ink-800 tracking-tight leading-tight">
                     Built for Trust, <br />
                     <span className="text-medical-600">Designed for Speed.</span>
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-md">
                     DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly.
                  </p>
               </div>
               <div className="flex-1 w-full max-w-md bg-slate-50/50 rounded-ds-lg border border-slate-100 p-8 space-y-8">
                  {[
                     { icon: Activity, title: "Live Queue Tracking", desc: "Know exactly when to enter the chamber." },
                     { icon: ShieldCheck, title: "BMDC Verified", desc: "Every doctor on our platform is verified." },
                     { icon: Pill, title: "Digital Prescription", desc: "Archive and access your Rxs anytime." }
                  ].map((feat, i) => (
                     <div key={i} className="flex gap-5 items-start">
                        <div className="bg-white p-2.5 rounded-xl shadow-ds-card border border-slate-100 text-medical-600 shrink-0">
                           <feat.icon size={20} />
                        </div>
                        <div>
                           <h4 className="text-[15px] font-black text-ink-800 mb-1">{feat.title}</h4>
                           <p className="text-[13px] text-slate-500 font-medium leading-normal">{feat.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* TRUST METRICS — Dococlock "Values" pattern: big number + subtitle, divided row */}
            <div className="mb-12 py-10 border-y border-ink-100 flex flex-wrap justify-center gap-x-4 gap-y-8">
               {[
                  { value: '15+', label: 'Years of Combined Experience' },
                  { value: '5,000+', label: 'Happy Patients' },
                  { value: '100%', label: 'BMDC Verified Doctors' },
                  { value: '24/7', label: 'Live Queue Tracking' },
               ].map((stat, i, arr) => (
                  <React.Fragment key={stat.label}>
                     <div className="flex flex-col items-center gap-3 px-6 text-center">
                        <span className="text-ink-900 font-medium text-5xl md:text-[56px] leading-none">{stat.value}</span>
                        <span className="text-ink-500 text-xs md:text-sm font-medium max-w-[160px] leading-snug">{stat.label}</span>
                     </div>
                     {i < arr.length - 1 && <div className="hidden sm:block w-px bg-ink-100 self-stretch" />}
                  </React.Fragment>
               ))}
            </div>

            {/* HOW IT WORKS — process cards */}
            <div className="mb-14">
               <h2 className="font-display text-[28px] md:text-[32px] font-bold text-ink-800 text-center tracking-tight mb-10">
                  Simplifying Healthcare, From Booking to Consultation
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                     { icon: Search, title: 'Discover', desc: 'Find the right specialist based on category, location and expertise.' },
                     { icon: Calendar, title: 'Book Instantly', desc: 'Reserve your serial in seconds — no phone calls, no waiting rooms.' },
                     { icon: Activity, title: 'Track Live', desc: 'Watch your queue position update in real time and arrive right on cue.' },
                  ].map((step) => (
                     <div key={step.title} className="bg-white rounded-ds-lg p-8 flex flex-col gap-6 shadow-ds-card">
                        <div className="space-y-3">
                           <h3 className="font-display text-xl font-bold text-ink-800">{step.title}</h3>
                           <p className="text-sm text-ink-500 leading-relaxed">{step.desc}</p>
                        </div>
                        <div className="h-40 rounded-ds-md bg-medical-50 flex items-center justify-center text-medical-500">
                           <step.icon size={48} strokeWidth={1.5} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* QUICK ACTION CARDS — logged-in patients only */}
            {isPatient && (
               <div className="mb-10">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Quick Actions</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     {[
                        { icon: Search,    label: 'Find a Doctor',    path: '/patient/doctors',          bg: 'bg-medical-50',    text: 'text-medical-600',    border: 'hover:border-medical-200' },
                        { icon: Calendar,  label: 'My Appointments',  path: '/patient/appointments',     bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'hover:border-indigo-200' },
                        { icon: FileText,  label: 'Prescriptions',    path: '/patient/prescriptions',    bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'hover:border-violet-200' },
                        { icon: Pill,      label: 'Medicine Tracker', path: '/patient/medicine-tracker', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-200' },
                     ].map(action => (
                        <button
                           key={action.path}
                           onClick={() => onNavigate(action.path)}
                           className={`bg-white border border-slate-100 ${action.border} rounded-ds-md p-4 flex flex-col items-center gap-2.5 shadow-ds-card hover:shadow-ds-soft transition-all group`}
                        >
                           <div className={`w-11 h-11 rounded-xl ${action.bg} ${action.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <action.icon size={20} />
                           </div>
                           <span className="text-[11px] font-black text-ink-700 text-center leading-tight">{action.label}</span>
                        </button>
                     ))}
                  </div>
               </div>
            )}

            {/* HEALTH TIPS CAROUSEL */}
            <HealthTipsSection />

            {/* UPCOMING APPOINTMENT (IF ANY) */}
            {isPatient && activeAppointment && (
               <div className="mb-12">
                  <div className="mb-6">
                     <h2 className="font-display text-[24px] font-bold tracking-[-0.3px] text-ink-800 leading-tight">Your Schedule</h2>
                     <p className="text-[14px] text-slate-500 font-medium mt-1 opacity-60">Your confirmed medical visits</p>
                  </div>
                  <div className="bg-white rounded-ds-lg shadow-ds-soft border border-slate-100 overflow-hidden">
                     <div className="flex flex-col md:flex-row">
                        <div className="bg-navy-900 p-8 md:w-48 flex flex-col items-center justify-center text-white text-center">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-medical-300 mb-2">Serial Now</span>
                           <span className="font-stat text-6xl font-black tracking-tighter leading-none">{activeAppointment.serialNumber}</span>
                           <div className="mt-4 flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ring-1 ring-white/10">
                              {activeAppointment.isArrived ? <Activity size={12} className="animate-pulse" /> : <Clock size={12} />}
                              <span>{activeAppointment.isArrived ? 'Live' : 'Expected'}</span>
                           </div>
                        </div>
                        <div className="flex-1 p-8 flex flex-col justify-between">
                           <div className="space-y-5">
                              <div className="space-y-1">
                                 <p className="text-[12px] text-medical-600 font-bold uppercase tracking-widest">Appointment Details</p>
                                 <h2 className="font-display text-[22px] font-bold text-ink-800">{activeAppointment.doctorName}</h2>
                              </div>
                              <div className="flex flex-wrap gap-x-8 gap-y-3">
                                 <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-600"><Calendar size={18} className="text-medical-500" /> {activeAppointment.date}</span>
                                 <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-600"><Clock size={18} className="text-emerald-500" /> {activeAppointment.time}</span>
                                 <span className="flex items-center gap-2.5 text-[15px] font-bold text-slate-600"><MapPin size={18} className="text-rose-500" /> {activeAppointment.chamber}</span>
                              </div>
                           </div>
                           <div className="mt-8 flex gap-3">
                              <Button onClick={() => onNavigate('/live-serial')} className="h-12 px-10 font-bold">Track Live Queue</Button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* LOCATION-BASED DISCOVERY */}
            {isLocationFeatureEnabled && (
               <FindDoctorsNearMe onSelectDoctor={onSelectDoctor} />
            )}

            {/* MODULAR SECTIONS */}
            <RecommendedDoctorsSection
               doctors={browseList}
               selectedSpecialty={selectedSpecialty}
               onSelectDoctor={onSelectDoctor}
               onClearFilters={() => { setSelectedSpecialty('All'); setSearchTerm(''); }}
            />

            <div className="flex justify-between items-center mb-6">
               <h2 className="font-display text-[24px] font-bold tracking-[-0.3px] text-ink-800 leading-tight">Explore Specialties</h2>
               <button
                  onClick={() => onNavigate('/patient/doctors')}
                  className="text-medical-600 font-black text-xs uppercase tracking-widest flex items-center gap-1 group"
               >
                  View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
            <BrowseSpecialtySection
               categories={categories}
               onCategoryClick={handleCategoryClick}
               selectedSpecialty={selectedSpecialty}
            />

            {/* CLOSING CTA — anonymous visitors only */}
            {!userRole && (
               <section className="py-12 mb-4">
                  <div className="bg-navy-900 rounded-ds-lg p-10 md:p-16 text-center">
                     <h2 className="font-display text-2xl md:text-4xl font-bold text-white leading-tight mb-4 max-w-2xl mx-auto">
                        Healthcare made simple with smarter appointment scheduling.
                     </h2>
                     <p className="text-[#93d3fd] text-sm md:text-base font-medium mb-8">
                        Join 5,000+ patients already using DocOclock.
                     </p>
                     <Button
                        variant="gradient"
                        className="h-14 px-10 mx-auto"
                        onClick={() => {
                           searchContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                           searchInputRef.current?.focus();
                        }}
                     >
                        Get Started
                     </Button>
                  </div>
               </section>
            )}

            {/* DOCTOR PARTNERSHIP Section - Refined */}
            {!isPatient && (
               <section className="py-12 mb-12 animate-in fade-in duration-1000">
                  <div className="bg-navy-900 rounded-ds-lg p-8 md:p-16 relative overflow-hidden shadow-ds-soft">
                     <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/5 text-medical-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/10 backdrop-blur-sm">
                           <BriefcaseMedical size={14} />
                           <span>Doctor Partnership</span>
                        </div>
                        <h2 className="font-display text-3xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">Are you a Doctor?</h2>
                        <p className="text-[15px] text-slate-400 font-medium mb-12 leading-relaxed opacity-80 max-w-md">
                           Join DocOclock to modernize your practice, manage patient queues, and issue professional digital prescriptions effortlessly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                           <Button onClick={() => onNavigate('/for-doctors')} className="h-14 px-12 font-black text-sm uppercase tracking-widest active:scale-95">Join Now</Button>
                           <Button variant="outline" onClick={() => onNavigate('/doctor-login')} className="h-14 px-12 border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-sm uppercase tracking-widest backdrop-blur-sm transition-all active:scale-95">Dashboard</Button>
                        </div>
                     </div>
                  </div>
               </section>
            )}
         </div>
      </div>
   );
};
