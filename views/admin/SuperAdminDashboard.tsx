import React, { useState } from 'react';
import { ShieldCheck, LogOut, LayoutDashboard, Database, Pill, Activity, FileText, Users, Settings, Building, Image, Globe } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';

import { AnalyticsOverview } from '../../components/admin/AnalyticsOverview';
import { ApprovalQueue } from '../../components/admin/ApprovalQueue';
import { GlobalDataView } from '../../components/admin/GlobalDataView';
import { MedicineManager } from '../../components/admin/MedicineManager';
import { HospitalManager } from '../../components/admin/HospitalManager';
import { HomepageManager } from '../../components/admin/HomepageManager';

import { ReviewMonitor } from '../../components/hospital-admin/ReviewMonitor';
import { UserCheck } from 'lucide-react';

type TabType = 'OVERVIEW' | 'APPROVALS' | 'DATABASE' | 'HOSPITALS' | 'MEDICINES' | 'SETTINGS' | 'HOMEPAGE';

export const SuperAdminDashboard: React.FC<{ onNavigate: (path: string) => void; onBrowsePublicSite?: () => void }> = ({ onNavigate, onBrowsePublicSite }) => {
  const { profile, logout } = useAuth();
  const { loading, stats, pendingDoctors, platformSettings, approveDoctor, rejectDoctor, updatePlatformSetting, heroBanners, createHeroBanner, updateHeroBanner, deleteHeroBanner } = useSuperAdminData();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

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

  const tabs = [
    { id: 'OVERVIEW' as TabType, label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'APPROVALS' as TabType, label: 'Doctor Approvals', icon: UserCheck },
    { id: 'HOSPITALS' as TabType, label: 'Hospitals', icon: Building },
    { id: 'DATABASE' as TabType, label: 'Global Database', icon: Database },
    { id: 'MEDICINES' as TabType, label: 'Medicine Catalog', icon: Pill },
    { id: 'HOMEPAGE' as TabType, label: 'Homepage', icon: Image },
    { id: 'SETTINGS' as TabType, label: 'Platform Settings', icon: Settings },
  ];

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
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{profile?.name || profile?.full_name || 'System Administrator'}</h1>
              <p className="text-slate-400 text-xs font-medium mt-1">{profile?.email || 'superadmin@dococlock.com'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto">
            {onBrowsePublicSite && (
              <button
                onClick={onBrowsePublicSite}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl border border-blue-500/20 transition-all text-sm"
              >
                <Globe size={15} /> View Website
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all text-sm group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col gap-2 sticky top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex justify-between items-center p-4 rounded-xl font-bold transition-all text-left ${
                  activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={20} />
                  <span className="text-sm">{tab.label}</span>
                </div>
                {tab.id === 'APPROVALS' && pendingDoctors.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-sm shadow-red-500/20">
                    {pendingDoctors.length}
                  </span>
                )}
              </button>
            ))}

            {/* Quick Stats in Sidebar */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 px-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">
                  {pendingDoctors.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Users</span>
                <span className="text-xs font-black text-slate-700">
                  {(stats?.totalPatients || 0) + (stats?.totalDoctors || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospitals</span>
                <span className="text-xs font-black text-slate-700">{stats?.totalHospitals || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === 'OVERVIEW' && (
            <AnalyticsOverview stats={stats} />
          )}

          {activeTab === 'APPROVALS' && (
            <ApprovalQueue pendingDoctors={pendingDoctors} onApprove={approveDoctor} onReject={rejectDoctor} />
          )}

          {activeTab === 'DATABASE' && (
            <GlobalDataView />
          )}

          {activeTab === 'HOSPITALS' && (
            <HospitalManager />
          )}

          {activeTab === 'MEDICINES' && (
            <MedicineManager />
          )}

          {activeTab === 'HOMEPAGE' && (
            <HomepageManager
              banners={heroBanners}
              onCreate={createHeroBanner}
              onUpdate={updateHeroBanner}
              onDelete={deleteHeroBanner}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Platform Settings</h2>
                  <p className="text-sm font-bold text-slate-500">Manage global features and toggles</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Feature Toggle Card */}
                <div className="flex items-center justify-between p-6 border border-slate-200 rounded-2xl bg-slate-50/50">
                  <div>
                    <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                      Location-Based Search
                      {platformSettings.location_search_enabled === 'true' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase tracking-widest font-black rounded-md">Active</span>
                      )}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 max-w-md">
                      Enable or disable the "Find Doctors Near Me" feature for patients. When turned off, patients will not be prompted for their location and the feature will be hidden from the homepage.
                    </p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button 
                    onClick={() => updatePlatformSetting('location_search_enabled', platformSettings.location_search_enabled === 'true' ? 'false' : 'true')}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      platformSettings.location_search_enabled === 'true' ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        platformSettings.location_search_enabled === 'true' ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
