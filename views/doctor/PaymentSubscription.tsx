import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, CalendarDays, Banknote, ShieldCheck, Sparkles } from 'lucide-react';
import { DoctorStorage, fetchDoctorAppointments } from '../../storage';
import { Appointment } from '../../types';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';

function monthKey(date: Date): string {
   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const PaymentSubscription: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
   const doctor = DoctorStorage.get();
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      if (!doctor?.id) return;
      fetchDoctorAppointments(doctor.id).then(setAppointments).finally(() => setIsLoading(false));
   }, [doctor?.id]);

   const stats = useMemo(() => {
      const now = new Date();
      const thisMonthKey = monthKey(now);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = monthKey(lastMonthDate);

      const completed = appointments.filter(a => a.status === 'completed');
      const allTime = completed.reduce((sum, a) => sum + (a.fee || 0), 0);
      const thisMonth = completed.filter(a => monthKey(new Date(a.date)) === thisMonthKey).reduce((sum, a) => sum + (a.fee || 0), 0);
      const lastMonth = completed.filter(a => monthKey(new Date(a.date)) === lastMonthKey).reduce((sum, a) => sum + (a.fee || 0), 0);
      const changePct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

      // Last 6 months, oldest first, for the mini trend bars.
      const monthly: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const key = monthKey(d);
         const value = completed.filter(a => monthKey(new Date(a.date)) === key).reduce((sum, a) => sum + (a.fee || 0), 0);
         monthly.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value });
      }

      return { allTime, thisMonth, lastMonth, changePct, monthly, completedCount: completed.length };
   }, [appointments]);

   const maxMonthly = Math.max(1, ...stats.monthly.map(m => m.value));

   return (
      <div className="space-y-6 max-w-6xl mx-auto px-2 md:px-0 pb-20 animate-fade-in">
         {onNavigate && <DoctorTabBar currentPath="/doctor/payment" onNavigate={onNavigate} />}

         <div>
            <h1 className="font-display text-2xl font-bold text-ink-800">Payment &amp; Subscription</h1>
            <p className="text-ink-500 text-sm mt-1">Your earnings summary — Dococlock doesn't process payments directly yet, so figures below are computed from completed appointment fees.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-[32px] shadow-ds-soft p-6">
               <div className="flex items-center gap-2 text-ink-500 text-xs font-bold uppercase tracking-widest mb-2">
                  <Wallet size={14} /> This Month
               </div>
               <p className="font-stat text-4xl font-medium text-medical-600 tracking-tight">
                  {isLoading ? <span className="inline-block w-24 h-9 bg-slate-50 animate-pulse rounded-lg" /> : `৳${stats.thisMonth.toLocaleString()}`}
               </p>
               {stats.changePct != null && !isLoading && (
                  <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${stats.changePct < 0 ? 'text-red-500' : 'text-medical-600'}`}>
                     {stats.changePct < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                     {stats.changePct > 0 ? '+' : ''}{stats.changePct}% vs last month
                  </p>
               )}
            </div>

            <div className="bg-white rounded-[32px] shadow-ds-soft p-6">
               <div className="flex items-center gap-2 text-ink-500 text-xs font-bold uppercase tracking-widest mb-2">
                  <CalendarDays size={14} /> Last Month
               </div>
               <p className="font-stat text-4xl font-medium text-ink-800 tracking-tight">
                  {isLoading ? <span className="inline-block w-24 h-9 bg-slate-50 animate-pulse rounded-lg" /> : `৳${stats.lastMonth.toLocaleString()}`}
               </p>
               <p className="text-xs text-ink-400 font-medium mt-2">{stats.completedCount} completed visits all-time</p>
            </div>

            <div className="bg-gradient-to-br from-secondary-900 to-secondary-700 rounded-[32px] shadow-ds-soft p-6 text-white">
               <div className="flex items-center gap-2 text-medical-300 text-xs font-bold uppercase tracking-widest mb-2">
                  <Banknote size={14} /> All-Time Earnings
               </div>
               <p className="font-stat text-4xl font-medium tracking-tight">
                  {isLoading ? <span className="inline-block w-24 h-9 bg-white/10 animate-pulse rounded-lg" /> : `৳${stats.allTime.toLocaleString()}`}
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="bg-white rounded-[32px] shadow-ds-soft p-6">
               <h3 className="font-display font-bold text-ink-800 mb-6">Last 6 Months</h3>
               <div className="flex items-end gap-3 h-40">
                  {stats.monthly.map(m => (
                     <div key={m.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div
                           className="w-full rounded-lg bg-medical-500 transition-all duration-700"
                           style={{ height: `${Math.max(4, (m.value / maxMonthly) * 100)}%` }}
                           title={`৳${m.value.toLocaleString()}`}
                        />
                        <span className="text-[11px] text-ink-500 font-medium">{m.label}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-ds-soft p-6 flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center shrink-0">
                     <Sparkles size={18} />
                  </div>
                  <div>
                     <p className="font-display font-bold text-ink-800 text-sm">Current Plan</p>
                     <p className="text-xs text-ink-500">Free — every feature included</p>
                  </div>
               </div>
               <div className="h-px bg-ink-100" />
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-ink-50 text-ink-400 flex items-center justify-center shrink-0">
                     <ShieldCheck size={18} />
                  </div>
                  <div>
                     <p className="font-display font-bold text-ink-800 text-sm">Payout Method</p>
                     <p className="text-xs text-ink-500">bKash / Bank transfer — coming soon</p>
                  </div>
               </div>
               <p className="text-[11px] text-ink-400 leading-relaxed pt-1">
                  Dococlock doesn't collect payments on your behalf — patients pay at your chamber. This page is a read-only summary of what you've earned through completed visits booked via the platform.
               </p>
            </div>
         </div>
      </div>
   );
};
