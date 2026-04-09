import React from 'react';
import { Users, Building, Calendar, Activity } from 'lucide-react';

interface AnalyticsOverviewProps {
  stats: {
    totalUsers: number;
    totalDoctors: number;
    totalHospitals: number;
    totalAppointments: number;
  };
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center">
          <Users size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex flex-col items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Doctors</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalDoctors}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center">
          <Building size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Hospitals</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalHospitals}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex flex-col items-center justify-center">
          <Calendar size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Appointments</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalAppointments}</p>
        </div>
      </div>

    </div>
  );
};
