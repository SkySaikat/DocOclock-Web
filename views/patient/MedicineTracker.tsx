import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import {
   Plus, Bell, BellOff, Clock, Trash2, Calendar,
   ChevronRight, Pill, Droplets, FlaskConical, Search,
   CheckCircle2, AlertCircle, Info, Heart, X, Activity
} from 'lucide-react';

import { PatientStorage, getDoctors, toggleMedicineAlert } from '../../storage';
import { MedicineAlert } from '../../types';

interface MedicineTrackerProps { }

interface UserMedicine {
   id: string;
   name: string;
   dose: string; // e.g. "1+0+1"
   startDate: string;
   durationDays: number;
   completed: boolean;
   appointmentId: string;
   doctorName?: string;
}

export const MedicineTracker: React.FC<MedicineTrackerProps> = () => {
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [refresh, setRefresh] = useState(0); // For manual UI trigger after storage update

   // 1. Get Current Patient & Doctors
   const patient = PatientStorage.get();
   const currentPatientId = patient?.id;
   const allDoctors = getDoctors();

   // 2. Fetch Structured Alerts (Exactly as requested)
   const alerts: MedicineAlert[] = useMemo(() => {
      if (!currentPatientId) return [];

      // Requested Snippet implementation
      const rawAlerts = JSON.parse(localStorage.getItem('demo_medicine_alerts') || '[]');
      return rawAlerts.filter((a: any) => String(a.patientId) === String(currentPatientId));
   }, [currentPatientId, refresh]); // Changed refresh to setRefresh to avoid direct dependency on state setter

   // 3. Map to UI Model
   const activeMeds: UserMedicine[] = useMemo(() => {
      return alerts.map(a => {
         // Find doctor via appointment (since everything connects via appointmentId as per rules)
         const prescriptions = JSON.parse(localStorage.getItem('demo_prescriptions') || '[]');
         const rx = prescriptions.find((p: any) => p.appointmentId === a.appointmentId);
         const doc = allDoctors.find(d => String(d.id) === String(rx?.doctorId));

         return {
            id: a.id,
            name: a.medicineName,
            dose: a.dosage,
            startDate: a.startDate,
            durationDays: a.durationDays,
            completed: a.completed,
            appointmentId: a.appointmentId,
            doctorName: doc?.name || 'Your Doctor'
         };
      });
   }, [alerts, allDoctors]);

   const toggleAlert = (id: string) => {
      toggleMedicineAlert(id);
      setRefresh(prev => prev + 1);
   };

   // 4. Organize by Time Slots
   const timeSlots = {
      Morning: activeMeds.filter(m => m.dose.split('+')[0] !== '0'),
      Noon: activeMeds.filter(m => m.dose.split('+')[1] !== '0'),
      Night: activeMeds.filter(m => m.dose.split('+')[2] !== '0'),
   };

   return (
      <div className="space-y-8 animate-fade-in pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Medicine Schedule</h1>
               <p className="text-slate-500 font-bold">Automatic alerts from your digital prescriptions.</p>
            </div>
         </div>

         {/* DASHBOARD STATS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 bg-blue-600 text-white border-0 shadow-xl shadow-blue-100">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Active Courses</p>
               <h2 className="text-4xl font-black">{activeMeds.filter(m => !m.completed).length}</h2>
               <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl w-fit">
                  <Activity size={14} /> {activeMeds.length} Total
               </div>
            </GlassCard>
            <GlassCard className="p-6 bg-white border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration Status</p>
               <h2 className="text-4xl font-black text-slate-800">{activeMeds.length > 0 ? activeMeds[0].durationDays : 0}</h2>
               <div className="mt-4 text-xs font-bold text-teal-600 uppercase tracking-widest">Days Course</div>
            </GlassCard>
            <GlassCard className="p-6 bg-white border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Session</p>
               <h2 className="text-4xl font-black text-slate-800">{new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Noon' : 'Night'}</h2>
               <div className="mt-4 text-xs font-bold text-blue-500 flex items-center gap-1"><Clock size={14} /> Live Update</div>
            </GlassCard>
         </div>

         {/* DAILY SCHEDULE */}
         <div className="space-y-10">
            {(['Morning', 'Noon', 'Night'] as const).map(slot => (
               <div key={slot} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                     <div className={`w-2 h-2 rounded-full ${slot === 'Morning' ? 'bg-orange-400' : slot === 'Noon' ? 'bg-yellow-400' : 'bg-indigo-400'}`}></div>
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{slot} Routine</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {timeSlots[slot].length > 0 ? timeSlots[slot].map(med => (
                        <GlassCard key={med.id + slot} className={`p-6 border-0 ring-1 transition-all shadow-sm flex flex-col justify-between ${med.completed ? 'bg-slate-50 ring-slate-100 opacity-60' : 'bg-white ring-slate-100 hover:ring-blue-100'}`}>
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${med.completed ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                    <Pill size={24} />
                                 </div>
                                 <div>
                                    <h4 className={`font-black text-lg leading-tight ${med.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{med.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                       <Calendar size={12} className="text-slate-400" />
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Started {med.startDate} • {med.durationDays} Days</p>
                                    </div>
                                 </div>
                              </div>
                              <button
                                 onClick={() => toggleAlert(med.id)}
                                 className={`p-3 rounded-2xl transition-all shadow-sm ${med.completed ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                              >
                                 {med.completed ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 border-2 border-slate-200 rounded-full" />}
                              </button>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-3">
                                 <span className={`text-xs font-black px-3 py-1 rounded-lg ${med.completed ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'}`}>Dose: {med.dose}</span>
                                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{med.doctorName}</span>
                              </div>
                              {med.completed && (
                                 <span className="text-[9px] font-black text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">Taken</span>
                              )}
                           </div>
                        </GlassCard>
                     )) : (
                        <div className="col-span-full py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                           <Clock size={32} className="mb-3 opacity-20" />
                           <p className="text-sm font-bold uppercase tracking-widest">No meds for {slot}</p>
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};