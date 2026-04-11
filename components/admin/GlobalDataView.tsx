import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Building, User } from 'lucide-react';
import { supabase } from '../../supabase';

type TabType = 'DOCTORS' | 'PATIENTS' | 'HOSPITALS';

export const GlobalDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('DOCTORS');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
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
      query = supabase.from('profiles').select('id, full_name, phone, contact_number, bmdc_number, registration_status, image_url, created_at').eq('role', activeTab).range(from, to).order('created_at', { ascending: false });
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
        <div className="grid gap-3">
          {data.length === 0 && !loading ? (
             <div className="p-8 text-center text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
               No {activeTab.toLowerCase()} found matching your search.
             </div>
          ) : (
            data.map(item => (
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
      </div>

    </div>
  );
};
