import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Building, User, ShieldAlert } from 'lucide-react';
import { supabase } from '../../supabase';
import { AdminPrescriptionViewer } from './AdminPrescriptionViewer';
import { AdminProfileModal } from './AdminProfileModal';

type TabType = 'DOCTORS' | 'PATIENTS' | 'HOSPITALS' | 'PRESCRIPTIONS';

export const GlobalDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('DOCTORS');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const PAGE_SIZE = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'PRESCRIPTIONS') return;
    setPage(0);
    setData([]);
    setHasMore(true);
    fetchGlobalData(0, true);
  }, [activeTab, debouncedSearch]);

  const fetchGlobalData = async (pageIndex: number, isNewSearch = false) => {
    setLoading(true);
    let query;

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    if (activeTab === 'HOSPITALS') {
      query = supabase.from('hospitals').select('id, name, address, created_at').range(from, to).order('created_at', { ascending: false });
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,address.ilike.%${debouncedSearch}%`);
      }
    } else {
      // Map activeTab to actual db role string
      const dbRole = activeTab === 'DOCTORS' ? 'DOCTOR' : (activeTab === 'PATIENTS' ? 'PATIENT' : activeTab);
      query = supabase.from('profiles').select('id, full_name, phone, bmdc_number, registration_status, image_url, created_at, role').eq('role', dbRole).range(from, to).order('created_at', { ascending: false });
      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,bmdc_number.ilike.%${debouncedSearch}%`);
      }
    }

    const { data: result, error } = await query;
    if (!error && result) {
      if (isNewSearch) {
        setData(result);
      } else {
        setData(prev => [...prev, ...result]);
      }
      setHasMore(result.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGlobalData(nextPage);
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      
      {/* Tabs Layout */}
      <div className="flex border-b border-slate-100 pt-2 px-2 bg-slate-50/50">
        {(['DOCTORS', 'PATIENTS', 'HOSPITALS', 'PRESCRIPTIONS'] as TabType[]).map(tab => (
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
        {/* Search - Hide in prescriptions mode since the viewer has its own */}
        {activeTab !== 'PRESCRIPTIONS' && (
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
        )}

        {activeTab === 'PRESCRIPTIONS' ? (
          <div className="-mx-6 -mb-6">
             <AdminPrescriptionViewer />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'HOSPITALS' ? (
              data.map(hosp => (
                <div key={hosp.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">{hosp.name}</h4>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <MapPin size={12} /> {hosp.address}
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-400">
                    ID: {hosp.id.substring(0,8)}
                  </div>
                </div>
              ))
            ) : (
              data.map(item => (
                <div 
                   key={item.id} 
                   onClick={() => setSelectedUser(item)}
                   className="p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-slate-400 m-auto mt-3" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-sm mb-1">{item.full_name}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                      {item.role === 'HOSPITAL_ADMIN' ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase tracking-widest text-[9px]">Hospital Admin</span>
                      ) : (
                        <>
                          {item.phone && <span className="flex items-center gap-1"><Phone size={12}/> {item.phone}</span>}
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

            {loading && (
              <div className="p-4 text-center text-slate-400 font-bold animate-pulse">Loading...</div>
            )}

            {!loading && hasMore && data.length > 0 && (
              <button
                onClick={handleLoadMore}
                className="mt-4 p-3 w-full border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedUser && (
         <AdminProfileModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onRefresh={() => {
              setSelectedUser(null);
              setPage(0);
              fetchGlobalData(0, true);
            }} 
         />
      )}

    </div>
  );
};
