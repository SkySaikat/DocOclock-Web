import React, { useState, useEffect, useMemo } from 'react';
import { DS_ICONS } from '../../components/dashboard';
import { FilterPill } from '../../components/patient/DsTable';
import { QueueStatusCard } from '../../components/doctor/overview/QueueStatusCard';
import { EarningCard } from '../../components/doctor/overview/EarningCard';

import { DoctorStorage, fetchAppointments, fetchDoctorChambers } from '../../storage';
import { Appointment, AppointmentStatus } from '../../types';

import { getLocalISODate } from '../../utils/date';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';

export const DoctorAnalytics: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
   const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('week');
   const session = DoctorStorage.get();
   const currentDoctorId = session?.id;
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [hospitals, setHospitals] = useState<any[]>([]);
   const [selectedHospitalId, setSelectedHospitalId] = useState<string>('all');

   const [isLoading, setIsLoading] = useState(true);

   // 1. Fetch Data
   useEffect(() => {
      const loadData = async () => {
         if (!currentDoctorId) return;
         setIsLoading(true);

         try {
            // Fetch all appointments for this doctor
            const myAppointments = await fetchAppointments({ doctorId: currentDoctorId });
            setAppointments(myAppointments);

            // Load chambers/hospitals
            const chambers = await fetchDoctorChambers(currentDoctorId);
            setHospitals(chambers || []);
         } catch (error) {
            console.error('Error loading analytics data:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadData();
   }, [currentDoctorId]);

   // 2. Real Analytics Computation
   const stats = useMemo(() => {
      const now = new Date();
      const todayStr = getLocalISODate();

      // Hospital Filtering logic exactly as requested
      const hospitalFiltered = selectedHospitalId === 'all'
         ? appointments.filter(a => String(a.doctorId) === String(currentDoctorId))
         : appointments.filter(a =>
            String(a.doctorId) === String(currentDoctorId) &&
            String(a.hospitalId) === String(selectedHospitalId)
         );

      // Then filter by time range
      const filteredApps = hospitalFiltered.filter(a => {
         const appDate = new Date(a.date);
         if (timeFilter === 'today') return a.date === todayStr;
         if (timeFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return appDate >= weekAgo;
         }
         if (timeFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return appDate >= monthAgo;
         }
         return true; // Year or All
      });

      // Trend Data Grouping (Exclude cancelled from active counts, only completed for revenue)
      const trendMap = new Map<string, { name: string, patients: number, revenue: number }>();
      filteredApps.forEach(a => {
         if (a.status === 'cancelled') return;
         let key = a.date;
         if (timeFilter === 'today') key = a.time.split(':')[0] + (a.time.includes('PM') ? ' PM' : ' AM');

         const existing = trendMap.get(key) || { name: key, patients: 0, revenue: 0 };
         existing.patients += 1;
         if (a.status === 'completed') {
            existing.revenue += (a.fee || 0);
         }
         trendMap.set(key, existing);
      });
      const trendData = Array.from(trendMap.values()).sort((a, b) => a.name.localeCompare(b.name));

      // Status Data
      const statusData = [
         { name: 'Completed', value: filteredApps.filter(a => a.status === 'completed').length, color: '#10b981' },
         { name: 'Waiting', value: filteredApps.filter(a => a.status === 'waiting').length, color: '#3b82f6' },
         { name: 'Cancelled', value: filteredApps.filter(a => a.status === 'cancelled').length, color: '#f59e0b' },
      ];

      // Peak Hours (Exclude cancelled)
      const hourMap = new Map<string, number>();
      filteredApps.forEach(a => {
         if (a.status === 'cancelled') return;
         const hour = a.time.split(':')[0] + (a.time.includes('PM') ? ' PM' : ' AM');
         hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });
      const peakData = Array.from(hourMap.entries()).map(([name, traffic]) => ({ name, traffic }));

      // Cancellation Rate & Pie specific
      const totalAppointments = filteredApps.length;
      const cancelledCount = filteredApps.filter(a => a.status === 'cancelled').length;
      const completedCount = filteredApps.filter(a => a.status === 'completed').length;
      const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0;

      const cancelledVsCompletedData = [
         { name: 'Completed', value: completedCount, color: '#10b981' },
         { name: 'Cancelled', value: cancelledCount, color: '#ef4444' }
      ];

      // Patient Demographics (New vs Returning) — a patient counts as "new" if
      // their earliest-ever appointment with this doctor (across all history,
      // not just the current filtered window) falls inside this window;
      // otherwise they had already visited before and count as "returning".
      const firstApptDateByPatient = new Map<string, string>();
      appointments
         .filter(a => String(a.doctorId) === String(currentDoctorId) && a.status !== 'cancelled')
         .forEach(a => {
            const existing = firstApptDateByPatient.get(a.patientId);
            if (!existing || a.date < existing) firstApptDateByPatient.set(a.patientId, a.date);
         });

      const patientsInWindow = new Set<string>(filteredApps.filter(a => a.status !== 'cancelled').map(a => a.patientId));
      let newPatientCount = 0;
      let returningPatientCount = 0;
      patientsInWindow.forEach(patientId => {
         const firstDate = firstApptDateByPatient.get(patientId);
         const firstApptWasInWindow = !!firstDate && filteredApps.some(a => a.patientId === patientId && a.date === firstDate);
         if (firstApptWasInWindow) newPatientCount += 1;
         else returningPatientCount += 1;
      });
      const demographicsTotal = newPatientCount + returningPatientCount;
      const newPatientPct = demographicsTotal > 0 ? Math.round((newPatientCount / demographicsTotal) * 100) : 0;
      const returningPatientPct = demographicsTotal > 0 ? 100 - newPatientPct : 0;

      // Figma cards (257:10189): monthly patients (scope-filtered, current year), weekday load, hour load, statuses, earnings.
      const active = filteredApps.filter(a => a.status !== 'cancelled');
      const thisYear = now.getFullYear();
      const monthly = MONTHS.map((label, m) => {
         const inMonth = hospitalFiltered.filter(a => a.status !== 'cancelled' && new Date(a.date).getFullYear() === thisYear && new Date(a.date).getMonth() === m);
         return { label, value: inMonth.length, done: inMonth.filter(a => a.status === 'completed').length, revenue: inMonth.filter(a => a.status === 'completed').reduce((t, a) => t + (a.fee || 0), 0) };
      });
      const weekday = WEEKDAYS.map((label, d) => {
         const onDay = active.filter(a => new Date(a.date).getDay() === d);
         return { label, value: onDay.length, done: onDay.filter(a => a.status === 'completed').length, revenue: onDay.filter(a => a.status === 'completed').reduce((t, a) => t + (a.fee || 0), 0) };
      });
      const hours = peakData
         .filter(p => /^\d/.test(p.name)) // skip non-clock slots such as "Walk-in"
         .map(p => ({ label: p.name, value: p.traffic, sortKey: hourSortKey(p.name) }))
         .sort((a, b) => a.sortKey - b.sortKey);
      const earned = filteredApps.filter(a => a.status === 'completed').reduce((t, a) => t + (a.fee || 0), 0);
      const expected = active.reduce((t, a) => t + (a.fee || 0), 0);
      const counts = {
         completed: filteredApps.filter(a => a.status === 'completed').length,
         consulting: filteredApps.filter(a => a.status === 'consulting').length,
         waiting: filteredApps.filter(a => a.status === 'waiting' || a.status === 'late').length,
         cancelled: cancelledCount,
         active: active.length,
      };

      return {
         trendData, statusData, peakData, filteredApps, cancellationRate, cancelledVsCompletedData,
         newPatientCount, returningPatientCount, newPatientPct, returningPatientPct,
         monthly, weekday, hours, earned, expected, counts,
      };
   }, [appointments, timeFilter, selectedHospitalId, currentDoctorId]);

   const { cancellationRate, newPatientPct, returningPatientPct, monthly, weekday, hours, earned, expected, counts } = stats;
   const periodLabel = TIME_OPTIONS.find(o => o.id === timeFilter)?.label ?? 'This Week';
   const scopeOptions = [{ id: 'all', label: 'All Hospitals' }, ...hospitals.map(h => ({ id: String(h.id), label: h.hospitalName }))];
   const scopeLabel = scopeOptions.find(o => o.id === String(selectedHospitalId))?.label ?? 'All Hospitals';
   const thisMonth = new Date().getMonth();

   return (
      // Figma "Analytics" 257:10189. Page background + gutters come from Layout.
      <div className="flex animate-fade-in flex-col gap-6 font-display">
         {onNavigate && <DoctorTabBar currentPath="/doctor/analytics" onNavigate={onNavigate} />}

         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
               <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Analytics</h1>
               <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">
                  {selectedHospitalId === 'all' ? 'Your whole practice at a glance' : `Analytics for ${scopeLabel}`}
               </p>
            </div>
            <div className="flex flex-wrap items-stretch gap-1">
               <FilterPill label={periodLabel} icon={DS_ICONS.calendar} chevron={DS_ICONS.dropdown} options={TIME_OPTIONS} value={timeFilter} onSelect={id => setTimeFilter(id as TimeKey)} />
               <FilterPill label={scopeLabel} icon={DS_ICONS.searchFilter} chevron={DS_ICONS.dropdown} options={scopeOptions} value={String(selectedHospitalId)} onSelect={setSelectedHospitalId} />
            </div>
         </div>

         {isLoading ? (
            <p className="py-24 text-center text-ds-body text-content-tertiary">Loading analytics...</p>
         ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_482px]">
               {/* Left column */}
               <div className="flex min-w-0 flex-col gap-3">
                  <Card title="Patients Status" chip={String(new Date().getFullYear())}>
                     <Legend items={[['bg-primary-500', 'Consultations'], ['bg-primary-950', 'Completed']]} />
                     <VBars data={monthly} highlight={thisMonth} height={200} format={d => `${d.value} · ৳${d.revenue}`} />
                  </Card>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[336px_minmax(0,1fr)]">
                     <QueueStatusCard
                        title="Appointment Status"
                        chipLabel={periodLabel}
                        completed={counts.completed}
                        consulting={counts.consulting}
                        waiting={counts.waiting}
                        total={counts.active}
                        layout="column"
                        className="!rounded-ds-lg !p-5"
                     />
                     <Card title="Peak Hours" chip={periodLabel}>
                        <Legend items={[['bg-primary-500', 'Consultations']]} />
                        <HBars data={hours} />
                     </Card>
                  </div>
               </div>

               {/* Right column (482) */}
               <div className="flex min-w-0 flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_195px]">
                     <Card title="Patient" chip={periodLabel}>
                        <div className="grid grid-cols-2 gap-4">
                           <PatientSplit label="New Patient" count={stats.newPatientCount} pct={newPatientPct} dark />
                           <PatientSplit label="Old Patient" count={stats.returningPatientCount} pct={returningPatientPct} />
                        </div>
                     </Card>
                     <EarningCard earned={earned} total={expected} chipLabel={periodLabel} className="!rounded-ds-lg" />
                  </div>

                  <Card title="Busiest Day" chip={periodLabel}>
                     <Legend items={[['bg-primary-500', 'Consultations'], ['bg-primary-950', 'Completed']]} />
                     <VBars data={weekday} highlight={argMax(weekday.map(d => d.value))} height={180} format={d => `${d.value} · ৳${d.revenue}`} />
                  </Card>

                  <Card title="Overall Status" chip={periodLabel}>
                     <VBars
                        data={[
                           { label: 'Completed', value: counts.completed },
                           { label: 'Waiting', value: counts.waiting + counts.consulting },
                           { label: 'Cancelled', value: counts.cancelled },
                        ]}
                        tones={['bg-primary-500', 'bg-primary-950', 'bg-ink-100']}
                        height={170}
                        format={d => String(d.value)}
                     />
                     <p className="text-ds-small text-content-tertiary">Cancellation rate {Math.round(cancellationRate)}% of {stats.filteredApps.length} appointment(s).</p>
                  </Card>
               </div>
            </div>
         )}
      </div>
   );
};

type TimeKey = 'today' | 'week' | 'month' | 'year';
const TIME_OPTIONS: { id: TimeKey; label: string }[] = [
   { id: 'today', label: 'Today' },
   { id: 'week', label: 'This Week' },
   { id: 'month', label: 'This Month' },
   { id: 'year', label: 'Year' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "10 AM" / "2 PM" keys from the peak-hours map -> 0..23 for ordering.
const hourSortKey = (label: string) => {
   const h = parseInt(label, 10) || 0;
   const pm = /PM/i.test(label);
   return (h % 12) + (pm ? 12 : 0);
};
const argMax = (xs: number[]) => xs.reduce((best, x, i) => (x > xs[best] ? i : best), 0);

// White r24 card, p20, title (24) + period chip — the Figma analytics card shell.
const Card: React.FC<{ title: string; chip: string; children: React.ReactNode }> = ({ title, chip, children }) => (
   <section aria-label={title} className="flex min-w-0 flex-col gap-4 rounded-ds-lg bg-white p-5">
      <div className="flex items-center justify-between gap-3">
         <h3 className="text-ds-title-24 text-content-primary">{title}</h3>
         <span className="inline-flex shrink-0 items-center rounded-full border border-content-disabled/25 px-[11px] py-[3px] text-ds-small text-ink-800">{chip}</span>
      </div>
      {children}
   </section>
);

const Legend: React.FC<{ items: [string, string][] }> = ({ items }) => (
   <div className="flex flex-wrap gap-4 text-ds-small text-content-secondary">
      {items.map(([dot, label]) => (
         <span key={label} className="flex items-center gap-1.5"><span className={`size-2.5 rounded-full ${dot}`} />{label}</span>
      ))}
   </div>
);

interface BarDatum { label: string; value: number; done?: number; revenue?: number }

// Vertical bars (Figma Patients Status / Busiest Day / Overall Status): #f6f6f6 bars, the highlighted one stacked
// Completed (primary-950) under Consultations (primary-500) with a dark value tag above it.
const VBars: React.FC<{ data: BarDatum[]; highlight?: number; height: number; tones?: string[]; format: (d: BarDatum) => string }> = ({ data, highlight, height, tones, format }) => {
   const max = Math.max(1, ...data.map(d => d.value));
   return (
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: height + 28 }} role="img" aria-label={data.map(d => `${d.label} ${d.value}`).join(', ')}>
         {data.map((d, i) => {
            const h = Math.max(6, (d.value / max) * height);
            const hot = i === highlight;
            const doneShare = d.value > 0 && d.done != null ? d.done / d.value : 0;
            return (
               <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full max-w-[36px] flex-col justify-end" style={{ height }}>
                     {(hot || tones) && d.value > 0 && (
                        <span className="absolute left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-950 px-1.5 py-0.5 text-[8px] text-white" style={{ bottom: h + 6 }}>{format(d)}</span>
                     )}
                     {tones ? (
                        <div className={`w-full rounded-t-md ${tones[i]}`} style={{ height: h }} />
                     ) : hot ? (
                        <div className="flex w-full flex-col overflow-hidden rounded-t-md" style={{ height: h }}>
                           <div className="w-full bg-primary-500" style={{ height: `${(1 - doneShare) * 100}%`, minHeight: 6 }} />
                           <div className="w-full flex-1 bg-primary-950" />
                        </div>
                     ) : (
                        <div className="w-full rounded-t-md bg-ink-100" style={{ height: h }} title={format(d)} />
                     )}
                  </div>
                  <span className={`truncate text-ds-small ${hot ? 'text-content-primary' : 'text-content-tertiary'}`}>{d.label}</span>
               </div>
            );
         })}
      </div>
   );
};

// Horizontal bars (Figma Peak Hours): hour labels left, #f6f6f6 bars, the busiest hour in primary.
const HBars: React.FC<{ data: BarDatum[] }> = ({ data }) => {
   if (data.length === 0) return <p className="py-10 text-center text-ds-body text-content-tertiary">No visits in this period.</p>;
   const max = Math.max(1, ...data.map(d => d.value));
   const hot = argMax(data.map(d => d.value));
   return (
      <div className="flex flex-col gap-2" role="img" aria-label={data.map(d => `${d.label}: ${d.value}`).join(', ')}>
         {data.map((d, i) => (
            <div key={d.label} className="flex items-center gap-3">
               <span className={`w-14 shrink-0 text-ds-small ${i === hot ? 'text-content-primary' : 'text-content-tertiary'}`}>{d.label}</span>
               <div className="h-9 min-w-0 flex-1">
                  <div className={`flex h-full items-center justify-end rounded-md pr-2 text-[10px] ${i === hot ? 'bg-primary-500 text-white' : 'bg-ink-100 text-content-tertiary'}`} style={{ width: `${Math.max(8, (d.value / max) * 100)}%` }}>
                     {d.value}
                  </div>
               </div>
            </div>
         ))}
      </div>
   );
};

// Figma Patient card: count + percentage pill (dark for new, primary-50 for old).
const PatientSplit: React.FC<{ label: string; count: number; pct: number; dark?: boolean }> = ({ label, count, pct, dark }) => (
   <div className="flex flex-col gap-3">
      <div className="flex flex-col items-end">
         <span className="text-ds-small text-content-secondary">{label}</span>
         <span className="text-ds-title-20 text-content-primary">{count}</span>
      </div>
      <span className={`flex h-[23px] items-center rounded-full px-2 text-ds-small ${dark ? 'bg-primary-950 text-white' : 'bg-primary-50 text-primary-600'}`} style={{ width: `${Math.max(34, pct)}%` }}>{pct}%</span>
   </div>
);
