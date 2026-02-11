import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Appointment, AppointmentStatus } from '../../types';
import {
   Clock, Activity, X, Phone, CheckCircle, Bell,
   FileText, UserCheck, ChevronRight, ClipboardList,
   History, MessageSquare, AlertTriangle, Plus, Minus, Save
} from 'lucide-react';
import {
   getAppointments, DoctorStorage, saveAppointments,
   getArrivalStatus, saveArrivalStatus,
   getQueueSessionStatus, saveQueueSessionStatus, QueueSessionStatus,
   assignPatientToReservedSlot,
   getSessionMeta, saveSessionMeta, DoctorSessionMeta, DEFAULT_SESSION_META
} from '../../storage';

interface SerialManagerProps {
   onNavigate: (path: string) => void;
   onStartPrescription: (patient: { name: string; age?: number; gender: string; phone: string }) => void;
}

export const SerialManager: React.FC<SerialManagerProps> = ({ onNavigate, onStartPrescription }) => {
   const session = DoctorStorage.get();
   const today = new Date().toISOString().split('T')[0];
   const [doctorStatus, setDoctorStatus] = useState<'arrived' | 'not-arrived'>(
      session && getArrivalStatus(session.id, today) ? 'arrived' : 'not-arrived'
   );
   const [queueSessionStatus, setQueueSessionStatus] = useState<QueueSessionStatus>(
      session ? getQueueSessionStatus(session.id, today) : 'NOT_STARTED'
   );
   const [sessionMeta, setSessionMeta] = useState<DoctorSessionMeta>(
      session ? getSessionMeta(session.id, today) : DEFAULT_SESSION_META
   );
   const [localDelay, setLocalDelay] = useState(0);
   const [isSavingDelay, setIsSavingDelay] = useState(false);
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
   const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
   const [showAssignModal, setShowAssignModal] = useState(false);
   const [assignData, setAssignData] = useState({ name: '', phone: '', appId: '' });

   const isArrived = doctorStatus === 'arrived';

   const loadAppointments = () => {
      if (!session || session.role !== 'doctor') return;
      const today = new Date().toISOString().split('T')[0];
      const allApps = getAppointments();
      const doctorTodayApps = allApps.filter(app =>
         app.doctorId === session.id && app.date === today
      );
      setAppointments(doctorTodayApps);
   };

   useEffect(() => {
      loadAppointments();
      const interval = setInterval(loadAppointments, 10000);
      return () => clearInterval(interval);
   }, [session]);

   const handleSaveDelay = () => {
      if (!session) return;
      setIsSavingDelay(true);

      // Determine status based on current arrival status
      const newStatus = doctorStatus === 'not-arrived' ? 'DELAYED' : 'BREAK';
      const meta: DoctorSessionMeta = {
         ...DEFAULT_SESSION_META,
         status: newStatus,
         delayMinutes: localDelay,
         delayStartedAt: new Date().toISOString()
      };

      saveSessionMeta(session.id, today, meta);
      setSessionMeta(meta);

      setTimeout(() => setIsSavingDelay(false), 800);
   };

   // Derived State for UI distinction
   const sessionUIStatus = useMemo(() => {
      if (sessionMeta.status === 'DELAYED') return 'DELAYED_PRE_ARRIVAL';
      if (sessionMeta.status === 'BREAK') return 'BREAK_IN_CHAMBER';
      return 'NORMAL';
   }, [sessionMeta.status]);

   const sortedAppointments = useMemo(() => {
      let list = [...appointments].sort((a, b) => a.tokenNumber - b.tokenNumber);
      if (filterStatus !== 'all') {
         list = list.filter(a => a.status === filterStatus);
      }
      return list;
   }, [appointments, filterStatus]);

   const currentApp = useMemo(() =>
      appointments.find(a => a.status === 'consulting'),
      [appointments]
   );

   const updateAppStatus = (id: string, newStatus: AppointmentStatus) => {
      if (newStatus === 'consulting' && !isArrived) {
         alert("Please mark yourself as Arrived to start today’s session.");
         return;
      }

      const allApps = getAppointments();
      let updatedAll = allApps;
      if (newStatus === 'consulting') {
         updatedAll = allApps.map(app =>
            (app.doctorId === session?.id && app.date === today && app.status === 'consulting')
               ? { ...app, status: 'completed' as AppointmentStatus }
               : app
         );
      }

      updatedAll = updatedAll.map(app =>
         app.id === id ? { ...app, status: newStatus } : app
      );

      saveAppointments(updatedAll);
      loadAppointments();
   };

   const handleNextPatient = () => {
      if (!isArrived) {
         alert("Please mark yourself as Arrived to start today’s session.");
         return;
      }

      if (queueSessionStatus === 'NOT_STARTED') {
         if (session) {
            saveQueueSessionStatus(session.id, today, 'RUNNING');
            setQueueSessionStatus('RUNNING');
         }
      }

      if (currentApp) {
         updateAppStatus(currentApp.id, 'completed');
      }

      const nextWaiting = [...appointments]
         .filter(a => a.status === 'waiting' && a.isVisibleToPatient !== false && !a.isReserved)
         .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

      if (nextWaiting) {
         updateAppStatus(nextWaiting.id, 'consulting');
      }
   };

   const selectedApp = appointments.find(a => a.id === selectedAppId);

   // Render Guard: Ensure critical session data exists
   if (!session || !sessionMeta) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
               Initializing Session...
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-8 max-w-6xl mx-auto px-2 md:px-0 pb-20">
         <div className="flex justify-between items-end">
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">Today's Queue</h1>
               <p className="text-slate-500 font-bold">Logged in as {session?.name}</p>
            </div>
            <div className="hidden md:block text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm uppercase tracking-[0.2em]">
               {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
         </div>

         <div className="bg-slate-50/80 rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-stretch md:items-center">
               {/* Chamber Availability Section */}
               <div className="flex items-center justify-between gap-4 w-full md:w-auto md:border-r md:border-slate-200 md:pr-12 pb-6 md:pb-0 border-b md:border-b-0 border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${doctorStatus === 'arrived' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                        <UserCheck size={20} />
                     </div>
                     <h3 className="font-black text-slate-800 uppercase tracking-widest text-[9px] truncate">Chamber Availability</h3>
                  </div>
                  <div className="flex p-0.5 bg-slate-200/50 rounded-lg w-fit shrink-0">
                     <button
                        onClick={() => {
                           setDoctorStatus('arrived');
                           if (session) {
                              saveArrivalStatus(session.id, today, true);
                              const meta: DoctorSessionMeta = { ...DEFAULT_SESSION_META, status: 'ACTIVE', delayMinutes: 0 };
                              saveSessionMeta(session.id, today, meta);
                              setSessionMeta(meta);
                           }
                        }}
                        className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-md transition-all ${doctorStatus === 'arrived' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
                     >
                        Arrived
                     </button>
                     <button
                        onClick={() => {
                           setDoctorStatus('not-arrived');
                           if (session) {
                              saveArrivalStatus(session.id, today, false);
                           }
                        }}
                        className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-md transition-all ${doctorStatus === 'not-arrived' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400'}`}
                     >
                        Away
                     </button>
                  </div>
               </div>

               {/* Expected Delay Section */}
               <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                  <div className="flex items-center justify-between gap-4 flex-1">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 shrink-0">
                           <History size={20} />
                        </div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Set Expected Delay</label>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setLocalDelay(Math.max(0, localDelay - 5))} className="w-8 h-8 flex items-center justify-center bg-slate-200/50 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"><Minus size={14} /></button>
                        <div className="w-16 bg-white border border-slate-200 rounded-lg h-8 flex items-center justify-center font-black text-sm text-slate-800">{localDelay}m</div>
                        <button onClick={() => setLocalDelay(localDelay + 5)} className="w-8 h-8 flex items-center justify-center bg-slate-200/50 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"><Plus size={14} /></button>
                     </div>
                  </div>
                  <Button
                     onClick={handleSaveDelay}
                     className={`h-10 md:h-11 px-6 rounded-xl font-black tracking-widest text-[9px] transition-all w-full md:w-auto shadow-none ${isSavingDelay ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                     {isSavingDelay ? 'SAVED' : 'APPLY DELAY'}
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
                        <Button
                           onClick={() => {
                              const meta: DoctorSessionMeta = { ...DEFAULT_SESSION_META, status: 'ACTIVE', delayMinutes: 0 };
                              saveSessionMeta(session.id, today, meta);
                              setSessionMeta(meta);
                           }}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-black rounded-xl shadow-lg shadow-blue-100 uppercase tracking-widest text-xs h-11"
                        >
                           End Break
                        </Button>
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
                                    <span className="bg-white/10 px-3 py-1 rounded-lg">Serial #{currentApp.tokenNumber}</span>
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
                                 disabled={sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK'}
                              >
                                 <Bell size={24} />
                                 {sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK' ? 'Session Paused' : 'Consult Next'}
                              </Button>
                           </div>
                        )}
                     </div>
                  </GlassCard>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Timeline</h3>
                     <div className="flex gap-2">
                        {(['all', 'waiting', 'completed'] as const).map(status => (
                           <button
                              key={status}
                              onClick={() => setFilterStatus(status as any)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${filterStatus === status ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border border-slate-100'}`}
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
                                    {app.tokenNumber}
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
                           <p className="text-slate-400 font-bold">No appointments booked yet.</p>
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
                        <span className="text-3xl font-black text-slate-900">{appointments.length}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-sm font-black text-slate-800">Remaining</p>
                           <p className="text-[10px] text-slate-400 font-bold">Waiting in queue</p>
                        </div>
                        <span className="text-3xl font-black text-yellow-600">{appointments.filter(a => a.status === 'waiting').length}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <div>
                           <p className="text-sm font-black text-slate-800">Finished</p>
                           <p className="text-[10px] text-slate-400 font-bold">Consultations ended</p>
                        </div>
                        <span className="text-3xl font-black text-green-600">{appointments.filter(a => a.status === 'completed').length}</span>
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
                           {selectedApp.tokenNumber}
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
                                       name: selectedApp.patientName,
                                       phone: selectedApp.patientPhone,
                                       gender: 'Male'
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual entry for Serial #{selectedApp?.tokenNumber}</p>
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
                           onClick={() => {
                              if (assignData.appId && assignData.name && assignData.phone) {
                                 assignPatientToReservedSlot(assignData.appId, `p-manual-${Date.now()}`, assignData.name, assignData.phone);
                                 loadAppointments();
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
