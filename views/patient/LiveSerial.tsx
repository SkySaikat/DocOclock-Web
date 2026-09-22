import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react';
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

   // "Start" = when this patient's consultation is expected to start; before the doctor opens the queue it is the schedule-based estimate.
   const startLabel = notStarted
      ? calculateEstimatedTime(myApp.time, myApp.serialNumber, sessionMeta.delayMinutes).toLowerCase()
      : fmtTime(stats.estimatedTime);
   const ongoingSerial = currentServing?.serialNumber ?? stats.servingToken;
   const waitingQueue = stats.queue.filter(a => a.status === 'waiting');
   const nextSerial = waitingQueue.find(a => a.serialNumber > ongoingSerial)?.serialNumber ?? waitingQueue[0]?.serialNumber;
   const ongoingLabel = notStarted
      ? (isDoctorArrived ? 'Doctor Arrived' : 'Not Started')
      : sessionMeta.status === 'BREAK' ? 'On Break'
      : currentServing ? 'Ongoing' : 'Up Now';
   // Consulting → Prescribing → Wrapping Up: elapsed time of the running consultation against the 10-minute average used above.
   const consultFraction = currentServing?.consultationStartTime
      ? Math.min(1, Math.max(0.04, (currentTime.getTime() - currentServing.consultationStartTime) / (10 * 60000)))
      : currentServing ? 0.04 : 0;

   // Session notice: the old tracker's break / delay / "doctor has not started" banners, kept as one soft pill under the title.
   const notice = sessionMeta.status === 'BREAK'
      ? { tone: 'accent', icon: <Clock size={16} />, text: `Doctor is on a short break (~${delayMins} minutes)` }
      : sessionMeta.status === 'DELAYED'
         ? { tone: 'warn', icon: <AlertCircle size={16} />, text: `Doctor may be delayed by ${delayMins} minutes` }
         : isMyTurn
            ? { tone: 'accent', icon: <Activity size={16} />, text: "It's your turn — consulting now" }
            : notStarted
               ? { tone: 'muted', icon: <Clock size={16} />, text: isDoctorArrived ? 'The doctor is in the chamber. Please wait for your serial call.' : `Doctor ${myApp.doctorName} has not started the live queue yet.` }
               : null;

   return (
      // Figma "Queue" 339:15916 (phone 357:19153). Page background + gutters come from Layout; body font Instrument Sans, card copy Inter.
      // No animate-fade-in here: its `forwards` fill keeps a stacking context that stops the building image from blending with the page.
      <div className="relative flex flex-col gap-6 font-display">
         {/* image 1235: decorative hospital building, mix-blend-darken over the page gradient (937x591, 36px below the header top). */}
         <img
            src="/assets/figma/patient-live-appts/hospital-building.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none order-last -mb-6 w-full select-none mix-blend-darken lg:absolute lg:right-0 lg:top-9 lg:order-none lg:mb-0 lg:h-[591px] lg:w-[937px] lg:max-w-[72%] lg:object-cover"
         />

         <LiveHeader />

         {notice && (
            <p className={`relative inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-ds-body ${notice.tone === 'warn' ? 'bg-orange-50 text-orange-700' : notice.tone === 'accent' ? 'bg-primary-50 text-primary-600' : 'bg-white/70 text-content-secondary'}`}>
               {notice.icon}{notice.text}
            </p>
         )}

         {/* Queue Manage Row */}
         <div className="relative flex flex-col gap-7 font-inter">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
               <div className="flex flex-col gap-4 sm:flex-row">
                  {/* "My Serial" card (328x202). The green left bar is Figma's 297:12283 variant, used here while it is the patient's turn. */}
                  <section aria-label="My serial" className="relative flex min-h-[202px] w-full flex-col justify-between gap-4 overflow-clip rounded-ds-xl bg-white/50 p-6 shadow-ds-rise sm:w-[328px]">
                     {isMyTurn && <span aria-hidden="true" className="absolute bottom-6 left-6 top-6 w-1 rounded-full bg-primary-500" />}
                     <div className={`flex items-center justify-between ${isMyTurn ? 'pl-6' : ''}`}>
                        <p className="text-ds-title-24 text-content-primary">My Serial</p>
                        <a href="/patient/appointments" aria-label="View my appointments" className={ARROW_BTN}>
                           <MaskIcon src={ARROW_ICON} size={16} />
                        </a>
                     </div>
                     <p className={`tracking-[-0.96px] text-content-primary ${isMyTurn ? 'pl-6' : ''}`}>
                        <span className="text-[24px]">#</span><span className="text-[48px] leading-none">{myApp.serialNumber}</span>
                     </p>
                     <div className={`flex gap-1 ${isMyTurn ? 'pl-6' : ''}`}>
                        <Stat label="Start" value={startLabel} />
                        <Stat label="People Ahead" value={isMyTurn ? 'Your turn' : String(stats.patientsAhead)} />
                     </div>
                  </section>

                  {/* Info column (218): Reporting Time / Session / Address. */}
                  <dl className="flex w-full flex-col gap-4 rounded-ds-xl bg-white/50 px-4 py-5 shadow-ds-rise sm:w-[218px] sm:bg-transparent sm:shadow-none lg:py-5">
                     <Stat as="dd" label="Reporting Time" value={notStarted ? '15 mins  Early' : `${fmtTime(stats.arrivalTime)} · 15 mins early`} />
                     <Stat as="dd" label="Session" value={myApp.chamberName || myApp.hospitalName || myApp.doctorName} />
                     {myApp.chamberLocation && <Stat as="dd" label="Address" value={myApp.chamberLocation} />}
                  </dl>
               </div>
            </div>

            <div className="flex items-baseline justify-between gap-4">
               <h2 className="text-content-primary">
                  <span className="text-[24px]">In Progress </span>
                  <span className="text-[16px]">({notStarted ? 0 : Math.min(ongoingSerial, stats.totalToday)}/{stats.totalToday})</span>
               </h2>
               <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 text-ds-body text-content-secondary transition-colors duration-300 ease-ds-out hover:text-primary-500">
                  <RefreshCw size={14} /> Refresh
               </button>
            </div>

            {/* Bottom: Ongoing (349) + Next Serial (247); a swipe row on phone like 357:19153. */}
            <div className="-mx-6 flex snap-x gap-2 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
               <section aria-label="Ongoing consultation" className="flex min-h-[194px] w-[85%] shrink-0 snap-start flex-col justify-between gap-6 rounded-ds-xl bg-white/70 p-6 shadow-ds-rise sm:w-[349px]">
                  <div className="flex items-start gap-1">
                     <div className="flex w-[71px] flex-col items-center text-center">
                        <span className="text-[55px] leading-none tracking-[-0.55px] text-content-primary">{notStarted ? '—' : ongoingSerial}</span>
                        <span className="text-ds-body tracking-[-0.14px] text-content-secondary">Serial No</span>
                     </div>
                     <p className="text-ds-title-24 text-content-primary">{ongoingLabel}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex justify-between text-ds-small tracking-[-0.72px] text-content-secondary">
                        <span>Consulting</span><span>Prescribing</span><span>Wrapping Up</span>
                     </div>
                     <div className="relative h-2 rounded-full bg-ink-50" role="progressbar" aria-label="Consultation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(consultFraction * 100)}>
                        <div className="h-full rounded-full bg-primary-500 transition-[width] duration-1000 ease-ds-out" style={{ width: `${consultFraction * 100}%` }} />
                        {consultFraction > 0 && (
                           <MaskIcon src="/assets/figma/patient-live-appts/progress-indicator.svg" size={7} className="absolute -top-[7px] -translate-x-1/2 text-primary-500" style={{ left: `${consultFraction * 100}%` }} />
                        )}
                     </div>
                  </div>
               </section>

               <section aria-label="Next serial" className="flex min-h-[194px] w-[60%] shrink-0 snap-start flex-col gap-6 rounded-ds-xl bg-primary-500 p-6 text-white drop-shadow-[0px_-1px_6px_rgba(0,0,0,0.04)] sm:w-[247px]">
                  <div className="flex flex-col gap-2">
                     <span className="text-ds-small tracking-[-0.72px]">Next Serial</span>
                     <span className="text-[48px] leading-none tracking-[-0.96px]">{nextSerial != null ? `#${nextSerial}` : '—'}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                     <span className="text-ds-small tracking-[-0.72px]">In Waiting room</span>
                     <span className="text-[16px] tracking-[-0.32px]">{waitingQueue.length}</span>
                  </div>
               </section>
            </div>
         </div>
      </div>
   );
};

