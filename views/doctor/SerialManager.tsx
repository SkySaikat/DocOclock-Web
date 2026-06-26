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
   assignPatientToReservedSlot, createNotification
} from '../../storage';
import { getLocalISODate } from '../../utils/date';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

interface SerialManagerProps {
   onNavigate: (path: string) => void;
   onStartPrescription: (patient: { id: string; name: string; phone: string; gender: string; appointmentId: string; hospitalId: string }) => void;
   overrideDoctorId?: string;
}

export const SerialManager: React.FC<SerialManagerProps> = ({ onNavigate, onStartPrescription, overrideDoctorId }) => {
   const doctor = DoctorStorage.get();
   const { autoSync, syncDelay } = useGoogleCalendar();
   const currentDoctorId = overrideDoctorId || doctor?.id;
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
   const [reservedSlotsCount, setReservedSlotsCount] = useState(0);
   const [isSavingReserved, setIsSavingReserved] = useState(false);
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
            setReservedSlotsCount(session.reservedSlotsCount);
            setSessionMeta(session.meta);

            // Auto-sync today's appointments to Google Calendar (non-blocking)
            if (apps.length > 0) {
              autoSync(apps.map(a => ({
                id: a.id,
                patientName: a.patientName,
                patientEmail: (a as any).patientEmail,
                date: a.date,
                time: a.time,
                chamberName: a.chamberName,
                chamberLocation: a.chamberLocation,
                fee: a.fee,
                serialNumber: a.serialNumber,
              })));
            }
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
         a.date === today
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

   const handleSaveReservedCount = async (count: number) => {
      if (!doctor || !activeChamber) return;
      setIsSavingReserved(true);
      try {
         await upsertQueueSession({
            doctorId: doctor.id,
            hospitalId: activeChamber.id,
            date: today,
            isDoctorArrived: isArrived,
            sessionStatus: queueSessionStatus,
            reservedSlotsCount: count,
            meta: sessionMeta
         });
         setReservedSlotsCount(count);
      } catch (error) {
         console.error('Error saving reserved count:', error);
      } finally {
         setIsSavingReserved(false);
      }
   };

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
            reservedSlotsCount,
            meta
         });

         setSessionMeta(meta);

         // Notify patients via in-app notifications + Google Calendar
         if (localDelay > 0 && filteredAppointments.length > 0) {
           const affectedApps = filteredAppointments.filter(a => a.status === 'waiting' || a.status === 'consulting');
           affectedApps.forEach(a => {
             if (a.patientId && a.patientId !== 'RESERVED') {
               createNotification({
                 recipient_id: a.patientId,
                 title: `Doctor Running ${localDelay} Min Late`,
                 body: `Dr. ${doctor?.name || 'Your doctor'} will be ${localDelay} minutes late. Your serial #${a.serialNumber} has been updated.`,
                 type: 'delay_alert',
                 link: '/live-serial',
                 metadata: { appointment_id: a.id, delay_minutes: localDelay },
               });
             }
           });
           syncDelay(
             filteredAppointments
               .filter(a => a.status === 'waiting' || a.status === 'consulting')
               .map(a => ({
                 id: a.id,
                 patientName: a.patientName,
                 date: a.date,
                 time: a.time,
                 serialNumber: a.serialNumber,
               })),
             localDelay
           );
         }
      } catch (error) {
         console.error('Error saving delay to Supabase:', error);
      } finally {
         setIsSavingDelay(false);
      }
   };

   const sortedAppointments = useMemo(() => {
      const list = [...filteredAppointments];

      // Calculate max serial for the day
      const maxPublic = activeChamber?.dailyBookingLimit || 30;

      // Inject virtual reserved slots if they don't exist as appointments
      const existingSerials = new Set(list.map(a => Number(a.serialNumber)));
      for (let i = 1; i <= reservedSlotsCount; i++) {
         const serial = i;
         if (!existingSerials.has(Number(serial))) {
            // Create a virtual reserved slot object
            list.push({
               id: `virtual-reserved-${serial}`,
               serialNumber: serial,
               status: 'waiting',
               isReserved: true,
               patientName: 'Reserved Slot',
               patientPhone: 'N/A',
               patientId: 'RESERVED',
               doctorId: currentDoctorId!,
               doctorName: doctor?.name || '',
               hospitalId: activeHospitalId!,
               hospitalName: activeChamber?.hospitalName || '',
               chamberName: activeChamber?.hospitalName || '',
               chamberLocation: activeChamber?.address || '',
               date: today,
               time: 'Reserved',
               fee: activeChamber?.feeNormal || 0,
               isVisibleToPatient: true,
               category: 'normal',
               hasPrescription: false,
               cancelledAt: null,
               completedAt: null,
               arrivalTime: null,
               consultationStartTime: null,
               consultationEndTime: null
            });
         }
      }

      const consulting = list.filter(a => a.status === 'consulting');
      const waitingAll = list.filter(a => a.status === 'waiting').sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
      const late = list.filter(a => a.status === 'late').sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
      const finished = list.filter(a => a.status === 'completed' || a.status === 'cancelled')
         .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

      let final = [...consulting, ...waitingAll, ...late, ...finished];

      const strictFilter = filterStatus as string;
      if (strictFilter !== 'all') {
         final = final.filter(a => a.status === strictFilter);
      }
      return final;
   }, [filteredAppointments, filterStatus, reservedSlotsCount, activeChamber, currentDoctorId, doctor?.name, today, activeHospitalId]);

   const currentApp = useMemo(() =>
      filteredAppointments.find(a => a.status === 'consulting'),
      [filteredAppointments]
   );

   const updateAppStatus = async (appId: string, newStatus: AppointmentStatus) => {
      try {
         // Handle virtual reserved slots
         if (appId.startsWith('virtual-reserved-')) {
            const serial = parseInt(appId.replace('virtual-reserved-', ''));

            // Guard: Check if this serial is already materialized in database
            const alreadyExists = allAppointments.some(a => a.serialNumber === serial && a.isReserved);
            if (alreadyExists) {
               console.warn(`[GUARD] Serial ${serial} already exists in DB. Skipping virtual materialization.`);
               setRefreshCount(prev => prev + 1);
               return;
            }

            if (newStatus === 'late') {
               // Materialize as a placeholder late patient
               const placeholder: Appointment = {
                  id: crypto.randomUUID(),
                  patientId: 'RESERVED', // Keep as 'RESERVED' so it stays assignable
                  patientName: 'Reserved Slot (Late)',
                  patientPhone: 'N/A',
                  doctorId: currentDoctorId!,
                  doctorName: doctor?.name || '',
                  hospitalId: activeHospitalId!,
                  hospitalName: activeChamber?.hospitalName || '',
                  chamberName: activeChamber?.hospitalName || '',
                  chamberLocation: activeChamber?.address || '',
                  date: today,
                  time: 'Late',
                  status: 'late',
                  serialNumber: serial,
                  isReserved: true,
                  fee: activeChamber?.feeNormal || 0,
                  isVisibleToPatient: true,
                  category: 'normal',
                  hasPrescription: false,
                  cancelledAt: null,
                  completedAt: null,
                  arrivalTime: Date.now(),
                  consultationStartTime: null,
                  consultationEndTime: null
               };
               await upsertAppointment(placeholder);
               setRefreshCount(prev => prev + 1);
               return;
            }
         }

         const app = allAppointments.find(a => a.id === appId);
         if (!app) return;

         if (newStatus === 'consulting' && !isArrived) {
            alert("Please mark yourself as Arrived to start today’s session.");
            return;
         }

         // Single Consulting Rule: If starting consultation, complete the previous one
         if (newStatus === 'consulting') {
            const currentConsulting = allAppointments.find(a => a.status === 'consulting');
            if (currentConsulting && currentConsulting.id !== appId) {
               await upsertAppointment({
                  ...currentConsulting,
                  status: 'completed',
                  completedAt: Date.now()
               });
            }
         }

         await upsertAppointment({
            ...app,
            status: newStatus,
         });

         setTimeout(() => setRefreshCount(prev => prev + 1), 500);
      } catch (error) {
         console.error('Error updating status:', error);
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
                  reservedSlotsCount,
                  meta: sessionMeta
               });
               setQueueSessionStatus('RUNNING');
            }
         }

         if (currentApp) {
            await updateAppStatus(currentApp.id, 'completed');
         }

         // Prioritize Waitlist over Late list
         const nextWaiting = filteredAppointments
            .filter(a => a.status === 'waiting' && !a.isReserved)
            .sort((a, b) => a.serialNumber - b.serialNumber)[0];

         if (nextWaiting) {
            await updateAppStatus(nextWaiting.id, 'consulting');
         } else {
            // If no normal waiting, check late list
            const nextLate = filteredAppointments
               .filter(a => a.status === 'late' && !a.isReserved)
               .sort((a, b) => a.serialNumber - b.serialNumber)[0];

            if (nextLate) {
               await updateAppStatus(nextLate.id, 'consulting');
            }
         }
      } catch (error) {
         console.error('Error handling next patient:', error);
      }
   };

   const selectedApp = allAppointments.find(a => a.id === selectedAppId);

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
                                 reservedSlotsCount,
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
                                 reservedSlotsCount,
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
               <div className="flex flex-col gap-2">
                  {/* Direct number input + human-readable display */}
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200/40 rounded-2xl">
                        <button onClick={() => setLocalDelay(Math.max(0, localDelay - 5))} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-95 shadow-sm"><Minus size={11} /></button>
                        <input
                           type="number"
                           min={0}
                           max={480}
                           value={localDelay}
                           onChange={e => setLocalDelay(Math.max(0, Math.min(480, parseInt(e.target.value) || 0)))}
                           className="w-14 text-center font-black text-sm text-slate-900 bg-transparent outline-none"
                        />
                        <span className="text-[9px] font-bold text-slate-400 -ml-1">m</span>
                        <button onClick={() => setLocalDelay(localDelay + 5)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-95 shadow-sm"><Plus size={11} /></button>
                     </div>
                     {localDelay > 0 && (
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                           {localDelay >= 60 ? `${Math.floor(localDelay / 60)}h${localDelay % 60 > 0 ? ` ${localDelay % 60}m` : ''}` : `${localDelay}m`}
                        </span>
                     )}
                  </div>
                  {/* Quick presets */}
                  <div className="flex gap-1 flex-wrap">
                     {[15, 30, 45, 60, 90, 120].map(v => (
                        <button key={v} onClick={() => setLocalDelay(v)} className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${localDelay === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                           {v >= 60 ? `${v/60}h` : `${v}m`}
                        </button>
                     ))}
                  </div>

                  <Button
                     onClick={handleSaveDelay}
                     disabled={!activeChamber || isSavingDelay}
                     className={`h-9 px-5 rounded-xl font-black text-[10px] tracking-widest transition-all shadow-md active:translate-y-px ${isSavingDelay ? 'bg-green-600 text-white border-0' : 'bg-slate-900 text-white hover:bg-black active:shadow-none'}`}
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
                                    reservedSlotsCount,
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
                     <div className="flex overflow-x-auto pb-2 -mb-2 no-scrollbar gap-2 flex-nowrap">
                        {['all', 'waiting', 'late', 'completed', 'cancelled'].map((status) => (
                           <button
                              key={status}
                              onClick={() => setFilterStatus(status as any)}
                              className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0 ${filterStatus === status
                                 ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                 : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
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
                              className={`group p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border
                                  ${isCurrent ? 'bg-teal-50/50 border-teal-500/50 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}
                               `}
                           >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                                 <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all
                                     ${isCurrent ? 'bg-teal-600 text-white shadow-lg' :
                                       app.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                          'bg-slate-100 text-slate-500'}
                                  `}>
                                    {app.serialNumber}
                                 </div>

                                 <div className="min-w-0 flex flex-col justify-center flex-1">
                                    <h4 className={`font-black text-base tracking-tight truncate ${app.status === 'cancelled' ? 'text-slate-300 line-through' : (app.isReserved ? 'text-slate-400 italic' : 'text-slate-900')}`}>
                                       {app.isReserved ? 'Reserved Slot' : app.patientName}
                                    </h4>
                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2 mt-0.5">
                                       {app.isReserved ? (
                                          <span className="text-teal-500/60 uppercase tracking-widest text-[8px]">Restricted Action</span>
                                       ) : (
                                          <>
                                             <span className="flex items-center gap-1"><Phone size={10} className="text-slate-300" /> {app.patientPhone}</span>
                                             <span className="hidden sm:inline w-0.5 h-0.5 rounded-full bg-slate-300" />
                                             <span className={`uppercase tracking-tighter ${app.status === 'late' ? 'text-amber-600' : ''}`}>{app.status}</span>
                                          </>
                                       )}
                                    </div>

                                    {/* MOBILE-ONLY ACTION ROW */}
                                    <div className="flex sm:hidden items-center gap-2 mt-3">
                                       {app.isReserved && app.patientId === 'RESERVED' && (
                                          <>
                                             {app.status === 'waiting' && (
                                                <button onClick={(e) => { e.stopPropagation(); setAssignData({ name: '', phone: '', appId: app.id }); setShowAssignModal(true); }} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[8px] uppercase tracking-widest">ASSIGN</button>
                                             )}
                                             <button onClick={(e) => { e.stopPropagation(); handleSaveReservedCount(Math.max(0, reservedSlotsCount - 1)); if (!app.id.startsWith('virtual-reserved-')) updateAppStatus(app.id, 'cancelled'); }} className="p-1.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg"><Plus size={14} className="rotate-45" /></button>
                                          </>
                                       )}
                                       {!app.isReserved && ['waiting', 'late'].includes(app.status) && (
                                          <>
                                             <button onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'consulting'); }} className="p-1.5 bg-teal-600 text-white rounded-lg"><Activity size={14} /></button>
                                             <button onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'cancelled'); }} className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg"><X size={14} /></button>
                                          </>
                                       )}
                                       {app.status === 'consulting' && (
                                          <button onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'completed'); }} className="px-3 py-1 bg-teal-600 text-white rounded-lg font-black text-[9px] uppercase">COMPLETE</button>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* DESKTOP-ONLY ACTION ROW */}
                              <div className="hidden sm:flex items-center gap-2 shrink-0">
                                 {app.isReserved && app.patientId === 'RESERVED' && (
                                    <>
                                       {app.status === 'waiting' && (
                                          <button
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setAssignData({ name: '', phone: '', appId: app.id });
                                                setShowAssignModal(true);
                                             }}
                                             className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-black transition-colors shadow-sm"
                                          >
                                             ASSIGN
                                          </button>
                                       )}
                                       {app.status === 'late' && (
                                          <button
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setAssignData({ name: '', phone: '', appId: app.id });
                                                setShowAssignModal(true);
                                             }}
                                             className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-black transition-colors shadow-sm"
                                          >
                                             ASSIGN
                                          </button>
                                       )}
                                       {app.status === 'waiting' && (
                                          <button
                                             onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'late'); }}
                                             className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors"
                                             title="Push to Late"
                                          >
                                             <Clock size={16} />
                                          </button>
                                       )}
                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             // Always decrement count when releasing a slot (whether virtual or materialized)
                                             handleSaveReservedCount(Math.max(0, reservedSlotsCount - 1));

                                             if (!app.id.startsWith('virtual-reserved-')) {
                                                // If materialized, also cancel the record
                                                updateAppStatus(app.id, 'cancelled');
                                             }
                                          }}
                                          className="p-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors"
                                          title="Release to Public"
                                       >
                                          <Plus size={16} className="rotate-45" />
                                       </button>
                                    </>
                                 )}

                                 {!app.isReserved && app.status === 'waiting' && (
                                    <>
                                       <button
                                          onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'consulting'); }}
                                          className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                                          title="Start Consultation"
                                       >
                                          <Activity size={16} />
                                       </button>
                                       <button
                                          onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'late'); }}
                                          className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors"
                                          title="Mark Late"
                                       >
                                          <Clock size={16} />
                                       </button>
                                       <button
                                          onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'cancelled'); }}
                                          className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                                          title="Cancel"
                                       >
                                          <X size={16} />
                                       </button>
                                    </>
                                 )}

                                 {!app.isReserved && app.status === 'late' && (
                                    <>
                                       <button
                                          onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'consulting'); }}
                                          className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                                          title="Start Consultation"
                                       >
                                          <Activity size={16} />
                                       </button>
                                       <button
                                          onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'cancelled'); }}
                                          className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                                          title="Cancel"
                                       >
                                          <X size={16} />
                                       </button>
                                    </>
                                 )}

                                 {app.status === 'consulting' && (
                                    <button
                                       onClick={(e) => { e.stopPropagation(); updateAppStatus(app.id, 'completed'); }}
                                       className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider hover:bg-teal-700 transition-colors shadow-sm"
                                    >
                                       COMPLETE
                                    </button>
                                 )}

                                 {['completed', 'cancelled'].includes(app.status) && (
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                       <History size={16} />
                                    </div>
                                 )}

                                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-all ml-2">
                                    <ChevronRight size={16} />
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
                              {selectedApp.status === 'consulting' && (
                                 <Button
                                    fullWidth
                                    className="h-16 text-lg font-black rounded-2xl bg-teal-600 shadow-xl shadow-teal-100 flex items-center gap-3 !text-white"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'completed');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    <CheckCircle size={24} /> Complete Consultation
                                 </Button>
                              )}

                              {(selectedApp.status === 'waiting' || selectedApp.status === 'late') && (
                                 <Button
                                    fullWidth
                                    className="h-16 text-lg font-black rounded-2xl bg-teal-600 shadow-xl shadow-teal-100 flex items-center gap-3 !text-white"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'consulting');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    <Activity size={24} /> Start Consultation
                                 </Button>
                              )}

                              {selectedApp.status === 'waiting' && (
                                 <Button
                                    fullWidth
                                    variant="outline"
                                    className="h-14 text-sm font-black rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'late');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    <Clock size={18} /> Mark as Late
                                 </Button>
                              )}

                              {(selectedApp.status === 'waiting' || selectedApp.status === 'late') && (
                                 <Button
                                    fullWidth
                                    variant="outline"
                                    className="h-14 text-sm font-black rounded-xl border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'cancelled');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    <X size={18} /> Cancel Appointment
                                 </Button>
                              )}

                              {!['waiting', 'late', 'consulting'].includes(selectedApp.status) && (
                                 <div className="bg-slate-50 p-6 rounded-2xl text-center">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation {selectedApp.status}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 italic">No further actions available for this record.</p>
                                 </div>
                              )}

                              <Button
                                 fullWidth
                                 className="h-16 text-lg font-black rounded-2xl bg-slate-900 shadow-xl shadow-slate-100 flex items-center gap-3 !text-white"
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
                                 <FileText size={24} /> {selectedApp.isReserved ? 'Assign Patient' : 'Open Prescription'}
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
                                 let slot = allAppointments.find(a => a.id === assignData.appId);

                                 // Handle virtual slot
                                 if (!slot && assignData.appId.startsWith('virtual-reserved-')) {
                                    const serial = parseInt(assignData.appId.replace('virtual-reserved-', ''));
                                    slot = {
                                       id: crypto.randomUUID(),
                                       serialNumber: serial,
                                       status: 'waiting',
                                       isReserved: true,
                                       patientName: 'Reserved Slot',
                                       patientPhone: 'N/A',
                                       patientId: 'RESERVED',
                                       doctorId: currentDoctorId!,
                                       doctorName: doctor?.name || '',
                                       hospitalId: activeHospitalId!,
                                       hospitalName: activeChamber?.hospitalName || '',
                                       chamberName: activeChamber?.hospitalName || '',
                                       chamberLocation: activeChamber?.address || '',
                                       date: today,
                                       time: 'Reserved',
                                       fee: activeChamber?.feeNormal || 0,
                                       isVisibleToPatient: true,
                                       category: 'normal',
                                       hasPrescription: false,
                                       cancelledAt: null,
                                       completedAt: null,
                                       arrivalTime: Date.now(),
                                       consultationStartTime: null,
                                       consultationEndTime: null
                                    } as Appointment;
                                 }

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
