import React, { useMemo, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Calendar, Clock, MapPin, Search, Activity, CheckCircle, AlertCircle, User, X, Trash2, Filter, History, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AppointmentCard } from '../../components/ui/AppointmentCard';
import { getAppointments, PatientStorage, getDoctorDelay, cancelAppointment } from '../../storage';
import { calculateEstimatedTime } from '../../utils/timeUtils';

interface AppointmentsProps {
   onNavigate: (path: string) => void;
}

// --- Custom Hook: Filtering & Cancellation Logic ---
const useAppointmentsLogic = (onNavigate: (path: string) => void) => {
   const session = PatientStorage.get();
   const [refresh, setRefresh] = useState(0);
   const [cancellingAppId, setCancellingAppId] = useState<string | null>(null);
   const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
   const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');

   // Scalability Preps: State Structured for Future UI
   const [searchQuery, setSearchQuery] = useState('');
   const [hospitalFilter, setHospitalFilter] = useState('all');
   const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 6 });

   const filteredAppointments = useMemo(() => {
      if (!session) return [];
      const allApps = getAppointments();
      let filtered = allApps.filter(a => a.patientPhone === session.phone);

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

   const handleCancel = () => {
      if (cancellingAppId) {
         cancelAppointment(cancellingAppId, "patient");
         setCancellingAppId(null);
         setRefresh(prev => prev + 1);
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
   };
};

// --- Sub-Component: Status Tabs ---
const StatusTabs: React.FC<{
   current: string;
   onChange: (s: 'all' | 'upcoming' | 'completed' | 'cancelled') => void;
}> = ({ current, onChange }) => (
   <div className="flex-1 flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-soft overflow-x-auto scrollbar-hide">
      {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((status) => (
         <button
            key={status}
            onClick={() => onChange(status)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${current === status
               ? 'bg-slate-900 text-white border-slate-900 shadow-premium'
               : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
               }`}
         >
            {status}
         </button>
      ))}
   </div>
);

// --- Sub-Component: Time Filters ---
const TimeFilters: React.FC<{
   current: string;
   onChange: (t: 'today' | 'week' | 'month' | 'year' | 'all') => void;
}> = ({ current, onChange }) => (
   <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-soft overflow-x-auto scrollbar-hide">
      {(['today', 'week', 'month', 'year', 'all'] as const).map((time) => (
         <button
            key={time}
            onClick={() => onChange(time)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${current === time
               ? 'bg-medical-500 text-white border-medical-500 shadow-premium'
               : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
               }`}
         >
            {time === 'today' ? 'Today' : time === 'week' ? 'This Week' : time === 'month' ? 'This Month' : time === 'year' ? 'Year' : 'All Time'}
         </button>
      ))}
   </div>
);

// Internal AppointmentCard removed to use global component

// --- Sub-Component: Cancellation Modal ---
const CancelModal: React.FC<{
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
   if (!isOpen) return null;
   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
         <GlassCard className="max-w-md w-full p-8 space-y-6 shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto border border-red-100 shadow-inner">
               <AlertCircle size={32} />
            </div>
            <div className="text-center space-y-2 pb-2">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Cancel Appointment</h3>
               <p className="text-slate-500 font-bold text-lg">
                  Are you sure you want to cancel this appointment?<br />
                  <span className="text-red-500">This action cannot be undone.</span>
               </p>
            </div>
            <div className="flex flex-col gap-3">
               <Button
                  fullWidth
                  className="h-16 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-100 text-lg"
                  onClick={onConfirm}
               >
                  Confirm Cancel
               </Button>
               <Button
                  variant="outline"
                  fullWidth
                  className="h-16 rounded-2xl font-black border-slate-200 text-slate-500 text-lg"
                  onClick={onClose}
               >
                  Keep Appointment
               </Button>
            </div>
         </GlassCard>
      </div>
   );
};

// --- Main View Component ---
export const Appointments: React.FC<AppointmentsProps> = ({ onNavigate }) => {
   const {
      session,
      userAppointments,
      statusFilter,
      setStatusFilter,
      timeFilter,
      setTimeFilter,
      cancellingAppId,
      setCancellingAppId,
      handleCancel,
   } = useAppointmentsLogic(onNavigate);

   return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto px-2 pb-24">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Appointments</h1>
               <p className="text-slate-500 font-bold text-lg mt-2">Track your serials and history.</p>
            </div>
            <Button onClick={() => onNavigate('/patient/home')} variant="outline" className="rounded-2xl h-14 px-8 font-black gap-2 border-slate-200 bg-white">
               <Search size={20} /> Book New
            </Button>
         </div>

         {/* Filtering Logic Layer */}
         <div className="flex flex-col md:flex-row gap-4">
            <StatusTabs current={statusFilter} onChange={setStatusFilter} />
            {statusFilter !== 'upcoming' && (
               <TimeFilters current={timeFilter} onChange={setTimeFilter} />
            )}
         </div>

         {/* UI Grid Layer */}
         {userAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {userAppointments.map(app => (
                  <AppointmentCard
                     key={app.id}
                     appointment={{
                        patientName: app.patientName,
                        doctorName: app.doctorName,
                        doctorSpecialty: 'Specialist Consultation',
                        hospitalName: app.chamberName,
                        date: app.date,
                        time: app.time,
                        serialNumber: app.serialNumber,
                        fee: app.fee,
                        status: app.status
                     }}
                     onTrack={() => onNavigate('/live-serial', app.id)}
                     onAction={() => setCancellingAppId(app.id)}
                  />
               ))}
            </div>
         ) : (
            <div className="py-24 text-center bg-white rounded-[32px] border border-slate-100 shadow-premium">
               <div className="w-20 h-20 bg-medical-50 text-medical-500 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                  {statusFilter === 'all' ? <Calendar size={40} /> : <Filter size={40} />}
               </div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {statusFilter === 'all' ? 'No appointments' : `No ${statusFilter} appointments`}
               </h3>
               <p className="text-slate-400 font-bold mt-2 max-w-xs mx-auto text-sm">
                  {statusFilter === 'all'
                     ? "You haven't booked any consultations yet."
                     : `There are no consultations matching "${statusFilter}" for this period.`}
               </p>
               <Button
                  className="mt-8 px-10 h-14 rounded-2xl bg-medical-600 hover:bg-medical-500 text-white shadow-lg shadow-medical-100 text-sm font-black uppercase tracking-widest"
                  onClick={() => statusFilter === 'all' ? onNavigate('/patient/home') : setStatusFilter('all')}
               >
                  {statusFilter === 'all' ? 'Find a Doctor' : 'Clear Filters'}
               </Button>
            </div>
         )}

         {/* Modal Layer */}
         <CancelModal
            isOpen={!!cancellingAppId}
            onClose={() => setCancellingAppId(null)}
            onConfirm={handleCancel}
         />
      </div>
   );
};