const ARROW_ICON = '/assets/figma/dashboard-components/user-card-icon-arrow-up-right.svg';
const ARROW_BTN = 'grid size-[42px] shrink-0 place-items-center rounded-full border border-primary-100 text-content-secondary transition-colors duration-300 ease-ds-out hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';

// Dashboard Header (339:15920): 36px title + 16px steel subtitle (24px title on phone, like the other dashboards).
const LiveHeader: React.FC = () => (
   <div className="relative flex flex-col gap-2">
      <h1 className="text-[24px] font-normal leading-[normal] text-ink-800 lg:text-ds-h36">Live Queue</h1>
      <p className="max-w-[380px] text-ds-paragraph text-steel max-lg:text-ds-small">Track Your Queue and arrive on time</p>
   </div>
);

// Label (12px secondary) over value (16px primary), Inter — the stat pattern used across the Figma queue cards.
const Stat: React.FC<{ label: string; value: string; as?: 'div' | 'dd' }> = ({ label, value, as = 'div' }) => {
   const Label = as === 'dd' ? 'dt' : 'span';
   const Value = as === 'dd' ? 'dd' : 'span';
   return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
         <Label className="text-ds-small tracking-[-0.72px] text-content-secondary">{label}</Label>
         <Value className="whitespace-pre-wrap text-[16px] tracking-[-0.32px] text-content-primary">{value}</Value>
      </div>
   );
};
