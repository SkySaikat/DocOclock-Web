import React, { useEffect, useState } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { supabase } from '../../supabase';

interface HospitalRow {
  id: string;
  name: string;
  address: string | null;
}

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('hospitals')
      .select('id, name, address')
      .order('name')
      .then(({ data }) => {
        setHospitals(data || []);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-10 text-center">
          <h1 className="font-display text-4xl md:text-[48px] font-bold text-ink-900 leading-[1.08] mb-4">Hospitals</h1>
          <p className="text-ink-500 text-base max-w-xl mx-auto leading-relaxed">
            Partner hospitals and clinics where Dococlock-verified doctors see patients.
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-ink-400 font-medium">Loading hospitals...</div>
        ) : hospitals.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center bg-medical-50/60 rounded-ds-lg">
            <div className="w-14 h-14 rounded-full bg-white text-medical-500 flex items-center justify-center mb-4 shadow-ds-card">
              <Building2 size={26} />
            </div>
            <h3 className="font-display text-xl font-bold text-ink-800 mb-2">No hospitals listed yet</h3>
            <p className="text-sm text-ink-500 max-w-xs">Partner hospitals will appear here as they join the platform.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            {hospitals.map((h) => (
              <div key={h.id} className="bg-white rounded-ds-lg shadow-ds-card p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-ink-800 truncate">{h.name}</h3>
                  {h.address && (
                    <p className="flex items-center gap-1.5 text-[13px] text-ink-500 mt-1">
                      <MapPin size={12} className="shrink-0" /> {h.address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
