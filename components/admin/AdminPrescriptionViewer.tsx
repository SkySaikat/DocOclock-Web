import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, Clock, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '../../supabase';
import { getLocalISODate } from '../../utils/date';

interface AdminPrescriptionViewerProps {
  hospitalId?: string; // If provided, limits prescriptions to this hospital (for Hospital Admins)
}

export const AdminPrescriptionViewer: React.FC<AdminPrescriptionViewerProps> = ({ hospitalId }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRx, setSelectedRx] = useState<any | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [hospitalId]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          doctor:doctor_id (full_name, specialty),
          medicines:prescription_medicines (*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPrescriptions(data || []);
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const term = searchQuery.toLowerCase();
    return (
      (rx.patient_id && rx.patient_id.toLowerCase().includes(term)) ||
      (rx.doctor?.full_name && rx.doctor.full_name.toLowerCase().includes(term)) ||
      (rx.id && rx.id.toLowerCase().includes(term)) ||
      (rx.diagnosis && rx.diagnosis.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white rounded-ds-lg shadow-ds-soft overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col md:flex-row min-h-[600px]">

      {/* Left List Pane */}
      <div className="w-full md:w-1/3 border-r border-ink-100 flex flex-col bg-ink-50/30">
        <div className="p-6 border-b border-ink-100">
          <h3 className="text-lg font-display font-black text-ink-800 flex items-center gap-2 mb-4">
            <FileText className="text-medical-600" size={20} /> Prescriptions Archive
          </h3>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-medical-600 transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Doctor, or Patient..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-ink-200 rounded-ds-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 outline-none font-bold text-xs transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-ink-200 border-t-medical-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-display font-black text-ink-400 uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldAlert className="text-ink-300 mx-auto mb-3" size={32} />
              <p className="font-bold text-ink-500 text-sm">No Prescriptions Found</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {filteredPrescriptions.map(rx => (
                <div
                  key={rx.id}
                  onClick={() => setSelectedRx(rx)}
                  className={`p-4 cursor-pointer transition-colors border-l-4 ${
                    selectedRx?.id === rx.id ? 'bg-medical-50 border-medical-500' : 'hover:bg-white border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-ink-400">ID: {rx.id}</span>
                    <span className="text-[10px] font-bold text-ink-500 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(rx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-black text-ink-800 text-sm truncate">{rx.doctor?.full_name || 'Unknown Doctor'}</h4>
                  <p className="text-xs font-bold text-medical-600 truncate mt-0.5">Patient: {rx.patient_id?.substring(0,8) || 'N/A'}</p>

                  {rx.diagnosis && (
                    <div className="mt-3 px-2 py-1 bg-ink-100 rounded-lg text-[10px] font-bold text-ink-600 truncate">
                      Diag: {rx.diagnosis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="w-full md:w-2/3 bg-white p-6 md:p-8 flex flex-col">
        {selectedRx ? (
          <div className="animate-in fade-in duration-300 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-ink-100">
              <div>
                <h2 className="text-2xl font-display font-black text-ink-800">Prescription Details</h2>
                <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mt-1">Ref: {selectedRx.id}</p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-black flex items-center gap-1">
                <CheckCircle2 size={14} /> Digiscript Verified
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
               <div className="bg-ink-50 rounded-2xl p-5 border border-ink-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-ink-400 mb-2.5">Prescribing Doctor</p>
                 <p className="font-black text-ink-800 flex items-center gap-2">
                    <User size={16} className="text-medical-500" /> {selectedRx.doctor?.full_name || 'N/A'}
                 </p>
                 <p className="text-xs font-bold text-ink-500 mt-1 pl-6">{selectedRx.doctor?.specialty || 'General'}</p>
               </div>
               <div className="bg-ink-50 rounded-2xl p-5 border border-ink-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-ink-400 mb-2.5">Consultation Info</p>
                 <p className="font-black text-ink-800 flex items-center gap-2">
                    <Calendar size={16} className="text-medical-500" /> {new Date(selectedRx.date).toLocaleDateString()}
                 </p>
                 {selectedRx.diagnosis && (
                   <div className="mt-3 text-xs">
                     <span className="font-bold text-ink-500">Diagnosis: </span>
                     <span className="font-black text-ink-700">{selectedRx.diagnosis}</span>
                   </div>
                 )}
               </div>
            </div>

            <h3 className="text-sm font-display font-black text-ink-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={16} className="text-medical-600" /> Prescribed Medications
            </h3>

            {selectedRx.medicines && selectedRx.medicines.length > 0 ? (
              <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden shadow-ds-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-50 border-b border-ink-200 text-[10px] font-black uppercase tracking-widest text-ink-400">
                    <tr>
                      <th className="px-4 py-3">Medicine Name</th>
                      <th className="px-4 py-3">Dosage</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {selectedRx.medicines.map((med: any) => (
                      <tr key={med.id} className="hover:bg-ink-50/50">
                        <td className="px-4 py-3 font-black text-ink-800">{med.name}</td>
                        <td className="px-4 py-3 font-bold text-medical-600">{med.dosage}</td>
                        <td className="px-4 py-3 font-bold text-ink-600">{med.duration_days} Days</td>
                        <td className="px-4 py-3 text-xs font-bold text-ink-500 capitalize">{med.before_after_meal} Meal</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <div className="p-8 border-2 border-dashed border-ink-200 rounded-2xl text-center text-ink-400">
                 No specialized medications attached to this prescription.
               </div>
            )}

            {selectedRx.notes && (
              <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Doctor Notes</h4>
                <p className="text-sm font-bold text-amber-900 leading-relaxed whitespace-pre-wrap">{selectedRx.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-ink-400">
            <FileText size={48} className="text-ink-200 mb-4" />
            <h3 className="text-xl font-display font-black text-ink-800 mb-2">No Selection</h3>
            <p className="font-bold max-w-sm text-center">Select a prescription from the archive list to view full clinical details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
