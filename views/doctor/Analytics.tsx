import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart2, UserPlus, UserCheck } from 'lucide-react';

// --- MOCK DATA GENERATORS ---

const generateTrendData = (filter: string) => {
  if (filter === 'today') {
    return [
      { name: '10 AM', patients: 2, revenue: 2000 },
      { name: '11 AM', patients: 4, revenue: 4500 },
      { name: '12 PM', patients: 3, revenue: 3000 },
      { name: '1 PM', patients: 1, revenue: 1000 },
      { name: '5 PM', patients: 8, revenue: 9500 },
      { name: '6 PM', patients: 12, revenue: 14000 },
      { name: '7 PM', patients: 10, revenue: 11500 },
      { name: '8 PM', patients: 6, revenue: 7000 },
    ];
  }
  if (filter === 'week') {
    return [
      { name: 'Sat', patients: 45, revenue: 48000 },
      { name: 'Sun', patients: 38, revenue: 41000 },
      { name: 'Mon', patients: 32, revenue: 35000 },
      { name: 'Tue', patients: 40, revenue: 44000 },
      { name: 'Wed', patients: 28, revenue: 30000 },
      { name: 'Thu', patients: 35, revenue: 38500 },
      { name: 'Fri', patients: 50, revenue: 55000 },
    ];
  }
  if (filter === 'month') {
    return [
      { name: 'Week 1', patients: 210, revenue: 250000 },
      { name: 'Week 2', patients: 180, revenue: 210000 },
      { name: 'Week 3', patients: 240, revenue: 280000 },
      { name: 'Week 4', patients: 220, revenue: 260000 },
    ];
  }
  return [ // Year
    { name: 'Jan', patients: 850, revenue: 950000 },
    { name: 'Feb', patients: 780, revenue: 880000 },
    { name: 'Mar', patients: 900, revenue: 1050000 },
    { name: 'Apr', patients: 820, revenue: 920000 },
    { name: 'May', patients: 880, revenue: 980000 },
    { name: 'Jun', patients: 950, revenue: 1100000 },
  ];
};

const generateStatusData = (filter: string) => [
  { name: 'Completed', value: filter === 'today' ? 18 : 65, color: '#10b981' }, // emerald-500
  { name: 'No-Show', value: filter === 'today' ? 2 : 10, color: '#ef4444' },   // red-500
  { name: 'Cancelled', value: filter === 'today' ? 1 : 5, color: '#f59e0b' },  // amber-500
  { name: 'Pending', value: filter === 'today' ? 12 : 20, color: '#3b82f6' },  // blue-500
];

const generatePeakHours = () => [
  { name: '4-5 PM', traffic: 40 },
  { name: '5-6 PM', traffic: 85 },
  { name: '6-7 PM', traffic: 95 },
  { name: '7-8 PM', traffic: 70 },
  { name: '8-9 PM', traffic: 30 },
];

export const DoctorAnalytics: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');
  
  // Memoized Chart Data
  const trendData = useMemo(() => generateTrendData(timeFilter), [timeFilter]);
  const statusData = useMemo(() => generateStatusData(timeFilter), [timeFilter]);
  const peakData = useMemo(() => generatePeakHours(), []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <BarChart2 size={24} />
             </div>
             <h1 className="text-3xl font-bold text-slate-800">Practice Analytics</h1>
           </div>
           <p className="text-slate-500 text-sm ml-12">Deep dive into your practice performance.</p>
        </div>
        
        {/* Time Filters */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {['today', 'week', 'month', 'year'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter as any)}
              className={`px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all ${timeFilter === filter ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Chart 1: Revenue & Patient Trend (Takes 2/3) */}
         <GlassCard className="lg:col-span-2 p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-bold text-slate-800 text-lg">Patient & Revenue Trend</h3>
                  <p className="text-xs text-slate-400">Comparison over selected period</p>
               </div>
               <div className="flex gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Patients</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-teal-400"></span> Revenue</div>
               </div>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                     <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                     <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                     />
                     <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                     <Area yAxisId="left" type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* Chart 2: Appointment Status (Pie) */}
         <GlassCard className="p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Appointment Status</h3>
            <p className="text-xs text-slate-400 mb-6">Completion vs Cancellations</p>
            <div className="h-[250px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={statusData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {statusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}/>
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold text-slate-800">
                     {statusData[0].value + statusData[3].value}%
                  </span>
                  <span className="text-xs text-slate-400 uppercase font-bold">Fulfilled</span>
               </div>
            </div>
         </GlassCard>

         {/* Chart 3: Peak Hours (Queue Analytics) */}
         <GlassCard className="p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-6">Peak Traffic Hours</h3>
            <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakData} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={60} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                     <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px' }} />
                     <Bar dataKey="traffic" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </GlassCard>

         {/* Chart 4: Patient Demographics (New vs Returning) */}
         <GlassCard className="lg:col-span-2 p-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4 w-full">
               <div>
                  <h3 className="font-bold text-slate-800 text-lg">Patient Demographics</h3>
                  <p className="text-sm text-slate-500">New vs Returning Patients</p>
               </div>
               
               {/* Mock Stats */}
               <div className="flex gap-4">
                  <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                     <div className="flex items-center gap-2 mb-1">
                        <UserPlus size={16} className="text-blue-600"/>
                        <span className="text-xs font-bold text-blue-800 uppercase">New Patients</span>
                     </div>
                     <p className="text-2xl font-bold text-slate-800">35%</p>
                  </div>
                  <div className="flex-1 bg-purple-50 p-4 rounded-xl border border-purple-100">
                     <div className="flex items-center gap-2 mb-1">
                        <UserCheck size={16} className="text-purple-600"/>
                        <span className="text-xs font-bold text-purple-800 uppercase">Returning</span>
                     </div>
                     <p className="text-2xl font-bold text-slate-800">65%</p>
                  </div>
               </div>
               
               <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic border border-slate-100">
                  "Returning patient rate increased by 12% this month, indicating high patient satisfaction."
               </div>
            </div>
            
            <div className="flex-1 w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[{ name: 'Ratio', New: 35, Returning: 65 }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis hide />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}/>
                      <Tooltip />
                      <Bar dataKey="New" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Patients" />
                      <Bar dataKey="Returning" fill="#a855f7" radius={[4, 4, 0, 0]} name="Returning Patients" />
                      <Legend iconType="circle"/>
                   </BarChart>
                </ResponsiveContainer>
            </div>
         </GlassCard>

      </div>

      {/* Insight Cards (Derived Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
         {[
           { label: "Busiest Day", value: "Monday", sub: "Avg 45 patients", color: "border-l-blue-500" },
           { label: "Revenue Growth", value: "+18%", sub: "Compared to last month", color: "border-l-teal-500" },
           { label: "Avg Wait Time", value: "14 mins", sub: "Below industry avg (20m)", color: "border-l-purple-500" }
         ].map((insight, i) => (
           <GlassCard key={i} className={`p-4 border-l-4 ${insight.color} bg-white shadow-sm`}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{insight.label}</p>
              <p className="text-xl font-bold text-slate-800">{insight.value}</p>
              <p className="text-xs text-slate-500 mt-1">{insight.sub}</p>
           </GlassCard>
         ))}
      </div>
    </div>
  );
};
