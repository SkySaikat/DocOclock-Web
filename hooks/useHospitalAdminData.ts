import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';

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
  const [stats, setStats] = useState({
    totalVisits: 0,
    averageRating: 0,
    totalDoctors: 0
  });

  const [reviews, setReviews] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    
    try {
      // 1. Fetch Hospital owned by current Admin
      const { data: hospData, error: hospErr } = await supabase
        .from('hospitals')
        .select('*')
        .eq('owner_id', profile.id)
        .single();
      
      if (hospErr && hospErr.code !== 'PGRST116') throw hospErr; // PGRST116 means zero rows
      
      if (!hospData) {
        setLoading(false);
        return;
      }
      
      setHospital(hospData);
      
      // 2. Fetch Roster (Doctors linked to this hospital)
      const { data: rosterData, error: rosterErr } = await supabase
        .from('doctor_hospitals')
        .select(`
          doctor_id,
          profiles:doctor_id (id, full_name, specialty, phone, image_url, rating)
        `)
        .eq('hospital_id', hospData.id);
        
      if (rosterErr) throw rosterErr;
      
      const doctors = (rosterData || []).map(r => r.profiles).filter(Boolean) as any[];
      setRoster(doctors);
      
      const doctorIds = doctors.map(d => d.id);
      
      if (doctorIds.length > 0) {
        // 3. Analytics: Total appointments for rostered doctors
        const { count: visitsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .in('doctor_id', doctorIds);
          
        // 4. Analytics: Average rating
        const avg = doctors.reduce((acc, doc) => acc + (doc.rating || 5.0), 0) / doctors.length;
        
        setStats({
          totalVisits: visitsCount || 0,
          averageRating: Number(avg.toFixed(1)),
          totalDoctors: doctors.length
        });
        
        // 5. Fetch Recent Reviews for rostered doctors
        const { data: revData } = await supabase
          .from('reviews')
          .select(`
            *,
            patient:patient_id (full_name),
            doctor:doctor_id (full_name, specialty)
          `)
          .in('doctor_id', doctorIds)
          .order('created_at', { ascending: false })
          .limit(20);
          
        setReviews(revData || []);
      }
    } catch (error) {
      console.error("Failed to load hospital admin data", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const searchDoctors = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, specialty, bmdc_number, image_url')
        .eq('role', 'DOCTOR')
        .eq('registration_status', 'approved')
        .or(`full_name.ilike.%${query}%,bmdc_number.ilike.%${query}%`)
        .limit(10);
        
      setSearchResults(data || []);
    } catch (error) {
      console.error("Failed to search doctors", error);
    }
  };

  const addDoctorToRoster = async (doctorId: string) => {
    if (!hospital?.id) return { success: false, error: 'No hospital configured' };
    
    try {
      const { error } = await supabase
        .from('doctor_hospitals')
        .insert([{
          doctor_id: doctorId,
          hospital_id: hospital.id,
          is_active: true
        }]);
        
      if (error) throw error;
      await fetchDashboardData();
      return { success: true };
    } catch (error: any) {
      console.error("Failed to add doctor", error);
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
    stats,
    reviews,
    searchResults,
    searchDoctors,
    addDoctorToRoster,
    refreshData: fetchDashboardData
  };
};
