import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';

export interface GrowthPoint { date: string; patients: number; doctors: number; }
export interface RevenuePoint { date: string; revenue: number; }
export interface ApprovalFunnel { pending: number; approved: number; rejected: number; }
export interface StatusSlice { status: string; count: number; }
export interface SpecialtySlice { specialty: string; count: number; }
export interface HospitalLeaderboardRow { name: string; appointments: number; revenue: number; }

export interface SuperAdminAnalyticsData {
  growth: GrowthPoint[];
  revenueTrend: RevenuePoint[];
  approvalFunnel: ApprovalFunnel;
  statusBreakdown: StatusSlice[];
  specialtyBreakdown: SpecialtySlice[];
  hospitalLeaderboard: HospitalLeaderboardRow[];
  repeatBookingRate: number; // % of patients with >1 completed appointment in the window
  estimatedRevenueTotal: number;
}

const EMPTY: SuperAdminAnalyticsData = {
  growth: [],
  revenueTrend: [],
  approvalFunnel: { pending: 0, approved: 0, rejected: 0 },
  statusBreakdown: [],
  specialtyBreakdown: [],
  hospitalLeaderboard: [],
  repeatBookingRate: 0,
  estimatedRevenueTotal: 0,
};

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export type AnalyticsRange = 7 | 30 | 90;

export const useSuperAdminAnalytics = (rangeDays: AnalyticsRange = 30) => {
  const [data, setData] = useState<SuperAdminAnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = isoDateNDaysAgo(rangeDays);
      const todayIso = new Date().toISOString().slice(0, 10);

      const [profilesRes, appointmentsRes, doctorProfilesRes, chambersRes] = await Promise.all([
        // Signups in range, for the growth chart + approval funnel.
        supabase.from('profiles').select('role, registration_status, created_at').gte('created_at', startDate),
        // Appointments in range, for revenue/status/specialty/repeat-rate/leaderboard.
        supabase.from('appointments').select('doctor_id, hospital_id, hospital_name, fee, status, appointment_date, patient_id').gte('appointment_date', startDate).lte('appointment_date', todayIso),
        // All doctors (for specialty lookup — small enough table to fetch fully; not range-bound).
        supabase.from('profiles').select('id, specialty').eq('role', 'DOCTOR'),
        // Chambers (for the hospital leaderboard's display name).
        supabase.from('chambers').select('id, hospital_name'),
      ]);

      const profiles = profilesRes.data || [];
      const appointments = appointmentsRes.data || [];
      const doctorSpecialtyById = new Map((doctorProfilesRes.data || []).map((d: any) => [d.id, d.specialty || 'General']));
      const chamberNameById = new Map((chambersRes.data || []).map((c: any) => [c.id, c.hospital_name]));

      // ── Growth (signups per day, patient vs doctor) ──────────────────────
      const growthByDay = new Map<string, { patients: number; doctors: number }>();
      profiles.forEach((p: any) => {
        if (p.role !== 'PATIENT' && p.role !== 'DOCTOR') return;
        const day = String(p.created_at).slice(0, 10);
        const entry = growthByDay.get(day) || { patients: 0, doctors: 0 };
        if (p.role === 'PATIENT') entry.patients += 1; else entry.doctors += 1;
        growthByDay.set(day, entry);
      });
      const growth = Array.from(growthByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));

      // ── Doctor approval funnel (all-time, not range-bound — a pipeline snapshot) ──
      const approvalFunnel = { pending: 0, approved: 0, rejected: 0 };
      // Re-derive from a fresh, all-time doctor fetch so the funnel isn't
      // artificially limited to the selected date range.
      const { data: allDoctors } = await supabase.from('profiles').select('registration_status').eq('role', 'DOCTOR');
      (allDoctors || []).forEach((d: any) => {
        if (d.registration_status === 'pending') approvalFunnel.pending += 1;
        else if (d.registration_status === 'approved') approvalFunnel.approved += 1;
        else if (d.registration_status === 'rejected') approvalFunnel.rejected += 1;
      });

      // ── Revenue trend + total (completed appointments only) ──────────────
      const revenueByDay = new Map<string, number>();
      let estimatedRevenueTotal = 0;
      appointments.forEach((a: any) => {
        if (a.status !== 'completed') return;
        const fee = a.fee || 0;
        estimatedRevenueTotal += fee;
        revenueByDay.set(a.appointment_date, (revenueByDay.get(a.appointment_date) || 0) + fee);
      });
      const revenueTrend = Array.from(revenueByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue }));

      // ── Appointment status breakdown ──────────────────────────────────────
      const statusCounts = new Map<string, number>();
      appointments.forEach((a: any) => statusCounts.set(a.status, (statusCounts.get(a.status) || 0) + 1));
      const statusBreakdown = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

      // ── Specialty breakdown (top 8) ────────────────────────────────────────
      const specialtyCounts = new Map<string, number>();
      appointments.forEach((a: any) => {
        const specialty = doctorSpecialtyById.get(a.doctor_id) || 'General';
        specialtyCounts.set(specialty, (specialtyCounts.get(specialty) || 0) + 1);
      });
      const specialtyBreakdown = Array.from(specialtyCounts.entries())
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // ── Hospital/chamber leaderboard (top 10 by appointment volume) ───────
      const hospitalAgg = new Map<string, { appointments: number; revenue: number }>();
      appointments.forEach((a: any) => {
        const name = chamberNameById.get(a.hospital_id) || a.hospital_name || 'Unknown';
        const entry = hospitalAgg.get(name) || { appointments: 0, revenue: 0 };
        entry.appointments += 1;
        if (a.status === 'completed') entry.revenue += (a.fee || 0);
        hospitalAgg.set(name, entry);
      });
      const hospitalLeaderboard = Array.from(hospitalAgg.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.appointments - a.appointments)
        .slice(0, 10);

      // ── Repeat booking rate proxy ───────────────────────────────────────
      const completedByPatient = new Map<string, number>();
      appointments.forEach((a: any) => {
        if (a.status !== 'completed') return;
        completedByPatient.set(a.patient_id, (completedByPatient.get(a.patient_id) || 0) + 1);
      });
      const patientsWithVisit = completedByPatient.size;
      const repeatPatients = Array.from(completedByPatient.values()).filter(c => c > 1).length;
      const repeatBookingRate = patientsWithVisit > 0 ? Math.round((repeatPatients / patientsWithVisit) * 100) : 0;

      setData({
        growth, revenueTrend, approvalFunnel, statusBreakdown, specialtyBreakdown,
        hospitalLeaderboard, repeatBookingRate, estimatedRevenueTotal,
      });
    } catch (error) {
      console.error('Failed to load super admin analytics', error);
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, refresh: fetchAnalytics };
};
