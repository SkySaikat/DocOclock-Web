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
          .select('doctor_id, has_prescription')
          .in('doctor_id', doctorIds);

        const doctorStatsMap: Record<string, { patientCount: number; rxCount: number }> = {};
        statsData?.forEach((row: any) => {
          if (!doctorStatsMap[row.doctor_id]) doctorStatsMap[row.doctor_id] = { patientCount: 0, rxCount: 0 };
          doctorStatsMap[row.doctor_id].patientCount++;
          if (row.has_prescription) doctorStatsMap[row.doctor_id].rxCount++;
        });

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
