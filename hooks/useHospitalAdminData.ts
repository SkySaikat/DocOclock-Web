import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import bcrypt from 'bcryptjs';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contact_info: string;
}

export interface HospitalAnalyticsData {
  revenueTrend: { day: string; amount: number }[];
  peakHours: { hour: string; value: number }[];
  demographics: { group: string; percentage: number }[];
  statusBreakdown: { status: string; count: number }[];
}

const AGE_GROUPS: { label: string; min: number; max: number }[] = [
  { label: '0-18 yrs', min: 0, max: 18 },
  { label: '19-35 yrs', min: 19, max: 35 },
  { label: '36-60 yrs', min: 36, max: 60 },
  { label: '60+ yrs', min: 61, max: Infinity },
];

function computeHospitalAnalytics(rows: { fee: number | null; status: string; appointment_date: string; appointment_time: string; patient_age: number | null }[]): HospitalAnalyticsData {
  // Revenue trend — last 7 calendar days, completed appointments only.
  const today = new Date();
  const last7Days: string[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const revenueByDay = new Map<string, number>(last7Days.map(d => [d, 0]));
  rows.forEach(r => {
    if (r.status === 'completed' && revenueByDay.has(r.appointment_date)) {
      revenueByDay.set(r.appointment_date, (revenueByDay.get(r.appointment_date) || 0) + (r.fee || 0));
    }
  });
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const revenueTrend = last7Days.map(d => ({
    day: dayLabels[new Date(d).getDay()],
    amount: revenueByDay.get(d) || 0,
  }));

  // Peak hours — non-cancelled appointments bucketed by hour, as % of the busiest hour.
  const hourCounts = new Map<string, number>();
  rows.forEach(r => {
    if (r.status === 'cancelled' || !r.appointment_time) return;
    const hour = r.appointment_time.split(':')[0] + (r.appointment_time.includes('PM') ? ' PM' : ' AM');
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  const maxHourCount = Math.max(1, ...Array.from(hourCounts.values()));
  const peakHours = Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, value: Math.round((count / maxHourCount) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Demographics — patient age buckets (from appointments.patient_age), share of appointments with a known age.
  const ageCounts = AGE_GROUPS.map(() => 0);
  let knownAgeCount = 0;
  rows.forEach(r => {
    if (r.patient_age == null) return;
    const idx = AGE_GROUPS.findIndex(g => r.patient_age! >= g.min && r.patient_age! <= g.max);
    if (idx >= 0) { ageCounts[idx] += 1; knownAgeCount += 1; }
  });
  const demographics = AGE_GROUPS.map((g, i) => ({
    group: g.label,
    percentage: knownAgeCount > 0 ? Math.round((ageCounts[i] / knownAgeCount) * 100) : 0,
  }));

  // Status breakdown — for a simple appointments-by-status donut.
  const statusCounts = new Map<string, number>();
  rows.forEach(r => statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1));
  const statusBreakdown = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  return { revenueTrend, peakHours, demographics, statusBreakdown };
}

export const useHospitalAdminData = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [doctorRequests, setDoctorRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalVisits: 0, averageRating: 0, totalDoctors: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<HospitalAnalyticsData>({
    revenueTrend: [], peakHours: [], demographics: [], statusBreakdown: [],
  });

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const { data: hospData, error: hospErr } = await supabase
        .from('hospitals')
        .select('*')
        .eq('owner_id', profile.id)
        .single();

      if (hospErr && hospErr.code !== 'PGRST116') throw hospErr;
      if (!hospData) { setLoading(false); return; }

      setHospital(hospData);

      // Parallel fetch
      const [rosterData, branchData, sectorData, requestData] = await Promise.all([
        supabase.from('doctor_hospitals').select(`
          doctor_id, branch_id, sector_id,
          profiles:doctor_id (id, full_name, specialty, phone, image_url, rating)
        `).eq('hospital_id', hospData.id),

        supabase.from('hospital_branches').select(`
          *, manager:manager_id (id, full_name, email)
        `).eq('hospital_id', hospData.id).order('created_at', { ascending: false }),

        supabase.from('hospital_sectors').select('*').eq('hospital_id', hospData.id).order('name'),

        supabase.from('chamber_requests').select(`
          *,
          doctor:doctor_id (id, full_name, specialty, email, bmdc_number, image_url),
          branch:branch_id (id, name),
          sector:sector_id (id, name)
        `).eq('hospital_id', hospData.id).eq('status', 'pending').order('created_at', { ascending: false }),
      ]);

      setBranches(branchData.data || []);
      setSectors(sectorData.data || []);
      setDoctorRequests(requestData.data || []);

      const doctors = (rosterData.data || []).map(r => r.profiles).filter(Boolean) as any[];
      const doctorIds = doctors.map((d: any) => d.id);

      if (doctorIds.length > 0) {
        const { count: visitsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .in('doctor_id', doctorIds);

        const { data: statsData } = await supabase
          .from('appointments')
          .select('doctor_id, has_prescription, fee, status, appointment_date, appointment_time, patient_age')
          .in('doctor_id', doctorIds);

        const doctorStatsMap: Record<string, { patientCount: number; rxCount: number }> = {};
        statsData?.forEach((row: any) => {
          if (!doctorStatsMap[row.doctor_id]) doctorStatsMap[row.doctor_id] = { patientCount: 0, rxCount: 0 };
          doctorStatsMap[row.doctor_id].patientCount++;
          if (row.has_prescription) doctorStatsMap[row.doctor_id].rxCount++;
        });

        setAnalytics(computeHospitalAnalytics(statsData || []));

        const rosterRows = rosterData.data || [];
        const rosterWithStats = rosterRows.map((r: any) => {
          const doc = r.profiles as any;
          if (!doc) return null;
          return {
            ...doc,
            patientCount: doctorStatsMap[doc.id]?.patientCount || 0,
            rxCount: doctorStatsMap[doc.id]?.rxCount || 0,
            branch_id: r.branch_id,
            sector_id: r.sector_id,
          };
        }).filter(Boolean);

        setRoster(rosterWithStats);

        const avg = doctors.reduce((acc: number, doc: any) => acc + (doc.rating || 5.0), 0) / doctors.length;
        setStats({ totalVisits: visitsCount || 0, averageRating: Number(avg.toFixed(1)), totalDoctors: doctors.length });

        const { data: revData } = await supabase
          .from('reviews')
          .select(`*, patient:patient_id (full_name), doctor:doctor_id (full_name, specialty)`)
          .in('doctor_id', doctorIds)
          .order('created_at', { ascending: false })
          .limit(20);

        setReviews(revData || []);
      }
    } catch (error) {
      console.error('Failed to load hospital admin data', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // ─── Roster ───────────────────────────────────────────────────────────────

  const searchDoctors = async (query: string) => {
    if (!query || query.length < 3) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, specialty, bmdc_number, image_url')
      .eq('role', 'DOCTOR')
      .eq('registration_status', 'approved')
      .or(`full_name.ilike.%${query}%,bmdc_number.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const addDoctorToRoster = async (doctorId: string) => {
    if (!hospital?.id) return { success: false, error: 'No hospital configured' };
    try {
      await supabase.from('doctor_hospitals').insert([{ doctor_id: doctorId, hospital_id: hospital.id, is_active: true }]);
      const { data: newChamber } = await supabase.from('chambers').insert([{
        doctor_id: doctorId,
        hospital_name: hospital.name,
        address: hospital.address,
        consultation_fee: 1000,
        linked_hospital_id: hospital.id,
        status: 'active',
      }]).select('id').single();
      if (newChamber) {
        await supabase.from('schedules').insert([
          { chamber_id: newChamber.id, day_of_week: 'Sunday',   start_time: '17:00', end_time: '20:00', max_patients: 20 },
          { chamber_id: newChamber.id, day_of_week: 'Tuesday',  start_time: '17:00', end_time: '20:00', max_patients: 20 },
          { chamber_id: newChamber.id, day_of_week: 'Thursday', start_time: '17:00', end_time: '20:00', max_patients: 20 },
        ]);
      }
      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ─── Branches ─────────────────────────────────────────────────────────────

  const createBranch = async (name: string, address: string, contactInfo?: string) => {
    if (!hospital?.id) return { success: false, error: 'No hospital' };
    try {
      const { error } = await supabase.from('hospital_branches').insert([{
        hospital_id: hospital.id, name, address, contact_info: contactInfo || ''
      }]);
      if (error) throw error;
      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const assignBranchManager = async (branchId: string, email: string, fullName: string, password: string) => {
    try {
      const hashed = await bcrypt.hash(password, 10);
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      let managerId: string;
      if (existing) {
        await supabase.from('profiles').update({ role: 'BRANCH_MANAGER', registration_status: 'approved', full_name: fullName, password: hashed, branch_id: branchId }).eq('id', existing.id);
        managerId = existing.id;
      } else {
        const { data, error } = await supabase.from('profiles').insert([{
          full_name: fullName, email, role: 'BRANCH_MANAGER', password: hashed,
          registration_status: 'approved', branch_id: branchId
        }]).select('id').single();
        if (error) throw error;
        managerId = data.id;
      }
      await supabase.from('hospital_branches').update({ manager_id: managerId }).eq('id', branchId);
      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ─── Sectors ──────────────────────────────────────────────────────────────

  const createSector = async (name: string, branchId?: string) => {
    if (!hospital?.id) return { success: false, error: 'No hospital' };
    try {
      const { error } = await supabase.from('hospital_sectors').insert([{
        hospital_id: hospital.id, branch_id: branchId || null, name
      }]);
      if (error) throw error;
      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ─── Doctor Requests ──────────────────────────────────────────────────────

  const approveRequest = async (requestId: string) => {
    try {
      const req = doctorRequests.find(r => r.id === requestId);
      if (!req) throw new Error('Request not found');

      await supabase.from('chamber_requests').update({
        status: 'approved',
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId);

      // Create chamber
      await supabase.from('chambers').insert([{
        doctor_id: req.doctor_id,
        hospital_name: hospital?.name || '',
        address: req.branch?.address || hospital?.address || '',
        consultation_fee: req.proposed_fee || 1000,
        linked_hospital_id: hospital?.id,
        branch_id: req.branch_id || null,
        sector_id: req.sector_id || null,
        request_id: requestId,
        status: 'active',
      }]);

      // Upsert doctor_hospitals
      await supabase.from('doctor_hospitals').upsert([{
        doctor_id: req.doctor_id,
        hospital_id: hospital?.id,
        branch_id: req.branch_id || null,
        sector_id: req.sector_id || null,
        is_active: true,
      }], { onConflict: 'doctor_id,hospital_id' });

      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const rejectRequest = async (requestId: string, note: string) => {
    try {
      await supabase.from('chamber_requests').update({
        status: 'rejected',
        note,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId);
      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    hospital,
    roster,
    branches,
    sectors,
    doctorRequests,
    stats,
    analytics,
    reviews,
    searchResults,
    searchDoctors,
    addDoctorToRoster,
    createBranch,
    assignBranchManager,
    createSector,
    approveRequest,
    rejectRequest,
    refreshData: fetchDashboardData,
  };
};
