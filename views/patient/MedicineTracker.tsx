import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import {
   Plus, Bell, BellOff, Clock, Trash2, Calendar,
   ChevronRight, Pill, Droplets, FlaskConical, Search,
   CheckCircle2, AlertCircle, Info, Heart, X, Activity
} from 'lucide-react';

import { PatientStorage, fetchDoctors, getMedicineAlerts, toggleMedicineAlert, fetchPrescriptions, fetchDoctorChambers } from '../../storage';
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
   const [enrichedAlerts, setEnrichedAlerts] = useState<UserMedicine[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   // 2. Fetch & Enrich Structured Alerts
   React.useEffect(() => {
      const loadAlerts = async () => {
         if (!currentPatientId) return;
         setIsLoading(true);
         try {
            // Get raw alerts (from storage helper)
            const rawAlerts = getMedicineAlerts().filter(a => String(a.patientId) === String(currentPatientId));

            if (rawAlerts.length === 0) {
               setEnrichedAlerts([]);
               return;
            }

            // Fetch prescriptions to get doctor/hospital IDs
            const prescriptions = await fetchPrescriptions(currentPatientId);

            // Get unique doctor IDs to fetch profiles
            const doctorIds = [...new Set(prescriptions.map(p => p.doctorId))].filter(Boolean);
            const allDoctors = await fetchDoctors(); // Or fetch specific profiles if we want to be more efficient

            const results = await Promise.all(rawAlerts.map(async (a) => {
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
            }));

            setEnrichedAlerts(results);
         } catch (error) {
            console.error('Error loading medicine alerts:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadAlerts();
   }, [currentPatientId, refresh]);

   const activeMeds = enrichedAlerts;

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
      <div className="space-y-6 animate-fade-in pb-20 px-4 md:px-0 max-w-4xl mx-auto">

         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Medicine Schedule</h1>
               <p className="text-slate-500 font-bold">Automatic alerts from your digital prescriptions.</p>
            </div>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
               <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
               <p className="text-slate-400 font-bold animate-pulse">Organizing your schedule...</p>
            </div>
         ) : (
            <>
               {/* DASHBOARD STATS */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <GlassCard className="p-4 bg-blue-600 text-white border-0 shadow-xl shadow-blue-100">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1.5">Active Courses</p>
                     <h2 className="text-3xl font-black">{activeMeds.filter(m => !m.completed).length}</h2>
                     <div className="mt-3 flex items-center gap-2 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-xl w-fit text-[11px]">
                        <Activity size={13} /> {activeMeds.length} Total
                     </div>
                  </GlassCard>
                  <GlassCard className="p-4 bg-white border-slate-100 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duration Status</p>
                     <h2 className="text-3xl font-black text-slate-800">{activeMeds.length > 0 ? activeMeds[0].durationDays : 0}</h2>
                     <div className="mt-3 text-[10px] font-black text-teal-600 uppercase tracking-widest">Days Course</div>
                  </GlassCard>
                  <GlassCard className="p-4 bg-white border-slate-100 shadow-sm">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Session</p>
                     <h2 className="text-3xl font-black text-slate-800">{new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Noon' : 'Night'}</h2>
                     <div className="mt-3 text-[10px] font-black text-blue-500 flex items-center gap-1 uppercase tracking-wider"><Clock size={13} /> Live Update</div>
                  </GlassCard>
               </div>

               {/* DAILY SCHEDULE */}
               <div className="space-y-6 animate-in fade-in duration-700 delay-200">
                  {(['Morning', 'Noon', 'Night'] as const).map(slot => (
                     <div key={slot} className="space-y-4">
                        <div className="flex items-center gap-3 px-1 md:px-2">
                           <div className={`w-2 h-2 rounded-full ${slot === 'Morning' ? 'bg-orange-400' : slot === 'Noon' ? 'bg-yellow-400' : 'bg-indigo-400'}`}></div>
                           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{slot} Routine</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {timeSlots[slot].length > 0 ? timeSlots[slot].map(med => (
                              <GlassCard key={med.id + slot} className={`p-4 border-0 ring-1 transition-all shadow-sm flex flex-col justify-between ${med.completed ? 'bg-slate-50 ring-slate-100 opacity-60' : 'bg-white ring-slate-100 hover:ring-blue-100'}`}>
                                 <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3">
                                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${med.completed ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                          <Pill size={20} />
                                       </div>
                                       <div>
                                          <h4 className={`font-black text-base leading-tight ${med.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{med.name}</h4>
                                          <div className="flex items-center gap-1.5 mt-1">
                                             <Calendar size={11} className="text-slate-400" />
                                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{med.startDate} • {med.durationDays} Days</p>
                                          </div>
                                       </div>
                                    </div>
                                    <button
                                       onClick={() => toggleAlert(med.id)}
                                       className={`p-2.5 rounded-xl transition-all shadow-sm ${med.completed ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                    >
                                       {med.completed ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />}
                                    </button>
                                 </div>

                                 <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${med.completed ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'}`}>Dose: {med.dose}</span>
                                       <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{med.doctorName}</span>
                                    </div>
                                    {med.completed && (
                                       <span className="text-[8px] font-black text-teal-600 uppercase bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100">Taken</span>
                                    )}
                                 </div>
                              </GlassCard>
                           )) : (
                              <div className="col-span-full py-8 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 animate-in fade-in zoom-in duration-500">
                                 <Clock size={24} className="mb-2 opacity-20" />
                                 <p className="text-[11px] font-black uppercase tracking-widest">No meds for {slot}</p>
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </>
         )}
      </div>
   );
};