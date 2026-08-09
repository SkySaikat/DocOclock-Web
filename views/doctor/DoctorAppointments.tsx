import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Grid3x3, List, Mail, ArrowUpRight } from 'lucide-react';
import { DoctorStorage, fetchAppointments } from '../../storage';
import { Appointment } from '../../types';
import { getLocalISODate } from '../../utils/date';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';

const PAGE_SIZE = 9;

export const DoctorAppointments: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
   const doctor = DoctorStorage.get();
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [view, setView] = useState<'grid' | 'list'>('grid');
   const [page, setPage] = useState(1);

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
         .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
   }, [appointments, search]);

   const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
   const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

   const today = getLocalISODate();
   const todayCount = appointments.filter((a) => a.date === today).length;
   const completedCount = appointments.filter((a) => a.status === 'completed').length;
   const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
   const maxCount = Math.max(todayCount, completedCount, cancelledCount, 1);

   const history = useMemo(() => {
      return [...appointments]
         .filter((a) => a.status === 'completed')
         .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
         .slice(0, 4);
   }, [appointments]);

   return (
      <div className="max-w-6xl mx-auto px-2 md:px-0 pb-20 animate-fade-in">
         {onNavigate && <DoctorTabBar currentPath="/doctor/appointments" onNavigate={onNavigate} />}

         <div className="mb-2">
            <h1 className="font-display text-2xl font-bold text-ink-800">Appointments</h1>
            <p className="text-ink-500 text-sm mt-1">Manage all your queues and get ready for the next ones.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-8">
            {/* LEFT COLUMN — status chart + history, matches Figma structure */}
            <div className="flex flex-col gap-6">
               <div className="bg-white rounded-[24px] shadow-ds-card p-6">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-display font-bold text-ink-800">Appointment Status</h3>
                     <span className="text-[11px] font-bold text-ink-400 bg-ink-50 px-2.5 py-1 rounded-full">Today</span>
                  </div>
                  <div className="flex items-end gap-4 h-32 mb-4">
                     {[{ label: 'Today', value: todayCount, color: 'bg-medical-500' }, { label: 'Completed', value: completedCount, color: 'bg-ink-800' }, { label: 'Cancelled', value: cancelledCount, color: 'bg-ink-200' }].map((bar) => (
                        <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                           <div className={`w-full rounded-lg ${bar.color} transition-all duration-700`} style={{ height: `${Math.max(8, (bar.value / maxCount) * 100)}%` }} />
                        </div>
                     ))}
                  </div>
                  <div className="flex items-center justify-around text-[11px] text-ink-500 font-medium">
                     <span>Today</span><span>Completed</span><span>Cancelled</span>
                  </div>
               </div>

               <div className="bg-white rounded-[24px] shadow-ds-card p-6">
                  <div className="flex items-center justify-between mb-5">
                     <h3 className="font-display font-bold text-ink-800">History</h3>
                     <span className="text-[11px] font-bold text-ink-400 bg-ink-50 px-2.5 py-1 rounded-full">Monthly</span>
                  </div>
                  <div className="flex flex-col gap-4">
                     {history.length > 0 ? history.map((h) => (
                        <div key={h.id} className="flex items-center gap-3">
                           <span className="w-1.5 h-1.5 rounded-full bg-medical-500 shrink-0" />
                           <span className="text-[13px] text-ink-700 flex-1 truncate">Consulted {h.patientName}</span>
                           <span className="text-[11px] text-ink-400 shrink-0">{h.date}</span>
                        </div>
                     )) : (
                        <p className="text-[13px] text-ink-400">No completed visits yet.</p>
                     )}
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN — search/filter + card grid */}
            <div>
               <div className="bg-white rounded-full shadow-ds-card flex items-center gap-3 px-5 py-3 mb-6">
                  <Search size={18} className="text-ink-400 shrink-0" />
                  <input
                     value={search}
                     onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                     placeholder="Search Anything"
                     className="flex-1 min-w-0 outline-none text-[14px] text-ink-800 placeholder:text-ink-400"
                  />
                  <button className="w-9 h-9 rounded-full bg-ink-50 flex items-center justify-center text-ink-500 shrink-0 hover:bg-ink-100 transition-colors" aria-label="Filter">
                     <Filter size={15} />
                  </button>
                  <div className="flex items-center bg-ink-50 rounded-full p-1 shrink-0">
                     <button onClick={() => setView('grid')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-medical-500 text-white' : 'text-ink-400'}`}>
                        <Grid3x3 size={14} />
                     </button>
                     <button onClick={() => setView('list')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${view === 'list' ? 'bg-medical-500 text-white' : 'text-ink-400'}`}>
                        <List size={14} />
                     </button>
                  </div>
               </div>

               {isLoading ? (
                  <p className="text-ink-400 text-sm py-10 text-center">Loading appointments...</p>
               ) : pageItems.length === 0 ? (
                  <p className="text-ink-400 text-sm py-10 text-center">No appointments found.</p>
               ) : (
                  <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
                     {pageItems.map((appt) => (
                        <div key={appt.id} className="bg-white rounded-2xl shadow-ds-card p-4 flex flex-col gap-3 hover:shadow-ds-soft transition-shadow">
                           <div className="flex items-start justify-between">
                              <div className="w-12 h-12 rounded-full bg-medical-100 flex items-center justify-center text-medical-500 font-display font-bold">
                                 {appt.patientName.charAt(0)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <button className="w-7 h-7 rounded-full bg-ink-50 flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors" aria-label="Message"><Mail size={13} /></button>
                                 <button className="w-7 h-7 rounded-full bg-ink-50 flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors" aria-label="Open"><ArrowUpRight size={13} /></button>
                              </div>
                           </div>
                           <div>
                              <p className="font-display font-bold text-ink-800 text-[15px]">{appt.patientName}</p>
                              <p className="text-[12px] text-ink-500">{appt.time} &middot; {appt.date}</p>
                           </div>
                           <span className={`text-[10px] font-bold uppercase tracking-wide w-fit px-2 py-1 rounded-full ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : appt.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-medical-50 text-medical-600'}`}>
                              {appt.status}
                           </span>
                        </div>
                     ))}
                  </div>
               )}

               {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 text-[13px] text-ink-500">
                     <span>Page {page} of {totalPages}</span>
                     <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-full bg-ink-50 hover:bg-ink-100 transition-colors disabled:opacity-40 disabled:hover:bg-ink-50">Prev</button>
                        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-full bg-ink-50 hover:bg-ink-100 transition-colors disabled:opacity-40 disabled:hover:bg-ink-50">Next</button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};
