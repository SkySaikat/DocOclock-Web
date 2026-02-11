import React, { useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Calendar, Clock, MapPin, Search, Activity, CheckCircle, AlertCircle, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getAppointments, PatientStorage, getDoctorDelay } from '../../storage';
import { calculateEstimatedTime } from '../../utils/timeUtils';

interface AppointmentsProps {
   onNavigate: (path: string) => void;
}

export const Appointments: React.FC<AppointmentsProps> = ({ onNavigate }) => {
   const session = PatientStorage.get();

   const userAppointments = useMemo(() => {
      if (!session) return [];

      const allApps = getAppointments();
      return allApps
         .filter(a => a.patientId === session.id || a.patientId.startsWith(`family-${session.id.split('-')[1]}`))
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [session]);

   const getStatusStyle = (status: string) => {
      switch (status) {
         case 'waiting': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
         case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
         case 'completed': return 'bg-green-50 text-green-600 border-green-100';
         case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
         default: return 'bg-slate-50 text-slate-600 border-slate-100';
      }
   };

   const getStatusIcon = (status: string) => {
      switch (status) {
         case 'waiting': return <Clock size={14} />;
         case 'completed': return <CheckCircle size={14} />;
         case 'cancelled': return <XCircle size={14} />;
         default: return <Activity size={14} />;
      }
   };

   return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto px-2">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Appointments</h1>
               <p className="text-slate-500 font-bold text-lg mt-2">Track your serials and consultation history.</p>
            </div>
            <Button onClick={() => onNavigate('/patient/home')} variant="outline" className="rounded-2xl h-14 px-8 font-black gap-2 border-slate-200 bg-white">
               <Search size={20} /> Book New
            </Button>
         </div>

         {userAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {userAppointments.map(app => (
                  <GlassCard key={app.id} className="p-0 overflow-hidden border-0 ring-1 ring-slate-100 shadow-lg hover:shadow-2xl transition-all flex flex-col bg-white rounded-[2.5rem]">
                     <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                           <div className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                              Serial #{app.tokenNumber}
                           </div>
                           <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(app.status)}`}>
                              {getStatusIcon(app.status)} {app.status}
                           </div>
                        </div>

                        <div className="flex gap-4 items-center mb-6">
                           <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner border border-blue-100">
                              <User size={28} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="font-black text-slate-800 text-xl leading-tight truncate">{app.doctorName}</h3>
                              <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-1">Specialist Consultation</p>
                           </div>
                        </div>

                        <div className="space-y-3 text-sm font-bold text-slate-500 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                           <div className="flex items-center gap-3">
                              <Calendar size={16} className="text-blue-500" />
                              {new Date(app.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                           </div>
                           <div className="flex items-center gap-3">
                              <Clock size={16} className="text-teal-500" /> {app.time}
                           </div>
                           {app.status === 'waiting' && (() => {
                              const delay = getDoctorDelay(app.doctorId, app.date);
                              const estTime = calculateEstimatedTime(app.time, app.tokenNumber, delay.delayInMinutes);
                              return (
                                 <div className="mt-4 pt-4 border-t border-slate-200/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Estimated Consultation Time</p>
                                    <p className="text-lg font-black text-blue-600">{estTime}</p>
                                 </div>
                              );
                           })()}
                        </div>
                     </div>

                     <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <Button
                           fullWidth
                           onClick={() => onNavigate('/live-serial')}
                           disabled={app.status === 'completed' || app.status === 'cancelled'}
                           className="h-12 rounded-xl text-sm font-black shadow-lg"
                        >
                           Track Live Queue
                        </Button>
                     </div>
                  </GlassCard>
               ))}
            </div>
         ) : (
            <div className="py-24 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-200">
               <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar size={48} />
               </div>
               <h3 className="text-2xl font-black text-slate-800">No appointments found</h3>
               <p className="text-slate-400 font-bold mt-2 max-w-xs mx-auto">You haven't booked any consultations yet. Start by finding a specialist.</p>
               <Button className="mt-8 px-12 h-14 rounded-2xl shadow-xl shadow-blue-100 text-lg font-black" onClick={() => onNavigate('/patient/home')}>
                  Find a Doctor
               </Button>
            </div>
         )}
      </div>
   );
};

const XCircle = ({ size, className }: { size: number, className?: string }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
   </svg>
);