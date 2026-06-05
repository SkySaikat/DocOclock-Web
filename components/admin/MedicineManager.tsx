import React, { useState, useEffect, useRef } from 'react';
import { Pill, Upload, Search, Plus, Trash2, Edit2, X, Check, Package, Loader2, FileSpreadsheet, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '../../supabase';

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  form: string;
  strength: string;
  manufacturer: string;
  added_by_doctor_id?: string | null;
  is_verified?: boolean;
}

const CATEGORIES = [
  'All', 'Antibiotic', 'Analgesic', 'NSAID', 'Antihistamine', 
  'Antacid/PPI', 'Antacid', 'Antidiabetic', 'Antihypertensive', 
  'Antiplatelet', 'Statin', 'Supplement', 'Bronchodilator', 
  'Antiasthmatic', 'Antifungal', 'Corticosteroid', 'Antidepressant', 
  'Anxiolytic', 'General'
];

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Cream', 'Ointment', 'Inhaler', 'Drop', 'Suppository'];

export const MedicineManager: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newMedicine, setNewMedicine] = useState({
    name: '', generic_name: '', category: 'General', form: 'Tablet', strength: '', manufacturer: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async (forceRefresh = false) => {
    setLoading(true);
    
    if (!forceRefresh) {
      const cached = sessionStorage.getItem('medicine_catalog');
      if (cached) {
        setMedicines(JSON.parse(cached));
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .order('category')
      .order('name');
    
    if (!error && data) {
      setMedicines(data);
      sessionStorage.setItem('medicine_catalog', JSON.stringify(data));
    }
    setLoading(false);
  };

  const addMedicine = async () => {
    if (!newMedicine.name || !newMedicine.category) return;

    const { error } = await supabase.from('medicines').insert([newMedicine]);
    if (!error) {
      fetchMedicines(true);
      setIsAddingNew(false);
      setNewMedicine({ name: '', generic_name: '', category: 'General', form: 'Tablet', strength: '', manufacturer: '' });
    }
  };

  const deleteMedicine = async (id: string) => {
    if (!confirm('Delete this medicine?')) return;
    await supabase.from('medicines').delete().eq('id', id);
    fetchMedicines(true);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const text = await file.text();
    const lines = text.split('\n').slice(1); // Skip header

    const medicines = lines
      .filter(line => line.trim())
      .map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
          name: cols[0] || '',
          generic_name: cols[1] || '',
          category: cols[2] || 'General',
          form: cols[3] || 'Tablet',
          strength: cols[4] || '',
          manufacturer: cols[5] || '',
        };
      })
      .filter(m => m.name);

    if (medicines.length > 0) {
      const { error } = await supabase.from('medicines').insert(medicines);
      if (error) {
        alert('Upload error: ' + error.message);
      } else {
        alert(`✅ Successfully uploaded ${medicines.length} medicines!`);
        fetchMedicines(true);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [showDoctorSubmitted, setShowDoctorSubmitted] = useState(false);

  const filtered = medicines.filter(m => {
    const matchesSearch = !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSubmitted = !showDoctorSubmitted || !!m.added_by_doctor_id;
    return matchesSearch && matchesCategory && matchesSubmitted;
  });

  const doctorSubmittedCount = medicines.filter(m => !!m.added_by_doctor_id).length;

  const verifyMedicine = async (id: string, verified: boolean) => {
    await supabase.from('medicines').update({ is_verified: verified }).eq('id', id);
    fetchMedicines(true);
  };

  const categoryCounts = medicines.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Pill size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Medicine Database</h2>
              <p className="text-xs font-bold text-slate-500">{medicines.length} medicines in catalog</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {doctorSubmittedCount > 0 && (
              <button
                onClick={() => setShowDoctorSubmitted(!showDoctorSubmitted)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border ${showDoctorSubmitted ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
              >
                <UserRound size={16} /> Doctor Submitted ({doctorSubmittedCount})
              </button>
            )}
            {/* CSV Upload */}
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
            >
              <Plus size={16} /> Add Medicine
            </button>
          </div>
        </div>

        {/* CSV Format Help */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CSV Format</p>
          <code className="text-[11px] text-slate-600 font-mono">name, generic_name, category, form, strength, manufacturer</code>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500 outline-none font-bold text-sm transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...Object.keys(categoryCounts).sort()].filter((v, i, a) => a.indexOf(v) === i).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-purple-200'
              }`}
            >
              {cat} {cat !== 'All' && categoryCounts[cat] ? `(${categoryCounts[cat]})` : cat === 'All' ? `(${medicines.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="bg-white rounded-[24px] shadow-sm border-2 border-purple-200 p-6 animate-in slide-in-from-top duration-300">
          <h3 className="text-sm font-black text-slate-900 mb-4">Add New Medicine</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input placeholder="Medicine Name *" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500" />
            <input placeholder="Generic Name" value={newMedicine.generic_name} onChange={e => setNewMedicine({...newMedicine, generic_name: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500" />
            <select value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500">
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={newMedicine.form} onChange={e => setNewMedicine({...newMedicine, form: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500">
              {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input placeholder="Strength (e.g. 500mg)" value={newMedicine.strength} onChange={e => setNewMedicine({...newMedicine, strength: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500" />
            <input placeholder="Manufacturer" value={newMedicine.manufacturer} onChange={e => setNewMedicine({...newMedicine, manufacturer: e.target.value})} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500" />
          </div>
          <div className="flex gap-3 mt-4 justify-end">
            <button onClick={() => setIsAddingNew(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
            <button onClick={addMedicine} disabled={!newMedicine.name} className="px-6 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              <Check size={14} /> Save Medicine
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={24} className="animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-bold">Loading medicines...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bold">No medicines found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Medicine</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Form · Strength</th>
                  <th className="p-4">Manufacturer</th>
                  <th className="p-4">Source</th>
                  <th className="p-4 pr-6 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(med => (
                  <tr key={med.id} className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors ${med.added_by_doctor_id && !med.is_verified ? 'bg-amber-50/30' : ''}`}>
                    <td className="p-4 pl-6">
                      <p className="font-black text-slate-900 text-sm">{med.name}</p>
                      {med.generic_name && <p className="text-[11px] text-slate-400 font-medium">{med.generic_name}</p>}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-black">{med.category}</span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-600">{med.form}{med.strength ? ` · ${med.strength}` : ''}</td>
                    <td className="p-4 text-xs text-slate-500">{med.manufacturer || '—'}</td>
                    <td className="p-4">
                      {med.added_by_doctor_id ? (
                        <span className="flex items-center gap-1 text-[9px] font-black px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 w-fit">
                          <UserRound size={10} /> Doctor
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 w-fit">
                          <ShieldCheck size={10} /> Admin
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-1">
                        {med.added_by_doctor_id && (
                          <button
                            onClick={() => verifyMedicine(med.id, !med.is_verified)}
                            title={med.is_verified ? 'Mark unverified' : 'Verify medicine'}
                            className={`p-1.5 rounded-xl transition-all ${med.is_verified ? 'text-emerald-500 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                          >
                            <ShieldCheck size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteMedicine(med.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineManager;
