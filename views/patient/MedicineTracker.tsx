import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import {
   Plus, Bell, BellOff, Clock, Trash2, Calendar,
   ChevronRight, Pill, Droplets, FlaskConical, Search,
   CheckCircle2, AlertCircle, Info, Heart, X, Activity,
   Check, Coffee, Sun, Moon, ShieldCheck
} from 'lucide-react';

import { PatientStorage, fetchDoctors, fetchMedicineAlerts, toggleMedicineAlert } from '../../storage';
import { MedicineAlert } from '../../types';

export const MedicineTracker: React.FC = () => {
   const [refresh, setRefresh] = useState(0);
   const patient = PatientStorage.get();
   const currentPatientId = patient?.id;

   const [enrichedAlerts, setEnrichedAlerts] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const loadAlerts = async () => {
         if (!currentPatientId) return;
         setIsLoading(true);
         try {
            const alerts = await fetchMedicineAlerts(currentPatientId);
            if (alerts.length === 0) {
               setEnrichedAlerts([]);
               return;
            }
            const allDoctors = await fetchDoctors();
            const results = alerts.map(a => {
               const doc = allDoctors.find(d => String(d.id) === String(a.doctorId));
               return {
                  ...a,
                  doctorName: doc?.name || 'Your Doctor'
               };
            });
            setEnrichedAlerts(results);
         } catch (error) {
            console.error('Error loading medicine alerts:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadAlerts();
   }, [currentPatientId, refresh]);

   const toggleAlert = (id: string) => {
      toggleMedicineAlert(id);
      setRefresh(prev => prev + 1);
   };

   // --- GLANCE LOGIC ---

   const currentTimeInfo = useMemo(() => {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) return { slot: 'Morning', index: 0, label: 'After Breakfast', icon: Coffee };
      if (hour >= 12 && hour < 17) return { slot: 'Noon', index: 1, label: 'After Lunch', icon: Sun };
      return { slot: 'Night', index: 2, label: 'Before Bed', icon: Moon };
   }, []);

   const nextDose = useMemo(() => {
      if (enrichedAlerts.length === 0) return null;

      // 1. Try finding an untaken dose in the CURRENT slot
      const currentSlotMeds = enrichedAlerts.filter(m => !m.completed && m.dosage.split('+')[currentTimeInfo.index] !== '0');
      if (currentSlotMeds.length > 0) return currentSlotMeds[0];

      // 2. Otherwise find the first untaken dose in ANY slot
      const nextAvailable = enrichedAlerts.find(m => !m.completed);
      return nextAvailable || null;
   }, [enrichedAlerts, currentTimeInfo]);

   const progress = useMemo(() => {
      const slots = [0, 1, 2];
      return slots.map(idx => {
         const medsInSlot = enrichedAlerts.filter(m => m.dosage.split('+')[idx] !== '0');
         if (medsInSlot.length === 0) return { status: 'none' };
         const allTaken = medsInSlot.every(m => m.completed);
         return { status: allTaken ? 'taken' : 'pending' };
      });
   }, [enrichedAlerts]);

   return (
      <div className="space-y-10 animate-fade-in pb-24 px-4 md:px-0 max-w-4xl mx-auto">

         <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Medicine Schedule</h1>
            <p className="text-slate-500 font-bold text-lg">Your daily routine, simplified.</p>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
               <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
               <p className="text-slate-400 font-black tracking-widest uppercase text-[10px] animate-pulse">Syncing Pharmacy Data</p>
            </div>
         ) : enrichedAlerts.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <Pill className="mx-auto text-slate-200 mb-6" size={80} />
               <h3 className="text-2xl font-black text-slate-900 mb-2">No Active Medicines</h3>
               <p className="text-slate-400 font-bold max-w-xs mx-auto">Your medicine alerts will appear here after your next prescription.</p>
            </div>
         ) : (
            <>
               {/* 1. NEXT DOSE CARD (PRIMARY HIGHLIGHT) */}
               <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <Clock size={14} /> What to take now
                  </h3>
                  {nextDose ? (
                     <div className="relative group">
                        <GlassCard className="relative p-6 md:p-8 bg-white border-blue-100 rounded-[2rem] overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-8 transition-all duration-500 hover:border-blue-200 shadow-xl shadow-blue-900/5">
                           <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                              <Pill size={32} strokeWidth={2.5} />
                           </div>
                           <div className="flex-1 text-center md:text-left space-y-2">
                              <div>
                                 <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-1">
                                    <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">{currentTimeInfo.slot} Slot</span>
                                    <span className="text-slate-400 font-bold text-xs">{currentTimeInfo.label}</span>
                                 </div>
                                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{nextDose.medicineName}</h2>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-500 font-bold">
                                 <div className="flex items-center gap-1.5 text-base font-black text-slate-700">
                                    <Clock size={16} className="text-blue-500" /> {currentTimeInfo.slot === 'Morning' ? '08:30 AM' : currentTimeInfo.slot === 'Noon' ? '02:00 PM' : '09:30 PM'}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-sm">
                                    <FlaskConical size={16} className="text-slate-400" /> Dose: <span className="text-blue-600 font-black">{nextDose.dosage}</span>
                                 </div>
                              </div>
                           </div>
                           <button
                              onClick={() => toggleAlert(nextDose.id)}
                              className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                              <Check size={24} strokeWidth={3} /> Mark as Taken
                           </button>
                        </GlassCard>
                     </div>
                  ) :
                     (
                        <GlassCard className="p-10 bg-teal-50/50 border-teal-100 rounded-[2.5rem] border-dashed text-center space-y-3">
                           <CheckCircle2 size={48} className="text-teal-500 mx-auto mb-2" />
                           <h3 className="text-2xl font-black text-teal-900">All Set for Now!</h3>
                           <p className="text-teal-600 font-bold">You've finished all your medicines for the current session.</p>
                        </GlassCard>
                     )}
               </section>

               {/* 2. TODAY'S PROGRESS TIMELINE */}
               <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6">Today's Progress</h3>
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                     {['Morning', 'Noon', 'Night'].map((slot, i) => {
                        const s = progress[i];
                        const SlotIcon = i === 0 ? Coffee : i === 1 ? Sun : Moon;
                        return (
                           <div key={slot} className="flex-1 flex flex-col items-center gap-3 relative">
                              {i < 2 && <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-slate-100"></div>}
                              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${s.status === 'taken' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : s.status === 'pending' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300'}`}>
                                 {s.status === 'taken' ? <Check size={24} strokeWidth={3} /> : <SlotIcon size={24} />}
                              </div>
                              <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${s.status === 'taken' ? 'text-teal-600' : s.status === 'pending' ? 'text-blue-600' : 'text-slate-400'}`}>
                                 {slot}
                              </span>
                           </div>
                        )
                     })}
                  </div>
               </section>

               {/* 3. ACTIVE MEDICINES LIST */}
               <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                  <div className="flex justify-between items-end mb-6">
                     <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">Active Medicines</h3>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{enrichedAlerts.length} Medicines</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {enrichedAlerts.map((med, i) => (
                        <GlassCard key={med.id} className="p-6 md:p-8 bg-white border-slate-100 rounded-[2rem] hover:border-blue-100 transition-all flex flex-col justify-between gap-6 group">
                           <div className="flex justify-between items-start">
                              <div className="space-y-3">
                                 <h4 className="text-xl md:text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{med.medicineName}</h4>
                                 <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                       <Activity size={12} className="text-blue-500" />
                                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{med.dosage}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                       <Calendar size={12} /> {med.durationDays} Days Left
                                    </span>
                                 </div>
                              </div>
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                 <Pill size={24} />
                              </div>
                           </div>

                           <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black">DR</div>
                                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{med.doctorName}</p>
                              </div>
                              <div className="flex gap-1.5">
                                 {[0, 1, 2].map(idx => (
                                    <div
                                       key={idx}
                                       className={`w-2 h-2 rounded-full ${med.dosage.split('+')[idx] !== '0' ? 'bg-blue-500' : 'bg-slate-100'}`}
                                    />
                                 ))}
                              </div>
                           </div>
                        </GlassCard>
                     ))}
                  </div>
               </section>
            </>
         )}

         <div className="pt-10 flex flex-col items-center gap-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">Managed by DocOclock Smart Pharmacy Sync</p>
            <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-[11px] font-black text-slate-500 uppercase tracking-widest">
               <ShieldCheck className="text-teal-500" size={16} /> Data Encryption Active
            </div>
         </div>
      </div>
   );
};