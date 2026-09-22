import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Stethoscope, Building2, X, Printer, Share2, FileDigit } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import { DashboardButton, DS_ICONS, MaskIcon, SearchField, SortMenu, ViewToggleButton } from '../../components/dashboard';
import { useMenu, RowMenu, TableHead, TableCell, TableEnd, PersonCell, PaginationBar, FilterPill, formatLongDate } from '../../components/patient/DsTable';
import { PatientStorage, fetchPrescriptions, downloadPrescriptionPDF } from '../../storage';
import { supabase } from '../../supabase';


interface PrescriptionsProps {
   onNavigate: (path: string) => void;
}

export const Prescriptions: React.FC<PrescriptionsProps> = ({ onNavigate }) => {
   const [selectedRx, setSelectedRx] = useState<any | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [downloadingRxId, setDownloadingRxId] = useState<string | null>(null);
   const { showToast } = useToast();

   const handleDownload = async (rxId: string) => {
      try {
         setDownloadingRxId(rxId);
         await downloadPrescriptionPDF(rxId);
      } catch (error) {
         console.error('Download failed:', error);
         showToast('Failed to download prescription. Please try again.', 'error');
      } finally {
         setDownloadingRxId(null);
      }
   };


   // 1. Get Current Patient
   const patient = useMemo(() => PatientStorage.get(), []);
   const currentPatientId = patient?.id;

   // 3. Join logic for display names
   const [enrichedPrescriptions, setEnrichedPrescriptions] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const enrich = async () => {
         if (!currentPatientId) return;
         setIsLoading(true);
         try {
            const rxList = await fetchPrescriptions(currentPatientId);
            if (rxList.length === 0) {
               setEnrichedPrescriptions([]);
               return;
            }

            const doctorIds = [...new Set(rxList.map(rx => rx.doctorId))].filter(Boolean);
            const hospitalIds = [...new Set(rxList.map(rx => rx.hospitalId))].filter(Boolean);

            const [doctorsResponse, chambersResponse] = await Promise.all([
               doctorIds.length > 0
                  ? supabase.from('profiles').select('*').in('id', doctorIds)
                  : Promise.resolve({ data: [] }),
               hospitalIds.length > 0
                  ? supabase.from('chambers').select('*').in('id', hospitalIds)
                  : Promise.resolve({ data: [] })
            ]);

            const allDoctors = doctorsResponse.data || [];
            const allChambers = chambersResponse.data || [];

            const results = rxList.map((rx: any) => {
               const doctor = allDoctors.find((d: any) => String(d.id) === String(rx.doctorId));
               const hospital = allChambers.find((c: any) => String(c.id) === String(rx.hospitalId));

               return {
                  ...rx,
                  doctorName: doctor?.full_name || 'Doctor',
                  specialty: doctor?.specialty || 'Specialist',
                  hospitalName: hospital?.hospital_name || 'Health Center',
                  displayDate: rx.date
               };
            });

            setEnrichedPrescriptions(results.sort((a: any, b: any) => b.createdAt - a.createdAt));
         } catch (error) {
            console.error('Error enriching prescriptions:', error);
         } finally {
            setIsLoading(false);
         }
      };
      enrich();
   }, [currentPatientId]);

   // Body scroll lock & Layout Hiding
   useEffect(() => {
      if (selectedRx) {
         console.log('[DEBUG] Prescription Opened:', selectedRx); // Diagnostic Log
         document.body.style.overflow = 'hidden';
         // Use requestAnimationFrame to ensure the attribute is applied after any render cycles
         requestAnimationFrame(() => {
            document.body.setAttribute('data-modal-open', 'true');
         });
      } else {
         document.body.style.overflow = 'unset';
         document.body.removeAttribute('data-modal-open');
      }
      return () => {
         document.body.style.overflow = 'unset';
         document.body.removeAttribute('data-modal-open');
      };
   }, [selectedRx]);

   const [activeFolder, setActiveFolder] = useState<string | null>(null);

   // 10. Grouping Logic for "Folders"
   const prescriptionFolders = useMemo(() => {
      const groups: Record<string, { name: string; count: number; lastDate: string; records: any[] }> = {};
      
      enrichedPrescriptions.forEach(rx => {
         const key = rx.hospitalName || 'Other Facilities';
         if (!groups[key]) {
            groups[key] = { name: key, count: 0, lastDate: rx.displayDate, records: [] };
         }
         groups[key].count++;
         groups[key].records.push(rx);
         // Keep the most recent date
         if (new Date(rx.displayDate) > new Date(groups[key].lastDate)) {
            groups[key].lastDate = rx.displayDate;
         }
      });
      
      return Object.values(groups).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
   }, [enrichedPrescriptions]);

   const currentFolderRecords = useMemo(() => {
      if (!activeFolder) return [];
      const folder = prescriptionFolders.find(f => f.name === activeFolder);
      return folder?.records || [];
   }, [activeFolder, prescriptionFolders]);

   const filteredRx = (activeFolder ? currentFolderRecords : enrichedPrescriptions).filter((rx: any) =>
      rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rx.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase())
   );

   const PrescriptionFlashCard = ({ rx }: { rx: any }) => (
      <div className="flex flex-col h-full bg-white relative font-sans">
         {/* Premium Custom Header Matching Doctor View EXACTLY */}
         <div className="p-6 pr-16 md:p-8 md:pr-16 bg-medical-50 border-b-2 border-medical-500">
            <div className="flex justify-between items-start gap-4">
               <div className="flex gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white p-2 rounded-ds-md border border-medical-100 flex items-center justify-center shrink-0 shadow-sm">
                     <Stethoscope size={28} className="text-medical-600" />
                  </div>
                  <div className="max-w-[200px] md:max-w-xs">
                     <h2 className="font-display text-xl md:text-2xl font-black text-medical-600 leading-tight">{rx.hospitalName}</h2>
                     <p className="text-[10px] md:text-xs text-ink-500 font-bold mt-1.5 uppercase tracking-widest">Medical Record</p>
                  </div>
               </div>
               <div className="text-right">
                  <h3 className="text-lg md:text-xl font-black text-ink-800 leading-tight">{rx.doctorName}</h3>
                  <p className="text-[10px] md:text-xs text-medical-600 font-black uppercase tracking-widest mt-0.5">{rx.specialty}</p>
               </div>
            </div>
         </div>

         {/* Meta Data Row Matching Doctor View */}
         <div className="px-6 md:px-8 py-4 bg-white border-b border-ink-100 flex flex-wrap gap-x-8 gap-y-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><span className="text-medical-600">Patient:</span> <span className="text-ink-600">{patient?.name}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-medical-600">Date:</span> <span className="text-ink-600">{rx.displayDate}</span></div>
            <div className="ml-auto text-medical-600">ID: <span className="text-ink-600">#{rx.id.slice(-8).toUpperCase()}</span></div>
         </div>

         <div className="flex-1 flex flex-col md:flex-row p-6 md:p-8 overflow-hidden gap-8">
            {/* Left Column: Clinical Info */}
            <div className="w-full md:w-1/3 md:border-r border-ink-100 md:pr-6 space-y-8">
               <section>
                  <h4 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.2em] mb-3">Clinical Diagnosis</h4>
                  <p className="text-sm font-bold text-ink-700 bg-medical-50/50 p-4 rounded-ds-sm border border-medical-100">{rx.diagnosis || 'No diagnosis recorded'}</p>
               </section>

               {rx.clinicalFindings && (
                  <section>
                     <h4 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.2em] mb-3">Clinical Findings</h4>
                     <ul className="space-y-1.5 pl-4 list-disc text-xs font-bold text-ink-700 marker:text-ink-300">
                        {rx.clinicalFindings.split('\n').filter((c: string) => c.trim()).map((c: string, i: number) => <li key={i}>{c}</li>)}
                     </ul>
                  </section>
               )}

               {rx.testsRecommended && (
                  <section>
                     <h4 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.2em] mb-3">Tests Recommended</h4>
                     <ol className="space-y-1.5 pl-4 list-decimal text-xs font-bold text-ink-700 marker:text-ink-300">
                        {rx.testsRecommended.split('\n').filter((t: string) => t.trim()).map((t: string, i: number) => <li key={i}>{t}</li>)}
                     </ol>
                  </section>
               )}

               {rx.followUpDate && (
                  <section className="bg-medical-50/50 p-4 rounded-ds-md border border-medical-100 shadow-sm">
                     <h4 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.2em] mb-2">Follow Up</h4>
                     <p className="text-xs font-bold text-ink-700 flex items-center gap-2">
                        <Calendar size={14} className="text-medical-500" /> {new Date(rx.followUpDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </p>
                  </section>
               )}
            </div>

            {/* Right Column: Medications & Advice */}
            <div className="flex-1 relative md:pl-2 min-h-[300px]">
               <div className="absolute top-0 right-0 opacity-[0.05] pointer-events-none select-none"><span className="text-8xl font-black italic">Rx</span></div>
               <h4 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.2em] mb-6">Medications</h4>
               <div className="space-y-8">
                  {rx.medicines.map((med: any, i: number) => (
                     <div key={i} className="relative group">
                        <h4 className="font-black text-ink-800 text-base md:text-lg flex items-center gap-2">
                           {i + 1}. {med.name}
                        </h4>
                        <div className="flex items-center gap-6 mt-3">
                           <div className="bg-ink-100 px-3 py-1 rounded-ds-sm font-black tracking-widest text-ink-800 text-xs border border-ink-200">{med.dosage}</div>
                           <div className="text-xs text-ink-500 font-bold uppercase tracking-wider">{med.beforeAfterMeal} Meal • {med.durationDays} Days</div>
                        </div>
                     </div>
                  ))}
               </div>

               {rx.notes && (
                  <div className="mt-12 pt-8 border-t border-ink-100">
                     <h4 className="text-[10px] font-black text-medical-500 uppercase tracking-[0.2em] mb-3">Advice / Instructions:</h4>
                     <p className="text-sm font-bold text-ink-600 italic leading-relaxed">{rx.notes}</p>
                  </div>
               )}
            </div>
         </div>

         <div className="p-6 md:p-8 bg-white border-t border-ink-100 flex flex-col items-center">
            <p className="text-[9px] text-ink-500 text-center max-w-xs mb-8 italic">Securely stored and verified by DocOclock Digital Health Registry.</p>
            <div className="w-full flex justify-between items-end">
               <div className="text-[9px] font-bold text-ink-500 uppercase tracking-widest">Recorded: {rx.displayDate}</div>
               <div className="text-center">
                  <div className="w-32 md:w-40 border-b border-ink-300 mb-1 h-8"></div>
                  <p className="text-[10px] font-black text-ink-500 uppercase tracking-widest">Digital Auth</p>
               </div>
            </div>
         </div>
      </div>
   );

   // Figma list controls (297:12584): view toggle, date pill, pagination. Presentational state over the same records.
   const [view, setView] = useState<'list' | 'grid'>('list');
   const [timeFilter, setTimeFilter] = useState<TimeKey>('all');
   const [page, setPage] = useState(1);
   const [perPage, setPerPage] = useState(12);
   const folderMenu = useMenu();

   const datedRx = filteredRx.filter((rx: any) => inTimeWindow(rx.displayDate, timeFilter));
   const pageCount = Math.max(1, Math.ceil(datedRx.length / perPage));
   const safePage = Math.min(page, pageCount);
   const pageRx = datedRx.slice((safePage - 1) * perPage, safePage * perPage);
   const timeLabel = TIME_OPTIONS.find(o => o.id === timeFilter)?.label ?? 'All Time';
   const openFolder = (name: string | null) => { setActiveFolder(name); setPage(1); };

   return (
      // Figma "Prescriptions" 297:12584 (Patient Dashboard). Page background + gutters come from Layout.
      <div className="flex animate-fade-in flex-col gap-6 font-display">
         {/* Dashboard Header (326:15127) */}
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Prescriptions</h1>
               <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Manage your clinical history securely.</p>
            </div>
            <FilterPill label={timeLabel} icon={DS_ICONS.calendar} chevron={DS_ICONS.dropdown} options={TIME_OPTIONS} value={timeFilter} onSelect={id => { setTimeFilter(id as TimeKey); setPage(1); }} />
         </div>

         <div className="flex flex-col gap-2 rounded-2xl bg-white p-2">
            <div className="flex items-center justify-between gap-3">
               <SearchField
                  value={searchQuery}
                  onChange={v => { setSearchQuery(v); setPage(1); }}
                  onFilterClick={() => folderMenu.setOpen(o => !o)}
                  filterLabel="Filter by facility"
                  filterExpanded={folderMenu.open}
                  filterSlot={folderMenu.open && (
                     <div ref={folderMenu.ref}>
                        <SortMenu
                           options={[{ id: '', label: 'All Facilities' }, ...prescriptionFolders.map(f => ({ id: f.name, label: f.name }))]}
                           value={activeFolder ?? ''}
                           onSelect={id => openFolder(id || null)}
                           onClose={folderMenu.close}
                           className="w-[200px]"
                        />
                     </div>
                  )}
               />
               <div className="flex shrink-0 items-center gap-1 rounded-[64px] bg-ink-50 max-md:hidden" role="group" aria-label="View">
                  <ViewToggleButton icon="grid" label="Folders" active={view === 'grid'} onClick={() => setView('grid')} />
                  <ViewToggleButton icon="list" label="List view" active={view === 'list'} onClick={() => setView('list')} />
               </div>
            </div>

            {activeFolder && (
               <div className="flex items-center gap-2 px-2 text-ds-small text-content-tertiary">
                  <Building2 size={14} /> <span className="text-content-primary">{activeFolder}</span>
                  <button type="button" onClick={() => openFolder(null)} className="text-primary-500 hover:underline">All Folders</button>
               </div>
            )}

            {isLoading ? (
               <div className="flex flex-col items-center justify-center gap-4 py-32">
                  <div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
                  <p className="animate-pulse text-ds-body text-content-tertiary">Retrieving medical records</p>
               </div>
            ) : prescriptionFolders.length === 0 ? (
               <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
                  <FileDigit className="text-ink-300" size={56} />
                  <p className="max-w-xs text-ds-body text-content-tertiary">Your prescriptions will appear here once shared by your doctor.</p>
               </div>
            ) : view === 'grid' && !activeFolder ? (
               /* Folder View (grid toggle): one card per facility */
               <div className="grid grid-cols-1 gap-4 p-2 sm:grid-cols-2 lg:grid-cols-3">
                  {prescriptionFolders.map((folder) => (
                     <button
                        key={folder.name}
                        onClick={() => openFolder(folder.name)}
                        className="group flex flex-col gap-6 rounded-ds-lg bg-white p-5 text-left shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100 transition-shadow duration-300 ease-ds-out hover:shadow-ds-doctor-hover focus-visible:outline-2 focus-visible:outline-primary-500"
                     >
                        <span className="grid size-12 place-items-center rounded-2xl bg-primary-50 text-primary-500 transition-colors duration-300 ease-ds-out group-hover:bg-primary-500 group-hover:text-white">
                           <Building2 size={22} />
                        </span>
                        <span className="flex flex-col gap-2">
                           <span className="line-clamp-1 text-ds-title-20 text-content-primary">{folder.name}</span>
                           <span className="flex items-end justify-between text-ds-small">
                              <span className="text-content-tertiary">{folder.count} Records</span>
                              <span className="text-primary-500">{folder.lastDate}</span>
                           </span>
                        </span>
                     </button>
                  ))}
               </div>
            ) : datedRx.length === 0 ? (
               <p className="px-6 py-20 text-center text-ds-body text-content-tertiary">No prescriptions match this search.</p>
            ) : (
               <>
                  {/* Phones: compact cards instead of the 5-column table */}
                  <ul className="flex flex-col gap-3 p-2 md:hidden">
                     {pageRx.map((rx: any) => (
                        <li key={rx.id} className="flex flex-col gap-3 rounded-ds-lg bg-white p-4 shadow-ds-rise outline outline-1 -outline-offset-1 outline-ink-100">
                           <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                 <p className="truncate text-ds-subtitle text-content-primary">{rx.doctorName}</p>
                                 <p className="text-ds-small text-content-tertiary">{formatLongDate(rx.displayDate)} · {rx.hospitalName}</p>
                              </div>
                              <RxStatus />
                           </div>
                           <p className="line-clamp-2 text-ds-small text-content-secondary">{rx.diagnosis || 'General Checkup'}</p>
                           <div className="flex gap-2">
                              <DashboardButton variant="monochrome" icon={false} className="h-10 flex-1 px-4 text-[14px]" onClick={() => setSelectedRx(rx)}>View</DashboardButton>
                              <DashboardButton variant="gradient" icon={false} className="h-10 flex-1 px-4 text-[14px]" disabled={downloadingRxId === rx.id} onClick={() => handleDownload(rx.id)}>
                                 <span className="relative z-[1]">{downloadingRxId === rx.id ? 'Downloading…' : 'Download'}</span>
                              </DashboardButton>
                           </div>
                        </li>
                     ))}
                  </ul>
                  <div className="hidden md:block">
                     <table className="w-full border-separate border-spacing-0 text-left">
                        <TableHead columns={['Doctor', 'Date', 'Time', 'Status', 'Action']} />
                        <tbody className="text-[14px] text-[#5e5e5e]">
                           {pageRx.map((rx: any, i: number) => (
                              <tr key={rx.id}>
                                 <TableCell first={i === 0}><PersonCell name={rx.doctorName} /></TableCell>
                                 <TableCell first={i === 0}>{formatLongDate(rx.displayDate)}</TableCell>
                                 <TableCell first={i === 0}>{formatTime(rx.createdAt)}</TableCell>
                                 <TableCell first={i === 0}><RxStatus /></TableCell>
                                 <TableCell first={i === 0}>
                                    <RowMenu
                                       label={`Actions for prescription from ${rx.doctorName}`}
                                       items={[
                                          { label: 'View', onClick: () => setSelectedRx(rx) },
                                          { label: downloadingRxId === rx.id ? 'Downloading…' : 'Download PDF', onClick: () => handleDownload(rx.id), disabled: downloadingRxId === rx.id },
                                       ]}
                                    />
                                 </TableCell>
                              </tr>
                           ))}
                           <TableEnd span={5} />
                        </tbody>
                     </table>
                  </div>
                  <PaginationBar page={safePage} pageCount={pageCount} perPage={perPage} onPage={p => setPage(Math.min(pageCount, Math.max(1, p)))} onPerPage={n => { setPerPage(n); setPage(1); }} />
               </>
            )}
         </div>

         {selectedRx && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4 ds-fade-in md:p-8" role="dialog" aria-modal="true" aria-label="Prescription">
               <div className="relative flex h-auto max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-ds-xl bg-white shadow-ds-modal">
                  <button
                     onClick={() => setSelectedRx(null)}
                     aria-label="Close prescription"
                     className="absolute right-5 top-5 z-[210] grid size-10 place-items-center rounded-full bg-white/80 text-content-secondary shadow-ds-pill transition-colors duration-ds-fast ease-ds-out hover:text-[#ed7272]"
                  >
                     <X size={20} />
                  </button>
                  <div className="custom-scrollbar flex-1 overflow-y-auto">
                     <PrescriptionFlashCard rx={selectedRx} />
                  </div>
                  <div className="flex gap-2 border-t border-ink-100 bg-white p-5">
                     <DashboardButton variant="gradient" icon={<Printer size={18} />} className="flex-1 pr-4"><span className="relative z-[1] px-3">Print Rx</span></DashboardButton>
                     <button type="button" aria-label="Share prescription" className="grid size-12 shrink-0 place-items-center rounded-full bg-ink-50 text-content-secondary"><Share2 size={20} /></button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

type TimeKey = 'today' | 'week' | 'month' | 'year' | 'all';
const TIME_OPTIONS: { id: TimeKey; label: string }[] = [
   { id: 'today', label: 'Today' },
   { id: 'week', label: 'This Week' },
   { id: 'month', label: 'This Month' },
   { id: 'year', label: 'This Year' },
   { id: 'all', label: 'All Time' },
];

const inTimeWindow = (date: string, key: TimeKey) => {
   if (key === 'all') return true;
   const d = new Date(date);
   if (isNaN(d.getTime())) return true;
   const now = new Date();
   if (key === 'today') return d.toDateString() === now.toDateString();
   if (key === 'week') { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo; }
   if (key === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
   return d.getFullYear() === now.getFullYear();
};

const formatTime = (ts: number | string | undefined) => {
   if (!ts) return '—';
   const d = new Date(ts);
   return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Figma "Status / Completed" chip (191:5550): #f3fff3 fill, #4dc44d label, 9x7 tick. A shared prescription is always issued.
const RxStatus: React.FC = () => (
   <span className="inline-flex items-center gap-1 rounded-3xl bg-[#f3fff3] px-2 py-1 text-ds-small text-[#4dc44d]">
      <MaskIcon src="/assets/figma/patient-live-appts/status-check.svg" size={9} style={{ height: 7 }} />
      Completed
   </span>
);
