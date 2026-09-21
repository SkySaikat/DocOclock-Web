import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, AppointmentStatus } from '../../types';
import { Clock, Activity, X, CheckCircle, FileText } from 'lucide-react';
import {
   DoctorStorage,
   fetchAppointments, upsertAppointment,
   fetchQueueSession, upsertQueueSession,
   QueueSessionStatus, DoctorSessionMeta, DEFAULT_SESSION_META,
   assignPatientToReservedSlot, createNotification
} from '../../storage';
import { getLocalISODate } from '../../utils/date';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { useToast } from '../../components/ToastProvider';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';
import { DashboardButton, StatusUpdateModal, MaskIcon, DS_ICONS } from '../../components/dashboard';
import { QueueHeader } from '../../components/doctor/queue/QueueHeader';
import { QueueClock } from '../../components/doctor/queue/QueueClock';
import { QueueProgress } from '../../components/doctor/queue/QueueProgress';
import { LiveQueueCard, IdleQueueCard, PausedQueueCard } from '../../components/doctor/queue/QueueStatusCards';
import { AvailabilityCard } from '../../components/doctor/queue/AvailabilityCard';
import { UpNextRow } from '../../components/doctor/queue/UpNextRow';
import { QueuePatientCard } from '../../components/doctor/queue/QueuePatientCard';
import { QueueListPanel } from '../../components/doctor/queue/QueueListPanel';
import { QueueStatusModal } from '../../components/doctor/queue/QueueStatusModal';
import { ConfirmCompleteModal } from '../../components/doctor/queue/ConfirmCompleteModal';
import { buildStatusOptions, isOpenReservedSlot, statusLabelOf, toneOf } from '../../components/doctor/queue/queueUtils';

// Quick delay presets (same values as before; rendered as Figma's chips in the Queue Status modal).
const DELAY_PRESETS = [15, 30, 45, 60, 90, 120] as const;

interface SerialManagerProps {
   onNavigate: (path: string) => void;
   onStartPrescription: (patient: { id: string; name: string; phone: string; gender: string; appointmentId: string; hospitalId: string }) => void;
   overrideDoctorId?: string;
}

