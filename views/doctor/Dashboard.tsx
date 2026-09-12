
import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Building2, ChevronDown } from 'lucide-react';
import { DoctorDashboardProfile } from '../../components/ui/DoctorDashboardProfile';
import { ArcGauge } from '../../components/ui/ArcGauge';
import { DoctorStorage, fetchAppointmentCountInRange } from '../../storage';
import { Appointment } from '../../types';

import { getLocalISODate } from '../../utils/date';
import { compareTimeStrings } from '../../utils/timeComparison';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';

interface DoctorDashboardProps {
  onNavigate?: (path: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate }) => {
  const doctor = DoctorStorage.get();
  const doctorId = doctor?.id;
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [monthCount, setMonthCount] = useState(0);
  const [progressionPct, setProgressionPct] = useState<number | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const today = getLocalISODate();

  const fetchData = async () => {
    if (!doctorId) return;
    setIsResolving(true);

    try {
      const { fetchDoctorChambers, fetchAppointments } = await import('../../storage');
      const chambers = await fetchDoctorChambers(doctorId);
      const allTodayApps = await fetchAppointments({ doctorId, date: today });
      setAppointments(allTodayApps);

      if (!chambers || chambers.length === 0) {
        setHospitals([]);
        setSelectedHospitalId(null);
        setIsResolving(false);
        return;
      }

      setHospitals(chambers);

      // Dynamic selection logic
      const todayWeekday = new Date().getDay(); // 0-6
      const scheduledToday = chambers.filter((c: any) =>
        c.schedule && c.schedule.some((s: any) => s.day === todayWeekday)
      );

      if (scheduledToday.length === 0) {
        setSelectedHospitalId(null);
      } else if (scheduledToday.length === 1) {
        setSelectedHospitalId(scheduledToday[0].id);
      } else {
        // Multiple matches: Pick by earliest appointment or highest waiting count
        const doctorTodayApps = allTodayApps.filter(
          app => String(app.doctorId) === String(doctorId) && app.date === today
        );

        let bestMatchId = scheduledToday[0].id;
        let minTime = "11:59 PM";
        let maxWaiting = -1;

        scheduledToday.forEach((chamber: any) => {
          const chamberApps = doctorTodayApps.filter(a => String(a.hospitalId) === String(chamber.id));
          const waiting = chamberApps.filter(a => a.status === 'waiting').length;

          // Sort apps by time to find the earliest
          const sortedApps = [...chamberApps].sort((a, b) => compareTimeStrings(a.time, b.time));
          const earliestTime = sortedApps.length > 0 ? sortedApps[0].time : "11:59 PM";

          if (compareTimeStrings(earliestTime, minTime) < 0) {
            minTime = earliestTime;
            bestMatchId = chamber.id;
            maxWaiting = waiting;
          } else if (compareTimeStrings(earliestTime, minTime) === 0) {
            if (waiting > maxWaiting) {
              maxWaiting = waiting;
              bestMatchId = chamber.id;
            }
          }
        });
        setSelectedHospitalId(bestMatchId);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    if (!doctor) {
      if (onNavigate) {
        onNavigate('/doctor-login');
      } else {
        window.location.href = '/doctor-login';
      }
      return;
    }

    fetchData();
  }, [doctorId, onNavigate, today]);

  // This-month vs. last-month appointment volume, for the "Progression" stat.
  useEffect(() => {
    if (!doctorId) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

    (async () => {
      const [thisMonth, lastMonth] = await Promise.all([
        fetchAppointmentCountInRange(doctorId, selectedHospitalId, monthStart, today),
        fetchAppointmentCountInRange(doctorId, selectedHospitalId, lastMonthStart, lastMonthEnd),
      ]);
      setMonthCount(thisMonth);
      setProgressionPct(lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null);
    })();
  }, [doctorId, selectedHospitalId, today]);

  // Close the hospital switcher on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setIsSwitcherOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!doctor) return null;

  // 1. All Today's Appointments for this Doctor (Global Scope)
  const doctorTodayAppointments = appointments;

  // 2. Filtered Appointments (Strict Hospital Scope)
  const filteredAppointments = selectedHospitalId
    ? doctorTodayAppointments.filter(app => String(app.hospitalId) === String(selectedHospitalId))
    : [];

  // STATISTICS (Strictly Scoped to filteredAppointments)
  const activeFiltered = filteredAppointments.filter(a => a.status !== 'cancelled');
  const totalPatients = activeFiltered.length;
  const waitingCount = filteredAppointments.filter(a => a.status === 'waiting').length;
  const consultingCount = filteredAppointments.filter(a => a.status === 'consulting').length;
  const finishedCount = filteredAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length;
  const revenueTotal = filteredAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.fee || 0), 0);
  const potentialRevenueTotal = activeFiltered.reduce((sum, a) => sum + (a.fee || 0), 0);
  const queueProgress = totalPatients > 0 ? finishedCount / totalPatients : 0;

  const selectedHospitalName = hospitals.find((h: any) => String(h.id) === String(selectedHospitalId))?.hospitalName;

  return (
    <div className="space-y-8 pb-10 animate-fade-in max-w-6xl mx-auto px-4 md:px-0">
      {onNavigate && <DoctorTabBar currentPath="/doctor/dashboard" onNavigate={onNavigate} />}

      {/* SECTION 1: DOCTOR PROFILE HEADER */}
      <div className="space-y-6">
        {/* Doctor Header Section */}
        <DoctorDashboardProfile
          doctor={{
            name: doctor.name || doctor.full_name,
            specialty: doctor.specialty,
            bmdcNumber: doctor.bmdcNumber || doctor.bmdc_number,
            image: doctor.image || doctor.image_url,
            hospitalName: selectedHospitalId ? selectedHospitalName : 'Main Chamber',
            experience: doctor.experience_years || doctor.experience || 0,
            rating: doctor.rating || 5.0,
            totalPatients: doctor.total_patients || 0
          }}
          onManageClick={() => onNavigate?.('/doctor/practice-settings')}
        />

        {/* WELCOME + HOSPITAL SWITCHER — matches the Figma "Doctor Overview" header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink-800">Welcome</h2>
            <p className="text-ink-500 text-sm mt-1">Track your queue and arrive on time</p>
          </div>

          {hospitals.length > 0 && (
            <div className="relative shrink-0" ref={switcherRef}>
              <button
                onClick={() => setIsSwitcherOpen(o => !o)}
                className="flex items-center gap-3 bg-white pl-4 pr-3 py-2.5 rounded-full shadow-ds-card border border-slate-100 font-bold text-sm text-ink-800"
              >
                <span className="truncate max-w-[140px]">{selectedHospitalName || 'Select Hospital'}</span>
                <span className="w-7 h-7 rounded-full bg-medical-500 text-white flex items-center justify-center shrink-0">
                  <ChevronDown size={14} className={`transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {isSwitcherOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {hospitals.map((h: any) => {
                    const hospApps = doctorTodayAppointments.filter(a => String(a.hospitalId) === String(h.id) && a.status !== 'cancelled');
                    const isActive = String(h.id) === String(selectedHospitalId);
                    return (
                      <button
                        key={h.id}
                        onClick={() => { setSelectedHospitalId(h.id); setIsSwitcherOpen(false); }}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-bold transition-colors ${isActive ? 'bg-medical-50 text-medical-600' : 'text-ink-600 hover:bg-ink-50'}`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Building2 size={14} className="shrink-0" />
                          <span className="truncate">{h.hospitalName}</span>
                        </span>
                        <span className="shrink-0 text-xs font-black">{hospApps.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* QUEUE MANAGE ROW — Appointments / Queue Status / Earning, matching Figma's "Doctor Overview" layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)] gap-4">
          {/* Appointments stat row */}
          <div className="bg-white rounded-[32px] p-6 shadow-ds-soft">
            <h3 className="font-display text-xl text-ink-800 mb-4">Appointments</h3>
            <div className="flex items-center divide-x divide-slate-100">
              <div className="flex-1 pr-6">
                <p className="font-stat text-4xl md:text-5xl font-medium text-medical-600 tracking-tight">
                  {isResolving ? <div className="w-16 h-10 bg-slate-50 animate-pulse rounded-lg" /> : totalPatients}
                </p>
                <p className="text-xs text-ink-500 mt-1">Today</p>
              </div>
              <div className="flex-1 px-6">
                <p className="font-stat text-4xl md:text-5xl font-medium text-medical-600 tracking-tight">
                  {isResolving ? <div className="w-16 h-10 bg-slate-50 animate-pulse rounded-lg" /> : monthCount}
                </p>
                <p className="text-xs text-ink-500 mt-1">This Month</p>
              </div>
              <div className="flex-1 pl-6">
                <p className={`font-stat text-4xl md:text-5xl font-medium tracking-tight flex items-center gap-1.5 ${progressionPct != null && progressionPct < 0 ? 'text-red-500' : 'text-medical-600'}`}>
                  {progressionPct == null ? '—' : `${progressionPct > 0 ? '+' : ''}${progressionPct}%`}
                  {progressionPct != null && (progressionPct < 0 ? <TrendingDown size={22} /> : <TrendingUp size={22} />)}
                </p>
                <p className="text-xs text-ink-500 mt-1">Progression</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Queue Status arc gauge */}
            <div className="bg-white rounded-3xl p-5 shadow-ds-soft">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-xl text-ink-800">Queue Status</h3>
                <span className="text-[10px] font-bold text-ink-500 border border-slate-200 rounded-full px-3 py-1">Today</span>
              </div>
              <div className="flex items-center gap-6">
                <ArcGauge progress={queueProgress} size={170} />
                <div className="flex-1 space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-ink-600 min-w-0"><span className="w-2.5 h-2.5 rounded-full bg-medical-800 shrink-0" />Completed</span>
                    <span className="font-bold text-ink-700 shrink-0">{finishedCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-ink-600 min-w-0"><span className="w-2.5 h-2.5 rounded-full bg-medical-400 shrink-0" />In Consultation</span>
                    <span className="font-bold text-ink-700 shrink-0">{consultingCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-ink-600 min-w-0"><span className="w-2.5 h-2.5 rounded-full bg-medical-100 shrink-0" />Waiting</span>
                    <span className="font-bold text-ink-700 shrink-0">{waitingCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Earning */}
            <div className="bg-white rounded-3xl p-5 shadow-ds-soft flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl text-ink-800">Earning</h3>
                <span className="text-[10px] font-bold text-ink-500 border border-slate-200 rounded-full px-3 py-1">Today</span>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-ink-600"><span className="w-2.5 h-2.5 rounded-full bg-medical-500" />Earned</span>
                  {isResolving ? <div className="w-12 h-4 bg-slate-50 animate-pulse rounded" /> : <span className="font-bold text-ink-700">৳{revenueTotal}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-ink-600"><span className="w-2.5 h-2.5 rounded-full bg-ink-200" />Potential (if all completed)</span>
                  {isResolving ? <div className="w-12 h-4 bg-slate-50 animate-pulse rounded" /> : <span className="font-bold text-ink-700">৳{potentialRevenueTotal}</span>}
                </div>
              </div>
              <div className="w-full bg-ink-100 rounded-full h-2 mt-4">
                <div className="bg-medical-500 h-2 rounded-full transition-all" style={{ width: `${potentialRevenueTotal > 0 ? Math.min(100, (revenueTotal / potentialRevenueTotal) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
