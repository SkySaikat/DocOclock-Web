import React, { useState } from 'react';
import { LayoutDashboard, Database, Pill, Settings, Building, Image, Palette, UserCheck } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';
import { AdminLayout, AdminNavItem } from '../../components/layout/AdminLayout';

import { AnalyticsOverview } from '../../components/admin/AnalyticsOverview';
import { ApprovalQueue } from '../../components/admin/ApprovalQueue';
import { GlobalDataView } from '../../components/admin/GlobalDataView';
import { MedicineManager } from '../../components/admin/MedicineManager';
import { HospitalManager } from '../../components/admin/HospitalManager';
import { HomepageManager } from '../../components/admin/HomepageManager';
import { BrandingSettings } from './BrandingSettings';

type TabType = 'OVERVIEW' | 'APPROVALS' | 'DATABASE' | 'HOSPITALS' | 'MEDICINES' | 'SETTINGS' | 'HOMEPAGE' | 'BRANDING';

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
        <div className="w-12 h-12 border-4 border-medical-200 border-t-medical-500 rounded-full animate-spin mb-4" />
        <p className="font-bold text-ink-500 animate-pulse">Syncing Global Data...</p>
      </div>
    );
  }

  const navItems: AdminNavItem[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'APPROVALS', label: 'Approvals', icon: UserCheck, badge: pendingDoctors.length },
    { id: 'HOSPITALS', label: 'Hospitals', icon: Building },
    { id: 'DATABASE', label: 'Database', icon: Database },
    { id: 'MEDICINES', label: 'Medicines', icon: Pill },
    { id: 'HOMEPAGE', label: 'Homepage', icon: Image },
    { id: 'BRANDING', label: 'Branding', icon: Palette },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <AdminLayout
      title="Super Admin"
      subtitle={profile?.name || profile?.full_name}
      navItems={navItems}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as TabType)}
      onLogout={handleLogout}
      onBrowsePublicSite={onBrowsePublicSite}
      recipientId={profile?.id}
      onNavigateNotification={onNavigate}
    >
      <div className="space-y-8">
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

        {activeTab === 'BRANDING' && (
          <BrandingSettings />
        )}

        {activeTab === 'SETTINGS' && (
          <div className="bg-white rounded-ds-lg p-8 shadow-ds-soft animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-ink-100 rounded-2xl flex items-center justify-center text-ink-600">
                <Settings size={24} />
              </div>
              <div>
                <h2 className="text-xl font-display font-black text-ink-800">Platform Settings</h2>
                <p className="text-sm font-bold text-ink-500">Manage global features and toggles</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Feature Toggle Card */}
              <div className="flex items-center justify-between p-6 border border-ink-200 rounded-ds-md bg-ink-50/50">
                <div>
                  <h3 className="font-display font-black text-ink-800 mb-1 flex items-center gap-2">
                    Location-Based Search
                    {platformSettings.location_search_enabled === 'true' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase tracking-widest font-black rounded-md">Active</span>
                    )}
                  </h3>
                  <p className="text-xs font-medium text-ink-500 max-w-md">
                    Enable or disable the "Find Doctors Near Me" feature for patients. When turned off, patients will not be prompted for their location and the feature will be hidden from the homepage.
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => updatePlatformSetting('location_search_enabled', platformSettings.location_search_enabled === 'true' ? 'false' : 'true')}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    platformSettings.location_search_enabled === 'true' ? 'bg-medical-500' : 'bg-ink-200'
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
    </AdminLayout>
  );
};
