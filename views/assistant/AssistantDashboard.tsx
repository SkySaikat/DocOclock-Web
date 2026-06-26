import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';
import { ShieldAlert, Users, Clock, Calendar } from 'lucide-react';
import { Appointments } from '../patient/Appointments';
import { SerialManager } from '../doctor/SerialManager';

export const AssistantDashboard = ({ currentPath }: { currentPath?: string }) => {
  const { profile } = useAuth();
  const [parentDoctor, setParentDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const permissions = profile?.permissions || { manage_queue: false, manage_appointments: false };

  useEffect(() => {
    fetchParentDoctor();
  }, [profile?.parent_id]);

  const fetchParentDoctor = async () => {
    if (!profile?.parent_id) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.parent_id).single();
    if (data) {
      setParentDoctor(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 font-bold text-slate-400">Loading Assistant Data...</div>;
  }

  if (!parentDoctor) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4 text-rose-700">
           <ShieldAlert size={32} />
           <div>
             <h2 className="font-black text-lg">Unlinked Account</h2>
             <p className="font-bold text-sm text-rose-600/80">Your account is not linked to any Doctor. Please contact administration.</p>
           </div>
        </div>
      </div>
    );
  }

  const isAppointmentsRoute = currentPath === '/assistant/appointments';
  const isQueueRoute = currentPath === '/assistant/queue';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {profile?.name}</h1>
          <p className="text-sm font-bold text-slate-500 mt-2">Managing clinic for <span className="text-indigo-600">{parentDoctor.full_name}</span></p>
        </div>
      </div>

      {/* Permissions Guard Alerts */}
      {isAppointmentsRoute && !permissions.manage_appointments && (
         <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
            <p className="font-bold text-slate-500 mt-2">You do not have permission to view patient appointments.</p>
         </div>
      )}

      {isQueueRoute && !permissions.manage_queue && (
         <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl">
            <Clock size={48} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
            <p className="font-bold text-slate-500 mt-2">You do not have permission to manage the live queue.</p>
         </div>
      )}

      {/* Embedded Components (Acting on behalf of Doctor) */}
      {isQueueRoute && permissions.manage_queue && (
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
               <Clock className="text-indigo-600" /> Live Queue Management
            </h2>
            <SerialManager 
               onNavigate={() => {}} 
               onStartPrescription={() => { alert('Assistants cannot write prescriptions.'); }}
               overrideDoctorId={parentDoctor.id}
            />
         </div>
      )}

      {isAppointmentsRoute && permissions.manage_appointments && (
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
               <Users className="text-indigo-600" /> Patient Reservations
            </h2>
            {/* The Appointments component could be wrapped here, but for now SerialManager handles the queue list */}
            <p className="text-sm font-bold text-slate-500">View upcoming reservations across all chambers.</p>
            <Appointments overridePatientId={null} overrideDoctorId={parentDoctor.id} />
         </div>
      )}

    </div>
  );
};
