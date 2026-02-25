import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Clock, Activity, AlertCircle, RefreshCw, CheckCircle, ArrowRight, User, MapPin, Calendar, Smartphone } from 'lucide-react';
import { PatientStorage, fetchAppointments, fetchQueueSession, DoctorSessionMeta, DEFAULT_SESSION_META, QueueSessionStatus } from '../../storage';
import { Appointment } from '../../types';
import { calculateEstimatedTime } from '../../utils/timeUtils';
import { getLocalISODate } from '../../utils/date';

interface LiveSerialProps {
   appointmentId?: string | null;
}

export const LiveSerial: React.FC<LiveSerialProps> = ({ appointmentId }) => {

   const session = PatientStorage.get();
   const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
   const [currentTime, setCurrentTime] = useState(new Date());
   const [isLoading, setIsLoading] = useState(true);
   const [queueSessionStatus, setQueueSessionStatus] = useState<QueueSessionStatus>('NOT_STARTED');
   const [sessionMeta, setSessionMeta] = useState<DoctorSessionMeta>(DEFAULT_SESSION_META);
   const [isDoctorArrived, setIsDoctorArrived] = useState(false);

   const loadData = async () => {
      if (!session) return;

      try {
         const today = getLocalISODate();
         let targetApp: Appointment | null = null;

         // 1. If ID is provided, fetch specifically by ID
         if (appointmentId) {
            const results = await fetchAppointments({ id: appointmentId });
            if (results.length > 0) {
               targetApp = results[0];
            }
         }

         // 2. Fallback: Search for today's appointment if no targetApp yet
         if (!targetApp) {
            const apps = await fetchAppointments({ patientId: session.id, date: today });
            targetApp = apps.find(a => a.date === today && a.status !== 'cancelled' && a.isVisibleToPatient !== false);
         }

         if (targetApp) {
            const [fullQueue, qSession] = await Promise.all([
               fetchAppointments({ doctorId: targetApp.doctorId, hospitalId: targetApp.hospitalId, date: targetApp.date }),
               fetchQueueSession(targetApp.doctorId, targetApp.hospitalId, targetApp.date)
            ]);

            setAllAppointments(fullQueue);
            setQueueSessionStatus(qSession.sessionStatus);
            setSessionMeta(qSession.meta);
            setIsDoctorArrived(qSession.isDoctorArrived);
         } else {
            setAllAppointments([]);
         }
      } catch (error) {
         console.error('Error loading live serial data from Supabase:', error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      loadData();
      const timer = setInterval(() => {
         loadData();
         setCurrentTime(new Date());
      }, 10000);
      return () => clearInterval(timer);
   }, []);

   const myApp = useMemo(() => {
      if (!session) return null;
      const today = getLocalISODate();

      if (appointmentId) {
         return allAppointments.find(a => a.id === appointmentId) || null;
      }

      // Fallback for cases where ID isn't passed (direct nav)
      const userApps = allAppointments.filter(a =>
         (a.patientId === session.id || a.patientId.startsWith('family-')) &&
         a.date === today &&
         a.status !== 'cancelled' &&
         a.isVisibleToPatient !== false
      );
      return userApps.sort((a, b) => b.serialNumber - a.serialNumber)[0];
   }, [session?.id, allAppointments, appointmentId]);




   const liveStats = useMemo(() => {
      if (!myApp) return null;

      const today = getLocalISODate();
      const doctorApps = allAppointments.filter(a =>
         a.doctorId === myApp.doctorId &&
         a.hospitalId === myApp.hospitalId &&
         a.date === today &&
         a.isVisibleToPatient !== false
      );

      const servingApp = doctorApps.find(a => a.status === 'consulting');
      const completedApps = doctorApps.filter(a => a.status === 'completed').sort((a, b) => b.serialNumber - a.serialNumber);
      const lastCompletedToken = completedApps[0]?.serialNumber || 0;

      const visibleQueue = doctorApps.sort((a, b) => a.serialNumber - b.serialNumber);
      const servingToken = servingApp ? servingApp.serialNumber : visibleQueue.find(a => a.status === 'waiting')?.serialNumber || (lastCompletedToken + 1);

      const patientsAheadCount = visibleQueue.filter(a => a.serialNumber < myApp.serialNumber && a.status === 'waiting' && a.id !== myApp.id).length;

      const avgTimePerPatientMins = 10;
      let estimatedTime: Date;

      if (servingApp) {
         const totalPatientsToWait = Math.max(0, myApp.serialNumber - servingApp.serialNumber);
         estimatedTime = new Date(currentTime.getTime() + totalPatientsToWait * avgTimePerPatientMins * 60000);
      } else {
         const startTimePart = myApp.time.split('-')[0].trim();
         const [time, modifier] = startTimePart.split(' ');
         let [hours, minutes] = time.split(':').map(Number);
         if (modifier === 'PM' && hours < 12) hours += 12;
         if (modifier === 'AM' && hours === 12) hours = 0;

         const startTime = new Date();
         startTime.setHours(hours, minutes, 0, 0);

         const baselineTime = currentTime > startTime ? currentTime : startTime;
         const waitFromStartMinutes = (myApp.serialNumber - 1) * avgTimePerPatientMins + (Number(sessionMeta.delayMinutes) || 0);
         estimatedTime = new Date(startTime.getTime() + waitFromStartMinutes * 60000);

         if (estimatedTime < baselineTime) {
            estimatedTime = new Date(baselineTime.getTime() + (myApp.serialNumber - (lastCompletedToken + 1)) * avgTimePerPatientMins * 60000);
         }
      }

      const arrivalTime = new Date(estimatedTime.getTime() - 15 * 60000);
      const waitTimeMinutes = Math.max(0, Math.ceil((estimatedTime.getTime() - currentTime.getTime()) / 60000));

      return {
         servingToken,
         patientsAhead: patientsAheadCount,
         waitTimeMinutes,
         estimatedTime,
         arrivalTime,
         totalToday: doctorApps.length,
         queue: doctorApps.sort((a, b) => a.serialNumber - b.serialNumber)
      };
   }, [myApp?.id, allAppointments, currentTime, sessionMeta]);


   // Guard: return a placeholder if critical session data is not yet available
   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
               Syncing with DocOclock Cloud...
            </div>
         </div>
      );
   }

   if (!myApp) {
      return (
         <div className="max-w-md mx-auto py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
               <Activity size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">No Active Queue</h2>
            <p className="text-slate-500">You don't have any appointments scheduled for today.</p>
            <button
               onClick={() => window.location.href = '/patient/home'}
               className="text-blue-600 font-black flex items-center gap-2 mx-auto"
            >
               Book a Doctor <ArrowRight size={18} />
            </button>
         </div>
      );
   }

   if (queueSessionStatus === 'NOT_STARTED') {
      return (
         <div className="max-w-md mx-auto py-16 text-center space-y-8 px-4 animate-fade-in">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-soft border transition-all duration-700 ${isDoctorArrived ? 'bg-green-50 text-green-600 border-green-100 scale-110 shadow-green-100' : 'bg-medical-50 text-medical-600 border-medical-100'}`}>
               {isDoctorArrived ? <User size={40} className="animate-bounce-soft" /> : <Clock size={40} className="animate-pulse" />}
            </div>
            <div className="space-y-2">
               <h2 className={`text-3xl font-black tracking-tight leading-tight ${isDoctorArrived ? 'text-green-600' : 'text-slate-900'}`}>
                  {isDoctorArrived ? "Doctor Arrived" : "Session starting soon"}
               </h2>
               <p className="text-slate-500 font-bold max-w-[280px] mx-auto leading-relaxed">
                  {isDoctorArrived
                     ? "The doctor is in the chamber. Please wait for your serial call."
                     : `Doctor ${myApp.doctorName} has not started the live queue yet.`}
               </p>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-premium border border-slate-50 space-y-6">
               <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Your Position</p>
                  <div className="w-20 h-20 bg-medical-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-xl shadow-medical-100">
                     #{myApp.serialNumber}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="text-left">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reach By</p>
                     <p className="text-sm font-black text-slate-800">15m Early</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Consult</p>
                     <p className="text-sm font-black text-medical-600">
                        {calculateEstimatedTime(myApp.time, myApp.serialNumber, sessionMeta.delayMinutes)}
                     </p>
                  </div>
               </div>

               {myApp.chamberName && (
                  <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-bold text-slate-600 text-left space-y-2">
                     <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-medical-500" />
                        <span className="truncate">{myApp.chamberName}</span>
                     </div>
                  </div>
               )}
            </div>

            {sessionMeta.status === 'BREAK' ? (
               <div className="p-5 bg-blue-50 border border-blue-100 rounded-[1.5rem] text-blue-700 text-sm font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-50">
                  <Clock size={20} className="animate-pulse" />
                  Doctor is on a short break (~{Number(sessionMeta.delayMinutes) || 0} minutes)
               </div>
            ) : sessionMeta.status === 'DELAYED' && (
               <div className="p-5 bg-orange-600 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 shadow-xl shadow-orange-200 animate-pulse">
                  <AlertCircle size={20} />
                  Doctor may be delayed by {Number(sessionMeta.delayMinutes) || 0} minutes
               </div>
            )}

            <button
               onClick={() => window.location.reload()}
               className="text-blue-600 font-black flex items-center gap-2 mx-auto hover:underline"
            >
               <RefreshCw size={18} /> Refresh Status
            </button>
         </div>
      );
   }

   const stats = liveStats!;
   const currentServing = allAppointments.find(a =>
      a.doctorId === myApp.doctorId &&
      a.hospitalId === myApp.hospitalId &&
      a.date === getLocalISODate() &&
      a.status === 'consulting'
   );

   const isMyTurn = currentServing?.id === myApp.id;

   return (
      <div className="max-w-4xl mx-auto space-y-4 pb-10 px-4 md:px-0 animate-fade-in">
         <div className="text-center space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Tracker</h1>
            <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.2em]">{myApp.doctorName} • Real-time status</p>
         </div>

         <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-medical-400/20 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-400/20 blur-[80px] rounded-full"></div>

            <div className="bg-white rounded-[40px] overflow-hidden shadow-premium border border-slate-50 relative z-10 transition-all duration-500">
               <div className="bg-slate-50/50 border-b border-slate-100 p-4 px-8 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-medical-500 shadow-[0_0_10px_rgba(var(--medical-500-rgb),0.5)]"></span>
                     </span>
                     <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        {isMyTurn ? 'Your Consultation' : 'Live Chamber Status'}
                     </span>
                  </div>
                  <button onClick={() => window.location.reload()} className="text-[10px] font-black text-medical-600 flex items-center gap-2 hover:bg-medical-50 px-3 py-1.5 rounded-full transition-all uppercase tracking-widest">
                     <RefreshCw size={12} /> Sync
                  </button>
               </div>

               <div className="p-6 md:p-8 text-center bg-white">
                  {isMyTurn ? (
                     <div className="py-8 space-y-10 animate-bounce-soft">
                        <div className="w-28 h-28 bg-medical-600 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-premium ring-8 ring-medical-50">
                           <Activity size={56} />
                        </div>
                        <div className="space-y-2">
                           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Consulting Now</h2>
                           <p className="text-medical-600 font-black text-sm uppercase tracking-[0.2em] animate-pulse">It's your turn</p>
                        </div>
                     </div>
                  ) : sessionMeta.status === 'BREAK' ? (
                     <div className="py-6 space-y-10 animate-fade-in">
                        <div className="p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 flex flex-col items-center gap-8 relative overflow-hidden group">
                           <div className="w-24 h-24 bg-white text-medical-600 rounded-3xl flex items-center justify-center shadow-premium border border-slate-50 group-hover:scale-110 transition-transform duration-700">
                              <Clock size={48} className="animate-pulse" />
                           </div>
                           <div className="text-center relative z-10 space-y-2">
                              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Doctor on Break</h2>
                              <p className="text-medical-500 font-black text-xs uppercase tracking-widest">Will resume shortly</p>
                           </div>
                           {Number(sessionMeta.delayMinutes) > 0 && (
                              <div className="bg-medical-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-medical-100">
                                 Approx. {sessionMeta.delayMinutes} min wait
                              </div>
                           )}
                        </div>

                        <div className="flex justify-center">
                           <div className="flex flex-col items-center gap-4 relative">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Your Serial No.</p>
                              <div className="w-24 h-24 bg-white rounded-[24px] flex items-center justify-center shadow-premium text-5xl font-black text-slate-900 ring-1 ring-slate-100">
                                 {myApp.serialNumber}
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="py-2 space-y-8">
                        {/* High-end Timeline Visualizer */}
                        <div className="relative px-4 pb-12">
                           <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-gradient-to-r from-medical-400 to-medical-600 shadow-[0_0_15px_rgba(var(--medical-500-rgb),0.3)] transition-all duration-1000 ease-out"
                                 style={{ width: `${Math.min(100, ((currentServing?.serialNumber || stats.servingToken) / myApp.serialNumber) * 100)}%` }}
                              ></div>
                           </div>

                           <div className="relative flex justify-between items-center">
                              <div className="flex flex-col items-center gap-3">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Serving</p>
                                 <div className="w-16 h-16 bg-white border-2 border-slate-50 rounded-2xl flex items-center justify-center shadow-premium text-2xl font-black text-slate-700">
                                    {currentServing?.serialNumber || stats.servingToken}
                                 </div>
                              </div>

                              <div className="flex flex-col items-center gap-3">
                                 <p className="text-[9px] font-black text-medical-600 uppercase tracking-widest">You</p>
                                 <div className="w-24 h-24 bg-medical-600 rounded-[28px] flex items-center justify-center shadow-premium text-4xl font-black text-white ring-8 ring-medical-50">
                                    {myApp.serialNumber}
                                 </div>
                                 <div className="absolute -bottom-8 w-max text-center">
                                    <p className="text-[10px] font-black text-medical-600 bg-medical-50 px-3 py-1 rounded-full border border-medical-100">
                                       {stats.estimatedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-1 pt-4">
                           <h2 className="text-4xl font-black text-slate-900 tracking-tight">{stats.patientsAhead} <span className="text-slate-400 text-2xl">Ahead</span></h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 px-6 py-5 rounded-[24px] border border-slate-100 flex flex-col items-center text-center">
                              <Clock size={16} className="text-slate-400 mb-2" />
                              <p className="text-xl font-black text-slate-900 leading-none">{stats.waitTimeMinutes}<span className="text-xs ml-0.5 text-slate-400">m</span></p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Wait Time</p>
                           </div>
                           <div className="bg-medical-50 px-6 py-5 rounded-[24px] border border-medical-100 flex flex-col items-center text-center">
                              <Smartphone size={16} className="text-medical-500 mb-2" />
                              <p className="text-xl font-black text-medical-600 leading-none">{stats.arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                              <p className="text-[8px] font-black text-medical-400 uppercase tracking-widest mt-1">Reach Clinic</p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {!currentServing && (
                  <div className={`${sessionMeta.status === 'DELAYED' ? 'bg-orange-600 p-5 text-white' : sessionMeta.status === 'BREAK' ? 'bg-medical-600 p-5 text-white' : 'bg-slate-50 p-4 text-slate-500'} text-center border-t border-slate-100 transition-colors`}>
                     <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        {sessionMeta.status === 'DELAYED' ? (
                           <>
                              <AlertCircle size={16} className="animate-pulse" />
                              Doctor delay: {Number(sessionMeta.delayMinutes) || 0}m added to estimation
                           </>
                        ) : sessionMeta.status === 'BREAK' ? (
                           <>
                              <Clock size={16} className="animate-pulse" />
                              Short break in progress (~{Number(sessionMeta.delayMinutes) || 0}m)
                           </>
                        ) : (
                           <>
                              <AlertCircle size={14} className="text-medical-500" /> Arrive 15 mins before your estimated time
                           </>
                        )}
                     </p>
                  </div>
               )}
            </div>
         </div>

      </div>
   );
};
