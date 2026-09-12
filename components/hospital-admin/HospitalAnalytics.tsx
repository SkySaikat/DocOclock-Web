import React from 'react';
import { Activity, Star, Users, TrendingUp, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { HospitalAnalyticsData } from '../../hooks/useHospitalAdminData';

interface HospitalAnalyticsProps {
  stats: {
    totalVisits: number;
    averageRating: number;
    totalDoctors: number;
  };
  analytics: HospitalAnalyticsData;
}

const DEMOGRAPHIC_COLORS = ['bg-medical-300', 'bg-medical-500', 'bg-teal-500', 'bg-amber-400'];

export const HospitalAnalytics: React.FC<HospitalAnalyticsProps> = ({ stats, analytics }) => {
  const { revenueTrend, peakHours, demographics } = analytics;
  const maxRevenue = Math.max(1, ...revenueTrend.map(d => d.amount));
  const hasDemographics = demographics.some(d => d.percentage > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-ds-lg p-6 shadow-sm border border-ink-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-medical-50 text-medical-600 rounded-ds-md flex flex-col items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-ink-500 text-xs font-black uppercase tracking-widest mb-1">Total Visits</p>
            <p className="font-stat text-3xl font-black text-ink-800 leading-none">{stats.totalVisits}</p>
          </div>
        </div>

        <div className="bg-white rounded-ds-lg p-6 shadow-sm border border-ink-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-ds-md flex flex-col items-center justify-center">
            <Star size={24} className="fill-amber-500" />
          </div>
          <div>
            <p className="text-ink-500 text-xs font-black uppercase tracking-widest mb-1">Avg Rating</p>
            <p className="font-stat text-3xl font-black text-ink-800 leading-none">{stats.averageRating}</p>
          </div>
        </div>

        <div className="bg-white rounded-ds-lg p-6 shadow-sm border border-ink-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-ds-md flex flex-col items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-ink-500 text-xs font-black uppercase tracking-widest mb-1">Staff Doctors</p>
            <p className="font-stat text-3xl font-black text-ink-800 leading-none">{stats.totalDoctors}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Bar Chart — last 7 days, completed appointments only */}
        <div className="bg-white rounded-ds-xl p-8 shadow-sm border border-ink-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="font-display text-xl font-black text-ink-800 flex items-center gap-2">
                 <TrendingUp className="text-medical-500" size={24} /> Weekly Revenue
               </h3>
               <p className="text-ink-500 font-bold text-sm">Completed appointment fees, last 7 days</p>
             </div>
          </div>

          <div className="flex-1 flex items-end gap-3 min-h-[220px]">
             {revenueTrend.map((data, i) => {
               const heightPercent = (data.amount / maxRevenue) * 100;
               return (
                 <div key={i} className="flex-1 flex flex-col items-center gap-3">
                   <div className="w-full bg-ink-50 rounded-ds-sm flex items-end justify-center h-full relative group">
                      <div className="absolute opacity-0 group-hover:opacity-100 -top-10 bg-ink-800 text-white text-xs font-bold py-1 px-2 rounded-ds-sm pointer-events-none transition-opacity z-10">
                         ৳{data.amount}
                      </div>
                      <div
                        className="w-full bg-medical-500/90 rounded-ds-sm group-hover:bg-medical-600 transition-all duration-500"
                        style={{ height: `${Math.max(2, heightPercent)}%` }}
                      />
                   </div>
                   <span className="text-xs font-black text-ink-500 uppercase">{data.day}</span>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">

           {/* Peak Traffic */}
           <div className="bg-white rounded-ds-lg p-6 shadow-sm border border-ink-100">
             <h3 className="font-display text-lg font-black text-ink-800 flex items-center gap-2 mb-6">
               <Clock className="text-teal-500" size={20} /> Peak Traffic Hours
             </h3>
             {peakHours.length === 0 ? (
               <p className="text-sm font-bold text-ink-400 text-center py-6">Not enough appointment data yet.</p>
             ) : (
               <div className="space-y-4">
                 {peakHours.map((hour, i) => (
                   <div key={i} className="space-y-1">
                     <div className="flex justify-between text-xs font-black">
                       <span className="text-ink-600">{hour.hour}</span>
                       <span className="text-teal-600">{hour.value}% Traffic</span>
                     </div>
                     <div className="w-full bg-ink-100 rounded-full h-2">
                       <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${hour.value}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* Demographics */}
           <div className="bg-white rounded-ds-lg p-6 shadow-sm border border-ink-100">
             <h3 className="font-display text-lg font-black text-ink-800 flex items-center gap-2 mb-6">
               <PieChartIcon className="text-amber-500" size={20} /> Patient Demographics
             </h3>
             {!hasDemographics ? (
               <p className="text-sm font-bold text-ink-400 text-center py-6">No patient age data recorded yet.</p>
             ) : (
               <>
                 <div className="flex gap-1 h-3 rounded-full overflow-hidden w-full mb-4">
                   {demographics.map((dem, i) => (
                     <div key={i} className={`${DEMOGRAPHIC_COLORS[i]} h-full`} style={{ width: `${dem.percentage}%` }} />
                   ))}
                 </div>
                 <div className="flex flex-wrap gap-4">
                   {demographics.map((dem, i) => (
                     <div key={i} className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full ${DEMOGRAPHIC_COLORS[i]}`} />
                       <span className="text-xs font-bold text-ink-500">{dem.group} ({dem.percentage}%)</span>
                     </div>
                   ))}
                 </div>
               </>
             )}
           </div>

        </div>
      </div>
    </div>
  );
};
