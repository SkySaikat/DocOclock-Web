import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Calendar, User, ArrowRight, MapPin, Stethoscope } from 'lucide-react';
import { PatientStorage, fetchAppointments, fetchPrescriptions, fetchDoctors } from '../../storage';

interface ConsultationsProps {
   onNavigate: (path: string) => void;
}

export const Consultations: React.FC<ConsultationsProps> = ({ onNavigate }) => {
   const [isLoading, setIsLoading] = useState(true);
   const [upcomingApp, setUpcomingApp] = useState<any | null>(null);
   const [pastApps, setPastApps] = useState<any[]>([]);

   const patient = useMemo(() => PatientStorage.get(), []);
   const currentPatientId = patient?.id;

   useEffect(() => {
      const loadHistory = async () => {
         if (!currentPatientId) return;
         setIsLoading(true);
         try {
            const [appointments, prescriptions, allDoctors] = await Promise.all([
               fetchAppointments({ patientId: currentPatientId }),
               fetchPrescriptions(currentPatientId),
               fetchDoctors()
            ]);

            const enriched = appointments.map(app => {
               const doc = allDoctors.find(d => String(d.id) === String(app.doctorId));
               const rx = prescriptions.find(p => p.appointmentId === app.id);
               return {
                  ...app,
                  doctorName: doc?.name || app.doctorName,
                  specialty: doc?.specialty || 'Specialist',
                  location: app.hospitalName || app.chamberName || 'Clinic',
                  imageUrl: doc?.imageUrl || "https://picsum.photos/200/200?random=" + app.id,
                  prescriptionId: rx?.id,
                  note: rx?.notes
               };
            });

            // Seprate Upcoming ('waiting' or 'consulting')
            const upcoming = enriched
               .filter(a => a.status === 'waiting' || a.status === 'consulting')
               .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            // Separate Past ('completed')
            const completed = enriched
               .filter(a => a.status === 'completed')
               .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setUpcomingApp(upcoming || null);
            setPastApps(completed);
         } catch (error) {
            console.error('Error loading consultation history:', error);
         } finally {
            setIsLoading(false);
         }
      };

      loadHistory();
   }, [currentPatientId]);

   if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center py-32 space-y-4 font-sans">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Loading Health Records</p>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-24 px-2 font-sans">
         <div className="flex justify-between items-end mb-2 pt-4">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Consultation History</h1>
            <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm mb-1">ID: #P-8832</div>
         </div>

         <div className="space-y-8">
            {/* Active Follow Up Section */}
            <div>
               <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-teal-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <GlassCard className="p-6 md:p-8 relative border-0 ring-1 ring-slate-100/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem]">
                     {upcomingApp ? (
                        <>
                           <div className="flex justify-between items-start mb-6">
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-black text-green-600 uppercase tracking-[0.15em] mb-1.5">Upcoming</span>
                                 <span className="text-2xl font-black text-slate-800 tracking-tight">Next Follow-up</span>
                              </div>
                              <div className="bg-green-50/80 text-green-700 px-4 py-2 rounded-2xl text-[13px] font-black border border-green-100/50 flex items-center gap-2.5 shadow-sm">
                                 <Calendar size={16} strokeWidth={3} />
                                 {upcomingApp.date}
                              </div>
                           </div>

                           <div className="flex items-center gap-5 mt-2 border-t border-slate-50 pt-6">
                              <img src={upcomingApp.imageUrl} className="w-16 h-16 rounded-[1.25rem] object-cover bg-slate-100 ring-4 ring-white shadow-md" alt="Doctor" />
                              <div className="flex-1">
                                 <h3 className="font-black text-slate-900 text-lg leading-tight">{upcomingApp.doctorName}</h3>
                                 <p className="text-[13px] text-teal-600 font-black uppercase tracking-wide mt-1">{upcomingApp.specialty}</p>
                                 <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mt-1.5">
                                    <MapPin size={12} className="text-slate-300" /> {upcomingApp.location}
                                 </div>
                              </div>
                           </div>

                           {upcomingApp.note && (
                              <div className="mt-6 bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100/50">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Doctor's Note</p>
                                 <p className="text-[13px] text-slate-600 italic font-medium leading-relaxed">
                                    "{upcomingApp.note}"
                                 </p>
                              </div>
                           )}
                        </>
                     ) : (
                        <div className="py-2 text-center">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col text-left">
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 opacity-50">No Activity</span>
                                 <span className="text-2xl font-black text-slate-300 tracking-tight">No Upcoming Visit</span>
                              </div>
                              <div className="bg-slate-50 text-slate-300 px-4 py-2 rounded-2xl text-[13px] font-black border border-slate-100 flex items-center gap-2.5">
                                 <Calendar size={16} />
                                 -- --- ----
                              </div>
                           </div>
                           <p className="text-slate-400 font-bold text-xs mt-4">Your future follow-ups will appear here.</p>
                        </div>
                     )}
                  </GlassCard>
               </div>
            </div>

            {/* Past Consultations Section */}
            <div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Past Consultations</h3>
               <div className="space-y-4">
                  {pastApps.length > 0 ? (
                     pastApps.map((app, i) => (
                        <GlassCard
                           key={app.id}
                           onClick={() => onNavigate('/patient/rx')}
                           className="p-5 flex items-center justify-between group cursor-pointer hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98] border-slate-100/50 shadow-sm rounded-[2rem]"
                        >
                           <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg transition-all transform group-hover:scale-110 ${i % 2 === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                 <User size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                 <h4 className="font-black text-slate-900 text-[15px]">{app.doctorName}</h4>
                                 <p className="text-[12px] text-slate-500 font-bold mt-0.5">{app.date} • {app.specialty}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="hidden md:inline text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all uppercase tracking-widest">View Prescription</span>
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-blue-50 transition-all">
                                 <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                              </div>
                           </div>
                        </GlassCard>
                     ))
                  ) : (
                     <div className="text-center py-20 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <Stethoscope size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No medical history found</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};
