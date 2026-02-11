import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Clock, Activity, AlertCircle, RefreshCw, CheckCircle, ArrowRight, User } from 'lucide-react';
import { PatientStorage, getAppointments, getArrivalStatus, getQueueSessionStatus, getSessionMeta, DoctorSessionMeta, DEFAULT_SESSION_META } from '../../storage';
import { Appointment } from '../../types';
import { calculateEstimatedTime } from '../../utils/timeUtils';

export const LiveSerial: React.FC = () => {
   const session = PatientStorage.get();
   const [allAppointments, setAllAppointments] = useState(getAppointments());
   const [currentTime, setCurrentTime] = useState(new Date());

   const refreshData = () => {
      setAllAppointments(getAppointments());
      setCurrentTime(new Date());
   };

   useEffect(() => {
      const timer = setInterval(refreshData, 10000);
      return () => clearInterval(timer);
   }, []);

   const myApp = useMemo(() => {
      if (!session) return null;
      const today = new Date().toISOString().split('T')[0];
      const userApps = allAppointments.filter(a =>
         (a.patientId === session.id || a.patientId.startsWith('family-')) &&
         a.date === today &&
         a.status !== 'cancelled' &&
         a.isVisibleToPatient !== false
      );
      return userApps.sort((a, b) => b.tokenNumber - a.tokenNumber)[0];
   }, [session, allAppointments]);

   const queueSessionStatus = useMemo(() => {
      if (!myApp) return 'NOT_STARTED';
      return getQueueSessionStatus(myApp.doctorId, myApp.date);
   }, [myApp]);

   const liveStats = useMemo(() => {
      if (!myApp) return null;

      const today = new Date().toISOString().split('T')[0];
      const doctorApps = allAppointments.filter(a =>
         a.doctorId === myApp.doctorId &&
         a.date === today &&
         a.isVisibleToPatient !== false
      );

      const servingApp = doctorApps.find(a => a.status === 'consulting');
      const completedApps = doctorApps.filter(a => a.status === 'completed').sort((a, b) => b.tokenNumber - a.tokenNumber);
      const lastCompletedToken = completedApps[0]?.tokenNumber || 0;

      const visibleQueue = doctorApps.sort((a, b) => a.tokenNumber - b.tokenNumber);
      const servingToken = servingApp ? servingApp.tokenNumber : visibleQueue.find(a => a.status === 'waiting')?.tokenNumber || (lastCompletedToken + 1);

      const patientsAhead = visibleQueue.filter(a => a.tokenNumber < myApp.tokenNumber && a.status === 'waiting').length;
      const avgTimePerPatientMins = 12;
      const waitTimeMinutes = patientsAhead * avgTimePerPatientMins;
      const estimatedTime = new Date(currentTime.getTime() + waitTimeMinutes * 60000);
      const arrivalTime = new Date(estimatedTime.getTime() - 15 * 60000);

      return {
         servingToken,
         patientsAhead,
         waitTimeMinutes,
         estimatedTime,
         arrivalTime,
         totalToday: doctorApps.length,
         queue: doctorApps.sort((a, b) => a.tokenNumber - b.tokenNumber)
      };
   }, [myApp, allAppointments, currentTime]);

   const sessionMeta = useMemo(() => {
      if (!myApp) return DEFAULT_SESSION_META;
      return getSessionMeta(myApp.doctorId, myApp.date);
   }, [myApp]);

   const isDoctorArrived = useMemo(() => {
      if (!myApp) return false;
      return getArrivalStatus(myApp.doctorId, myApp.date);
   }, [myApp]);

   // Guard: return a placeholder if critical session data is not yet available
   if (!myApp || !sessionMeta) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
               Syncing Queue...
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
         <div className="max-w-md mx-auto py-20 text-center space-y-6 px-4 animate-fade-in">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
               <Clock size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Doctor has not started yet</h2>
            <p className="text-slate-500 font-bold">Doctor {myApp.doctorName} has not started the session yet. Please wait or check back later.</p>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700 text-xs font-bold leading-relaxed space-y-1">
               <div className="flex justify-between items-center px-2">
                  <span>Your Serial:</span>
                  <span className="font-black text-lg">#{myApp.tokenNumber}</span>
               </div>
               <div className="pt-2 mt-2 border-t border-blue-100 flex justify-between items-center px-2">
                  <span className="text-[10px] uppercase tracking-widest text-blue-400">Estimated Consultation</span>
                  <span className="text-sm font-black text-blue-700">
                     {calculateEstimatedTime(myApp.time, myApp.tokenNumber, sessionMeta.delayMinutes)}
                  </span>
               </div>
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
      a.date === new Date().toISOString().split('T')[0] &&
      a.status === 'consulting'
   );

   const isMyTurn = currentServing?.id === myApp.id;

   return (
      <div className="max-w-md mx-auto space-y-6 pb-24 px-2 md:px-0 animate-fade-in">
         <div className="text-center mb-2">
            <h1 className="text-2xl font-black text-slate-900">Live Status</h1>
            <p className="text-slate-500 font-bold text-xs">{myApp.doctorName} • Today</p>
         </div>

         <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-3xl rounded-full -z-10"></div>

            <GlassCard className="p-0 overflow-hidden border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-white/50 rounded-[2rem]">
               <div className="bg-slate-50/80 border-b border-slate-100 p-3 px-6 flex justify-between items-center backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                     </span>
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {isMyTurn ? 'In Consultation' : 'Live Timeline'}
                     </span>
                  </div>
                  <div className="flex items-center gap-3">
                     {sessionMeta.status !== 'IDLE' && sessionMeta.status !== 'ACTIVE' && !currentServing ? (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${sessionMeta.status === 'BREAK' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                           }`}>
                           <AlertCircle size={10} />
                           {sessionMeta.status === 'BREAK' ? `On Break: ${sessionMeta.delayMinutes}m` : `Est. Delay: ${sessionMeta.delayMinutes}m`}
                        </div>
                     ) : !currentServing ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-tight">
                           <CheckCircle size={10} /> On Time
                        </div>
                     ) : null}
                     <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline">
                        <RefreshCw size={10} /> Refresh
                     </button>
                  </div>
               </div>

               <div className="p-8 text-center bg-white relative">
                  {isMyTurn ? (
                     <div className="py-6 space-y-6">
                        <div className="w-24 h-24 bg-green-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-200 animate-bounce">
                           <Activity size={48} />
                        </div>
                        <div>
                           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Your Turn</h2>
                           <p className="text-green-600 font-black text-xl uppercase tracking-tighter">Consulting Now</p>
                        </div>
                     </div>
                  ) : sessionMeta.status === 'BREAK' ? (
                     <div className="py-4 space-y-8 animate-fade-in">
                        <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col items-center gap-6 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Clock size={120} />
                           </div>
                           <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200">
                              <Clock size={40} className="animate-pulse" />
                           </div>
                           <div className="text-center relative z-10">
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Doctor is on a short break</h2>
                              <p className="text-blue-600 font-black text-sm uppercase tracking-widest">Consultation will resume shortly</p>
                           </div>
                           {Number(sessionMeta.delayMinutes) > 0 && (
                              <div className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm ring-1 ring-slate-100">
                                 Approx. {sessionMeta.delayMinutes}m remaining
                              </div>
                           )}
                        </div>

                        <div className="flex justify-center">
                           <div className="flex flex-col items-center gap-2 relative">
                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 absolute -top-5 w-20">Your Serial</span>
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-[1.2rem] flex items-center justify-center shadow-2xl shadow-blue-200 text-4xl font-black text-white transform scale-110 ring-4 ring-white">
                                 {myApp.tokenNumber}
                              </div>
                              <div className="absolute -bottom-6 w-32 text-center pointer-events-none">
                                 <p className="text-[7px] font-black uppercase text-slate-400 tracking-tighter mb-0.5 opacity-80">Estimated Time</p>
                                 <p className="text-[10px] font-black text-blue-600 drop-shadow-sm">
                                    {calculateEstimatedTime(myApp.time, myApp.tokenNumber, sessionMeta.delayMinutes)}
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="py-2 space-y-8">
                        <div className="flex items-end justify-between px-2 relative z-10">
                           <div className="absolute bottom-5 left-12 right-12 h-1.5 bg-slate-100 rounded-full -z-10 overflow-hidden">
                              <div
                                 className="h-full bg-gradient-to-r from-green-400 to-blue-500 origin-left transition-all duration-1000"
                                 style={{ width: `${Math.min(100, ((currentServing?.tokenNumber || stats.servingToken) / myApp.tokenNumber) * 100)}%` }}
                              ></div>
                           </div>

                           <div className="flex flex-col items-center gap-2 relative">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 absolute -top-5 w-20">Serving</span>
                              <div className="w-14 h-14 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center shadow-lg text-xl font-black text-slate-700">
                                 {currentServing?.tokenNumber || stats.servingToken}
                              </div>
                           </div>

                           <div className="flex flex-col items-center gap-2 relative">
                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 absolute -top-5 w-20">You</span>
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-[1.2rem] flex items-center justify-center shadow-2xl shadow-blue-200 text-4xl font-black text-white transform scale-110 ring-4 ring-white">
                                 {myApp.tokenNumber}
                              </div>
                              <div className="absolute -bottom-6 w-32 text-center pointer-events-none">
                                 <p className="text-[7px] font-black uppercase text-slate-400 tracking-tighter mb-0.5 opacity-80">Estimated Time</p>
                                 <p className="text-[10px] font-black text-blue-600 drop-shadow-sm">
                                    {calculateEstimatedTime(myApp.time, myApp.tokenNumber, sessionMeta.delayMinutes)}
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div>
                           <h2 className="text-3xl font-black text-slate-800 tracking-tight">{stats.patientsAhead} ahead</h2>
                           <p className="text-slate-500 font-black text-lg uppercase tracking-widest">Waiting</p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 divide-x divide-slate-200 border border-slate-100">
                           <div className="text-center px-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Wait Time</p>
                              <p className="text-base font-black text-slate-800">{stats.waitTimeMinutes}<span className="text-[10px] ml-0.5 text-slate-500">m</span></p>
                           </div>
                           <div className="text-center px-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reach By</p>
                              <p className="text-base font-black text-blue-600">{stats.arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {!currentServing && (
                  <div className={`${sessionMeta.status === 'DELAYED' ? 'bg-orange-600 p-4 text-white' : sessionMeta.status === 'BREAK' ? 'bg-blue-600 p-4 text-white' : 'bg-blue-50/80 p-3 text-blue-700'} text-center border-t transition-colors`}>
                     <p className="text-[10px] font-bold flex items-center justify-center gap-2">
                        {sessionMeta.status === 'DELAYED' ? (
                           <>
                              <AlertCircle size={14} className="animate-pulse" />
                              Doctor may be delayed by {Number(sessionMeta.delayMinutes) || 0} minutes
                           </>
                        ) : sessionMeta.status === 'BREAK' ? (
                           <>
                              <Clock size={14} className="animate-pulse" />
                              Doctor is on a short break (~{Number(sessionMeta.delayMinutes) || 0} minutes)
                           </>
                        ) : (
                           <>
                              <AlertCircle size={12} /> Please arrive at the chamber 15 mins before your time.
                           </>
                        )}
                     </p>
                  </div>
               )}
            </GlassCard>
         </div>

         <div className="bg-white/50 p-4 rounded-3xl border border-white/20 backdrop-blur-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Appointments Today: {stats.totalToday}</p>
         </div>
      </div>
   );
};
