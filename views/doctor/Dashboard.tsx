
import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { ArrowUpRight, Users, CreditCard, Activity, Clock, MapPin, BadgeCheck, AlertCircle, X, UserCheck, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { DoctorDashboardProfile } from '../../components/ui/DoctorDashboardProfile';
import { DoctorStorage, fetchDoctorAppointments, fetchDoctorAppointmentsByHospital } from '../../storage';
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
  const finishedCount = filteredAppointments.filter(a => a.status === 'completed').length;
  const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length;
  const revenueTotal = filteredAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.fee || 0), 0);

  const selectedHospitalName = hospitals.find((h: any) => String(h.id) === String(selectedHospitalId))?.hospitalName;

  return (
    <div className="space-y-8 pb-10 animate-fade-in max-w-6xl mx-auto px-4 md:px-0">

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

        {/* TODAY'S OVERVIEW SECTION */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Today's Overview</h3>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
              Live Updates
            </div>
          </div>

          <div className="grid gap-4">
            {/* Row 1: Primary (Full-width) */}
            <div className="w-full">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 flex items-center justify-between group hover:border-teal-200 transition-all shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                    <TrendingUp size={12} className="text-teal-500" /> Total Earnings
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                      {isResolving ? <div className="w-24 h-12 bg-slate-50 animate-pulse rounded-xl" /> : `৳${revenueTotal}`}
                    </span>
                    {!isResolving && <span className="text-xs font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-lg">Today</span>}
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/30 shadow-inner group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                  <CreditCard size={28} />
                </div>
              </div>
            </div>

            {/* Row 2: Secondary (2 Columns) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-7 flex flex-col justify-between hover:border-teal-200 transition-all shadow-[0_10px_40px_-15px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-teal-500 transition-colors"></div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Appointments</p>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-500 transition-all">
                    <Users size={16} />
                  </div>
                </div>
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {isResolving ? <div className="w-12 h-10 bg-slate-50 animate-pulse rounded-lg" /> : totalPatients}
                </h4>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-7 flex flex-col justify-between hover:border-teal-200 transition-all shadow-[0_10px_40px_-15px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waiting List</p>
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {isResolving ? <div className="w-12 h-10 bg-slate-50 animate-pulse rounded-lg" /> : waitingCount}
                  <span className="ml-2 text-[10px] text-orange-500 uppercase tracking-widest font-black">Active</span>
                </h4>
              </div>
            </div>

            {/* Row 3: Support (2 Columns - Smaller) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/40 border border-slate-100/80 rounded-[1.5rem] p-5 flex items-center gap-5 hover:bg-white hover:border-teal-100 transition-all transition-duration-500 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-teal-500 shadow-sm group-hover:scale-110 transition-transform">
                  <UserCheck size={18} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Completed</p>
                  <p className="text-2xl font-black text-slate-800 leading-none mt-1.5">{finishedCount}</p>
                </div>
              </div>

              <div className="bg-slate-50/40 border border-slate-100/80 rounded-[1.5rem] p-5 flex items-center gap-5 hover:bg-white hover:border-red-100 transition-all transition-duration-500 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-red-400 shadow-sm group-hover:scale-110 transition-transform">
                  <X size={18} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Cancelled</p>
                  <p className="text-2xl font-black text-slate-800 leading-none mt-1.5">{cancelledCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
