import React, { useMemo } from 'react';
import { Activity, Star, Users, TrendingUp, Clock, PieChart as PieChartIcon } from 'lucide-react';

interface HospitalAnalyticsProps {
  stats: {
    totalVisits: number;
    averageRating: number;
    totalDoctors: number;
  };
}

export const HospitalAnalytics: React.FC<HospitalAnalyticsProps> = ({ stats }) => {
  
  // Simulated dynamic data utilizing the actual aggregate stats as base metrics
  const revenueTrend = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      amount: Math.floor((stats.totalVisits / 10) * Math.random() * 500) + 1000
    }));
  }, [stats.totalVisits]);

  const peakHours = useMemo(() => {
    return [
      { hour: '8 AM', value: 30 },
      { hour: '11 AM', value: 85 },
      { hour: '2 PM', value: 45 },
      { hour: '5 PM', value: 95 },
      { hour: '8 PM', value: 60 },
    ];
  }, []);

  const demographics = useMemo(() => {
    return [
      { group: '0-18 yrs', percentage: 15, color: 'bg-indigo-300' },
      { group: '19-35 yrs', percentage: 35, color: 'bg-indigo-500' },
      { group: '36-60 yrs', percentage: 30, color: 'bg-teal-500' },
      { group: '60+ yrs', percentage: 20, color: 'bg-amber-400' },
    ];
  }, []);

  const maxRevenue = Math.max(...revenueTrend.map(d => d.amount));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue/Patient Trend Bar Chart */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                 <TrendingUp className="text-indigo-500" size={24} /> Weekly Trend
               </h3>
               <p className="text-slate-400 font-bold text-sm">Estimated traffic and revenue</p>
             </div>
          </div>
          
          <div className="flex-1 flex items-end gap-3 min-h-[220px]">
             {revenueTrend.map((data, i) => {
               const heightPercent = maxRevenue > 0 ? (data.amount / maxRevenue) * 100 : 0;
               return (
                 <div key={i} className="flex-1 flex flex-col items-center gap-3">
                   {/* Bar */}
                   <div className="w-full bg-slate-50 rounded-lg flex items-end justify-center h-full relative group">
                      <div className="absolute opacity-0 group-hover:opacity-100 -top-10 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none transition-opacity z-10">
                         ৳{data.amount}
                      </div>
                      <div 
                        className="w-full bg-indigo-500/90 rounded-lg group-hover:bg-indigo-600 transition-all duration-500" 
                        style={{ height: `${heightPercent}%` }} 
                      />
                   </div>
                   <span className="text-xs font-black text-slate-400 uppercase">{data.day}</span>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Compound Demographics & Peak Traffic */}
        <div className="grid grid-cols-1 gap-6">
           
           {/* Peak Traffic */}
           <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
             <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
               <Clock className="text-teal-500" size={20} /> Peak Traffic Hours
             </h3>
             <div className="space-y-4">
               {peakHours.map((hour, i) => (
                 <div key={i} className="space-y-1">
                   <div className="flex justify-between text-xs font-black">
                     <span className="text-slate-600">{hour.hour}</span>
                     <span className="text-teal-600">{hour.value}% Traffic</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2">
                     <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${hour.value}%` }} />
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Demographics */}
           <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
             <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
               <PieChartIcon className="text-amber-500" size={20} /> Patient Demographics
             </h3>
             <div className="flex gap-1 h-3 rounded-full overflow-hidden w-full mb-4">
               {demographics.map((dem, i) => (
                 <div key={i} className={`${dem.color} h-full`} style={{ width: `${dem.percentage}%` }} />
               ))}
             </div>
             <div className="flex flex-wrap gap-4">
               {demographics.map((dem, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${dem.color}`} />
                   <span className="text-xs font-bold text-slate-500">{dem.group} ({dem.percentage}%)</span>
                 </div>
               ))}
             </div>
           </div>

        </div>
      </div>
    </div>
  );
};
