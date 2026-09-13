import React, { useState } from 'react';
import { Users, Building, Calendar, Activity, TrendingUp, Stethoscope, Wallet, Repeat } from 'lucide-react';
import { useSuperAdminAnalytics, AnalyticsRange } from '../../hooks/useSuperAdminAnalytics';
import { useTheme } from '../../contexts/ThemeContext';
import { TrendAreaChart } from './charts/TrendAreaChart';
import { DonutStatusChart } from './charts/DonutStatusChart';
import { LeaderboardBar } from './charts/LeaderboardBar';

interface AnalyticsOverviewProps {
  stats: {
    totalUsers: number;
    totalDoctors: number;
    totalHospitals: number;
    totalAppointments: number;
  };
}

const RANGE_OPTIONS: { label: string; value: AnalyticsRange }[] = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-ds-md p-6 shadow-ds-soft flex items-center gap-5">
    <div className={`w-14 h-14 ${color} rounded-2xl flex flex-col items-center justify-center shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-ink-400 text-xs font-display font-black uppercase tracking-widest mb-1 truncate">{label}</p>
      <p className="text-3xl font-stat font-black text-ink-800 leading-none">{value}</p>
    </div>
  </div>
);

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ stats }) => {
  const [range, setRange] = useState<AnalyticsRange>(30);
  const { data, loading } = useSuperAdminAnalytics(range);
  const { colors: themeColors } = useTheme();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display font-black text-ink-800 text-lg">Platform Analytics</h2>
        <div className="flex bg-white p-1 rounded-xl shadow-ds-card border border-ink-100">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${range === opt.value ? 'bg-medical-600 text-white shadow-sm' : 'text-ink-500 hover:bg-medical-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Line Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-medical-50 text-medical-600" />
        <StatCard label="Doctors" value={stats.totalDoctors} icon={Stethoscope} color="bg-teal-50 text-teal-600" />
        <StatCard label="Hospitals" value={stats.totalHospitals} icon={Building} color="bg-sky-50 text-sky-600" />
        <StatCard label="Appointments" value={stats.totalAppointments} icon={Calendar} color="bg-orange-50 text-orange-600" />
        <StatCard label="Est. Revenue" value={`৳${data.estimatedRevenueTotal.toLocaleString()}`} icon={Wallet} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Repeat Rate" value={`${data.repeatBookingRate}%`} icon={Repeat} color="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Growth */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-display font-black text-ink-800 flex items-center gap-2">
                <TrendingUp className="text-medical-500" size={22} /> Platform Growth
              </h3>
              <p className="text-ink-400 font-bold text-sm">New patients vs. new doctors, per day</p>
            </div>
          </div>
          <TrendAreaChart
            data={data.growth}
            xKey="date"
            series={[{ dataKey: 'patients', name: 'Patients' }, { dataKey: 'doctors', name: 'Doctors' }]}
          />
        </div>

        {/* Appointment Status */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft">
          <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-2">
            <Activity className="text-medical-500" size={20} /> Appointment Status
          </h3>
          <p className="text-ink-400 font-bold text-xs mb-4">Selected period</p>
          <DonutStatusChart data={data.statusBreakdown} centerLabel="Total" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft">
          <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-1">
            <Wallet className="text-emerald-500" size={20} /> Estimated Revenue
          </h3>
          <p className="text-ink-400 font-bold text-xs mb-4">Sum of completed appointment fees — not a real payment gateway total, since none is integrated yet.</p>
          <TrendAreaChart data={data.revenueTrend} xKey="date" series={[{ dataKey: 'revenue', name: 'Revenue', color: themeColors.primaryColor }]} />
        </div>

        {/* Doctor approval funnel */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft">
          <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-6">
            <Stethoscope className="text-teal-500" size={20} /> Doctor Approval Pipeline
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Pending', value: data.approvalFunnel.pending, color: 'bg-amber-400' },
              { label: 'Approved', value: data.approvalFunnel.approved, color: 'bg-emerald-500' },
              { label: 'Rejected', value: data.approvalFunnel.rejected, color: 'bg-rose-500' },
            ].map(row => {
              const total = data.approvalFunnel.pending + data.approvalFunnel.approved + data.approvalFunnel.rejected;
              const pct = total > 0 ? (row.value / total) * 100 : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black text-ink-600">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                  <div className="w-full bg-ink-100 rounded-full h-2.5">
                    <div className={`${row.color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital leaderboard */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft">
          <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-6">
            <Building className="text-sky-500" size={20} /> Top Hospitals / Chambers
          </h3>
          <LeaderboardBar
            rows={data.hospitalLeaderboard.map(h => ({ name: h.name, value: h.appointments, meta: 'appts' }))}
            emptyLabel="No appointments in this period yet."
          />
        </div>

        {/* Specialty breakdown */}
        <div className="bg-white rounded-ds-xl p-8 shadow-ds-soft">
          <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-6">
            <Stethoscope className="text-violet-500" size={20} /> Appointments by Specialty
          </h3>
          <LeaderboardBar
            rows={data.specialtyBreakdown.map(s => ({ name: s.specialty, value: s.count }))}
            emptyLabel="No appointments in this period yet."
          />
        </div>
      </div>

      {loading && (
        <p className="text-center text-xs font-bold text-ink-400 uppercase tracking-widest">Refreshing analytics…</p>
      )}
    </div>
  );
};
