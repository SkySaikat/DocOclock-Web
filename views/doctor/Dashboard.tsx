
import React, { useEffect, useState } from 'react';
import { DoctorDashboardProfile } from '../../components/ui/DoctorDashboardProfile';
import { HospitalSwitcher } from '../../components/doctor/overview/HospitalSwitcher';
import { AppointmentsCard } from '../../components/doctor/overview/AppointmentsCard';
import { QueueStatusCard } from '../../components/doctor/overview/QueueStatusCard';
import { EarningCard } from '../../components/doctor/overview/EarningCard';
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
      // One decimal, like Figma's "-10.4%" (was rounded to a whole percent).
      setProgressionPct(lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : null);
    })();
  }, [doctorId, selectedHospitalId, today]);

  // The hospital switcher (open / close / outside click / Esc) lives in <HospitalSwitcher/>.

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
    // Figma "Doctor Overview" (339:17421 / phone 572:25777): Welcome header + hospital pill, then the Queue Manage Row.
    // Page background + gutters come from Layout; root font is Instrument Sans (Inter only where the spec says so).
    <div className="flex animate-fade-in flex-col gap-6 font-display">
      {onNavigate && <DoctorTabBar currentPath="/doctor/dashboard" onNavigate={onNavigate} />}

      {/* DASHBOARD HEADER — "Welcome" + subtitle (desktop) and the hospital switcher pill (absolute at the right on desktop, beside the title on phone) */}
      {/* While the chambers load the pill is not rendered yet; on phone the row reserves its 66px so the cards below do not jump when it appears.
          Phone: "Welcome" keeps its width and the pill takes the rest up to Figma's 225px, so on 360px screens (Layout gutters are 24, Figma's 16) the name truncates instead of the pill covering the title. */}
      <div className={`relative flex items-center justify-between gap-x-[10px] lg:block ${isResolving ? 'min-h-[66px] lg:min-h-0' : ''}`}>
        <div className="flex shrink-0 flex-col justify-center gap-2 lg:h-[72px]">
          <h1 className="font-display text-[24px] font-normal leading-[normal] text-ink-800 lg:text-ds-h36">Welcome</h1>
          {/* Figma #8a94a3 has no token; `steel` is the established stand-in (see IconButtons). */}
          <p className="hidden w-[380px] max-w-full font-display text-ds-paragraph text-steel lg:block">Track Your Queue and arrive on time</p>
        </div>

        {hospitals.length > 0 && (
          <HospitalSwitcher
            className="min-w-0 max-w-[225px] flex-1 lg:absolute lg:right-0 lg:top-[11px] lg:max-w-none lg:flex-none"
            hospitals={hospitals}
            selectedId={selectedHospitalId}
            selectedName={selectedHospitalName}
            getCount={id => doctorTodayAppointments.filter(a => String(a.hospitalId) === id && a.status !== 'cancelled').length}
            onSelect={setSelectedHospitalId}
          />
        )}
      </div>

      {/* QUEUE MANAGE ROW — profile card | Appointments, Queue Status, Earning */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
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
          onProfileClick={() => onNavigate?.('/doctor/profile')}
        />

        <div className="flex min-w-0 flex-col gap-4 lg:max-w-[896px] lg:flex-1">
          <AppointmentsCard today={totalPatients} month={monthCount} progressionPct={progressionPct} loading={isResolving} />

          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start">
            <QueueStatusCard
              completed={finishedCount}
              consulting={consultingCount}
              waiting={waitingCount}
              total={totalPatients}
              className="lg:w-[536px] lg:max-w-full"
            />
            {/* Figma: the card fills what the 536px Queue Status card leaves (344px at 1440). It shrinks to 240px, then wraps under Queue Status (still at most 344px wide). */}
            <EarningCard earned={revenueTotal} total={potentialRevenueTotal} loading={isResolving} className="lg:min-w-[240px] lg:max-w-[344px] lg:flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
