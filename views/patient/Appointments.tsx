import React, { useMemo, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Calendar, Clock, MapPin, Search, Activity, CheckCircle, AlertCircle, User, X, Trash2, Filter, History, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AppointmentCard } from '../../components/ui/AppointmentCard';
import { fetchAppointments, PatientStorage, cancelAppointment } from '../../storage';
import { calculateEstimatedTime } from '../../utils/timeUtils';

interface AppointmentsProps {
   onNavigate: (path: string) => void;
}

// --- Custom Hook: Filtering & Cancellation Logic ---
const useAppointmentsLogic = (onNavigate: (path: string) => void) => {
   const session = PatientStorage.get();
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
         if (!session) return;
         setIsLoading(true);
         try {
            const apps = await fetchAppointments({ patientId: session.id });
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
      if (!session) return [];
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
            alert('Could not cancel appointment. Please try again.');
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

// --- Sub-Component: Status Tabs ---
const StatusTabs: React.FC<{
   current: string;
   onChange: (s: 'all' | 'upcoming' | 'completed' | 'cancelled') => void;
}> = ({ current, onChange }) => (
   <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-full">
      <div className="grid grid-cols-4 gap-1">
         {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((status) => (
            <button
               key={status}
               onClick={() => onChange(status)}
               className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all text-center ${current === status
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
            >
               {status === 'cancelled' ? 'CANC.' : status}
            </button>
         ))}
      </div>
   </div>
);

// --- Sub-Component: Time Filters ---
const TimeFilters: React.FC<{
   current: string;
   onChange: (t: 'today' | 'week' | 'month' | 'year' | 'all') => void;
}> = ({ current, onChange }) => (
   <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-full">
      <div className="grid grid-cols-5 gap-1">
         {(['today', 'week', 'month', 'year', 'all'] as const).map((time) => (
            <button
               key={time}
               onClick={() => onChange(time)}
               className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all text-center ${current === time
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
            >
               {time === 'today' ? 'Day' : time === 'week' ? 'Week' : time === 'month' ? 'Mon' : time === 'year' ? 'Year' : 'All'}
            </button>
         ))}
      </div>
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
      isLoading,
   } = useAppointmentsLogic(onNavigate);

   return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-0.5">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">My Appointments</h1>
               <p className="text-slate-500 font-bold text-base tracking-tight">Track your serials and history.</p>
            </div>
         </div>


         {/* Filtering Logic Layer */}
         <div className="flex flex-col md:flex-row gap-3">
            <StatusTabs current={statusFilter} onChange={setStatusFilter} />
            <TimeFilters current={timeFilter} onChange={setTimeFilter} />
         </div>

         {/* UI Grid Layer */}
         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
               <div className="w-12 h-12 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
               <p className="text-slate-400 font-bold animate-pulse">Syncing your appointments...</p>
            </div>
         ) : userAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
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
            <div className="py-24 text-center bg-white rounded-[32px] border border-slate-100 shadow-premium animate-in fade-in zoom-in duration-500">
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