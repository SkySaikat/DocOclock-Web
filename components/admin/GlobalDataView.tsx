import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Building } from 'lucide-react';
import { supabase } from '../../supabase';

type TabType = 'DOCTORS' | 'PATIENTS' | 'HOSPITALS';

export const GlobalDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('DOCTORS');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGlobalData();
  }, [activeTab]);

  const fetchGlobalData = async () => {
    setLoading(true);
    let query;

    if (activeTab === 'HOSPITALS') {
      query = supabase.from('hospitals').select('*').limit(50);
    } else {
      query = supabase.from('profiles').select('*').eq('role', activeTab).limit(50);
    }

    const { data: result, error } = await query;
    if (!error) {
      setData(result || []);
    }
    setLoading(false);
  };

  const filteredData = data.filter(item => {
    const term = searchQuery.toLowerCase();
    if (activeTab === 'HOSPITALS') {
      return item.name?.toLowerCase().includes(term) || item.address?.toLowerCase().includes(term);
    }
    return item.full_name?.toLowerCase().includes(term) || item.phone?.includes(term) || item.bmdc_number?.includes(term);
  });

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      
      {/* Tabs Layout */}
      <div className="flex border-b border-slate-100 pt-2 px-2 bg-slate-50/50">
        {(['DOCTORS', 'PATIENTS', 'HOSPITALS'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
            className={`px-6 py-3 text-sm font-black tracking-wide border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-700 bg-white' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="relative group mb-6 max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
           <input 
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder={`Search ${activeTab.toLowerCase()}...`}
             className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-sm transition-all"
           />
        </div>

        {/* Data List */}
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">Loading registry...</div>
        ) : (
          <div className="grid gap-3">
            {filteredData.length === 0 ? (
               <div className="p-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                 No {activeTab.toLowerCase()} found matching your search.
               </div>
            ) : (
              filteredData.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all bg-white group">
                  {activeTab === 'HOSPITALS' ? (
                     <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Building size={20} />
                     </div>
                  ) : (
                     <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
                        {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
                     </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      {activeTab === 'HOSPITALS' ? item.name : item.full_name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                      {activeTab === 'HOSPITALS' ? (
                        <span className="flex items-center gap-1"><MapPin size={12}/> {item.address}</span>
                      ) : (
                        <>
                          {(item.phone || item.contact_number) && <span className="flex items-center gap-1"><Phone size={12}/> {item.phone || item.contact_number}</span>}
                          {item.bmdc_number && <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">BMDC: {item.bmdc_number}</span>}
                          {item.registration_status && (
                             <span className={`px-2 py-0.5 rounded uppercase tracking-widest text-[9px] ${
                               item.registration_status === 'approved' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                             }`}>
                               {item.registration_status}
                             </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-400 w-24">
                     {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};
