import React, { useMemo, useState } from 'react';
import { AlertCircle, Calendar, Filter } from 'lucide-react';
import { AppointmentCard, StatusChip } from '../../components/ui/AppointmentCard';
import { fetchAppointments, PatientStorage, cancelAppointment } from '../../storage';
import { ReviewModal } from '../../components/ReviewModal';
import { useToast } from '../../components/ToastProvider';
import { DashboardButton, DS_ICONS, SearchField, SortMenu, ViewToggleButton } from '../../components/dashboard';
import { useMenu, RowMenu, RowMenuItem, TableHead, TableCell, TableEnd, PersonCell, PaginationBar, FilterPill, formatLongDate } from '../../components/patient/DsTable';
import { downloadICS, generateGoogleCalendarLink } from '../../utils/calendar';
import { Appointment } from '../../types';

interface AppointmentsProps {
   onNavigate: (path: string) => void;
}

// --- Custom Hook: Filtering & Cancellation Logic ---
const useAppointmentsLogic = (onNavigate: (path: string) => void, overridePatientId?: string | null, overrideDoctorId?: string | null) => {
   const session = PatientStorage.get();
   const { showToast } = useToast();
   const [refresh, setRefresh] = useState(0);
   const [rawAppointments, setRawAppointments] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [cancellingAppId, setCancellingAppId] = useState<string | null>(null);
   const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
   const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');

   // Scalability Preps: State Structured for Future UI
   const [searchQuery, setSearchQuery] = useState('');
   const [hospitalFilter, setHospitalFilter] = useState('all');
   const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 6 });

   React.useEffect(() => {
      const loadApps = async () => {
         if (!session && !overridePatientId && !overrideDoctorId) return;
         setIsLoading(true);
         try {
            const queryObj: any = {};
            if (overrideDoctorId) {
               queryObj.doctorId = overrideDoctorId;
            } else {
               queryObj.patientId = overridePatientId || session?.id;
            }
            const apps = await fetchAppointments(queryObj);
            setRawAppointments(apps);
         } catch (error) {
            console.error('Error fetching appointments for patient:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadApps();
   }, [session?.id, refresh]);

   const filteredAppointments = useMemo(() => {
      let filtered = rawAppointments;

      // Status Filtering
      if (statusFilter !== 'all') {
         const targetStatus = statusFilter === 'upcoming' ? 'waiting' : statusFilter;
         filtered = filtered.filter(a => a.status === targetStatus);
      }

      // Time Filtering
      if (timeFilter !== 'all') {
         const now = new Date();
         filtered = filtered.filter(a => {
            const appDate = new Date(a.date);
            if (timeFilter === 'today') return appDate.toDateString() === now.toDateString();
            if (timeFilter === 'week') {
               const weekAgo = new Date();
               weekAgo.setDate(now.getDate() - 7);
               return appDate >= weekAgo;
            }
            if (timeFilter === 'month') return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
            if (timeFilter === 'year') return appDate.getFullYear() === now.getFullYear();
            return true;
         });
      }

      // Search Filtering (Scalability)
      if (searchQuery.trim()) {
         const query = searchQuery.toLowerCase();
         filtered = filtered.filter(a => a.doctorName.toLowerCase().includes(query));
      }

      // Hospital/Chamber Filtering (Scalability)
      if (hospitalFilter !== 'all') {
         filtered = filtered.filter(a => a.hospitalId === hospitalFilter || a.chamberName === hospitalFilter);
      }

      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [session, refresh, statusFilter, timeFilter, searchQuery, hospitalFilter]);

   const paginatedAppointments = useMemo(() => {
      const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
      return filteredAppointments.slice(start, start + pagination.itemsPerPage);
   }, [filteredAppointments, pagination]);

   const handleCancel = async () => {
      if (cancellingAppId) {
         try {
            await cancelAppointment(cancellingAppId, "patient");
            setCancellingAppId(null);
            setRefresh(prev => prev + 1);
         } catch (error) {
            console.error('Failed to cancel appointment:', error);
            showToast('Could not cancel appointment. Please try again.', 'error');
         }
      }
   };

   return {
      session,
      userAppointments: paginatedAppointments, // Switched to paginated view
      totalCount: filteredAppointments.length,
      statusFilter,
      setStatusFilter,
      timeFilter,
      setTimeFilter,
      searchQuery,
      setSearchQuery,
      hospitalFilter,
      setHospitalFilter,
      pagination,
      setPagination,
      cancellingAppId,
      setCancellingAppId,
      handleCancel,
      isLoading,
   };
};

const ICON = '/assets/figma/patient-live-appts/';

type StatusKey = 'all' | 'upcoming' | 'completed' | 'cancelled';
type TimeKey = 'today' | 'week' | 'month' | 'year' | 'all';

const STATUS_OPTIONS: { id: StatusKey; label: string }[] = [
   { id: 'all', label: 'All' },
   { id: 'upcoming', label: 'Upcoming' },
   { id: 'completed', label: 'Completed' },
   { id: 'cancelled', label: 'Cancelled' },
];
const TIME_OPTIONS: { id: TimeKey; label: string }[] = [
   { id: 'today', label: 'Today' },
   { id: 'week', label: 'This Week' },
   { id: 'month', label: 'This Month' },
   { id: 'year', label: 'This Year' },
   { id: 'all', label: 'All Time' },
];

// Row "…" menu: the old card's actions (Track Queue, calendar exports, Cancel, Share Feedback) for this appointment's status.
const RowActions: React.FC<{
   app: any;
   onTrack: () => void;
   onCancel: () => void;
   onReview: () => void;
}> = ({ app, onTrack, onCancel, onReview }) => {
   const items: RowMenuItem[] = [];
   if (app.status === 'waiting') {
      items.push({ label: 'Track Queue', onClick: onTrack });
      items.push({ label: 'Download ICS', onClick: () => downloadICS(app as Appointment) });
      items.push({ label: 'Add to Google Calendar', onClick: () => window.open(generateGoogleCalendarLink(app as Appointment), '_blank') });
   }
   if (app.status !== 'cancelled' && app.status !== 'completed') {
      items.push({ label: app.status === 'waiting' ? 'Cancel' : 'Action', onClick: onCancel, danger: app.status === 'waiting' });
   }
   if (app.status === 'completed') items.push({ label: 'Share Feedback', onClick: onReview });
   return <RowMenu label={`Actions for appointment with ${app.doctorName}`} items={items} />;
};

// --- Sub-Component: Cancellation Modal (Figma modal look: white, r32, shadow-ds-modal) ---
const CancelModal: React.FC<{
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
   if (!isOpen) return null;
   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 ds-fade-in" role="dialog" aria-modal="true" aria-labelledby="cancel-appt-title">
         <div className="flex w-full max-w-[420px] flex-col gap-6 rounded-ds-xl bg-white p-8 font-display shadow-ds-modal">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#fdecec] text-[#ed7272]">
               <AlertCircle size={28} />
            </div>
            <div className="flex flex-col gap-2 text-center">
               <h3 id="cancel-appt-title" className="text-ds-title-24 text-content-primary">Cancel Appointment</h3>
               <p className="text-ds-body text-content-secondary">
                  Are you sure you want to cancel this appointment?<br />
                  <span className="text-[#ed7272]">This action cannot be undone.</span>
               </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
               <button type="button" onClick={onConfirm} className="h-12 flex-1 rounded-full bg-[#ed7272] font-inter text-[16px] tracking-[-0.32px] text-white transition-opacity duration-ds-fast ease-ds-out hover:opacity-90">
                  Confirm Cancel
               </button>
               <DashboardButton variant="monochrome" icon={false} onClick={onClose} className="flex-1 px-4">Keep Appointment</DashboardButton>
            </div>
         </div>
      </div>
   );
};

// --- Main View Component ---
interface AppointmentsProps {
  onNavigate: (path: string) => void;
  overridePatientId?: string | null;
  overrideDoctorId?: string | null;
}

export const Appointments: React.FC<AppointmentsProps> = ({ onNavigate, overridePatientId, overrideDoctorId }) => {
   const {
      session,
      userAppointments,
      totalCount,
      statusFilter,
      setStatusFilter,
      timeFilter,
      setTimeFilter,
      searchQuery,
      setSearchQuery,
      pagination,
      setPagination,
      cancellingAppId,
      setCancellingAppId,
      handleCancel,
      isLoading,
   } = useAppointmentsLogic(onNavigate, overridePatientId, overrideDoctorId);
   const { showToast } = useToast();

   const [activeReviewApp, setActiveReviewApp] = useState<any>(null);
   const [view, setView] = useState<'list' | 'grid'>('list');
   const statusMenu = useMenu();

   const pageCount = Math.max(1, Math.ceil(totalCount / pagination.itemsPerPage));
   const goToPage = (page: number) => setPagination(p => ({ ...p, currentPage: Math.min(pageCount, Math.max(1, page)) }));
   const resetPage = () => setPagination(p => ({ ...p, currentPage: 1 }));

   const openReview = (app: any) => setActiveReviewApp({
      id: app.id,
      doctor_id: app.doctorId,
      doctor_name: app.doctorName,
      patient_id: session?.id
   });

   const cardGrid = (className: string) => (
               <div className={`grid grid-cols-1 gap-4 p-2 md:grid-cols-2 xl:grid-cols-3 ${className}`}>
                  {userAppointments.map(app => (
                     <AppointmentCard
                        key={app.id}
                        appointment={{
                           id: app.id,
                           patientName: app.patientName,
                           doctorName: app.doctorName,
                           doctorSpecialty: 'Specialist Consultation',
                           hospitalName: app.chamberName,
                           chamberLocation: app.chamberLocation,
                           category: app.category,
                           date: app.date,
                           time: app.time,
                           serialNumber: app.serialNumber,
                           fee: app.fee,
                           status: app.status
                        }}
                        onTrack={() => onNavigate('/live-serial', app.id)}
                        onAction={() => setCancellingAppId(app.id)}
                        onReview={() => openReview(app)}
                     />
                  ))}
               </div>
   );

   const timeLabel = TIME_OPTIONS.find(o => o.id === timeFilter)?.label ?? 'All Time';

   return (
      // Figma "Appointments" 191:5570 (Patient Dashboard). Page background + gutters come from Layout.
      <div className="flex animate-fade-in flex-col gap-6 font-display">
         {/* Dashboard Header (326:15091): title + subtitle | date pill + "Add Appointment" */}
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Appointments</h1>
               <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Track your serials and history.</p>
            </div>
            <div className="flex items-stretch gap-1">
               {/* Date "Action" pill → the old Day / Week / Month / Year / All time filter. */}
               <FilterPill label={timeLabel} icon={DS_ICONS.calendar} chevron={DS_ICONS.dropdown} options={TIME_OPTIONS} value={timeFilter} onSelect={id => { setTimeFilter(id as TimeKey); resetPage(); }} />
               <DashboardButton variant="gradient" onClick={() => onNavigate('/patient/doctors')} className="pr-3">
                  <span className="relative z-[1] px-3">Add Appointment</span>
               </DashboardButton>
            </div>
         </div>

         {/* Body (339:17048): white r16 panel, p8 */}
         <div className="flex flex-col gap-2 rounded-2xl bg-white p-2">
            <div className="flex items-center justify-between gap-3">
               <SearchField
                  value={searchQuery}
                  onChange={v => { setSearchQuery(v); resetPage(); }}
                  placeholder="Search Anything"
                  onFilterClick={() => statusMenu.setOpen(o => !o)}
                  filterLabel="Filter by status"
                  filterExpanded={statusMenu.open}
                  filterSlot={statusMenu.open && (
                     <div ref={statusMenu.ref}>
                        <SortMenu options={STATUS_OPTIONS} value={statusFilter} onSelect={id => { setStatusFilter(id as StatusKey); resetPage(); }} onClose={statusMenu.close} />
                     </div>
                  )}
               />
               <div className="flex shrink-0 items-center gap-1 rounded-[64px] bg-ink-50 max-md:hidden" role="group" aria-label="View">
                  <ViewToggleButton icon="grid" label="Grid view" active={view === 'grid'} onClick={() => setView('grid')} />
                  <ViewToggleButton icon="list" label="List view" active={view === 'list'} onClick={() => setView('list')} />
               </div>
            </div>

            {statusFilter !== 'all' && (
               <div className="flex items-center gap-2 px-2 text-ds-small text-content-tertiary">
                  Showing <span className="text-content-primary">{STATUS_OPTIONS.find(o => o.id === statusFilter)?.label}</span>
                  <button type="button" onClick={() => { setStatusFilter('all'); resetPage(); }} className="text-primary-500 hover:underline">Show all</button>
               </div>
            )}

            {isLoading ? (
               <div className="flex flex-col items-center justify-center gap-4 py-32">
                  <div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
                  <p className="animate-pulse text-ds-body text-content-tertiary">Syncing your appointments...</p>
               </div>
            ) : userAppointments.length === 0 ? (
               <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
                  <div className="grid size-16 place-items-center rounded-full bg-primary-50 text-primary-500">
                     {statusFilter === 'all' ? <Calendar size={28} /> : <Filter size={28} />}
                  </div>
                  <h3 className="text-ds-title-24 text-content-primary">
                     {statusFilter === 'all' ? 'No appointments' : `No ${statusFilter} appointments`}
                  </h3>
                  <p className="max-w-xs text-ds-body text-content-tertiary">
                     {statusFilter === 'all'
                        ? "You haven't booked any consultations yet."
                        : `There are no consultations matching "${statusFilter}" for this period.`}
                  </p>
                  <DashboardButton variant="primary" icon={false} className="mt-4 px-6" onClick={() => statusFilter === 'all' ? onNavigate('/patient/home') : setStatusFilter('all')}>
                     {statusFilter === 'all' ? 'Find a Doctor' : 'Clear Filters'}
                  </DashboardButton>
               </div>
            ) : view === 'grid' ? (
               cardGrid('')
            ) : (
               // List (339:17054): #f6f6f6 head, 5 columns (min 200), rows gap 24, px16. Below md the table would need sideways
               // scrolling (which would also clip the row menus), so phones get the card grid instead.
               <>
               {cardGrid('md:hidden')}
               <div className="hidden md:block">
                  <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
                     <TableHead columns={['Doctor', 'Date', 'Serial', 'Status', 'Action']} />
                     <tbody className="text-[14px] text-[#505050]">
                        {userAppointments.map((app, i) => (
                           <tr key={app.id}>
                              <TableCell first={i === 0}><PersonCell name={app.doctorName} /></TableCell>
                              <TableCell first={i === 0}>{formatLongDate(app.date)}</TableCell>
                              <TableCell first={i === 0}>{app.serialNumber ?? '—'}</TableCell>
                              <TableCell first={i === 0}><StatusChip status={app.status} /></TableCell>
                              <TableCell first={i === 0}>
                                 <RowActions
                                    app={app}
                                    onTrack={() => onNavigate('/live-serial', app.id)}
                                    onCancel={() => setCancellingAppId(app.id)}
                                    onReview={() => openReview(app)}
                                 />
                              </TableCell>
                           </tr>
                        ))}
                        <TableEnd span={5} />
                     </tbody>
                  </table>
               </div>
               </>
            )}

            {/* Pagination bar (339:17166) */}
            {!isLoading && totalCount > 0 && (
               <PaginationBar
                  page={pagination.currentPage}
                  pageCount={pageCount}
                  perPage={pagination.itemsPerPage}
                  onPage={goToPage}
                  onPerPage={n => setPagination({ currentPage: 1, itemsPerPage: n })}
               />
            )}
         </div>

         {/* Modal Layer */}
         <CancelModal
            isOpen={!!cancellingAppId}
            onClose={() => setCancellingAppId(null)}
            onConfirm={handleCancel}
         />

         {activeReviewApp && (
            <ReviewModal
               isOpen={!!activeReviewApp}
               onClose={() => setActiveReviewApp(null)}
               onSuccess={() => {
                  showToast('Thank you for your feedback!', 'success');
               }}
               appointment={activeReviewApp}
            />
         )}
      </div>
   );
};
