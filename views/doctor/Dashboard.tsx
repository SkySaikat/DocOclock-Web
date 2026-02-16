
import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { ArrowUpRight, Users, CreditCard, Activity, Clock, MapPin, BadgeCheck, AlertCircle, X, UserCheck, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { DoctorCard } from '../../components/ui/DoctorCard';
import { DoctorStorage, getDoctorAppointments, getDoctorAppointmentsByHospital } from '../../storage';
import { Appointment, AppointmentStatus } from '../../types';

import { getLocalISODate } from '../../utils/date';
import { compareTimeStrings } from '../../utils/timeComparison';

interface DoctorDashboardProps {
  onNavigate?: (path: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate }) => {
  const doctor = DoctorStorage.get();
  const doctorId = doctor?.id;
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [registryFilter, setRegistryFilter] = useState<'all' | AppointmentStatus>('all');
  const today = getLocalISODate();

  useEffect(() => {
    if (!doctor) {
      if (onNavigate) {
        onNavigate('/doctor-login');
      } else {
        window.location.href = '/doctor-login';
      }
      return;
    }

    const practiceKey = `doctor_practice_settings_${doctorId}`;
    const practiceSettingsRaw = localStorage.getItem(practiceKey);
    const practiceSettings = practiceSettingsRaw ? JSON.parse(practiceSettingsRaw) : null;

    if (!practiceSettings || !practiceSettings.chambers || practiceSettings.chambers.length === 0) {
      setHospitals([]);
      setSelectedHospitalId(null);
      setIsResolving(false);
      return;
    }

    const chambers = practiceSettings.chambers;
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
      const allAppointments: Appointment[] = JSON.parse(localStorage.getItem("demo_appointments") || "[]");
      const doctorTodayApps = allAppointments.filter(
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
    setIsResolving(false);
  }, [doctor, doctorId, onNavigate, today]);

  if (!doctor) return null;

  // READ DATA DIRECTLY
  const allAppointments: Appointment[] = JSON.parse(localStorage.getItem("demo_appointments") || "[]");

  // 1. All Today's Appointments for this Doctor (Global Scope)
  const doctorTodayAppointments = allAppointments.filter(
    app => String(app.doctorId) === String(doctor.id) && app.date === today
  );

  // 2. Filtered Appointments (Strict Hospital Scope)
  const filteredAppointments = selectedHospitalId
    ? doctorTodayAppointments.filter(app => String(app.hospitalId) === String(selectedHospitalId))
    : [];

  // STATISTICS (Strictly Scoped to filteredAppointments)
  const activeFiltered = filteredAppointments.filter(a => a.status !== 'cancelled');
  const totalPatients = activeFiltered.length;
  const waitingCount = filteredAppointments.filter(a => a.status === 'waiting').length;
  const finishedCount = filteredAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length;
  const revenueTotal = filteredAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.fee || 0), 0);

  // REGISTRY SPECIFIC FILTERING
  const registryAppointments = useMemo(() => {
    let list = [...filteredAppointments];
    if (registryFilter !== 'all') {
      list = list.filter(a => a.status === registryFilter);
    }
    return list.sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));
  }, [filteredAppointments, registryFilter]);

  const selectedHospitalName = hospitals.find((h: any) => String(h.id) === String(selectedHospitalId))?.hospitalName;

  return (
    <div className="space-y-8 pb-10 animate-fade-in">

      {/* SECTION 1: DOCTOR PROFILE HEADER */}
      <div className="space-y-6">
        {/* Doctor Header Section */}
        <DoctorCard
          doctor={{
            name: doctor.name,
            specialty: doctor.specialty,
            bmdcNumber: doctor.bmdcNumber,
            image: doctor.image,
            hospitalName: selectedHospitalId ? selectedHospitalName : 'Waiting for context...',
            experience: 12, // Mock data for now
            rating: 4.9,
            reviews: 120
          }}
          ctaLabel="Manage Settings"
          onCtaClick={() => onNavigate?.('/doctor/practice-settings')}
        />

        {/* Operational Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <StatCard
            label="Appointments"
            value={totalPatients}
            subValue="Today"
            icon={Users}
            color="blue"
            loading={isResolving}
          />
          <StatCard
            label="Cancelled"
            value={cancelledCount}
            subValue="This scope"
            icon={X}
            color="red"
            loading={isResolving}
          />
          <StatCard
            label="Revenue"
            value={`৳${revenueTotal}`}
            subValue="Earned"
            icon={CreditCard}
            color="teal"
            loading={isResolving}
          />
          <StatCard
            label="Remaining"
            value={waitingCount}
            subValue="Waiting"
            icon={Clock}
            color="orange"
            loading={isResolving}
          />
          <StatCard
            label="Completed"
            value={finishedCount}
            subValue="Consulted"
            icon={UserCheck}
            color="green"
            loading={isResolving}
          />
        </div>

        {/* Recent Appointments Registry Section */}
        <div className="bg-white rounded-[24px] shadow-soft border border-slate-100 p-6 space-y-6">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Today's Registry</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedHospitalId ? selectedHospitalName : "Patient List Overflow"}
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('/doctor/serial-manager')}
                className="px-4 py-2 bg-slate-50 text-blue-600 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-colors"
              >
                Manage Queue <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Scope Selector */}
              <div className="relative flex-1">
                <select
                  value={selectedHospitalId || ''}
                  onChange={(e) => setSelectedHospitalId(e.target.value || null)}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-4 focus:ring-medical-500/5 text-slate-700 transition-all"
                >
                  <option value="" disabled>Select Chamber Scope...</option>
                  {hospitals.map((hospital: any) => (
                    <option key={hospital.id} value={hospital.id}>{hospital.hospitalName}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <MapPin size={16} />
                </div>
              </div>

              {/* Filter Pills - Horizontally Scrollable */}
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide shrink-0">
                {(['all', 'waiting', 'completed', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setRegistryFilter(status)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                      ${registryFilter === status
                        ? "bg-slate-900 text-white border-slate-900 shadow-premium"
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isResolving ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Resolving Schedule...</p>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">No Chambers Configured</h1>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">Please go to Practice Settings to add your chambers and weekly schedule.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] bg-slate-50/50">
                    <th className="py-4 pl-4 rounded-l-2xl">Serial</th>
                    <th className="py-4">Patient Name</th>
                    <th className="py-4">Time Slot</th>
                    <th className="py-4">Status</th>
                    <th className="py-4 pr-4 rounded-r-2xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-sm">
                  {registryAppointments.length > 0 ? registryAppointments.slice(0, 10).map((row, i) => (
                    <tr key={i} className={`border-b border-slate-50 last:border-0 group ${row.status === 'cancelled' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                      <td className={`py-5 pl-4 font-black ${row.status === 'cancelled' ? 'text-slate-400' : 'text-blue-600'}`}>#{(row.serialNumber || 0).toString().padStart(2, '0')}</td>
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${row.status === 'cancelled' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-500'}`}>P</div>
                          <span className={`font-bold ${row.status === 'cancelled' ? 'text-slate-500' : 'text-slate-800'}`}>{row.patientName}</span>
                        </div>
                      </td>
                      <td className="py-5 font-bold text-slate-500">{row.time}</td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${row.status === 'waiting' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                          row.status === 'consulting' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            row.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
                              'bg-green-50 text-green-600 border-green-100'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-right">
                        {row.status !== 'cancelled' && (
                          <button onClick={() => onNavigate?.('/doctor/serial-manager')} className="text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-widest border border-slate-200 px-4 py-2 rounded-xl hover:border-blue-200 hover:bg-blue-50/50">Manage</button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                          </div>
                          <p className="text-slate-400 font-bold">No active chamber today</p>
                          <p className="text-[10px] text-slate-300 uppercase font-black">Select a chamber above to see appointments</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><AlertCircle size={16} /></div>
              <p className="text-[10px] font-bold text-slate-600 leading-tight">Live bookings reflect real-time hospital context. Filter scope to manage specific sessions.</p>
            </div>
            <Button onClick={() => onNavigate?.('/doctor/manual-booking')} className="w-full md:w-auto h-10 px-6 rounded-xl text-xs font-black shadow-none bg-slate-800">Add Walk-in</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
