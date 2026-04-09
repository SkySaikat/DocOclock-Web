import React from 'react';
import { Activity, Star, Users } from 'lucide-react';

interface HospitalAnalyticsProps {
  stats: {
    totalVisits: number;
    averageRating: number;
    totalDoctors: number;
  };
}

export const HospitalAnalytics: React.FC<HospitalAnalyticsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Visits</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalVisits}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex flex-col items-center justify-center">
          <Star size={24} className="fill-amber-500" />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Avg Rating</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.averageRating}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex flex-col items-center justify-center">
          <Users size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Staff Doctors</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalDoctors}</p>
        </div>
      </div>

    </div>
  );
};
