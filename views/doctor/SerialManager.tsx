import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Appointment, AppointmentStatus } from '../../types';
import {
   Clock, Activity, X, Phone, CheckCircle, Bell,
   FileText, UserCheck, ChevronRight, ClipboardList,
   History, Plus, Minus, MapPin, Calendar
} from 'lucide-react';
import {
   DoctorStorage,
   fetchAppointments, upsertAppointment,
   fetchQueueSession, upsertQueueSession,
   QueueSessionStatus, DoctorSessionMeta, DEFAULT_SESSION_META,
   assignPatientToReservedSlot
} from '../../storage';
import { getLocalISODate } from '../../utils/date';

interface SerialManagerProps {
   onNavigate: (path: string) => void;
   onStartPrescription: (patient: { id: string; name: string; phone: string; gender: string; appointmentId: string; hospitalId: string }) => void;
}

export const SerialManager: React.FC<SerialManagerProps> = ({ onNavigate, onStartPrescription }) => {
   const doctor = DoctorStorage.get();
   const currentDoctorId = doctor?.id;
   const [activeHospitalId, setActiveHospitalId] = useState<string | null>(null);
   const today = getLocalISODate();
   const todayNumeric = new Date(today + "T00:00:00").getDay();

   const [activeHospitalsToday, setActiveHospitalsToday] = useState<any[]>([]);
   const [isLoadingChambers, setIsLoadingChambers] = useState(true);

   useEffect(() => {
      const loadChambers = async () => {
         if (!currentDoctorId) return;
         setIsLoadingChambers(true);
         try {
            const { fetchDoctorChambers } = await import('../../storage');
            const chambers = await fetchDoctorChambers(currentDoctorId);
            const matches = chambers.filter(chamber =>
               chamber.scheduleDays?.includes(todayNumeric) || chamber.schedule.some(s => s.day === todayNumeric)
            );
            setActiveHospitalsToday(matches);
         } catch (error) {
            console.error('Error loading chambers for manager:', error);
         } finally {
            setIsLoadingChambers(false);
         }
      };
      loadChambers();
   }, [currentDoctorId, todayNumeric]);

   // Initialize active hospital based on today's schedule
   useEffect(() => {
      if (activeHospitalsToday.length > 0) {
         const isValid = activeHospitalsToday.some(h => h.id === activeHospitalId);
         if (!activeHospitalId || !isValid) {
            setActiveHospitalId(activeHospitalsToday[0].id);
         }
      } else {
         setActiveHospitalId(null);
      }
   }, [activeHospitalsToday, activeHospitalId]);

   const activeChamber = useMemo(() =>
      activeHospitalsToday.find(c => c.id === activeHospitalId),
      [activeHospitalsToday, activeHospitalId]);

   const [doctorStatus, setDoctorStatus] = useState<'arrived' | 'not-arrived'>('not-arrived');
   const [queueSessionStatus, setQueueSessionStatus] = useState<QueueSessionStatus>('NOT_STARTED');
   const [sessionMeta, setSessionMeta] = useState<DoctorSessionMeta>(DEFAULT_SESSION_META);
   const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
   const [isLoadingQueue, setIsLoadingQueue] = useState(true);

   const [refreshCount, setRefreshCount] = useState(0);
   const [localDelay, setLocalDelay] = useState(0);
   const [isSavingDelay, setIsSavingDelay] = useState(false);
   const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
   const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
   const [showAssignModal, setShowAssignModal] = useState(false);
   const [assignData, setAssignData] = useState({ name: '', phone: '', appId: '' });

   // Unified state sync for persistent status from Supabase
   useEffect(() => {
      const loadQueueData = async () => {
         if (!doctor || !activeHospitalId) return;
         setIsLoadingQueue(true);
         try {
            const [apps, session] = await Promise.all([
               fetchAppointments({ doctorId: doctor.id, hospitalId: activeHospitalId, date: today }),
               fetchQueueSession(doctor.id, activeHospitalId, today)
            ]);

            setAllAppointments(apps);
            setDoctorStatus(session.isDoctorArrived ? 'arrived' : 'not-arrived');
            setQueueSessionStatus(session.sessionStatus);
            setSessionMeta(session.meta);
         } catch (error) {
            console.error('Error loading queue data from Supabase:', error);
         } finally {
            setIsLoadingQueue(false);
         }
      };
      loadQueueData();
   }, [currentDoctorId, activeHospitalId, today, refreshCount]);



   const isArrived = doctorStatus === 'arrived';

   const filteredAppointments = useMemo(() => {
      if (!currentDoctorId || !activeHospitalId) return [];

      const filtered = allAppointments.filter(a =>
         String(a.doctorId) === String(currentDoctorId) &&
         String(a.hospitalId) === String(activeHospitalId) &&
         a.date === today &&
         a.status !== 'cancelled'
      );

      // Part 9: Safe debug guard
      if (filtered.length === 0 && activeHospitalId) {
         console.log("Queue Debug:", {
            doctorId: currentDoctorId,
            hospitalId: activeHospitalId,
            todayISO: today,
            allCount: allAppointments.length,
            doctorApps: allAppointments.filter(a => String(a.doctorId) === String(currentDoctorId)).length
         });
      }

      return filtered;
   }, [allAppointments, currentDoctorId, activeHospitalId, today]);

   const handleSaveDelay = async () => {
      if (!doctor || !activeChamber) return;
      setIsSavingDelay(true);

      try {
         const newStatus = doctorStatus === 'not-arrived' ? 'DELAYED' : 'BREAK';
         const meta: DoctorSessionMeta = {
            ...DEFAULT_SESSION_META,
            status: newStatus,
            delayMinutes: localDelay,
            delayStartedAt: new Date().toISOString()
         };

         await upsertQueueSession({
            doctorId: doctor.id,
            hospitalId: activeChamber.id,
            date: today,
            isDoctorArrived: isArrived,
            sessionStatus: queueSessionStatus,
            meta
         });

         setSessionMeta(meta);
      } catch (error) {
         console.error('Error saving delay to Supabase:', error);
      } finally {
         setIsSavingDelay(false);
      }
   };

   const sortedAppointments = useMemo(() => {
      let list = [...filteredAppointments].sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
      if (filterStatus !== 'all') {
         list = list.filter(a => a.status === filterStatus);
      }
      return list;
   }, [filteredAppointments, filterStatus]);

   const currentApp = useMemo(() =>
      filteredAppointments.find(a => a.status === 'consulting'),
      [filteredAppointments]
   );

   const updateAppStatus = async (id: string, newStatus: AppointmentStatus) => {
      if (newStatus === 'consulting' && !isArrived) {
         alert("Please mark yourself as Arrived to start today’s session.");
         return;
      }

      try {
         // If starting consultation, complete the previous one
         if (newStatus === 'consulting') {
            const currentConsulting = allAppointments.find(a => a.status === 'consulting');
            if (currentConsulting) {
               await upsertAppointment({
                  ...currentConsulting,
                  status: 'completed',
                  completedAt: Date.now()
               });
            }
         }

         const targetApp = allAppointments.find(a => a.id === id);
         if (targetApp) {
            await upsertAppointment({
               ...targetApp,
               status: newStatus,
               completedAt: newStatus === 'completed' ? Date.now() : targetApp.completedAt
            });
         }

         setRefreshCount(prev => prev + 1);
      } catch (error) {
         console.error('Error updating appointment status in Supabase:', error);
      }
   };

   const handleNextPatient = async () => {
      if (!isArrived) {
         alert("Please mark yourself as Arrived to start today’s session.");
         return;
      }

      try {
         if (queueSessionStatus === 'NOT_STARTED') {
            if (doctor && activeChamber) {
               await upsertQueueSession({
                  doctorId: doctor.id,
                  hospitalId: activeChamber.id,
                  date: today,
                  isDoctorArrived: true,
                  sessionStatus: 'RUNNING',
                  meta: sessionMeta
               });
               setQueueSessionStatus('RUNNING');
            }
         }

         if (currentApp) {
            await updateAppStatus(currentApp.id, 'completed');
         }

         const nextWaiting = [...filteredAppointments]
            .filter(a => a.status === 'waiting' && a.isVisibleToPatient !== false && !a.isReserved)
            .sort((a, b) => a.serialNumber - b.serialNumber)[0];

         if (nextWaiting) {
            await updateAppStatus(nextWaiting.id, 'consulting');
         }
      } catch (error) {
         console.error('Error handling next patient in Supabase:', error);
      }
   };

   const selectedApp = filteredAppointments.find(a => a.id === selectedAppId);

   if (!doctor || isLoadingQueue) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
               Syncing with DocOclock Cloud...
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-4 max-w-6xl mx-auto px-2 md:px-0 pb-20 animate-fade-in">
         {/* Unified Grid-Based Control Panel */}
         <div className="bg-white border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)] rounded-xl overflow-hidden">
            {/* Row 1: Context Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50/50 bg-white">
               <div className="flex items-baseline gap-2.5">
                  <h1 className="text-base font-black text-slate-900 tracking-tighter leading-none">Today's Queue</h1>
                  <span className="px-2 py-0.5 bg-blue-50/50 text-[8px] font-bold text-blue-600 rounded-md uppercase tracking-widest border border-blue-100/30">Popular</span>
               </div>
               <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200/40 rounded-lg shrink-0">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                     {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
               </div>
            </div>

            {/* Row 2: Operational Controls (Centered) */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 px-5 py-5 bg-white">

               {/* Availability Block */}
               <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end md:items-start">
                     <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Availability</span>
                     <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter leading-none">{doctorStatus === 'arrived' ? 'Live Now' : 'Off-Duty'}</span>
                  </div>
                  <div className="flex p-0.5 bg-slate-100/80 rounded-full w-40 relative border border-slate-200/20">
                     <button
                        onClick={async () => {
                           if (doctor && activeChamber) {
                              const meta: DoctorSessionMeta = { ...DEFAULT_SESSION_META, status: 'ACTIVE', delayMinutes: 0 };
                              await upsertQueueSession({
                                 doctorId: doctor.id,
                                 hospitalId: activeChamber.id,
                                 date: today,
                                 isDoctorArrived: true,
                                 sessionStatus: queueSessionStatus,
                                 meta
                              });
                              setDoctorStatus('arrived');
                              setSessionMeta(meta);
                           }
                        }}
                        className={`flex-1 text-[8px] font-black uppercase py-2 rounded-full transition-all duration-300 z-10 ${doctorStatus === 'arrived' ? 'text-white' : 'text-slate-400'}`}
                     >
                        Arrived
                     </button>
                     <button
                        onClick={async () => {
                           if (doctor && activeChamber) {
                              await upsertQueueSession({
                                 doctorId: doctor.id,
                                 hospitalId: activeChamber.id,
                                 date: today,
                                 isDoctorArrived: false,
                                 sessionStatus: queueSessionStatus,
                                 meta: sessionMeta
                              });
                              setDoctorStatus('not-arrived');
                           }
                        }}
                        className={`flex-1 text-[8px] font-black uppercase py-2 rounded-full transition-all duration-300 z-10 ${doctorStatus === 'not-arrived' ? 'text-white' : 'text-slate-400'}`}
                     >
                        Away
                     </button>
                     <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-300 shadow-lg ${doctorStatus === 'arrived' ? 'left-0.5 bg-green-600 shadow-green-500/20' : 'left-[calc(50%+0.5px)] bg-slate-900'}`} />
                  </div>
               </div>

               <div className="hidden md:block w-px h-8 bg-slate-100/80" />

               {/* Operations Block: Delay + Action */}
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 p-0.5 bg-slate-50 border border-slate-200/40 rounded-full">
                     <button onClick={() => setLocalDelay(Math.max(0, localDelay - 5))} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200/60 rounded-full text-slate-500 hover:text-slate-900 transition-all active:scale-95 shadow-sm"><Minus size={12} /></button>
                     <div className="px-1 text-center min-w-[36px]">
                        <span className="font-black text-sm text-slate-900 leading-none">{localDelay}</span>
                        <span className="text-[9px] font-bold text-slate-400 ml-0.5">m</span>
                     </div>
                     <button onClick={() => setLocalDelay(localDelay + 5)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200/60 rounded-full text-slate-500 hover:text-slate-900 transition-all active:scale-95 shadow-sm"><Plus size={12} /></button>
                  </div>

                  <Button
                     onClick={handleSaveDelay}
                     disabled={!activeChamber || isSavingDelay}
                     className={`h-10 px-6 rounded-xl font-black text-[10px] tracking-widest transition-all shadow-md active:translate-y-px ${isSavingDelay ? 'bg-green-600 text-white border-0' : 'bg-slate-900 text-white hover:bg-black active:shadow-none'}`}
                  >
                     {isSavingDelay ? 'DONE' : 'SET DELAY'}
                  </Button>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               {sessionMeta.status === 'DELAYED' && doctorStatus === 'not-arrived' && (
                  <div className="p-6 rounded-[2rem] border-2 border-orange-200 bg-amber-50/50 space-y-3 shadow-lg shadow-orange-100/20">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                              <History size={20} />
                           </div>
                           <div>
                              <h2 className="text-xl font-black text-orange-950 tracking-tight">DELAYED SESSION</h2>
                              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-2 py-0.5 rounded">Doctor not arrived</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-orange-600">{sessionMeta.delayMinutes}m</p>
                        </div>
                     </div>
                     <p className="text-sm font-bold text-orange-800/70 pl-1">Patients have been notified of the delay.</p>
                  </div>
               )}

               {sessionMeta.status === 'BREAK' && doctorStatus === 'arrived' && (
                  <div className="p-6 rounded-[2rem] border-2 border-blue-200 bg-blue-50/50 space-y-4 shadow-lg shadow-blue-100/20">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                              <Clock size={20} />
                           </div>
                           <div>
                              <h2 className="text-xl font-black text-blue-950 tracking-tight">BREAK IN PROGRESS</h2>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded">Doctor is on break</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Duration</p>
                           <p className="text-xl font-black text-blue-600">{sessionMeta.delayMinutes} Minutes</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-center">
                        <p className="text-sm font-bold text-blue-800/70 flex-1">Break duration: {sessionMeta.delayMinutes} minutes</p>
                        <button
                           onClick={async () => {
                              if (doctor && activeChamber) {
                                 const meta: DoctorSessionMeta = { ...DEFAULT_SESSION_META, status: 'ACTIVE', delayMinutes: 0 };
                                 await upsertQueueSession({
                                    doctorId: doctor.id,
                                    hospitalId: activeChamber.id,
                                    date: today,
                                    isDoctorArrived: true,
                                    sessionStatus: queueSessionStatus,
                                    meta
                                 });
                                 setSessionMeta(meta);
                              }
                           }}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-black rounded-xl shadow-lg shadow-blue-100 uppercase tracking-widest text-xs h-11"
                        >
                           End Break
                        </button>
                     </div>
                  </div>
               )}

               <div className="relative">
                  <GlassCard className="p-8 bg-slate-900 text-white border-0 relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-blue-900/20">
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                              <Activity size={12} className="animate-pulse" /> Current Patient
                           </div>
                        </div>

                        {currentApp ? (
                           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="text-center md:text-left">
                                 <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{currentApp.patientName}</h2>
                                 <p className="text-blue-200/60 font-bold flex items-center justify-center md:justify-start gap-4">
                                    <span className="bg-white/10 px-3 py-1 rounded-lg">Serial #{currentApp.serialNumber}</span>
                                    <span className="flex items-center gap-1"><Phone size={14} /> {currentApp.patientPhone}</span>
                                 </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
                                 <Button
                                    onClick={() => setSelectedAppId(currentApp.id)}
                                    variant="outline"
                                    className="!bg-white/10 hover:!bg-white/20 !text-white !border-white/20 px-8 py-4 h-16 rounded-2xl font-black text-lg shadow-none"
                                 >
                                    Patient Records
                                 </Button>
                                 <Button
                                    className="h-16 px-10 gap-3 !bg-blue-500 hover:!bg-blue-400 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all font-black text-lg rounded-2xl !text-white"
                                    onClick={handleNextPatient}
                                    disabled={sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK'}
                                 >
                                    <Bell size={24} />
                                    {sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK' ? 'Session Paused' : 'Consult Next'}
                                 </Button>
                              </div>
                           </div>
                        ) : (
                           <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-8">
                              <h2 className="text-3xl font-black text-slate-500 tracking-tight">No Active Patient</h2>
                              <Button
                                 className="h-16 px-10 gap-3 !bg-white hover:!bg-slate-100 !text-slate-900 shadow-xl transition-all font-black text-lg rounded-2xl w-full md:w-auto"
                                 onClick={handleNextPatient}
                                 disabled={!activeChamber || sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK'}
                              >
                                 <Bell size={24} />
                                 {!activeChamber ? 'No Active Chamber' : sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK' ? 'Session Paused' : 'Consult Next'}
                              </Button>
                           </div>
                        )}
                     </div>
                  </GlassCard>
               </div>

               <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Timeline</h3>
                     <div className="flex flex-wrap gap-2">
                        {['all', 'waiting', 'consulting', 'completed', 'cancelled'].map((status) => (
                           <button
                              key={status}
                              onClick={() => setFilterStatus(status as any)}
                              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${filterStatus === status
                                 ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                 : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                 }`}
                           >
                              {status}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     {sortedAppointments.length > 0 ? sortedAppointments.map(app => {
                        const isCurrent = app.status === 'consulting';

                        return (
                           <div
                              key={app.id}
                              onClick={() => setSelectedAppId(app.id)}
                              className={`group p-5 rounded-[2rem] flex items-center justify-between cursor-pointer transition-all border-2
                        ${isCurrent ? 'bg-blue-50/50 border-blue-500 ring-4 ring-blue-500/5' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1'}
                      `}
                           >
                              <div className="flex items-center gap-6">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all
                            ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}
                          `}>
                                    {app.serialNumber}
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className={`font-black text-lg tracking-tight truncate transition-colors ${app.isReserved ? 'text-slate-400 italic' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                       {app.isReserved ? 'Reserved Slot' : app.patientName}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-bold flex items-center gap-2 mt-0.5">
                                       {app.isReserved ? (
                                          <span className="text-blue-500">Doctor Only Slot</span>
                                       ) : (
                                          <>
                                             <span className="flex items-center gap-1"><Phone size={12} /> {app.patientPhone}</span>
                                             <span className="text-slate-200">|</span>
                                             <span>Today • {app.time}</span>
                                          </>
                                       )}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest border ${app.status === 'waiting' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                    app.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                       app.status === 'consulting' ? 'bg-blue-600 text-white border-blue-600 animate-pulse' :
                                          app.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
                                             'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>{app.status === 'consulting' ? 'Serving' : app.status}</span>
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                    <ChevronRight size={24} />
                                 </div>
                              </div>
                           </div>
                        );
                     }) : (
                        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                           <ClipboardList className="mx-auto text-slate-200 mb-4" size={48} />
                           <p className="text-slate-400 font-bold">No appointments found matching this filter.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <GlassCard className="p-8 bg-white border-0 shadow-sm rounded-[2.5rem]">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Operational Insights</h3>
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-sm font-black text-slate-800">Total Patients</p>
                           <p className="text-[10px] text-slate-400 font-bold">Today's registry</p>
                        </div>
                        <span className="text-3xl font-black text-slate-900">{filteredAppointments.length}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-sm font-black text-slate-800">Remaining</p>
                           <p className="text-[10px] text-slate-400 font-bold">Waiting in queue</p>
                        </div>
                        <span className="text-3xl font-black text-yellow-600">{filteredAppointments.filter(a => a.status === 'waiting').length}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-sm font-black text-slate-800">Finished</p>
                           <p className="text-[10px] text-slate-400 font-bold">Consultations ended</p>
                        </div>
                        <span className="text-3xl font-black text-green-600">{filteredAppointments.filter(a => a.status === 'completed').length}</span>
                     </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                     <Button fullWidth variant="outline" className="h-14 rounded-2xl gap-3 border-slate-200 font-black" onClick={() => window.print()}>
                        <ClipboardList size={20} /> Export Queue List
                     </Button>
                  </div>
               </GlassCard>

               {activeChamber && (
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                        <Activity size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Hospital Today</p>
                        <h4 className="font-black text-blue-900">{activeChamber.hospitalName}</h4>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {selectedApp && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl animate-fade-in p-4">
               <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                           {selectedApp.serialNumber}
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-800">{selectedApp.patientName}</h2>
                           <p className="text-xs font-bold text-slate-400">Patient ID: {selectedApp.patientId}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAppId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Medical History</h3>
                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[150px] flex items-center justify-center italic text-slate-400">
                              No previous prescriptions found in system.
                           </div>
                        </section>
                        <section className="space-y-4">
                           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Action Center</h3>
                           <div className="space-y-3">
                              {selectedApp.status !== 'completed' && (
                                 <Button
                                    fullWidth
                                    className="h-16 text-lg font-black rounded-2xl bg-green-600 shadow-xl shadow-green-100 flex items-center gap-3"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'completed');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    <CheckCircle size={24} /> Mark as Completed
                                 </Button>
                              )}
                              <Button
                                 fullWidth
                                 className="h-16 text-lg font-black rounded-2xl bg-blue-600 shadow-xl shadow-blue-100 flex items-center gap-3"
                                 onClick={() => {
                                    if (selectedApp.isReserved) {
                                       setAssignData({ name: '', phone: '', appId: selectedApp.id });
                                       setShowAssignModal(true);
                                       return;
                                    }
                                    onStartPrescription({
                                       id: selectedApp.patientId,
                                       name: selectedApp.patientName,
                                       phone: selectedApp.patientPhone,
                                       gender: 'Male',
                                       appointmentId: selectedApp.id,
                                       hospitalId: selectedApp.hospitalId
                                    });
                                    setSelectedAppId(null);
                                    onNavigate('/doctor/prescription');
                                 }}
                              >
                                 <FileText size={24} /> {selectedApp.isReserved ? 'Assign Patient' : 'Generate Prescription'}
                              </Button>
                           </div>
                        </section>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {showAssignModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
               <GlassCard className="w-full max-w-md p-8 bg-white overflow-hidden rounded-[2.5rem] shadow-2xl border-0 animate-scale-up">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Assign Patient</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual entry for Serial #{selectedApp?.serialNumber}</p>
                     </div>
                     <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="space-y-5">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Patient Name</label>
                        <input
                           type="text"
                           autoFocus
                           className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all h-14"
                           placeholder="Enter name"
                           value={assignData.name}
                           onChange={e => setAssignData({ ...assignData, name: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                        <input
                           type="tel"
                           className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all h-14"
                           placeholder="01XXXXXXXXX"
                           value={assignData.phone}
                           onChange={e => setAssignData({ ...assignData, phone: e.target.value })}
                        />
                     </div>

                     <div className="flex gap-3 pt-2">
                        <Button
                           variant="outline"
                           fullWidth
                           className="h-14 rounded-2xl font-black text-slate-500 border-slate-200"
                           onClick={() => setShowAssignModal(false)}
                        >
                           Cancel
                        </Button>
                        <Button
                           fullWidth
                           disabled={!assignData.name || !assignData.phone}
                           className="h-14 rounded-2xl font-black bg-blue-600 shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
                           onClick={async () => {
                              if (assignData.appId && assignData.name && assignData.phone) {
                                 const slot = allAppointments.find(a => a.id === assignData.appId);
                                 if (slot) {
                                    await upsertAppointment({
                                       ...slot,
                                       patientId: `p-manual-${Date.now()}`,
                                       patientName: assignData.name,
                                       patientPhone: assignData.phone,
                                       isReserved: false,
                                       isVisibleToPatient: true
                                    });
                                 }
                                 setRefreshCount(prev => prev + 1);
                                 setShowAssignModal(false);
                                 setSelectedAppId(null);
                                 setAssignData({ name: '', phone: '', appId: '' });
                              }
                           }}
                        >
                           Confirm
                        </Button>
                     </div>
                  </div>
               </GlassCard>
            </div>
         )}
      </div>
   );
};