export const SerialManager: React.FC<SerialManagerProps> = ({ onNavigate, onStartPrescription, overrideDoctorId }) => {
   const doctor = DoctorStorage.get();
   const { autoSync, syncDelay } = useGoogleCalendar();
   // window.alert is avoided on Capacitor (CLAUDE.md): the two "mark yourself as Arrived" prompts use the design-system toast instead.
   const { showToast } = useToast();
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

   // Figma overlays (view state only): Card 3 "Queue Status", the "complete this session?" confirm, the "Queue List" panel and the
   // per-row "Update Status" sheet (holds the appointment id it was opened for).
   const [showStatusModal, setShowStatusModal] = useState(false);
   const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
   const [showQueueList, setShowQueueList] = useState(false);
   const [statusSheetAppId, setStatusSheetAppId] = useState<string | null>(null);

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

   // The Arrived / Away / End Break actions used to be inline onClick closures of the availability toggle and the break banner.
   // Same bodies, now named so the Figma "Queue Status" modal and the Paused card can call them.
   const handleMarkArrived = async () => {
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
   };

   const handleMarkAway = async () => {
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
   };

   const handleEndBreak = async () => {
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
   };

   // Queue order (consulting, waiting, late, then finished) is `orderedAppointments`; `sortedAppointments` is that list after the
   // status filter (the filter chips now live in the Queue List panel, the Up Next strip always shows the unfiltered upcoming rows).
   const orderedAppointments = useMemo(() => {
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

      return [...consulting, ...waitingAll, ...late, ...finished];
   }, [filteredAppointments, reservedSlotsCount, activeChamber, currentDoctorId, doctor?.name, today, activeHospitalId]);

   const sortedAppointments = useMemo(() => {
      const strictFilter = filterStatus as string;
      return strictFilter !== 'all' ? orderedAppointments.filter(a => a.status === strictFilter) : orderedAppointments;
   }, [orderedAppointments, filterStatus]);

   const currentApp = useMemo(() =>
      filteredAppointments.find(a => a.status === 'consulting'),
      [filteredAppointments]
   );

   // Figma "Queue Progress" counts (real appointment records only, like the old Operational Insights):
   // Completed / Remaining (waiting + consulting) / Cancelled / No Show (= late).
   const queueCounts = useMemo(() => ({
      completed: filteredAppointments.filter(a => a.status === 'completed').length,
      remaining: filteredAppointments.filter(a => a.status === 'waiting' || a.status === 'consulting').length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'late').length,
   }), [filteredAppointments]);

   // Figma "Session ... (approx.)": average length of today's finished consultations (null until one has both timestamps).
   const avgSessionMins = useMemo(() => {
      const durations = filteredAppointments
         .filter(a => a.status === 'completed' && a.consultationStartTime && a.consultationEndTime)
         .map(a => (a.consultationEndTime as number) - (a.consultationStartTime as number))
         .filter(ms => ms > 0);
      if (durations.length === 0) return null;
      return Math.max(1, Math.round(durations.reduce((sum, ms) => sum + ms, 0) / durations.length / 60000));
   }, [filteredAppointments]);

   // "Up Next" strip = upcoming rows (waiting + late, incl. reserved slots) in queue order, independent of the panel's filter.
   const upNextApps = useMemo(
      () => orderedAppointments.filter(a => a.status === 'waiting' || a.status === 'late'),
      [orderedAppointments]
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
            showToast("Please mark yourself as Arrived to start today’s session.", 'warning');
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
         showToast("Please mark yourself as Arrived to start today’s session.", 'warning');
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

   // Figma PAUSED frame = a delay (doctor not arrived) or a break is active. These are the two conditions the old
   // "Delayed Session" / "Break In Progress" banners and the disabled "Session Paused" button used.
   const isPaused = sessionMeta.status === 'DELAYED' || sessionMeta.status === 'BREAK';
   const statusSheetApp = statusSheetAppId ? orderedAppointments.find(a => a.id === statusSheetAppId) : undefined;
   const statusSheet = statusSheetApp ? buildStatusOptions(statusSheetApp) : null;
   const assignSerial = selectedApp?.serialNumber ?? orderedAppointments.find(a => a.id === assignData.appId)?.serialNumber;

   // Reserved-slot "Release to Public" (same body the row button had for virtual and materialized slots).
   const releaseReservedSlot = (app: Appointment) => {
      // Always decrement count when releasing a slot (whether virtual or materialized)
      handleSaveReservedCount(Math.max(0, reservedSlotsCount - 1));

      if (!app.id.startsWith('virtual-reserved-')) {
         // If materialized, also cancel the record
         updateAppStatus(app.id, 'cancelled');
      }
   };

   const openAssignFor = (appId: string) => {
      setAssignData({ name: '', phone: '', appId });
      setShowAssignModal(true);
   };

   // Figma "Update Status" sheet -> the existing per-row actions (see queueUtils.buildStatusOptions for the allowed set).
   const handleStatusSheetSelect = (app: Appointment, optionId: string) => {
      const { value } = buildStatusOptions(app);
      setStatusSheetAppId(null);
      if (optionId === value) return; // already in that status ("Arrived" = waiting)
      switch (optionId) {
         case 'consulting': updateAppStatus(app.id, 'consulting'); break;
         case 'late':
         case 'push-late': updateAppStatus(app.id, 'late'); break;
         case 'cancelled': updateAppStatus(app.id, 'cancelled'); break;
         case 'completed': updateAppStatus(app.id, 'completed'); break;
         case 'assign': openAssignFor(app.id); break;
         case 'release': releaseReservedSlot(app); break;
         default: break;
      }
   };

   // "Prescribe & End": the same hand-off "Open Prescription" in the patient record used.
   const handlePrescribeCurrent = () => {
      if (!currentApp) return;
      onStartPrescription({
         id: currentApp.patientId,
         name: currentApp.patientName,
         phone: currentApp.patientPhone,
         gender: 'Male',
         appointmentId: currentApp.id,
         hospitalId: currentApp.hospitalId
      });
      onNavigate('/doctor/prescription');
   };

   if (!doctor || isLoadingQueue) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-content-tertiary font-bold uppercase tracking-widest text-xs">
               Syncing with DocOclock Cloud...
            </div>
         </div>
      );
   }

   return (
      <div className="font-display">
      {/* The page content fades in (animate-fade-in creates a stacking context), the overlays below sit outside it so their z-[200]
          stays above the sticky navbar. */}
      <div className="flex flex-col gap-6 animate-fade-in">
         {onNavigate && <DoctorTabBar currentPath="/doctor/serial-manager" onNavigate={onNavigate} />}

         <QueueHeader onUpdateStatus={() => setShowStatusModal(true)} />

         {isPaused ? (
            // Figma 328:14902: orange Paused card + 36px clock + "Doctor hasn't arrived yet".
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
               <PausedQueueCard
                  minutes={sessionMeta.delayMinutes}
                  resumeLabel={doctorStatus === 'arrived' ? 'End Break' : 'Mark Arrived'}
                  onResume={doctorStatus === 'arrived' ? handleEndBreak : handleMarkArrived}
               />
               <div className="w-full md:w-[412px] md:shrink-0 md:py-2">
                  <QueueClock size="md" note={doctorStatus === 'arrived' ? 'Doctor is on a break' : 'Doctor hasn’t arrived yet'} />
               </div>
            </div>
         ) : (
            // Figma 368:14306: live card (524) + clock and Queue Progress column (412). With no patient in the chair the row follows the
            // flow-start frame 328:13919 instead: card | Availability (308) | clock + progress. Below `lg` the row dissolves into the page
            // column (`contents`) so the phone order matches Figma 341:18476 / 368:17738: clock, card, Up Next, then Queue Progress.
            <div className="contents lg:flex lg:flex-row lg:gap-6">
               {currentApp ? (
                  <LiveQueueCard
                     className="order-2 lg:order-none"
                     isArrived={isArrived}
                     name={currentApp.patientName}
                     subtitle={currentApp.patientPhone}
                     serialNo={currentApp.serialNumber}
                     startedAt={currentApp.consultationStartTime}
                     avgSessionMins={avgSessionMins}
                     onOpenRecords={() => setSelectedAppId(currentApp.id)}
                     onPrescribe={handlePrescribeCurrent}
                     onConsultNext={handleNextPatient}
                     onEndSession={() => setShowCompleteConfirm(true)}
                  />
               ) : (
                  <>
                     <IdleQueueCard
                        className="order-2 lg:order-none"
                        isArrived={isArrived}
                        hint={isArrived ? 'Call the next patient when you are ready.' : 'Mark yourself as Arrived from Update Queue Status to start today’s session.'}
                        ctaLabel={!activeChamber ? 'No Active Chamber' : 'Consult Next'}
                        ctaDisabled={!activeChamber}
                        onConsultNext={handleNextPatient}
                     />
                     <AvailabilityCard
                        className="max-xl:hidden xl:w-auto xl:basis-[308px] xl:shrink xl:min-w-[260px]"
                        isArrived={isArrived}
                        onArrived={() => { if (doctorStatus !== 'arrived') handleMarkArrived(); }}
                        onAway={() => { if (doctorStatus === 'arrived') handleMarkAway(); }}
                        onSetDelay={() => setShowStatusModal(true)}
                     />
                  </>
               )}
               <div className="contents lg:flex lg:basis-[412px] lg:shrink lg:min-w-[300px] lg:flex-col lg:justify-between lg:gap-6 lg:py-2">
                  <QueueClock size="lg" className="order-1 lg:order-none" />
                  <QueueProgress {...queueCounts} className="order-4 lg:order-none" />
               </div>
            </div>
         )}

         <UpNextRow
            className="order-3 lg:order-none"
            count={orderedAppointments.length}
            onViewAll={() => setShowQueueList(true)}
            empty={upNextApps.length === 0}
            emptyText="No upcoming patients in the queue."
         >
            {upNextApps.map(app => (
               <QueuePatientCard
                  key={app.id}
                  name={app.isReserved ? 'Reserved Slot' : app.patientName}
                  subtitle={app.isReserved ? 'Restricted Action' : app.patientPhone}
                  serialNo={app.serialNumber}
                  tone={toneOf(app.status)}
                  statusLabel={isOpenReservedSlot(app) && app.status === 'waiting' ? 'Reserved' : statusLabelOf(app.status)}
                  onStatusClick={buildStatusOptions(app).options.length > 0 ? () => setStatusSheetAppId(app.id) : undefined}
                  onOpen={() => setSelectedAppId(app.id)}
                  phone={!app.isReserved && app.patientPhone && app.patientPhone !== 'N/A' ? app.patientPhone : undefined}
               />
            ))}
         </UpNextRow>
      </div>

         {showStatusModal && (
            <QueueStatusModal
               isArrived={doctorStatus === 'arrived'}
               delayMinutes={localDelay}
               presets={DELAY_PRESETS}
               isSaving={isSavingDelay}
               saveDisabled={!activeChamber}
               onArrived={async () => {
                  if (doctorStatus !== 'arrived' || isPaused) await handleMarkArrived();
                  setShowStatusModal(false);
               }}
               onAway={handleMarkAway}
               onDelayChange={setLocalDelay}
               onConfirm={async () => {
                  if (localDelay > 0) await handleSaveDelay();
                  setShowStatusModal(false);
               }}
               onClose={() => setShowStatusModal(false)}
            />
         )}

         {showCompleteConfirm && currentApp && (
            <ConfirmCompleteModal
               onCancel={() => setShowCompleteConfirm(false)}
               onConfirm={() => {
                  updateAppStatus(currentApp.id, 'completed');
                  setShowCompleteConfirm(false);
               }}
            />
         )}

         {statusSheetApp && statusSheet && statusSheet.options.length > 0 && (
            <StatusUpdateModal
               options={statusSheet.options}
               value={statusSheet.value}
               onSelect={id => handleStatusSheetSelect(statusSheetApp, id)}
               onClose={() => setStatusSheetAppId(null)}
            />
         )}

         {showQueueList && (
            <QueueListPanel
               appointments={sortedAppointments}
               filterStatus={filterStatus}
               onFilter={setFilterStatus}
               onSelect={id => { setShowQueueList(false); setSelectedAppId(id); }}
               onClose={() => setShowQueueList(false)}
               onExport={() => window.print()}
            />
         )}

         {selectedApp && (
            <div
               className="ds-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4"
               onMouseDown={e => { if (e.target === e.currentTarget) setSelectedAppId(null); }}
            >
               <div role="dialog" aria-modal="true" aria-label="Patient records" className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-ds-xl bg-white shadow-ds-modal">
                  <div className="flex items-center justify-between gap-4 border-b border-ink-100 p-6 md:p-8">
                     <div className="flex min-w-0 items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-500 font-display text-ds-title-20 text-white">
                           {selectedApp.serialNumber}
                        </span>
                        <div className="min-w-0">
                           <h2 className="truncate font-display text-ds-title-24 font-normal text-content-primary">{selectedApp.patientName}</h2>
                           <p className="font-display text-ds-small text-content-tertiary">Patient ID: {selectedApp.patientId}</p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => setSelectedAppId(null)}
                        aria-label="Close"
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-steel shadow-ds-pill cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                     >
                        <MaskIcon src={DS_ICONS.close} size={11.5} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8">
                     <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <section className="space-y-4">
                           <h3 className="border-b border-ink-100 pb-2 font-display text-ds-body text-content-secondary">Medical History</h3>
                           <div className="flex min-h-[150px] items-center justify-center rounded-ds-lg bg-page p-6 text-center font-display text-ds-body italic text-content-tertiary">
                              No previous prescriptions found in system.
                           </div>
                        </section>
                        <section className="space-y-4">
                           <h3 className="border-b border-ink-100 pb-2 font-display text-ds-body text-content-secondary">Action Center</h3>
                           <div className="flex flex-col gap-3">
                              {selectedApp.status === 'consulting' && (
                                 <DashboardButton
                                    variant="primary"
                                    icon={<CheckCircle size={18} />}
                                    className="w-full"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'completed');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    Complete Consultation
                                 </DashboardButton>
                              )}

                              {(selectedApp.status === 'waiting' || selectedApp.status === 'late') && (
                                 <DashboardButton
                                    variant="primary"
                                    icon={<Activity size={18} />}
                                    className="w-full"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'consulting');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    Start Consultation
                                 </DashboardButton>
                              )}

                              {selectedApp.status === 'waiting' && (
                                 <DashboardButton
                                    variant="monochrome"
                                    icon={<Clock size={18} />}
                                    className="w-full"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'late');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    Mark as Late
                                 </DashboardButton>
                              )}

                              {(selectedApp.status === 'waiting' || selectedApp.status === 'late') && (
                                 // #ce4747 = the fixed semantic danger colour (same as the profile menu's Logout row).
                                 <DashboardButton
                                    variant="monochrome"
                                    icon={<X size={18} />}
                                    className="w-full !text-[#ce4747]"
                                    onClick={() => {
                                       updateAppStatus(selectedApp.id, 'cancelled');
                                       setSelectedAppId(null);
                                    }}
                                 >
                                    Cancel Appointment
                                 </DashboardButton>
                              )}

                              {!['waiting', 'late', 'consulting'].includes(selectedApp.status) && (
                                 <div className="rounded-ds-lg bg-page p-6 text-center">
                                    <p className="font-display text-ds-small uppercase tracking-widest text-content-tertiary">Consultation {selectedApp.status}</p>
                                    <p className="mt-1 font-display text-ds-small italic text-content-tertiary">No further actions available for this record.</p>
                                 </div>
                              )}

                              <DashboardButton
                                 variant="gradient"
                                 icon={<FileText size={18} />}
                                 className="w-full"
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
                                 {selectedApp.isReserved ? 'Assign Patient' : 'Open Prescription'}
                              </DashboardButton>
                           </div>
                        </section>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {showAssignModal && (
            <div className="ds-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-black/25 p-4">
               <div role="dialog" aria-modal="true" aria-label="Assign Patient" className="flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-ds-lg bg-white p-6 shadow-ds-modal">
                  <div className="flex items-start justify-between gap-4">
                     <div>
                        <h2 className="font-display text-ds-title-24 font-normal text-content-primary">Assign Patient</h2>
                        <p className="mt-1 font-display text-ds-small text-content-tertiary">Manual entry for Serial #{assignSerial}</p>
                     </div>
                     <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        aria-label="Close"
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-steel shadow-ds-pill cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                     >
                        <MaskIcon src={DS_ICONS.close} size={11.5} />
                     </button>
                  </div>

                  <div className="flex flex-col gap-5">
                     <div className="flex flex-col gap-2">
                        <label className="font-display text-ds-body text-content-secondary">Patient Name</label>
                        <input
                           type="text"
                           autoFocus
                           className="h-10 w-full rounded-ds-sm border border-ink-50 bg-ink-50 px-3 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-primary-500"
                           placeholder="Enter name"
                           value={assignData.name}
                           onChange={e => setAssignData({ ...assignData, name: e.target.value })}
                        />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="font-display text-ds-body text-content-secondary">Phone Number</label>
                        <input
                           type="tel"
                           className="h-10 w-full rounded-ds-sm border border-ink-50 bg-ink-50 px-3 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-primary-500"
                           placeholder="01XXXXXXXXX"
                           value={assignData.phone}
                           onChange={e => setAssignData({ ...assignData, phone: e.target.value })}
                        />
                     </div>

                     <div className="flex gap-[10px] pt-2">
                        <DashboardButton
                           variant="monochrome"
                           icon={false}
                           className="min-w-0 flex-1"
                           onClick={() => setShowAssignModal(false)}
                        >
                           Cancel
                        </DashboardButton>
                        <DashboardButton
                           variant="primary"
                           icon={false}
                           disabled={!assignData.name || !assignData.phone}
                           className="min-w-0 flex-1"
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
                        </DashboardButton>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
