import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import {
   Search, Heart, Activity, Brain, Stethoscope, Star, MapPin,
   ShieldCheck, Users, Clock, ArrowRight, X, GraduationCap,
   ChevronRight, Calendar, Sparkles, Bell, Pill, FileText, BriefcaseMedical,
   Baby, BabyIcon, VenetianMask, Syringe, Thermometer, BrainCircuit,
   Microscope, Droplets, UserRound, Zap, Bone, HeartPulse, ClipboardPlus, Wind,
   Quote, ClipboardList, LayoutDashboard, KanbanSquare
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

const SPECIALTY_TICKER = ['Medicine & Nephrology', 'Dental Care', 'Neurology', 'Food & Nutrition'];

const SpecialtyMarquee: React.FC = () => (
   <div className="border-y border-ink-100 overflow-hidden">
      <div className="flex w-max animate-marquee">
         {[...Array(4)].flatMap(() => SPECIALTY_TICKER).map((label, i) => (
            <span key={i} className="flex items-center gap-2 px-8 py-5 text-[13px] font-medium text-ink-500 whitespace-nowrap shrink-0">
               <Sparkles size={14} className="text-medical-400" /> {label}
            </span>
         ))}
      </div>
   </div>
);

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
   onLoginClick?: () => void;
   onRegisterClick?: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onSelectDoctor, userRole, focusSearchTrigger, onLoginClick, onRegisterClick }) => {
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

   // "What Our Patients Say" — real approved reviews, never fabricated testimonials.
   const [testimonials, setTestimonials] = useState<{ id: string; comment: string; rating: number; patientName: string; patientImage?: string }[]>([]);
   useEffect(() => {
      const loadTestimonials = async () => {
         const { data: reviewRows } = await supabase
            .from('reviews')
            .select('id, rating, comment, patient_id, created_at')
            .not('comment', 'is', null)
            .order('rating', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(6);
         if (!reviewRows || reviewRows.length === 0) { setTestimonials([]); return; }
         const patientIds = [...new Set(reviewRows.map((r: any) => r.patient_id))];
         const { data: patients } = await supabase.from('profiles').select('id, name, image').in('id', patientIds);
         const byId = new Map((patients || []).map((p: any) => [p.id, p]));
         setTestimonials(
            reviewRows.slice(0, 3).map((r: any) => ({
               id: r.id,
               comment: r.comment,
               rating: r.rating,
               patientName: byId.get(r.patient_id)?.name || 'Verified Patient',
               patientImage: byId.get(r.patient_id)?.image,
            }))
         );
      };
      loadTestimonials();
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

   const compactDoctorList = useMemo(() => browseList.slice(0, 8), [browseList]);
   const doctorFilterPills = ['All', 'Cardiologist', 'Dermatologist', 'Dentist', 'Neurologist', 'Orthopedic'];

   return (
      <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
         {/* HERO — literal Figma "PreLogin 1" flow: full-bleed brand-blue band, ring motif,
             "Welcome to Dococlock" eyebrow, headline, Register/Login row, image panel right. */}
         <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-medical-500 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1600 700" fill="none">
               <circle cx="500" cy="350" r="420" stroke="white" strokeWidth="1" />
               <circle cx="700" cy="150" r="260" stroke="white" strokeWidth="1" />
            </svg>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:pt-16 md:pb-24 relative">
               <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  <div className="flex-1 w-full relative z-10">
                     <span className="inline-block bg-white/15 text-white text-[13px] font-medium px-4 py-2 rounded-full mb-6">
                        Welcome to Dococlock
                     </span>
                     <h1 className="font-display text-4xl md:text-[52px] font-medium text-white leading-[1.1] mb-8">
                        {isPatient ? (
                           <>Welcome back.<br />Your Health.<br />Fully Controlled.</>
                        ) : (
                           <>Your Time.Your<br />Health.<br />Fully Controlled.</>
                        )}
                     </h1>
                     <div className="flex items-center gap-6">
                        {isPatient ? (
                           <button
                              onClick={() => {
                                 searchContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                 searchInputRef.current?.focus();
                              }}
                              className="h-[52px] px-8 rounded-full bg-white text-ink-800 font-display font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors"
                           >
                              Find a Doctor <ArrowRight size={16} />
                           </button>
                        ) : (
                           <>
                              <button onClick={() => onRegisterClick?.()} className="h-[52px] px-8 rounded-full bg-white text-ink-800 font-display font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors">
                                 Register <ArrowRight size={16} />
                              </button>
                              <button onClick={() => onLoginClick?.()} className="text-white/90 hover:text-white text-[16px] font-normal transition-colors">
                                 Login
                              </button>
                           </>
                        )}
                     </div>
                  </div>

                  {/* Image panel — real content comes from the admin-managed Hero Banner slider */}
                  <div className="flex-1 w-full relative z-10">
                     <div className="relative rounded-ds-xl overflow-hidden shadow-ds-soft h-[320px] md:h-[420px] bg-navy-900/10">
                        <HeroSlider banners={heroBanners} />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
            <SpecialtyMarquee />
         </div>

         <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* FIND A DOCTOR — dedicated search (real product functionality; Figma's marketing
                frame has no slot for it since it covers logged-out screens only) */}
            <div ref={searchContainerRef} className="relative my-16 md:my-20">
               <div className="bg-white flex items-center gap-2 md:gap-3 p-1.5 rounded-ds-md shadow-ds-card border border-ink-100 focus-within:border-medical-400 transition-all duration-300 max-w-2xl mx-auto">
                  <div className="bg-medical-600 text-white p-2.5 md:p-3 rounded-ds-sm shrink-0">
                     <Search size={18} className="md:w-5 md:h-5" />
                  </div>
                  <input
                     ref={searchInputRef}
                     className="flex-1 min-w-0 py-2 text-sm md:text-base outline-none text-ink-800 placeholder:text-ink-400 font-medium bg-transparent"
                     placeholder="Search Doctor..."
                     value={searchTerm}
                     onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                     onFocus={() => setShowDropdown(true)}
                  />
                  {searchTerm && (
                     <button onClick={() => { setSearchTerm(''); setShowDropdown(false); }} className="p-2 text-ink-400 hover:text-ink-700 transition-colors mr-2">
                        <X size={18} />
                     </button>
                  )}
               </div>

               {showDropdown && searchTerm && browseList.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-ds-md shadow-ds-soft border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
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

            {/* HOW IT WORKS — literal Figma copy + 3 process cards */}
            <div className="mb-16 md:mb-20">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <div>
                     <span className="flex items-center gap-2 text-[13px] font-bold text-ink-500 uppercase tracking-wide mb-3">
                        <span className="w-4 h-1 bg-medical-500 rounded-full" /> How it works
                     </span>
                     <h2 className="font-display text-[28px] md:text-[36px] font-medium text-ink-900 leading-tight max-w-lg">
                        Healthcare made simple with smarter appointment scheduling.
                     </h2>
                  </div>
                  <button onClick={() => onNavigate('/patient/doctors')} className="h-12 px-7 rounded-full bg-medical-500 text-white font-display font-semibold inline-flex items-center gap-2 shrink-0 hover:bg-medical-600 transition-colors">
                     Register <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                     { icon: Search, title: 'Find Specialists', desc: 'Find the right Doctor to guide your healthcare journey.' },
                     { icon: Calendar, title: 'Get an Appointment', desc: 'Browse top-rated specialists and book your visit instantly.' },
                     { icon: Clock, title: 'Track Your Live Serial', desc: 'Skip the waiting room and arrive exactly when it’s your turn.' },
                  ].map((step) => (
                     <div key={step.title} className="bg-white rounded-ds-lg p-6 flex flex-col gap-5 shadow-ds-card">
                        <div className="space-y-2">
                           <h3 className="font-display text-lg font-bold text-ink-800">{step.title}</h3>
                           <p className="text-[13px] text-ink-500 leading-relaxed">{step.desc}</p>
                        </div>
                        <div className="h-36 rounded-ds-md bg-medical-50 flex items-center justify-center text-medical-400">
                           <step.icon size={40} strokeWidth={1.5} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* MEET OUR MEDICAL EXPERTS — filter pills + compact doctor carousel */}
            <div className="mb-16 md:mb-20">
               <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 text-[13px] font-bold text-ink-500 uppercase tracking-wide mb-3">
                     <span className="w-4 h-1 bg-medical-500 rounded-full" /> Specialists
                  </span>
                  <h2 className="font-display text-[28px] md:text-[36px] font-medium text-ink-900 leading-tight">Meet Our Medical Experts</h2>
               </div>
               <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {doctorFilterPills.map((pill) => (
                     <button
                        key={pill}
                        onClick={() => setSelectedSpecialty(pill)}
                        className={`h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${selectedSpecialty === pill ? 'bg-medical-500 text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                           }`}
                     >
                        {pill}
                     </button>
                  ))}
               </div>
               {compactDoctorList.length > 0 ? (
                  <div className="flex gap-5 overflow-x-auto pb-2 hide-scrollbar snap-x">
                     {compactDoctorList.map((doc) => (
                        <div key={doc.id} className="snap-start">
                           <DoctorCard
                              compact
                              doctor={{
                                 name: doc.name,
                                 specialty: doc.specialty,
                                 bmdcNumber: doc.bmdcNumber || '',
                                 rating: doc.rating,
                                 image: doc.imageUrl,
                              }}
                              onClick={() => onSelectDoctor?.(doc)}
                           />
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-center text-sm text-ink-400 font-medium">No doctors found for this specialty yet.</p>
               )}
            </div>

            {/* TRANSPARENCY STATEMENT + floating feature badges around a photo */}
            <div className="mb-16 md:mb-20">
               <p className="text-center font-display text-xl md:text-2xl text-ink-800 leading-relaxed max-w-2xl mx-auto mb-14">
                  DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly.
               </p>
               <div className="relative w-full max-w-sm mx-auto h-[280px] mb-14">
                  <div className="absolute inset-x-8 inset-y-0 rounded-ds-lg bg-medical-50 overflow-hidden" />
                  <div className="absolute top-0 left-0 bg-white rounded-ds-md shadow-ds-soft p-4 flex flex-col items-center gap-2 w-28 text-center">
                     <Activity size={18} className="text-medical-500" />
                     <span className="text-[11px] font-bold text-ink-700 leading-tight">Live Queue Tracking</span>
                  </div>
                  <div className="absolute top-2 right-0 bg-white rounded-ds-md shadow-ds-soft p-4 flex flex-col items-center gap-2 w-28 text-center">
                     <FileText size={18} className="text-medical-500" />
                     <span className="text-[11px] font-bold text-ink-700 leading-tight">Digital Prescription</span>
                  </div>
                  <div className="absolute bottom-0 right-6 bg-white rounded-ds-md shadow-ds-soft p-4 flex flex-col items-center gap-2 w-28 text-center">
                     <ShieldCheck size={18} className="text-medical-500" />
                     <span className="text-[11px] font-bold text-ink-700 leading-tight">BMDC Verified</span>
                  </div>
               </div>
               <div className="flex flex-wrap justify-center gap-x-4 gap-y-8">
                  {[
                     { value: '15+', label: 'Years Combined Experience' },
                     { value: '5,000+', label: 'Total Patients Treated' },
                     { value: '100%', label: 'Patient Satisfaction' },
                  ].map((stat, i, arr) => (
                     <React.Fragment key={stat.label}>
                        <div className="flex flex-col items-center gap-2 px-6 text-center">
                           <span className="text-ink-900 font-medium text-4xl md:text-5xl leading-none">{stat.value}</span>
                           <span className="text-ink-500 text-xs font-medium max-w-[150px] leading-snug">{stat.label}</span>
                        </div>
                        {i < arr.length - 1 && <div className="hidden sm:block w-px bg-ink-100 self-stretch" />}
                     </React.Fragment>
                  ))}
               </div>
            </div>
         </div>

         <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
            <SpecialtyMarquee />
         </div>

         <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* SIMPLIFYING HEALTHCARE — feature list + doctor-dashboard preview mockup */}
            <div className="my-16 md:my-20">
               <div className="text-center mb-10">
                  <span className="inline-flex items-center gap-2 text-[13px] font-bold text-ink-500 uppercase tracking-wide mb-3">
                     <span className="w-4 h-1 bg-medical-500 rounded-full" /> Dashboard
                  </span>
                  <h2 className="font-display text-[28px] md:text-[36px] font-medium text-ink-900 leading-tight max-w-lg mx-auto">
                     Simplifying healthcare appointments from booking to consultation.
                  </h2>
               </div>
               <div className="flex flex-col lg:flex-row gap-10 items-center">
                  <div className="flex-1 w-full space-y-1">
                     {['Doctor Panel', 'Patient Panel', 'Appointment Management', 'Queue Tracker'].map((label, i) => (
                        <div key={label} className={`px-5 py-4 rounded-xl text-[15px] font-medium border-b border-ink-50 ${i === 0 ? 'text-ink-900 font-bold bg-medical-50/60' : 'text-ink-400'}`}>
                           {label}
                        </div>
                     ))}
                  </div>
                  <div className="flex-1 w-full max-w-md bg-white rounded-ds-lg shadow-ds-soft p-6">
                     <div className="flex items-center justify-between mb-6">
                        <span className="font-display font-bold text-ink-800">Queue</span>
                        <Calendar size={16} className="text-ink-400" />
                     </div>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-11 h-11 rounded-full bg-medical-500 text-white flex items-center justify-center font-bold shrink-0">24</div>
                        <div className="flex-1">
                           <p className="text-[14px] font-bold text-ink-800">John Doe</p>
                           <p className="text-[11px] text-ink-400">Serial: 24 &middot; 10:30 am</p>
                        </div>
                        <div className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center"
                           style={{ background: 'conic-gradient(#2E8CFF 0deg 260deg, #E5F1FF 260deg 360deg)' }}>
                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[11px] font-bold text-ink-800">18</div>
                        </div>
                     </div>
                     <div className="h-px bg-ink-50 mb-4" />
                     <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-3">Up Next</p>
                     <div className="space-y-2">
                        {['John Doe', 'John Doe'].map((name, i) => (
                           <div key={i} className="flex items-center gap-3 bg-ink-50/60 rounded-xl px-3 py-2.5">
                              <div className="w-8 h-8 rounded-full bg-ink-100" />
                              <span className="text-[13px] font-medium text-ink-700 flex-1">{name}</span>
                              <span className="text-[11px] font-bold text-ink-400">#{26 + i}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* WHAT OUR PATIENTS SAY — real approved reviews only, never fabricated */}
            {testimonials.length > 0 && (
               <div className="mb-16 md:mb-20">
                  <div className="text-center mb-10">
                     <span className="inline-flex items-center gap-2 text-[13px] font-bold text-ink-500 uppercase tracking-wide mb-3">
                        <span className="w-4 h-1 bg-medical-500 rounded-full" /> Testimonials
                     </span>
                     <h2 className="font-display text-[28px] md:text-[36px] font-medium text-ink-900 leading-tight">What Our Patients Say</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {testimonials.map((t) => (
                        <div key={t.id} className="bg-white rounded-ds-lg shadow-ds-card p-6 flex flex-col gap-4">
                           <Quote size={22} className="text-medical-200" />
                           <p className="text-[14px] text-ink-600 leading-relaxed flex-1">{t.comment}</p>
                           <div className="flex items-center gap-3 pt-2 border-t border-ink-50">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-medical-50 shrink-0">
                                 {t.patientImage ? (
                                    <img src={t.patientImage} alt={t.patientName} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center text-medical-400 font-bold text-xs">{t.patientName.charAt(0)}</div>
                                 )}
                              </div>
                              <span className="text-[13px] font-bold text-ink-800">{t.patientName}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

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
