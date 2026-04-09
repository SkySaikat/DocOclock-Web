import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { Doctor, PatientProfile } from '../types';

export const useSuperAdminData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalAppointments: 0,
  });
  
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, docsRes, hospsRes, appsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'DOCTOR'),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalDoctors: docsRes.count || 0,
        totalHospitals: hospsRes.count || 0,
        totalAppointments: appsRes.count || 0,
      });
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    }
  }, []);

  const fetchPendingDoctors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'DOCTOR')
        .eq('registration_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingDoctors(data || []);
    } catch (error) {
      console.error("Failed to fetch pending doctors", error);
    }
  }, []);

  const approveDoctor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ registration_status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      setPendingDoctors(prev => prev.filter(doc => doc.id !== id));
      fetchStats();
      return { success: true };
    } catch (error) {
      console.error("Failed to approve doctor", error);
      return { success: false };
    }
  };

  const rejectDoctor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ registration_status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      setPendingDoctors(prev => prev.filter(doc => doc.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Failed to reject doctor", error);
      return { success: false };
    }
  };

  const initializeData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPendingDoctors()]);
    setLoading(false);
  }, [fetchStats, fetchPendingDoctors]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return {
    loading,
    stats,
    pendingDoctors,
    approveDoctor,
    rejectDoctor,
    refreshQueue: fetchPendingDoctors
  };
};
