import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Pill, X } from 'lucide-react';
import { DashboardButton, MaskIcon } from '../../components/dashboard';
import { QueueClock } from '../../components/doctor/queue/QueueClock';

import { PatientStorage, fetchDoctors, fetchMedicineAlerts, toggleMedicineAlert, saveUserMedicine, fetchMedicineCatalog } from '../../storage';
import { MedicineAlert } from '../../types';

export const MedicineTracker: React.FC = () => {
   const [refresh, setRefresh] = useState(0);
   const patient = PatientStorage.get();
   const currentPatientId = patient?.id;

   const [showAddModal, setShowAddModal] = useState(false);
   const [medicineCatalog, setMedicineCatalog] = useState<any[]>([]);

   useEffect(() => {
      fetchMedicineCatalog().then(setMedicineCatalog);
   }, []);

   const [enrichedAlerts, setEnrichedAlerts] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const loadAlerts = async () => {
         if (!currentPatientId) return;
         setIsLoading(true);
         try {
            const alerts = await fetchMedicineAlerts(currentPatientId);
            if (alerts.length === 0) {
               setEnrichedAlerts([]);
               return;
            }
            const allDoctors = await fetchDoctors();
            const results = alerts.map(a => {
               const doc = allDoctors.find(d => String(d.id) === String(a.doctorId));
               return {
                  ...a,
                  doctorName: doc?.name || 'Your Doctor'
               };
            });
            setEnrichedAlerts(results);
         } catch (error) {
            console.error('Error loading medicine alerts:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadAlerts();
   }, [currentPatientId, refresh]);

   const toggleAlert = (id: string) => {
      toggleMedicineAlert(id);
      setRefresh(prev => prev + 1);
   };

   // --- GLANCE LOGIC ---

   const currentTimeInfo = useMemo(() => {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) return { slot: 'Morning', index: 0, label: 'After Breakfast' };
      if (hour >= 12 && hour < 17) return { slot: 'Noon', index: 1, label: 'After Lunch' };
      return { slot: 'Night', index: 2, label: 'Before Bed' };
   }, []);

   const nextDose = useMemo(() => {
      if (enrichedAlerts.length === 0) return null;

      // 1. Try finding an untaken dose in the CURRENT slot
      const currentSlotMeds = enrichedAlerts.filter(m => !m.completed && m.dosage.split('+')[currentTimeInfo.index] !== '0');
      if (currentSlotMeds.length > 0) return currentSlotMeds[0];

      // 2. Otherwise find the first untaken dose in ANY slot
      const nextAvailable = enrichedAlerts.find(m => !m.completed);
      return nextAvailable || null;
   }, [enrichedAlerts, currentTimeInfo]);

   const progress = useMemo(() => {
      const slots = [0, 1, 2];
      return slots.map(idx => {
         const medsInSlot = enrichedAlerts.filter(m => m.dosage.split('+')[idx] !== '0');
         if (medsInSlot.length === 0) return { status: 'none' };
         const allTaken = medsInSlot.every(m => m.completed);
         return { status: allTaken ? 'taken' : 'pending' };
      });
   }, [enrichedAlerts]);

   // "Your pills for today" slot toggle (Figma Toggle 339:16144); starts on the current slot.
   const [viewSlot, setViewSlot] = useState<number>(currentTimeInfo.index);
   const slotMeds = enrichedAlerts.filter(m => m.dosage.split('+')[viewSlot] !== '0');
   const pillsNow = nextDose ? Number(nextDose.dosage.split('+')[currentTimeInfo.index]) || 0 : 0;

   return (
      // Figma "Medicines" 339:16108 (Patient Dashboard). Page background + gutters come from Layout.
      <div className="flex animate-fade-in flex-col gap-6 font-display">
         {/* Dashboard Header (339:16111) */}
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Medicines</h1>
               <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Your daily routine, simplified.</p>
            </div>
            <DashboardButton variant="gradient" onClick={() => setShowAddModal(true)} className="self-start pr-3 md:self-auto">
               <span className="relative z-[1] px-3">Add Medicine</span>
            </DashboardButton>
         </div>

         {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-32">
               <div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
               <p className="animate-pulse text-ds-body text-content-tertiary">Syncing Pharmacy Data</p>
            </div>
         ) : enrichedAlerts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-ds-lg bg-white px-6 py-24 text-center">
               <Pill className="text-ink-300" size={56} />
               <h3 className="text-ds-title-24 text-content-primary">No Active Medicines</h3>
               <p className="max-w-xs text-ds-body text-content-tertiary">Your medicine alerts will appear here after your next prescription.</p>
            </div>
         ) : (
            // Row 1: Left (483) clock + next-dose card | Patients Status timeline
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
               <div className="flex w-full flex-col gap-4 lg:w-[483px] lg:shrink-0">
                  <QueueClock size="md" icon={ICON + 'pill-badge.svg'} />

                  {/* Card 3: what to take now */}
                  <section aria-label="What to take now" className="flex flex-col gap-6 rounded-ds-lg bg-white p-6">
                     {nextDose ? (
                        <>
                           <div className="flex flex-col gap-[10px]">
                              <div className="flex items-center justify-between gap-3">
                                 <p className="truncate text-ds-title-24 text-content-primary">{nextDose.medicineName}</p>
                                 <SlotIcons dosage={nextDose.dosage} active={currentTimeInfo.index} />
                              </div>
                              <p className="text-ds-paragraph text-content-secondary">
                                 {pillsNow > 0 ? `${pillsNow} Pill${pillsNow > 1 ? 's' : ''} Now` : currentTimeInfo.label} | {currentTimeInfo.slot}
                              </p>
                           </div>
                           <button
                              type="button"
                              onClick={() => toggleAlert(nextDose.id)}
                              className="btn-sheen relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-primary-500 py-2 pl-1 pr-1 font-inter text-[16px] tracking-[-0.32px] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                           >
                              <span className="-mr-[14px] grid size-8 place-items-center"><MaskIcon src={ICON + 'btn-tick.svg'} size={32} /></span>
                              <span className="px-3">Mark As Taken</span>
                           </button>
                        </>
                     ) : (
                        <div className="flex flex-col items-center gap-2 py-4 text-center">
                           <CheckCircle2 size={40} className="text-primary-500" />
                           <h3 className="text-ds-title-20 text-content-primary">All Set for Now!</h3>
                           <p className="text-ds-body text-content-secondary">You've finished all your medicines for the current session.</p>
                        </div>
                     )}
                  </section>
               </div>

               {/* Patients Status: "Your pills for today" */}
               <section aria-label="Your pills for today" className="flex min-w-0 flex-1 flex-col gap-6 rounded-[20px] lg:p-5 lg:pt-3">
                  <div className="flex items-center justify-between gap-3">
                     <h2 className="text-ds-title-24 text-content-primary max-sm:text-ds-title-20">Your pills for today</h2>
                     <div role="tablist" aria-label="Time of day" className="flex items-center gap-1 rounded-[64px] bg-surface">
                        {SLOTS.map((slot, i) => (
                           <button
                              key={slot.name}
                              type="button"
                              role="tab"
                              aria-selected={viewSlot === i}
                              aria-label={`${slot.name}${progress[i].status === 'taken' ? ' (all taken)' : ''}`}
                              onClick={() => setViewSlot(i)}
                              className={`relative grid size-8 place-items-center rounded-full transition-colors duration-ds-fast ease-ds-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${viewSlot === i ? 'bg-primary-500 text-white' : 'text-content-secondary'}`}
                           >
                              <MaskIcon src={ICON + slot.icon} size={32} />
                              {progress[i].status === 'taken' && viewSlot !== i && <span aria-hidden="true" className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary-500" />}
                           </button>
                        ))}
                     </div>
                  </div>

                  {slotMeds.length === 0 ? (
                     <p className="rounded-2xl bg-white px-6 py-10 text-center text-ds-body text-content-tertiary">No pills scheduled for the {SLOTS[viewSlot].name.toLowerCase()}.</p>
                  ) : (
                     <ol className="flex flex-col">
                        {slotMeds.map((med, i) => {
                           const isCurrent = !med.completed && nextDose?.id === med.id && viewSlot === currentTimeInfo.index;
                           const pills = Number(med.dosage.split('+')[viewSlot]) || 0;
                           return (
                              <li key={med.id} className="flex h-[89px] gap-2">
                                 {/* Status rail: dashed Ghost line + 24px state dot */}
                                 <div aria-hidden="true" className="flex w-8 shrink-0 flex-col items-center gap-0.5">
                                    <span className={`h-3 w-px border-l border-dashed ${i === 0 ? 'border-transparent' : 'border-ghost'}`} />
                                    {med.completed ? (
                                       <span className="grid size-6 place-items-center rounded-full bg-primary-400 text-white"><MaskIcon src={ICON + 'track-check.svg'} size={24} /></span>
                                    ) : (
                                       <span className={`size-6 rounded-full ${isCurrent ? 'border-2 border-primary-500' : 'border border-content-secondary'}`} />
                                    )}
                                    <span className={`w-px flex-1 border-l border-dashed ${i === slotMeds.length - 1 ? 'border-transparent' : 'border-ghost'}`} />
                                 </div>
                                 {/* Medicine Track card */}
                                 <div className={`mb-2 flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl p-4 ${isCurrent ? 'bg-primary-500 text-white' : med.completed ? 'bg-surface opacity-50' : 'bg-white shadow-ds-track'}`}>
                                    <div className="flex min-w-0 flex-col gap-2">
                                       <p className={`truncate text-ds-title-20 ${isCurrent ? 'text-white' : 'text-content-primary'}`}>{med.medicineName}</p>
                                       <p className={`truncate text-ds-body ${isCurrent ? 'text-white' : 'text-content-secondary'}`}>
                                          {pills} pill{pills === 1 ? '' : 's'} · {med.durationDays} days left · {med.doctorName}
                                       </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-4">
                                       <span className={`h-9 w-px ${isCurrent ? 'bg-white/60' : 'bg-ghost'}`} />
                                       <span className="flex w-[40px] flex-col gap-1">
                                          <span className={`text-ds-body ${isCurrent ? 'text-white' : 'text-content-primary'}`}>{SLOTS[viewSlot].time}</span>
                                          <span className={`text-ds-small ${isCurrent ? 'text-white' : 'text-content-secondary'}`}>{SLOTS[viewSlot].meridiem}</span>
                                       </span>
                                    </div>
                                 </div>
                              </li>
                           );
                        })}
                     </ol>
                  )}
               </section>
            </div>
         )}

         {/* ADD MEDICINE MODAL (Figma Modal 339:15402) */}
         {showAddModal && currentPatientId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 ds-fade-in" role="dialog" aria-modal="true" aria-labelledby="add-med-title">
               <div className="relative w-full max-w-[565px] rounded-ds-xl bg-white p-6 shadow-ds-modal sm:p-9">
                  <button type="button" onClick={() => setShowAddModal(false)} aria-label="Close" className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-content-tertiary transition-colors duration-ds-fast ease-ds-out hover:text-[#ed7272]"><X size={18} /></button>
                  <div className="mb-6 flex flex-col gap-2 pr-8">
                     <h2 id="add-med-title" className="text-ds-title-24 text-content-primary">Add Medicines</h2>
                     <p className="text-ds-body text-content-secondary">Track a medicine and get reminded for every dose.</p>
                  </div>

                  <form onSubmit={async (e) => {
                     e.preventDefault();
                     const fd = new FormData(e.currentTarget);
                     const medName = fd.get('medicineName') as string;
                     const dosage = `${fd.get('morning') || 0}+${fd.get('noon') || 0}+${fd.get('night') || 0}`;
                     const duration = parseInt(fd.get('duration') as string) || 7;

                     // Use the free text value if standard selection fails (or catalog is missing)
                     await saveUserMedicine(currentPatientId, medName, dosage, duration);
                     setShowAddModal(false);
                     setRefresh(p => p + 1);
                  }} className="flex flex-col gap-4">
                     <label className="flex flex-col gap-3">
                        <span className="text-ds-paragraph text-content-secondary">Search Medicine</span>
                        <input name="medicineName" list="catalog-meds" required placeholder="Search a medicine to add ..." className={FIELD} />
                        <datalist id="catalog-meds">
                           {medicineCatalog.map(m => <option key={m.id} value={m.name} />)}
                        </datalist>
                     </label>

                     <div className="grid grid-cols-3 gap-2">
                        {(['morning', 'noon', 'night'] as const).map((time) => (
                           <label key={time} className="flex min-w-0 flex-col gap-3">
                              <span className="truncate text-ds-paragraph capitalize text-content-secondary">{time}</span>
                              <input name={time} type="number" min="0" max="5" defaultValue="0" aria-label={`${time} dosage`} className={FIELD} />
                           </label>
                        ))}
                     </div>

                     <label className="flex flex-col gap-3">
                        <span className="text-ds-paragraph text-content-secondary">Duration</span>
                        <input name="duration" type="number" min="1" max="90" required defaultValue="7" placeholder="Type (ex: 7 days)" className={FIELD} />
                     </label>

                     <div className="mt-4 flex items-center gap-2">
                        <DashboardButton variant="secondary" icon={false} onClick={() => setShowAddModal(false)} className="flex-1 px-4">Cancel</DashboardButton>
                        <DashboardButton type="submit" variant="primary" icon={false} className="flex-[2] px-4">Confirm</DashboardButton>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

const ICON = '/assets/figma/patient-live-appts/';
const FIELD = 'h-[42px] w-full rounded-2xl bg-ink-50 px-3 text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';

// Morning / Noon / Night — the app's fixed reminder times for each slot.
const SLOTS = [
   { name: 'Morning', icon: 'slot-morning.svg', time: '08:30', meridiem: 'AM' },
   { name: 'Noon', icon: 'slot-noon.svg', time: '02:00', meridiem: 'PM' },
   { name: 'Night', icon: 'slot-night.svg', time: '09:30', meridiem: 'PM' },
] as const;

// The next-dose card's three slot glyphs: slots with a dose are dark, the current slot gets Figma's primary ring.
const SlotIcons: React.FC<{ dosage: string; active: number }> = ({ dosage, active }) => (
   <div className="flex shrink-0 items-start gap-1">
      {SLOTS.map((slot, i) => {
         const hasDose = dosage.split('+')[i] !== '0';
         return (
            <span
               key={slot.name}
               title={slot.name}
               className={`grid size-8 place-items-center rounded-full ${i === active ? 'border border-primary-500 text-primary-500' : hasDose ? 'text-content-secondary' : 'text-content-disabled'}`}
            >
               <MaskIcon src={ICON + slot.icon} size={32} />
            </span>
         );
      })}
   </div>
);
