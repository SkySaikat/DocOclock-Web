import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

export const useBranchManagerData = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<any | null>(null);
  const [hospital, setHospital] = useState<any | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [doctorRequests, setDoctorRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDoctors: 0, pendingRequests: 0, totalVisits: 0 });

  const fetchData = useCallback(async () => {
    if (!profile?.branch_id) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Fetch branch + hospital
      const { data: branchData } = await supabase
        .from('hospital_branches')
        .select(`*, hospital:hospital_id (id, name, address)`)
        .eq('id', profile.branch_id)
        .single();

      if (!branchData) { setLoading(false); return; }
      setBranch(branchData);
      setHospital(branchData.hospital);

      // 2. Parallel fetches
      const [rosterData, sectorData, requestData] = await Promise.all([
        supabase.from('doctor_hospitals').select(`
          doctor_id, sector_id,
          profiles:doctor_id (id, full_name, specialty, phone, image_url, rating, bmdc_number)
        `).eq('branch_id', profile.branch_id),

        supabase.from('hospital_sectors').select('*').eq('branch_id', profile.branch_id).order('name'),

        supabase.from('chamber_requests').select(`
          *,
          doctor:doctor_id (id, full_name, specialty, email, bmdc_number, image_url),
          sector:sector_id (id, name)
        `).eq('branch_id', profile.branch_id).eq('status', 'pending').order('created_at', { ascending: false }),
      ]);

      setSectors(sectorData.data || []);
      setDoctorRequests(requestData.data || []);

      const doctors = (rosterData.data || []).map((r: any) => r.profiles).filter(Boolean);
      const doctorIds = doctors.map((d: any) => d.id);

      if (doctorIds.length > 0) {
        const { count: visitsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .in('doctor_id', doctorIds);

        const rosterRows = rosterData.data || [];
        const rosterWithMeta = rosterRows.map((r: any) => ({
          ...(r.profiles as any),
          sector_id: r.sector_id,
        })).filter(Boolean);

        setRoster(rosterWithMeta);
        setStats({
          totalDoctors: doctors.length,
          pendingRequests: requestData.data?.length || 0,
          totalVisits: visitsCount || 0,
        });
      } else {
        setRoster([]);
        setStats({ totalDoctors: 0, pendingRequests: requestData.data?.length || 0, totalVisits: 0 });
      }
    } catch (error) {
      console.error('Failed to load branch manager data', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.branch_id]);

  const approveRequest = async (requestId: string) => {
    try {
      const req = doctorRequests.find(r => r.id === requestId);
      if (!req) throw new Error('Request not found');

      await supabase.from('chamber_requests').update({
        status: 'approved',
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId);

      await supabase.from('chambers').insert([{
        doctor_id: req.doctor_id,
        hospital_name: hospital?.name || '',
        address: branch?.address || '',
        consultation_fee: req.proposed_fee || 1000,
        linked_hospital_id: hospital?.id,
        branch_id: branch?.id,
        sector_id: req.sector_id || null,
        request_id: requestId,
        status: 'active',
      }]);

      await supabase.from('doctor_hospitals').upsert([{
        doctor_id: req.doctor_id,
        hospital_id: hospital?.id,
        branch_id: branch?.id,
        sector_id: req.sector_id || null,
        is_active: true,
      }], { onConflict: 'doctor_id,hospital_id' });

      await fetchData();
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
      await fetchData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createSector = async (name: string) => {
    if (!branch || !hospital) return { success: false };
    try {
      const { error } = await supabase.from('hospital_sectors').insert([{
        hospital_id: hospital.id, branch_id: branch.id, name
      }]);
      if (error) throw error;
      await fetchData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return {
    loading,
    branch,
    hospital,
    roster,
    sectors,
    doctorRequests,
    stats,
    approveRequest,
    rejectRequest,
    createSector,
    refreshData: fetchData,
  };
};
