import React, { createContext, useContext } from 'react';
import { NavLinksPill } from '../dashboard/NavLink';

// Figma doctor-dashboard tabs (Navbar - Dashboard / Default 317:13545): Overview / Queue / Appointments / Prescriptions / Analytics / Manage.
// Item `id` = the route the tab navigates to.
export const DOCTOR_TABS = [
  { id: '/doctor/dashboard', label: 'Overview' },
  { id: '/doctor/serial-manager', label: 'Queue' },
  { id: '/doctor/appointments', label: 'Appointments' },
  { id: '/doctor/prescription', label: 'Prescriptions' },
  { id: '/doctor/analytics', label: 'Analytics' },
  { id: '/doctor/practice-settings', label: 'Manage' },
];

// Routes that live inside a tab's section but are not the tab's own path (Figma keeps that tab highlighted:
// Manage stays active on Doctor Profile / Account pages).
const SECTION_OF: Record<string, string> = {
  '/doctor/profile': '/doctor/practice-settings',
  '/doctor/profile-editor': '/doctor/practice-settings',
  '/doctor/manual-booking': '/doctor/practice-settings',
};

/** Which doctor tab is highlighted for a route (`null` = none, e.g. /doctor/payment). */
export const getDoctorActiveTab = (path?: string): string | null => {
  if (!path) return null;
  if (DOCTOR_TABS.some(t => t.id === path)) return path;
  return SECTION_OF[path] ?? null;
};

/**
 * Layout renders the tabs in the shared navbar (Figma puts them in the white `Navlinks` pill of every page's navbar). While this context
 * is `true`, the per-page `<DoctorTabBar/>` copies still rendered inside individual doctor views render nothing, so the tabs never
 * appear twice. Outside Layout (or if a view is mounted standalone) the inline bar below still renders.
 */
export const DoctorNavbarContext = createContext(false);

export const DoctorTabBar: React.FC<{ currentPath?: string; onNavigate: (path: string) => void }> = ({ currentPath, onNavigate }) => {
  const inNavbar = useContext(DoctorNavbarContext);
  if (inNavbar) return null;
  return (
    <div className="mb-8 max-w-full overflow-x-auto hide-scrollbar">
      <NavLinksPill
        className="w-max"
        items={DOCTOR_TABS}
        activeId={getDoctorActiveTab(currentPath)}
        onSelect={onNavigate}
        ariaLabel="Doctor sections"
      />
    </div>
  );
};
