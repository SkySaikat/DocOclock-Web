import React, { useEffect, useMemo, useState } from 'react';
import { DoctorStorage, fetchAppointments } from '../../storage';
import { Appointment } from '../../types';
import { getLocalISODate } from '../../utils/date';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';
import { DashboardButton, DS_ICONS, SearchField, SortMenu, ViewToggleButton } from '../../components/dashboard';
import { QueuePatientCard } from '../../components/doctor/queue/QueuePatientCard';
import { toneOf } from '../../components/doctor/queue/queueUtils';
import { StatusChip } from '../../components/ui/AppointmentCard';
import { useMenu, RowMenu, TableHead, TableCell, TableEnd, PersonCell, PaginationBar, FilterPill, formatLongDate } from '../../components/patient/DsTable';

type TimeKey = 'today' | 'week' | 'month' | 'year' | 'all';
type StatusKey = 'all' | Appointment['status'];

const TIME_OPTIONS: { id: TimeKey; label: string }[] = [
   { id: 'today', label: 'Today' },
   { id: 'week', label: 'This Week' },
   { id: 'month', label: 'This Month' },
   { id: 'year', label: 'This Year' },
   { id: 'all', label: 'All Time' },
];
const STATUS_OPTIONS: { id: StatusKey; label: string }[] = [
   { id: 'all', label: 'All' },
   { id: 'waiting', label: 'Upcoming' },
   { id: 'consulting', label: 'Ongoing' },
   { id: 'completed', label: 'Completed' },
   { id: 'cancelled', label: 'Cancelled' },
   { id: 'late', label: 'Late' },
];
const STATUS_LABEL: Record<Appointment['status'], string> = {
   waiting: 'Upcoming', consulting: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled', late: 'Late',
};

