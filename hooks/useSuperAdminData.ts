import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { Doctor, PatientProfile } from '../types';
import bcrypt from 'bcryptjs';
import { createNotification } from '../storage';

export interface HospitalWithDetails {
  id: string;
  name: string;
  address: string;
  contact_info: string;
  owner_id: string;
  owner: { full_name: string; email: string } | null;
  branch_count: number;
  doctor_count: number;
}

export const useSuperAdminData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalAppointments: 0,
  });

  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>({});
  const [allHospitals, setAllHospitals] = useState<HospitalWithDetails[]>([]);
  const [customChamberRequests, setCustomChamberRequests] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);

  const fetchPlatformSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      setPlatformSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch platform settings", error);
    }
  }, []);

  const updatePlatformSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value });
        
      if (error) throw error;
      
      setPlatformSettings(prev => ({
        ...prev,
        [key]: value
      }));
      return { success: true };
    } catch (error) {
      console.error(`Failed to update setting ${key}`, error);
      return { success: false };
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, docsRes, patientsRes, hospsRes, appsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'DOCTOR'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PATIENT'),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers:        usersRes.count    || 0,
        totalPatients:     patientsRes.count || 0,
        totalDoctors:      docsRes.count     || 0,
        totalHospitals:    hospsRes.count    || 0,
        totalAppointments: appsRes.count     || 0,
      });
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    }
  }, []);

  const fetchPendingDoctors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, bmdc_number, specialty, degrees, created_at, id_photo_url, image_url, experience_years')
        .eq('role', 'DOCTOR')
        .eq('registration_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPendingDoctors(data || []);
    } catch (error) {
      console.error("Failed to fetch pending doctors", error);
    }
  }, []);

  const sendDoctorStatusEmail = (email: string | undefined, doctorName: string, status: 'approved' | 'rejected') => {
    if (!email) return;
    fetch('http://localhost:3001/api/send-doctor-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, doctorName, status }),
    }).catch(() => { /* Non-blocking — email failure should not block the UI */ });
  };

  const approveDoctor = async (id: string) => {
    try {
      const doctor = pendingDoctors.find(d => d.id === id);

      const { error } = await supabase
        .from('profiles')
        .update({ registration_status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      setPendingDoctors(prev => prev.filter(doc => doc.id !== id));
      fetchStats();

      if (doctor) {
        sendDoctorStatusEmail(doctor.email, doctor.full_name, 'approved');
        createNotification({
          recipient_id: id,
          title: 'Account Approved',
          body: 'Your doctor account has been approved. You can now log in and start seeing patients.',
          type: 'approval_status',
          link: '/doctor/dashboard',
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to approve doctor", error);
      return { success: false };
    }
  };

  const rejectDoctor = async (id: string) => {
    try {
      const doctor = pendingDoctors.find(d => d.id === id);

      const { error } = await supabase
        .from('profiles')
        .update({ registration_status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      setPendingDoctors(prev => prev.filter(doc => doc.id !== id));

      if (doctor) {
        sendDoctorStatusEmail(doctor.email, doctor.full_name, 'rejected');
        createNotification({
          recipient_id: id,
          title: 'Account Application Update',
          body: 'Your doctor account application was not approved at this time. Please contact support for more information.',
          type: 'approval_status',
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to reject doctor", error);
      return { success: false };
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ registration_status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      await Promise.all([fetchStats(), fetchPendingDoctors()]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetUserPassword = async (userId: string, newStrValue: string) => {
    try {
      const hashed = await bcrypt.hash(newStrValue, 10);
      const { error } = await supabase
        .from('profiles')
        .update({ password: hashed })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ─── Hospital Management ───────────────────────────────────────────────────

  const fetchAllHospitals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select(`
          *,
          owner:owner_id (full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with branch/doctor counts
      const enriched = await Promise.all((data || []).map(async (h: any) => {
        const [branchRes, doctorRes] = await Promise.all([
          supabase.from('hospital_branches').select('id', { count: 'exact', head: true }).eq('hospital_id', h.id),
          supabase.from('doctor_hospitals').select('doctor_id', { count: 'exact', head: true }).eq('hospital_id', h.id),
        ]);
        return {
          ...h,
          owner: h.owner,
          branch_count: branchRes.count || 0,
          doctor_count: doctorRes.count || 0,
        };
      }));
      setAllHospitals(enriched);
    } catch (error) {
      console.error('Failed to fetch hospitals', error);
    }
  }, []);

  const createHospital = async (name: string, address: string, contactInfo: string) => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert([{ name, address, contact_info: contactInfo }])
        .select()
        .single();
      if (error) throw error;
      await fetchAllHospitals();
      await fetchStats();
      return { success: true, id: data.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const assignHospitalAdmin = async (hospitalId: string, email: string, fullName: string, password: string) => {
    try {
      const hashed = await bcrypt.hash(password, 10);
      // Create or update profile as HOSPITAL_ADMIN
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      let adminId: string;
      if (existing) {
        const { error } = await supabase.from('profiles').update({ role: 'HOSPITAL_ADMIN', registration_status: 'approved', full_name: fullName, password: hashed }).eq('id', existing.id);
        if (error) throw error;
        adminId = existing.id;
      } else {
        const { data, error } = await supabase.from('profiles').insert([{ full_name: fullName, email, role: 'HOSPITAL_ADMIN', password: hashed, registration_status: 'approved' }]).select('id').single();
        if (error) throw error;
        adminId = data.id;
      }
      // Link hospital to this admin
      const { error: linkErr } = await supabase.from('hospitals').update({ owner_id: adminId }).eq('id', hospitalId);
      if (linkErr) throw linkErr;
      await fetchAllHospitals();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createBranch = async (hospitalId: string, name: string, address: string, contactInfo?: string) => {
    try {
      const { error } = await supabase.from('hospital_branches').insert([{ hospital_id: hospitalId, name, address, contact_info: contactInfo || '' }]);
      if (error) throw error;
      await fetchAllHospitals();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const fetchCustomChamberRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chamber_requests')
        .select(`
          *,
          doctor:doctor_id (id, full_name, specialty, email, bmdc_number),
          hospital:hospital_id (id, name, address),
          branch:branch_id (id, name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCustomChamberRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch chamber requests', error);
    }
  }, []);

  const approveCustomChamber = async (requestId: string) => {
    try {
      const req = customChamberRequests.find(r => r.id === requestId);
      if (!req) throw new Error('Request not found');

      await supabase.from('chamber_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', requestId);

      // Create chamber for this doctor
      await supabase.from('chambers').insert([{
        doctor_id: req.doctor_id,
        hospital_name: req.hospital?.name || 'Hospital',
        address: req.hospital?.address || '',
        consultation_fee: req.proposed_fee || 0,
        linked_hospital_id: req.hospital_id,
        branch_id: req.branch_id || null,
        sector_id: req.sector_id || null,
        request_id: requestId,
        status: 'active',
      }]);

      // Upsert doctor_hospitals
      await supabase.from('doctor_hospitals').upsert([{
        doctor_id: req.doctor_id,
        hospital_id: req.hospital_id,
        branch_id: req.branch_id || null,
        sector_id: req.sector_id || null,
        is_active: true,
      }], { onConflict: 'doctor_id,hospital_id' });

      await fetchCustomChamberRequests();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ─── Hero Banner Management ───────────────────────────────────────────────

  const fetchHeroBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('hero_banners').select('*').order('sort_order');
      if (error) throw error;
      setHeroBanners(data || []);
    } catch (error) {
      console.error('Failed to fetch hero banners', error);
    }
  }, []);

  const createHeroBanner = async (banner: { desktop_image_url: string; mobile_image_url?: string; title?: string; subtitle?: string }) => {
    const maxOrder = heroBanners.length ? Math.max(...heroBanners.map(b => b.sort_order)) : -1;
    const { error } = await supabase.from('hero_banners').insert([{ ...banner, sort_order: maxOrder + 1 }]);
    if (error) throw error;
    await fetchHeroBanners();
  };

  const updateHeroBanner = async (id: string, updates: Partial<{ desktop_image_url: string; mobile_image_url: string; title: string; subtitle: string; sort_order: number; is_active: boolean }>) => {
    const { error } = await supabase.from('hero_banners').update(updates).eq('id', id);
    if (error) throw error;
    setHeroBanners(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteHeroBanner = async (id: string) => {
    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    if (error) throw error;
    setHeroBanners(prev => prev.filter(b => b.id !== id));
  };

  const rejectCustomChamber = async (requestId: string, note: string) => {
    try {
      await supabase.from('chamber_requests').update({ status: 'rejected', note, reviewed_at: new Date().toISOString() }).eq('id', requestId);
      await fetchCustomChamberRequests();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const initializeData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPendingDoctors(), fetchPlatformSettings(), fetchAllHospitals(), fetchCustomChamberRequests(), fetchHeroBanners()]);
    setLoading(false);
  }, [fetchStats, fetchPendingDoctors, fetchPlatformSettings, fetchAllHospitals, fetchCustomChamberRequests, fetchHeroBanners]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return {
    loading,
    stats,
    pendingDoctors,
    platformSettings,
    allHospitals,
    customChamberRequests,
    approveDoctor,
    rejectDoctor,
    updatePlatformSetting,
    updateUserStatus,
    resetUserPassword,
    refreshQueue: fetchPendingDoctors,
    createHospital,
    assignHospitalAdmin,
    createBranch,
    approveCustomChamber,
    rejectCustomChamber,
    refreshHospitals: fetchAllHospitals,
    refreshChamberRequests: fetchCustomChamberRequests,
    heroBanners,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
  };
};
