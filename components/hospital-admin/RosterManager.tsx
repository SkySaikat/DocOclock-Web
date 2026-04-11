import React, { useState } from 'react';
import { Search, Plus, User, CheckCircle2, Star } from 'lucide-react';

interface RosterManagerProps {
  roster: any[];
  searchResults: any[];
  onSearch: (query: string) => void;
  onAddDoctor: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const RosterManager: React.FC<RosterManagerProps> = ({ roster, searchResults, onSearch, onAddDoctor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 3) {
      setIsSearching(true);
      onSearch(val);
    } else {
      setIsSearching(false);
      onSearch(''); // Clear results
    }
  };

  const handleAdd = async (id: string) => {
    await onAddDoctor(id);
    setSearchQuery('');
    onSearch('');
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Add Section */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="font-black text-slate-900 mb-4">Add Doctor to Roster</h3>
        
        <div className="relative group max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by Name or BMDC Number..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-sm transition-all"
          />
        </div>

        {/* Search Results Dropdown-style embedded list */}
        {isSearching && searchResults.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden max-w-lg divide-y divide-slate-100">
            {searchResults.map(doc => {
              const alreadyInRoster = roster.some(r => r.id === doc.id);
              
              return (
                <div key={doc.id} className="p-3 flex items-center justify-between bg-slate-50 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden">
                       {doc.image_url ? <img src={doc.image_url} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400 m-auto mt-2" />}
                     </div>
                     <div>
                       <p className="font-bold text-slate-900 text-sm">{doc.full_name}</p>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest">{doc.specialty || 'General'} • {doc.bmdc_number}</p>
                     </div>
                  </div>
                  
                  {alreadyInRoster ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">
                      <CheckCircle2 size={14} /> Added
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleAdd(doc.id)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus size={14} /> Link
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Roster */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
          Current Staff 
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{roster.length}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roster.map(doc => (
            <div key={doc.id} className="border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-100 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                 {doc.image_url ? <img src={doc.image_url} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-slate-400 m-auto mt-2" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate">{doc.full_name}</p>
                <p className="text-xs font-bold text-blue-600 truncate">{doc.specialty || 'General'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold text-slate-500">{doc.rating || '5.0'} Rating</span>
                </div>
              </div>
            </div>
          ))}
          
          {roster.length === 0 && (
            <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold">
              No doctors assigned to this hospital yet. Search above to add them.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