const inTimeWindow = (date: string, key: TimeKey) => {
   if (key === 'all') return true;
   const d = new Date(date);
   if (isNaN(d.getTime())) return true;
   const now = new Date();
   if (key === 'today') return date === getLocalISODate();
   if (key === 'week') { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo; }
   if (key === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
   return d.getFullYear() === now.getFullYear();
};

// Figma "Appointments" 255:11674 (grid of User Cards) / 255:12102 (list). Page background + gutters come from Layout.
export const DoctorAppointments: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
   const doctor = DoctorStorage.get();
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [view, setView] = useState<'grid' | 'list'>('grid');
   const [page, setPage] = useState(1);
   const [perPage, setPerPage] = useState(12);
   const [timeFilter, setTimeFilter] = useState<TimeKey>('all');
   const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
   const statusMenu = useMenu();

   useEffect(() => {
      if (!doctor?.id) return;
      fetchAppointments({ doctorId: doctor.id })
         .then(setAppointments)
         .finally(() => setIsLoading(false));
   }, [doctor?.id]);

   const filtered = useMemo(() => {
      const term = search.toLowerCase();
      return appointments
         .filter((a) => !term || a.patientName.toLowerCase().includes(term))
         .filter((a) => statusFilter === 'all' || a.status === statusFilter)
         .filter((a) => inTimeWindow(a.date, timeFilter))
         .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
   }, [appointments, search, statusFilter, timeFilter]);

   const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
   const safePage = Math.min(page, totalPages);
   const pageItems = filtered.slice((safePage - 1) * perPage, safePage * perPage);
   const today = getLocalISODate();
   // Today's rows open the live queue (where they can be managed); other days have no detail screen yet.
   const openAppt = (a: Appointment) => (a.date === today && onNavigate ? () => onNavigate('/doctor/serial-manager') : undefined);

   return (
      <div className="flex animate-fade-in flex-col gap-6 font-display">
         {onNavigate && <DoctorTabBar currentPath="/doctor/appointments" onNavigate={onNavigate} />}

         {/* Dashboard Header (303:13256) */}
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Appointments</h1>
               <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Manage all your queues and get ready for the next ones</p>
            </div>
            <div className="flex items-stretch gap-1">
               <FilterPill
                  label={TIME_OPTIONS.find(o => o.id === timeFilter)?.label ?? 'All Time'}
                  icon={DS_ICONS.calendar}
                  chevron={DS_ICONS.dropdown}
                  options={TIME_OPTIONS}
                  value={timeFilter}
                  onSelect={id => { setTimeFilter(id as TimeKey); setPage(1); }}
               />
               {onNavigate && (
                  <DashboardButton variant="gradient" onClick={() => onNavigate('/doctor/manual-booking')} className="pr-3">
                     <span className="relative z-[1] px-3">Add Appointment</span>
                  </DashboardButton>
               )}
            </div>
         </div>

         {/* Row 1: white r16 panel */}
         <div className="flex flex-col gap-4 rounded-2xl bg-white p-2">
            <div className="flex items-center justify-between gap-3">
               <SearchField
                  value={search}
                  onChange={v => { setSearch(v); setPage(1); }}
                  onFilterClick={() => statusMenu.setOpen(o => !o)}
                  filterLabel="Filter by status"
                  filterExpanded={statusMenu.open}
                  filterSlot={statusMenu.open && (
                     <div ref={statusMenu.ref}>
                        <SortMenu options={STATUS_OPTIONS} value={statusFilter} onSelect={id => { setStatusFilter(id as StatusKey); setPage(1); }} onClose={statusMenu.close} />
                     </div>
                  )}
               />
               <div className="flex shrink-0 items-center gap-1 rounded-[64px] bg-ink-50 max-md:hidden" role="group" aria-label="View">
                  <ViewToggleButton icon="grid" label="Grid view" active={view === 'grid'} onClick={() => setView('grid')} />
                  <ViewToggleButton icon="list" label="List view" active={view === 'list'} onClick={() => setView('list')} />
               </div>
            </div>

            {isLoading ? (
               <p className="py-16 text-center text-ds-body text-content-tertiary">Loading appointments...</p>
            ) : pageItems.length === 0 ? (
               <p className="py-16 text-center text-ds-body text-content-tertiary">No appointments found.</p>
            ) : (
               <>
                  {/* Grid (255:11765): User Cards, min 280, wrap, gap 12. Phones always get this view. */}
                  <div className={`grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 ${view === 'list' ? 'md:hidden' : ''}`}>
                     {pageItems.map((appt) => (
                        <QueuePatientCard
                           key={appt.id}
                           className="!w-full"
                           name={appt.patientName}
                           subtitle={appt.patientPhone || `${appt.time} · ${appt.date}`}
                           serialNo={appt.serialNumber}
                           tone={toneOf(appt.status)}
                           statusLabel={STATUS_LABEL[appt.status] ?? appt.status}
                           phone={appt.status === 'cancelled' ? appt.patientPhone || undefined : undefined}
                           onOpen={openAppt(appt)}
                        />
                     ))}
                  </div>
                  {view === 'list' && (
                     <div className="hidden md:block">
                        <table className="w-full border-separate border-spacing-0 text-left">
                           <TableHead columns={['Patient Name', 'Date', 'Serial', 'Status', 'Action']} />
                           <tbody className="text-[14px] text-[#505050]">
                              {pageItems.map((appt, i) => {
                                 const open = openAppt(appt);
                                 const items = [
                                    ...(open ? [{ label: 'Open in Queue', onClick: open }] : []),
                                    ...(appt.patientPhone ? [{ label: 'Call Patient', onClick: () => { window.location.href = `tel:${appt.patientPhone}`; } }] : []),
                                 ];
                                 return (
                                    <tr key={appt.id}>
                                       <TableCell first={i === 0}><PersonCell name={appt.patientName} /></TableCell>
                                       <TableCell first={i === 0}>{formatLongDate(appt.date)}</TableCell>
                                       <TableCell first={i === 0}>{appt.serialNumber}</TableCell>
                                       <TableCell first={i === 0}><StatusChip status={appt.status} /></TableCell>
                                       <TableCell first={i === 0}><RowMenu label={`Actions for ${appt.patientName}`} items={items} /></TableCell>
                                    </tr>
                                 );
                              })}
                              <TableEnd span={5} />
                           </tbody>
                        </table>
                     </div>
                  )}
               </>
            )}

            {!isLoading && filtered.length > 0 && (
               <PaginationBar
                  page={safePage}
                  pageCount={totalPages}
                  perPage={perPage}
                  perPageOptions={[9, 12, 24]}
                  onPage={p => setPage(Math.min(totalPages, Math.max(1, p)))}
                  onPerPage={n => { setPerPage(n); setPage(1); }}
               />
            )}
         </div>
      </div>
   );
};
