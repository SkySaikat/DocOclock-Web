import React, { useState } from 'react';
import { Building2, LogOut, ActivitySquare, Users, Star } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useHospitalAdminData } from '../../hooks/useHospitalAdminData';

import { HospitalAnalytics } from '../../components/hospital-admin/HospitalAnalytics';
import { RosterManager } from '../../components/hospital-admin/RosterManager';
import { ReviewMonitor } from '../../components/hospital-admin/ReviewMonitor';

export const HospitalAdminDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const { loading, hospital, roster, stats, reviews, searchResults, searchDoctors, addDoctorToRoster } = useHospitalAdminData();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'ROSTER' | 'REVIEWS'>('ANALYTICS');

  const handleLogout = () => {
    logout();
    onNavigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-500 animate-pulse">Loading Facility Data...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Building2 size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Hospital Facility Found</h2>
        <p className="text-slate-500 font-bold max-w-md">Your account is not linked to any hospital. Please contact Super Admin to configure your facility.</p>
        <button onClick={handleLogout} className="mt-8 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all">Select Different Account</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-500 border border-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 border border-white/10 rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <Building2 size={32} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">Facility Management</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{hospital.name}</h1>
              <p className="text-sm font-bold text-slate-400 mt-1">{hospital.address}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all text-sm group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col gap-2 sticky top-24">
            <button
              onClick={() => setActiveTab('ANALYTICS')}
              className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${
                activeTab === 'ANALYTICS' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ActivitySquare size={20} /> Analytics
            </button>
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all ${
                activeTab === 'ROSTER' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3"><Users size={20} /> Roster Management</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-200/50 rounded-lg">{roster.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${
                activeTab === 'REVIEWS' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Star size={20} /> Review Monitor
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'ANALYTICS' && (
            <HospitalAnalytics stats={stats} />
          )}

          {activeTab === 'ROSTER' && (
            <RosterManager 
               roster={roster} 
               searchResults={searchResults} 
               onSearch={searchDoctors} 
               onAddDoctor={addDoctorToRoster} 
            />
          )}

          {activeTab === 'REVIEWS' && (
            <ReviewMonitor reviews={reviews} />
          )}
        </div>

      </div>

    </div>
  );
};
