import React, { useState } from 'react';
import { ShieldCheck, LogOut, LayoutDashboard, Database, Activity } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';

import { AnalyticsOverview } from '../../components/admin/AnalyticsOverview';
import { ApprovalQueue } from '../../components/admin/ApprovalQueue';
import { GlobalDataView } from '../../components/admin/GlobalDataView';

export const SuperAdminDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { profile, logout } = useAuth();
  const { loading, stats, pendingDoctors, approveDoctor, rejectDoctor } = useSuperAdminData();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DATABASE'>('OVERVIEW');

  const handleLogout = () => {
    logout();
    onNavigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-500 animate-pulse">Syncing Global Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-500 border border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center text-blue-400 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Super Admin Console</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{profile?.name || 'System Administrator'}</h1>
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
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${
                activeTab === 'OVERVIEW' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={20} />
              Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('DATABASE')}
              className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${
                activeTab === 'DATABASE' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Database size={20} />
              Global Database View
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'OVERVIEW' && (
            <>
              <AnalyticsOverview stats={stats} />
              <ApprovalQueue pendingDoctors={pendingDoctors} onApprove={approveDoctor} onReject={rejectDoctor} />
            </>
          )}

          {activeTab === 'DATABASE' && (
            <GlobalDataView />
          )}
        </div>

      </div>

    </div>
  );
};
