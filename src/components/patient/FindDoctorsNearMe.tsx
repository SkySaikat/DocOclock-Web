import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, Star, User } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';
import { UserRole, Doctor } from '../../types';

interface FindDoctorsNearMeProps {
  onSelectDoctor?: (doctor: Doctor) => void;
}

export const FindDoctorsNearMe: React.FC<FindDoctorsNearMeProps> = ({ onSelectDoctor }) => {
  const { profile, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{city?: string, error?: string}>({});
  const [nearbyDoctors, setNearbyDoctors] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFindNearMe = async () => {
    // Requires authenticated user matching constraints in edge func
    if (!profile || userRole !== UserRole.PATIENT) {
      setLocationStatus({ error: "Please login as a patient to use location services." });
      return;
    }

    setLocating(true);
    setLocationStatus({});
    setNearbyDoctors([]);
    setHasSearched(false);

    let lat, lng;

    try {
      // 1. Invoke Edge Function to capture IP & GeoIP update
      const { data, error } = await supabase.functions.invoke('update-location');
      
      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to detect location');
      }

      lat = data.data.lat;
      lng = data.data.lng;
      setLocationStatus({ city: data.data.city });

    } catch (err: any) {
      console.warn("Edge function failed, falling back to Browser Geolocation:", err);
      // Fallback: Browser Geolocation
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        setLocationStatus({ city: "Current Location (Browser)" });
      } catch (geoErr) {
        setLocating(false);
        setLocationStatus({ error: "Location detection failed entirely. Please ensure location services are enabled." });
        return;
      }
    }

    setLocating(false);
    setLoading(true);

    try {
      // 2. Query PostGIS RPC nearest doctors
      const { data: doctors, error: rpcError } = await supabase.rpc('get_nearest_doctors', {
        user_lat: lat,
        user_lng: lng,
        max_dist_meters: 50000 // 50 km radius
      });

      if (rpcError) throw rpcError;
      setNearbyDoctors(doctors || []);
      
    } catch (err: any) {
      console.error(err);
      setLocationStatus({ error: "Failed to fetch nearby doctors." });
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between border-b border-slate-100 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Find Doctors Near Me</h2>
          </div>
          <p className="text-slate-500 font-medium">Auto-detects your location to find the closest available specialists.</p>
        </div>

        <button 
          onClick={handleFindNearMe}
          disabled={locating || loading}
          className="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-slate-900/20"
        >
          {locating ? (
            <><Loader2 size={20} className="animate-spin" /> Locating...</>
          ) : (
            <><Navigation size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="currentColor" /> Locate via IP GeoData</>
          )}
        </button>
      </div>

      {/* Status Alert */}
      {locationStatus.error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl mb-8">
          {locationStatus.error}
        </div>
      )}

      {locationStatus.city && !loading && (
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
          <MapPin size={16} className="text-blue-500" />
          Detected Location: <span className="text-slate-900">{locationStatus.city}</span>
        </div>
      )}

      {loading && (
        <div className="py-20 text-center flex flex-col items-center">
           <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
           <p className="font-bold text-slate-500 animate-pulse">Calculating spatial distances securely...</p>
        </div>
      )}

      {/* Results Grid */}
      {hasSearched && !loading && (
        <>
          {nearbyDoctors.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl">
              <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-lg font-black text-slate-800">No doctors found within 50km</p>
              <p className="text-slate-500">Try adjusting your search filters or manual location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyDoctors.map(doctor => (
                <div key={doctor.doctor_id} className="border border-slate-100 rounded-[24px] p-5 hover:border-blue-100 hover:shadow-md transition-all group bg-slate-50/50 hover:bg-white cursor-pointer relative overflow-hidden">
                  
                  {/* Distance Badge */}
                  <div className="absolute top-5 right-5 px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-full text-[10px] font-black tracking-widest text-blue-600 z-10 flex items-center gap-1 group-hover:border-blue-200 transition-colors">
                    <Navigation size={10} className="opacity-70" />
                    {(doctor.distance_meters / 1000).toFixed(1)} km away
                  </div>

                  <div className="flex items-center gap-4 mb-4 mt-2">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm shrink-0">
                      {doctor.image_url ? (
                        <img src={doctor.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={24}/></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{doctor.full_name}</h3>
                      <p className="text-xs font-bold text-slate-500">{doctor.specialty || 'General'}</p>
                      
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-600">{Number(doctor.rating || 5).toFixed(1)} Rating</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectDoctor?.({
                      id: doctor.doctor_id,
                      name: doctor.full_name,
                      specialty: doctor.specialty || 'General',
                      degrees: doctor.degrees || 'MBBS',
                      bmdcNumber: '',
                      imageUrl: doctor.image_url || '',
                      chambers: [],
                      experienceYears: doctor.experience_years || 0,
                      totalPatients: 0,
                      rating: doctor.rating || 5,
                      about: ''
                    })}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};
