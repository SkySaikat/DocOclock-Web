import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import {
   Search, Heart, Activity, Brain, Stethoscope, Star, MapPin,
   ShieldCheck, Users, Clock, ArrowRight, X, GraduationCap,
   ChevronRight, Calendar, Sparkles, Bell, Pill, BriefcaseMedical
} from 'lucide-react';
import { Doctor, UserRole } from '../../types';
import { DoctorCard } from '../../components/ui/DoctorCard';
import { getAppointments, PatientStorage, getDoctors, getArrivalStatus } from '../../storage';
import { getLocalISODate } from '../../utils/date';

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
   const doctorListRef = useRef<HTMLDivElement>(null);

   const session = useMemo(() => PatientStorage.get(), []);
   // Fetch ALL doctors from the shared registry (demo_doctors)
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

   const patientPrescriptions = useMemo(() => {
      if (!session) return [];
      const allRx = JSON.parse(localStorage.getItem('demo_prescriptions') || '[]');
      return allRx.filter((p: any) => String(p.patientId) === String(session.id));
   }, [session]);

   const upcomingFollowUps = patientPrescriptions
      .filter((rx: any) => rx.followUpDate && new Date(rx.followUpDate) >= new Date())
      .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime());

   const medicineCount = patientPrescriptions.reduce((acc, rx: any) => acc + (rx.medicines?.length || 0), 0);

   const categories = [
      { name: 'General Physician', icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Primary Care' },
      { name: 'Cardiology', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', desc: 'Heart Care' },
      { name: 'Neurology', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Brain & Nerves' },
      { name: 'Pediatrics', icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Child Specialist' },
      { name: 'Dermatology', icon: Activity, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Skin Care' },
      { name: 'Internal Medicine', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'General Health' },
      { name: 'Orthopedics', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Bone & Joints' },
      { name: 'View All', icon: ArrowRight, color: 'text-slate-600', bg: 'bg-slate-100', desc: 'Show All' },
   ];

   const handleCategoryClick = (categoryName: string) => {
      if (categoryName === 'View All') {
         setSelectedSpecialty('All');
      } else {
         const keywords: Record<string, string> = {
            'General Physician': 'Physician',
            'Cardiology': 'Cardiologist',
            'Neurology': 'Neurologist',
            'Pediatrics': 'Pediatrician',
            'Dermatology': 'Dermatologist',
            'Internal Medicine': 'Medicine',
            'Orthopedics': 'Orthopedics'
         };
         setSelectedSpecialty(keywords[categoryName] || categoryName);
      }
      doctorListRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   const browseList = doctors.filter(doc => {
      const matchesSearch = searchTerm === '' ||
         doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
         doc.chambers.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSpecialty = selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

      return matchesSearch && matchesSpecialty;
   });

   const searchResults = searchTerm ? browseList : [];

   return (
      <div className="space-y-12 pb-16">
         <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 rounded-[3rem] p-8 md:p-20 text-white shadow-2xl shadow-blue-200 overflow-visible z-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-10 max-w-5xl mx-auto">
               <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/20 shadow-2xl">
                  <ShieldCheck size={18} className="text-teal-300" />
                  <span>BMDC Verified Doctors Only</span>
               </div>

               <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1] drop-shadow-sm">
                  Less Delay.<br />
                  <span className="text-teal-200">More Care.</span>
               </h1>

               <p className="text-xl md:text-2xl text-blue-50 font-medium opacity-90 max-w-2xl leading-relaxed">
                  Book top specialists in minutes and track your serial live. No more long queues.
               </p>

               <div ref={searchContainerRef} className="w-full max-w-3xl mt-4 relative z-[60]">
                  <div className="relative bg-white p-3 flex items-center gap-4 shadow-[0_30px_90px_rgba(0,0,0,0.3)] rounded-[2.5rem] border-0 transition-all focus-within:ring-8 focus-within:ring-blue-500/10">
                     <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-3xl shadow-xl shadow-blue-200 shrink-0">
                        <Search size={32} />
                     </div>

                     <div className="flex-1 flex flex-col items-start px-1 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Find a Specialist</label>
                        <input
                           ref={searchInputRef}
                           className="w-full py-1 text-2xl outline-none text-slate-800 placeholder:text-slate-300 font-black bg-transparent"
                           placeholder="e.g. Cardiologist, Sarah Ahmed..."
                           value={searchTerm}
                           onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowDropdown(true);
                           }}
                           onFocus={() => setShowDropdown(true)}
                        />
                     </div>

                     {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setShowDropdown(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                           <X size={28} />
                        </button>
                     )}

                     <Button className="rounded-[1.75rem] px-14 h-16 shadow-none hidden md:block text-xl font-black bg-blue-800 hover:bg-slate-900 transition-all">
                        Search
                     </Button>
                  </div>

                  {showDropdown && searchTerm && searchResults.length > 0 && (
                     <div className="absolute top-[calc(100%+20px)] left-0 w-full bg-white rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-slate-100 overflow-hidden animate-fade-in z-[70] text-left">
                        <div className="divide-y divide-slate-100">
                           <div className="px-8 py-5 bg-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Sparkles size={14} className="text-blue-500" /> Best Matches
                           </div>
                           {searchResults.map(doc => (
                              <div
                                 key={doc.id}
                                 onClick={() => {
                                    onSelectDoctor?.(doc);
                                    setShowDropdown(false);
                                 }}
                                 className="p-6 hover:bg-blue-50 cursor-pointer flex gap-6 items-center group transition-all"
                              >
                                 <img src={doc.imageUrl} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shadow-md border-2 border-white" alt={doc.name} />
                                 <div className="flex-1">
                                    <h4 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                                    <p className="text-xs text-teal-600 font-black uppercase tracking-widest">{doc.specialty}</p>
                                 </div>
                                 <ChevronRight size={24} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {isPatient && (
            <div className="px-2 space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                     <Bell size={24} className="text-blue-600" /> Schedule & Reminders
                  </h2>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeAppointment ? (
                     <GlassCard className="bg-white p-0 border-0 ring-1 ring-blue-100 shadow-2xl overflow-hidden rounded-[2.5rem] relative h-full">
                        <div className="flex flex-col sm:flex-row h-full">
                           <div className="bg-blue-600 sm:w-36 p-6 flex flex-col items-center justify-center text-white text-center shrink-0">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Serial</span>
                              <span className="text-5xl font-black leading-none">{activeAppointment.serialNumber}</span>
                              <div className="mt-4 flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase whitespace-nowrap">
                                 {activeAppointment.isArrived ? (
                                    <>
                                       <Activity size={12} className="animate-pulse" /> Live Now
                                    </>
                                 ) : (
                                    <>
                                       <Clock size={12} /> Waiting for Arrival
                                    </>
                                 )}
                              </div>
                           </div>
                           <div className="flex-1 p-6 flex flex-col justify-between">
                              <div>
                                 <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                                    {activeAppointment.isArrived ? 'Doctor Arrived' : 'Next Appointment'} • {activeAppointment.date}
                                 </h3>
                                 <h2 className="text-2xl font-black text-slate-900 leading-tight">{activeAppointment.doctorName}</h2>
                                 <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs font-bold text-slate-500">
                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-teal-500" /> {activeAppointment.time}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-red-500" /> {activeAppointment.chamber}</span>
                                 </div>
                              </div>
                              <Button onClick={() => onNavigate('/live-serial')} className="mt-6 h-12 rounded-xl text-sm font-black shadow-lg shadow-blue-100 flex items-center gap-2 w-full sm:w-fit px-8">
                                 Track Live <ArrowRight size={18} />
                              </Button>
                           </div>
                        </div>
                     </GlassCard>
                  ) : (
                     <GlassCard className="bg-white p-8 border-0 ring-1 ring-slate-100 shadow-sm flex flex-col items-center justify-center text-center rounded-[2.5rem] h-full">
                        <Calendar size={48} className="text-slate-200 mb-4" />
                        <p className="font-bold text-slate-400">No upcoming appointments</p>
                        <Button variant="outline" onClick={() => onNavigate('/patient/home')} className="mt-4 border-slate-200 text-slate-600">Book Specialist</Button>
                     </GlassCard>
                  )}

                  <GlassCard className="bg-white p-0 border-0 ring-1 ring-indigo-100 shadow-xl overflow-hidden rounded-[2.5rem] h-full">
                     <div className="flex flex-col sm:flex-row h-full">
                        <div className="bg-indigo-600 sm:w-36 p-6 flex flex-col items-center justify-center text-white text-center shrink-0">
                           <Pill size={32} className="mb-2 opacity-80" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Medicines</span>
                           <span className="mt-2 text-2xl font-black">{medicineCount}</span>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                           <div>
                              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Health Routine</h3>
                              <h2 className="text-2xl font-black text-slate-900 leading-tight">Daily Intake List</h2>
                              <div className="flex flex-wrap gap-3 mt-4">
                                 {['Morning', 'Noon', 'Night'].map(slot => (
                                    <div key={slot} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
                                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{slot}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <Button onClick={() => onNavigate('/patient/medicine-tracker')} className="mt-6 h-12 rounded-xl text-sm font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 text-white w-full sm:w-fit px-8">
                              Open Tracker
                           </Button>
                        </div>
                     </div>
                  </GlassCard>
               </div>
            </div>
         )}

         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
            {[
               { icon: Users, label: "1.7k+", sub: "Verified Doctors", color: "text-blue-600", bg: "bg-blue-50" },
               { icon: ShieldCheck, label: "100%", sub: "BMDC Certified", color: "text-teal-600", bg: "bg-teal-50" },
               { icon: Clock, label: "24/7", sub: "Instant Booking", color: "text-orange-500", bg: "bg-orange-50" },
               { icon: Heart, label: "700k+", sub: "Healthy Patients", color: "text-red-500", bg: "bg-red-50" }
            ].map((stat, i) => (
               <div key={i} className="bg-white rounded-[28px] p-6 md:p-8 flex flex-col items-center text-center shadow-soft border border-slate-100 hover:border-medical-200 transition-all duration-300">
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                     <stat.icon size={28} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.label}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.sub}</p>
               </div>
            ))}
         </div>

         <div className="px-2">
            <div className="flex justify-between items-end mb-10">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Browse Specialty</h2>
                  <p className="text-slate-600 font-bold text-lg mt-2">Find experts in every department</p>
               </div>
               <button onClick={() => setSelectedSpecialty('All')} className="text-blue-600 font-black text-sm hover:underline">View All Departments</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
               {categories.map((cat) => (
                  <div
                     key={cat.name}
                     onClick={() => handleCategoryClick(cat.name)}
                     className={`group p-6 md:p-8 rounded-[32px] border-2 transition-all duration-500 cursor-pointer flex flex-col items-center text-center
                   ${selectedSpecialty !== 'All' && cat.name.toLowerCase().includes(selectedSpecialty.toLowerCase())
                           ? 'bg-medical-600 border-medical-600 text-white shadow-premium scale-[1.02]'
                           : 'bg-white border-slate-50 hover:border-medical-100 hover:shadow-premium hover:-translate-y-1'}
                 `}
                  >
                     <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500
                      ${selectedSpecialty !== 'All' && cat.name.toLowerCase().includes(selectedSpecialty.toLowerCase()) ? 'bg-white/20 text-white' : `${cat.bg} ${cat.color} shadow-sm group-hover:shadow-md group-hover:scale-110`}
                  `}>
                        <cat.icon size={32} />
                     </div>
                     <h3 className={`font-black text-sm md:text-base leading-tight ${selectedSpecialty !== 'All' && cat.name.toLowerCase().includes(selectedSpecialty.toLowerCase()) ? 'text-white' : 'text-slate-800'}`}>
                        {cat.name}
                     </h3>
                  </div>
               ))}
            </div>
         </div>

         <div ref={doctorListRef} className="pt-4 px-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                     {selectedSpecialty === 'All' ? (searchTerm ? 'Search Results' : 'Recommended Specialists') : `${selectedSpecialty} Specialists`}
                  </h2>
                  <p className="text-slate-600 font-bold text-lg mt-2">
                     Showing {browseList.length} verified doctors matching your needs.
                  </p>
               </div>
               {(selectedSpecialty !== 'All' || searchTerm !== '') && (
                  <button onClick={() => { setSelectedSpecialty('All'); setSearchTerm(''); }} className="text-red-600 font-black text-sm hover:underline flex items-center gap-2 bg-red-50 px-6 py-3 rounded-2xl transition-all hover:bg-red-100">
                     Clear Filters <X size={18} />
                  </button>
               )}
            </div>

            {browseList.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {browseList.map((doc) => (
                     <DoctorCard
                        key={doc.id}
                        doctor={{
                           name: doc.name,
                           specialty: doc.specialty,
                           bmdcNumber: doc.bmdcNumber,
                           experience: 12, // Using mock for now
                           rating: doc.rating,
                           reviews: doc.totalPatients,
                           image: doc.imageUrl,
                           hospitalName: doc.chambers[0]?.name
                        }}
                        variant="compact"
                        onCtaClick={() => onSelectDoctor?.(doc)}
                     />
                  ))}
               </div>
            ) : (
               <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-200">
                  <div className="w-32 h-32 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-10">
                     <Search size={64} />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">No Doctors Found</h3>
                  <p className="text-slate-500 font-bold text-xl max-w-md mx-auto mt-4 leading-relaxed">Try searching for a specialty or resetting your filters to explore more options.</p>
                  <Button variant="outline" onClick={() => { setSelectedSpecialty('All'); setSearchTerm(''); }} className="mt-12 px-14 h-16 rounded-[2rem] font-black text-xl border-2">Clear All Filters</Button>
               </div>
            )}
         </div>

         {!isPatient && (
            <div className="px-2 pt-12 animate-fade-in">
               <div className="relative rounded-[3rem] bg-slate-900 p-8 md:p-16 overflow-hidden shadow-2xl shadow-slate-900/10">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                     <div className="text-center lg:text-left space-y-6 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white rounded-full text-xs font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm w-fit mx-auto lg:mx-0">
                           <BriefcaseMedical size={16} className="text-blue-400" />
                           <span>Doctor Partnership</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                           Are you a <span className="text-blue-400">Doctor?</span>
                        </h2>
                        <p className="text-slate-300 text-xl md:text-2xl font-bold leading-relaxed opacity-90">
                           Modernize your practice, manage patient queues, and issue professional digital prescriptions effortlessly.
                        </p>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-5 shrink-0 w-full lg:w-auto">
                        <Button
                           onClick={() => onNavigate('/for-doctors')}
                           className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all h-16 px-12 text-xl font-black shadow-2xl shadow-blue-900/20 border-none rounded-2xl w-full sm:w-auto"
                        >
                           Join as a Doctor
                        </Button>
                        <Button
                           variant="outline"
                           onClick={() => onNavigate('/doctor-login')}
                           className="h-16 px-12 text-xl font-black border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md rounded-2xl w-full sm:w-auto"
                        >
                           Partner Login
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};