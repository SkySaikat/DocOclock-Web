import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlarmClock, AlertCircle, ArrowRight, Building2, CalendarDays, Clock, Coffee, Hourglass, MapPin, Radio, RefreshCw, Stethoscope, Users } from 'lucide-react';
import { MaskIcon } from '../../components/dashboard';
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
         <div className="flex min-h-[400px] items-center justify-center font-display">
            <p className="animate-pulse text-ds-body text-content-tertiary">Syncing with DocOclock Cloud...</p>
         </div>
      );
   }

   if (!myApp) {
      return (
         <div className="flex flex-col gap-6 font-display">
            <LiveHeader />
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-ds-xl bg-white/70 px-8 py-12 text-center shadow-ds-rise">
               <div className="grid size-16 place-items-center rounded-full bg-primary-50 text-primary-500"><Activity size={28} /></div>
               <h2 className="text-ds-title-24 text-content-primary">No Active Queue</h2>
               <p className="text-ds-body text-content-secondary">You don't have any appointments scheduled for today.</p>
               <button
                  onClick={() => window.location.href = '/patient/home'}
                  className="inline-flex items-center gap-2 text-ds-subtitle text-primary-500 hover:underline"
               >
                  Book a Doctor <ArrowRight size={18} />
               </button>
            </div>
         </div>
      );
   }

   const notStarted = queueSessionStatus === 'NOT_STARTED';
   const stats = liveStats!;
   const currentServing = allAppointments.find(a =>
      a.doctorId === myApp.doctorId &&
      a.hospitalId === myApp.hospitalId &&
      a.date === getLocalISODate() &&
      a.status === 'consulting'
   );

   const isMyTurn = currentServing?.id === myApp.id;
   const delayMins = Number(sessionMeta.delayMinutes) || 0;
   const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
   const serialLabel = `#${String(myApp.serialNumber).padStart(2, '0')}`;
   const startLabel = notStarted
      ? calculateEstimatedTime(myApp.time, myApp.serialNumber, sessionMeta.delayMinutes).toLowerCase()
      : fmtTime(stats.estimatedTime);
   const waitLabel = isMyTurn ? 'Now' : stats.waitTimeMinutes >= 60
      ? `${Math.floor(stats.waitTimeMinutes / 60)}h ${stats.waitTimeMinutes % 60}m`
      : `~${stats.waitTimeMinutes}`;

   // One banner per queue state. Status colours are fixed semantic tones; the "live" tones use theme tokens.
   const banner = isMyTurn
      ? { tone: 'live', icon: <Activity size={22} />, title: "It's your turn", text: `Serial ${serialLabel} — please go in to see ${myApp.doctorName}.` }
      : sessionMeta.status === 'BREAK'
         ? { tone: 'warn', icon: <Coffee size={22} />, title: 'Doctor is on a short break', text: `Your serial number is ${serialLabel}. The queue resumes in about ${delayMins} minutes.` }
         : sessionMeta.status === 'DELAYED'
            ? { tone: 'warn', icon: <AlertCircle size={22} />, title: `Running about ${delayMins} minutes late`, text: `Your serial number is ${serialLabel}. Estimates below already include the delay.` }
            : notStarted && isDoctorArrived
               ? { tone: 'info', icon: <Building2 size={22} />, title: "Doctor is in the hospital but hasn't started", text: `Your serial number is ${serialLabel}. Consultations will begin shortly.` }
               : notStarted
                  ? { tone: 'muted', icon: <Clock size={22} />, title: "Doctor hasn't started yet", text: `Your serial number is ${serialLabel}. We'll update this page as soon as the queue opens.` }
                  : { tone: 'live', icon: <Radio size={22} />, title: 'Queue is live', text: `Serial #${String(currentServing?.serialNumber ?? stats.servingToken).padStart(2, '0')} is with the doctor now. Your serial number is ${serialLabel}.` };
   const BANNER_TONE: Record<string, string> = {
      live: 'border-primary-200 bg-primary-50 text-primary-700',
      info: 'border-sky-200 bg-sky-50 text-sky-800',
      warn: 'border-amber-200 bg-amber-50 text-amber-800',
      muted: 'border-ink-100 bg-white text-content-primary',
   };

   return (
      <div className="flex flex-col gap-6 font-display">
         <div className="flex items-end justify-between gap-4">
            <LiveHeader />
            <button onClick={() => loadData()} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-ds-body text-content-secondary transition-colors duration-300 ease-ds-out hover:text-primary-500">
               <RefreshCw size={14} /> Refresh
            </button>
         </div>

         <div role="status" className={`flex items-start gap-4 rounded-ds-xl border p-5 ${BANNER_TONE[banner.tone]}`}>
            <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white/80">
               {banner.icon}
               {banner.tone === 'live' && <span className="absolute -right-0.5 -top-0.5 size-3 animate-pulse rounded-full bg-primary-500 ring-2 ring-white" />}
            </span>
            <div className="min-w-0">
               <p className="text-[18px] font-semibold leading-snug">{banner.title}</p>
               <p className="mt-1 text-[15px] opacity-80">{banner.text}</p>
            </div>
         </div>

         <div className="grid gap-4 sm:grid-cols-3">
            <section aria-label="My serial" className="relative flex flex-col justify-between gap-3 overflow-hidden rounded-ds-xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white shadow-ds-rise">
               <span aria-hidden="true" className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
               <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">My Serial</p>
               <p className="font-display text-[64px] font-extrabold leading-none tracking-tight">{serialLabel}</p>
               <p className="text-[14px] text-white/85">Expected start · {startLabel}</p>
            </section>
            <section aria-label="Estimated wait" className="flex flex-col justify-between gap-3 rounded-ds-xl bg-white p-6 shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100">
               <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-content-tertiary">Estimated Wait</p>
                  <span className="grid size-9 place-items-center rounded-full bg-primary-50 text-primary-600"><Hourglass size={16} /></span>
               </div>
               <p className="font-display text-[44px] font-extrabold leading-none text-content-primary">{waitLabel}</p>
               <p className="text-[14px] text-content-secondary">{isMyTurn || stats.waitTimeMinutes >= 60 ? 'approximately' : 'minutes'}</p>
            </section>
            <section aria-label="People ahead" className="flex flex-col justify-between gap-3 rounded-ds-xl bg-white p-6 shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100">
               <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-content-tertiary">People Ahead</p>
                  <span className="grid size-9 place-items-center rounded-full bg-primary-50 text-primary-600"><Users size={16} /></span>
               </div>
               <p className="font-display text-[44px] font-extrabold leading-none text-content-primary">{isMyTurn ? 0 : stats.patientsAhead}</p>
               <p className="text-[14px] text-content-secondary">{stats.patientsAhead === 1 ? 'patient' : 'patients'} of {stats.totalToday} today</p>
            </section>
         </div>

         <section aria-label="Appointment details" className="rounded-ds-xl bg-white p-6 shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100">
            <div className="flex items-center gap-4 border-b border-ink-100 pb-5">
               <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-600"><Stethoscope size={26} /></span>
               <div className="min-w-0 flex-1">
                  <p className="truncate text-[20px] font-semibold text-content-primary">{myApp.doctorName}</p>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-content-tertiary">Specialist Consultation</p>
               </div>
               <a href="/patient/appointments" aria-label="View my appointments" className={ARROW_BTN}>
                  <MaskIcon src={ARROW_ICON} size={16} />
               </a>
            </div>
            <dl className="grid gap-3 pt-5 font-inter sm:grid-cols-3">
               <InfoTile icon={<CalendarDays size={18} />} label="Session" value={myApp.time} sub={myApp.date} />
               <InfoTile icon={<AlarmClock size={18} />} label="Reporting Time" value={notStarted ? '15 mins early' : fmtTime(stats.arrivalTime)} sub={notStarted ? 'before your turn' : '15 mins before your turn'} />
               <InfoTile icon={<MapPin size={18} />} label="Chamber" value={myApp.chamberName || myApp.hospitalName || '—'} sub={myApp.chamberLocation} />
            </dl>
         </section>
      </div>
   );
};

const InfoTile: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
   <div className="flex items-start gap-3 rounded-xl bg-ink-50 p-4">
      <span className="mt-0.5 shrink-0 text-primary-500">{icon}</span>
      <div className="min-w-0">
         <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-content-tertiary">{label}</dt>
         <dd className="mt-1 text-[15px] font-semibold text-content-primary">{value}</dd>
         {sub && <dd className="text-[13px] text-content-secondary">{sub}</dd>}
      </div>
   </div>
);

const ARROW_ICON = '/assets/figma/dashboard-components/user-card-icon-arrow-up-right.svg';
const ARROW_BTN = 'grid size-[42px] shrink-0 place-items-center rounded-full border border-primary-100 text-content-secondary transition-colors duration-300 ease-ds-out hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';

// Dashboard Header (339:15920): 36px title + 16px steel subtitle (24px title on phone, like the other dashboards).
const LiveHeader: React.FC = () => (
   <div className="relative flex flex-col gap-2">
      <h1 className="text-[24px] font-normal leading-[normal] text-ink-800 lg:text-ds-h36">Live Queue</h1>
      <p className="max-w-[380px] text-ds-paragraph text-steel max-lg:text-ds-small">Track Your Queue and arrive on time</p>
   </div>
);
