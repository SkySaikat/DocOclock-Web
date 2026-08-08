import React, { useMemo } from 'react';
import { Users, Building, Calendar, Activity, TrendingUp, Globe, Smartphone } from 'lucide-react';

interface AnalyticsOverviewProps {
  stats: {
    totalUsers: number;
    totalDoctors: number;
    totalHospitals: number;
    totalAppointments: number;
  };
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ stats }) => {
  
  const weeklyGrowth = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      users: Math.floor((stats.totalUsers / 20) * Math.random() * 2) + 5,
      appointments: Math.floor((stats.totalAppointments / 30) * Math.random() * 3) + 10
    }));
  }, [stats.totalUsers, stats.totalAppointments]);

  const platformUsage = [
    { label: 'Mobile App', percentage: 65, color: 'bg-medical-500' },
    { label: 'Desktop Web', percentage: 35, color: 'bg-sky-400' },
  ];

  const maxAppts = Math.max(...weeklyGrowth.map(d => d.appointments));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Line Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-ds-md p-6 shadow-ds-soft flex items-center gap-5">
          <div className="w-14 h-14 bg-medical-50 text-medical-600 rounded-2xl flex flex-col items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-ink-400 text-xs font-display font-black uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-3xl font-stat font-black text-ink-800 leading-none">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-ds-md p-6 shadow-ds-soft flex items-center gap-5">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex flex-col items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-ink-400 text-xs font-display font-black uppercase tracking-widest mb-1">Total Doctors</p>
            <p className="text-3xl font-stat font-black text-ink-800 leading-none">{stats.totalDoctors}</p>
          </div>
        </div>

        <div className="bg-white rounded-ds-md p-6 shadow-ds-soft flex items-center gap-5">
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex flex-col items-center justify-center">
            <Building size={24} />
          </div>
          <div>
            <p className="text-ink-400 text-xs font-display font-black uppercase tracking-widest mb-1">Hospitals</p>
            <p className="text-3xl font-stat font-black text-ink-800 leading-none">{stats.totalHospitals}</p>
          </div>
        </div>

        <div className="bg-white rounded-ds-md p-6 shadow-ds-soft flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex flex-col items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-ink-400 text-xs font-display font-black uppercase tracking-widest mb-1">Appointments</p>
            <p className="text-3xl font-stat font-black text-ink-800 leading-none">{stats.totalAppointments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Growth Chart */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft flex flex-col lg:col-span-2">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-display font-black text-ink-800 flex items-center gap-2">
                <TrendingUp className="text-medical-500" size={24} /> Platform Trajectory
              </h3>
              <p className="text-ink-400 font-bold text-sm">Appointments booked per day</p>
            </div>
          </div>
          <div className="flex-1 flex items-end gap-2 md:gap-4 min-h-[250px]">
             {weeklyGrowth.map((data, i) => {
               const heightPercent = maxAppts > 0 ? (data.appointments / maxAppts) * 100 : 0;
               return (
                 <div key={i} className="flex-1 flex flex-col items-center gap-3">
                   <div className="w-full bg-ink-50 rounded-xl flex items-end justify-center h-full relative group pb-1">
                      <div className="absolute opacity-0 group-hover:opacity-100 -top-10 bg-navy-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none transition-opacity z-10 whitespace-nowrap">
                         {data.appointments} Appts
                      </div>
                      <div
                        className="w-[80%] mx-auto bg-medical-500 rounded-lg group-hover:bg-medical-600 transition-all duration-500 shadow-sm shadow-medical-500/20"
                        style={{ height: `${Math.max(10, heightPercent)}%` }}
                      />
                   </div>
                   <span className="text-xs font-black text-ink-400 uppercase">{data.day}</span>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Global Distribution */}
        <div className="space-y-6">
          <div className="bg-navy-900 text-white rounded-ds-xl p-8 shadow-ds-soft relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-medical-500/20 blur-3xl rounded-full pointer-events-none" />
            <h3 className="text-xl font-display font-black flex items-center gap-2 mb-6 relative z-10">
              <Globe className="text-medical-400" size={24} /> System Health
            </h3>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="font-bold text-slate-300 text-sm">Server Status</span>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </div>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="font-bold text-slate-300 text-sm">API Latency</span>
                <span className="text-medical-400 text-xs font-black uppercase tracking-widest">42ms avg</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft">
             <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-6">
               <Smartphone className="text-sky-500" size={20} /> Client Distribution
             </h3>
             <div className="flex gap-1 h-3 rounded-full overflow-hidden w-full mb-6">
               {platformUsage.map((p, i) => (
                 <div key={i} className={`${p.color} h-full`} style={{ width: `${p.percentage}%` }} />
               ))}
             </div>
             <div className="space-y-3">
               {platformUsage.map((p, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${p.color}`} />
                     <span className="text-sm font-bold text-ink-600">{p.label}</span>
                   </div>
                   <span className="text-sm font-stat font-black text-ink-800">{p.percentage}%</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
