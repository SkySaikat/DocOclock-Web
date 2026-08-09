import React from 'react';

// Exact Figma doctor-dashboard tab bar (Queue / Appointments / Prescriptions / Analytics / Manage).
const TABS = [
  { label: 'Queue', path: '/doctor/serial-manager' },
  { label: 'Appointments', path: '/doctor/appointments' },
  { label: 'Prescriptions', path: '/doctor/prescription' },
  { label: 'Analytics', path: '/doctor/analytics' },
  { label: 'Manage', path: '/doctor/practice-settings' },
];

export const DoctorTabBar: React.FC<{ currentPath?: string; onNavigate: (path: string) => void }> = ({ currentPath, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto hide-scrollbar">
      {TABS.map((tab) => {
        const isActive = currentPath === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => onNavigate(tab.path)}
            className={`h-11 px-5 rounded-full text-[15px] font-medium whitespace-nowrap transition-colors shrink-0 ${isActive ? 'bg-medical-500 text-white font-semibold' : 'text-ink-500 hover:bg-ink-50'
              }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
