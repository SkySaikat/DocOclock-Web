import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Menu, X, Activity, Gift, User, Stethoscope, ShieldCheck, Globe, ArrowLeft, BarChart2, Settings, PlusCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Footer } from './Footer';
import { NotificationBell } from './ui/NotificationBell';
import { DashboardNavbar } from './dashboard/DashboardNavbar';
import { AvatarMenu, AvatarMenuItem } from './dashboard/AvatarMenu';
import { BottomTabBar, BottomTabItem } from './dashboard/BottomTabBar';
import { MaskIcon } from './dashboard/MaskIcon';
import { DS_ICONS } from './dashboard/assets';
import { DOCTOR_TABS, DoctorNavbarContext, getDoctorActiveTab } from './doctor/DoctorTabBar';
import './dashboard/dashboard.css';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
  onNavigate: (path: string) => void;
  onLoginClick?: (role: UserRole) => void;
  onRegisterClick?: () => void;
  hideMobileBottomNav?: boolean;
  currentPath?: string;
  browseMode?: boolean;
  onBrowsePublicSite?: () => void;
  onReturnToDashboard?: () => void;
}

// Exact Figma navbar tags (Doctor / Hospital / Lab&Diagnostic / Blogs / About us / Contact us)
const MARKETING_NAV_LINKS: { label: string; path: string }[] = [
  { label: 'Doctor', path: '/patient/doctors' },
  { label: 'Hospital', path: '/hospitals' },
  { label: 'Lab&Diagnostic', path: '/lab-diagnostics' },
  { label: 'Blogs', path: '/blogs' },
  { label: 'About us', path: '/about-us' },
  { label: 'Contact us', path: '/contact-us' },
];

// Figma Navbar - Dashboard / Patient (396:12117): Queue / Appointments / Medicines / Prescriptions.
// (Route of each tab; "Home" and "Profile" have no navbar slot in Figma — the logo goes home, the avatar menu opens the account page.)
const PATIENT_TABS = [
  { id: '/live-serial', label: 'Queue' },
  { id: '/patient/appointments', label: 'Appointments' },
  { id: '/patient/medicine-tracker', label: 'Medicines' },
  { id: '/patient/prescriptions', label: 'Prescriptions' },
];

// Phone bottom bar (Figma Card 4 570:20777): 4 tabs, icons are exported assets.
const DOCTOR_BOTTOM_TABS: BottomTabItem[] = [
  { id: '/doctor/dashboard', label: 'Overview', icon: DS_ICONS.grid, iconSize: 20 },
  { id: '/doctor/serial-manager', label: 'Queue', icon: DS_ICONS.queue },
  { id: '/doctor/appointments', label: 'Appointments', icon: DS_ICONS.calendar },
  { id: '/doctor/prescription', label: 'Prescriptions', icon: DS_ICONS.prescriptions, iconSize: 15 },
];
const PATIENT_BOTTOM_TABS: BottomTabItem[] = [
  { id: '/live-serial', label: 'Queue', icon: DS_ICONS.queue },
  { id: '/patient/appointments', label: 'Appointments', icon: DS_ICONS.calendar },
  { id: '/patient/medicine-tracker', label: 'Medicines', icon: DS_ICONS.pill },
  { id: '/patient/prescriptions', label: 'Prescriptions', icon: DS_ICONS.prescriptions, iconSize: 15 },
];

// Patient routes that show the public site (landing / doctor search / doctor profile) rather than a dashboard page.
const PATIENT_SITE_PATHS = ['/', '/index.html', '/patient/home', '/patient/doctors', '/patient/profile'];

const menuIcon = (src: string) => <MaskIcon src={src} size={20} className="text-content-secondary" />;

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, onNavigate, onLoginClick, onRegisterClick, hideMobileBottomNav, currentPath, browseMode, onBrowsePublicSite, onReturnToDashboard }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavCompact, setIsNavCompact] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { profile } = useAuth();

  // Public navbar shrinks on scroll-down, grows back on scroll-up (and gains a hairline shadow once content scrolls under it).
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 80) setIsNavCompact(true);
      else if (y < lastY) setIsNavCompact(false);
      setIsScrolled(y > 8);
      lastY = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile drawer: Escape closes it.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  const isPublic = !userRole;
  const isPatient = userRole === UserRole.PATIENT;
  const isDoctor = userRole === UserRole.DOCTOR;
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const isHospitalAdmin = userRole === UserRole.HOSPITAL_ADMIN;
  // All four admin-tier roles build their own chrome via the shared
  // <AdminLayout> (components/layout/AdminLayout.tsx) — Layout renders no
  // nav/footer for any of them so there's exactly one source of chrome.
  const isAdminTier = isSuperAdmin || isHospitalAdmin || userRole === UserRole.BRANCH_MANAGER || userRole === UserRole.ASSISTANT;

  if (isAdminTier && !browseMode) {
    return <div className="min-h-screen relative font-sans text-slate-800 bg-surface">{children}</div>;
  }

  const path = currentPath || '/';
  // Signed-in chrome (Figma "Navbar - Dashboard"): patients, doctors, and admins browsing the public site.
  const hasDashboardNav = isPatient || isDoctor || !!browseMode;
  const isDoctorConsole = isDoctor && !browseMode;
  const isPatientSitePage = isPatient && (PATIENT_SITE_PATHS.includes(path) || path.startsWith('/doctor/'));
  const showBottomBar = hasDashboardNav && !hideMobileBottomNav;

  // Page backgrounds (Figma root fills, tokens.md §1.5 / D9): Overview + Queue and the patient Queue use the two theme-derived gradients,
  // Prescriptions / patient Appointments + the public site sit on #fafafa (`page`), everything else on Fill Color (`surface`).
  let rootBg = 'bg-surface';
  if (isPublic || isPatientSitePage || browseMode) rootBg = 'bg-page'; // browse mode = the public site, so same page fill as a guest
  else if (isDoctorConsole && (path === '/doctor/dashboard' || path === '/doctor/serial-manager')) rootBg = 'bg-ds-page-overview';
  else if (isDoctorConsole && path === '/doctor/prescription') rootBg = 'bg-page';
  else if (isPatient && path === '/live-serial') rootBg = 'bg-ds-page-patient';
  else if (isPatient && path === '/patient/appointments') rootBg = 'bg-page';

  const goTo = (p: string) => () => onNavigate(p);

  const doctorMenu: AvatarMenuItem[] = [
    { id: 'account', label: 'My Account', icon: menuIcon(DS_ICONS.menuAccount), onSelect: goTo('/doctor/profile') },
    { id: 'payment', label: 'Payment History', icon: menuIcon(DS_ICONS.menuPayment), onSelect: goTo('/doctor/payment') },
    ...(onBrowsePublicSite ? [{ id: 'website', label: 'View Website', icon: <Globe size={20} strokeWidth={1.5} className="text-content-secondary" />, onSelect: () => onBrowsePublicSite() }] : []),
    // Reachability for the tabs the 4-tab phone bar (Figma) has no slot for — only shown below `lg`.
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} strokeWidth={1.5} className="text-content-secondary" />, onSelect: goTo('/doctor/analytics'), mobileOnly: true },
    { id: 'manage', label: 'Manage', icon: <Settings size={20} strokeWidth={1.5} className="text-content-secondary" />, onSelect: goTo('/doctor/practice-settings'), mobileOnly: true },
    { id: 'enroll', label: 'Enroll Patient', icon: <PlusCircle size={20} strokeWidth={1.5} className="text-content-secondary" />, onSelect: goTo('/doctor/manual-booking'), mobileOnly: true },
  ];
  const patientMenu: AvatarMenuItem[] = [
    { id: 'account', label: 'My Account', icon: menuIcon(DS_ICONS.menuAccount), onSelect: goTo('/patient/more') },
    { id: 'rewards', label: 'Rewards', icon: menuIcon(DS_ICONS.menuActivity), onSelect: goTo('/patient/rewards') },
  ];
  const browseMenu: AvatarMenuItem[] = [
    { id: 'account', label: 'My Account', icon: menuIcon(DS_ICONS.menuAccount), onSelect: goTo('/patient/more') },
  ];

  const navItems = isDoctorConsole ? DOCTOR_TABS : isPatient ? PATIENT_TABS : undefined;
  const activeNav = isDoctorConsole ? getDoctorActiveTab(path) : path;

  // Main column geometry: Figma `Body` = padding 48/64, content 1312 wide. index.css forces `main` padding-x to 24/40px (!important), so the
  // inner wrapper adds the missing 24px at md+ (24 + 40 = 64) and caps the column at 1312.
  const mainClass = hasDashboardNav
    ? `pt-6 ${hideMobileBottomNav ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-32 lg:pb-12'} mx-auto min-h-screen`
    : `pt-[calc(6.5rem+env(safe-area-inset-top))] ${hideMobileBottomNav ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-32'} max-w-7xl mx-auto min-h-screen`;
  // Only real dashboard screens get the 1312 column; the public site (guest, patient site pages, and browse mode = "viewing as visitor") stays full-bleed.
  const constrainColumn = isDoctorConsole || (isPatient && !isPatientSitePage);
  const innerClass = constrainColumn ? 'w-full max-w-[1360px] mx-auto md:px-6' : 'w-full';

  return (
    <div className={`min-h-screen relative font-sans text-slate-800 ${rootBg}`}>

      {/* NAVBAR — signed-in: in-flow Figma "Navbar - Dashboard"; public: Figma "Navbar/Default" floating pill. */}
      {hasDashboardNav ? (
        <DashboardNavbar
          onLogoClick={() => onNavigate('/')}
          navItems={navItems}
          activeId={activeNav}
          onSelectNav={onNavigate}
          hideWordmarkOnLg={isDoctorConsole}
        >
          <NotificationBell variant="dashboard" recipientId={profile?.id} onNavigate={onNavigate} />
          <AvatarMenu
            imageUrl={profile?.image}
            name={profile?.name}
            items={isDoctorConsole ? doctorMenu : isPatient ? patientMenu : browseMenu}
            logout={isDoctorConsole || isPatient ? { label: 'Logout', onSelect: () => onLogout?.() } : undefined}
          />
        </DashboardNavbar>
      ) : (
        /* Public navbar — pill 1224 x 68.73 (Figma 80:7430), white, no shadow at rest. Shrinks on scroll-down. */
        <nav className={`fixed top-0 w-full z-50 px-4 pointer-events-none transition-[padding] duration-300 ease-ds-out motion-reduce:transition-none ${isNavCompact ? 'pt-[calc(12px+env(safe-area-inset-top))] pb-2' : 'pt-[calc(16px+env(safe-area-inset-top))] md:pt-[calc(26px+env(safe-area-inset-top))] pb-4'}`}>
          <div className={`max-w-[1224px] mx-auto px-6 flex justify-between items-center rounded-full pointer-events-auto bg-white transition-all duration-300 ease-ds-out motion-reduce:transition-none ${isNavCompact ? 'h-[52px]' : 'h-[68.73px] py-3'} ${isScrolled ? 'shadow-ds-pill' : ''}`}>
            {/* Brand Logo — Figma Favicon 40x40 + "Dococlock" Inter Regular 16 */}
            <button type="button" aria-label="Dococlock home" className="flex items-center gap-2 cursor-pointer shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500" onClick={() => onNavigate('/')}>
              <img src={DS_ICONS.logoFavicon} alt="" width={40} height={40} className={`size-10 transition-transform duration-300 ease-ds-out motion-reduce:transition-none ${isNavCompact ? 'scale-90' : 'scale-100'}`} />
              <span className="font-inter font-normal text-[16px] leading-[normal] text-ink-800">Dococlock</span>
            </button>

            {/* Desktop Navigation — exact Figma navbar tags (Inter Regular 16, gap 44; tighter gap only at 1024-1099px where the fixed-width right group leaves no room) */}
            <div className="hidden lg:flex items-center gap-8 min-[1100px]:gap-[44px]">
              {MARKETING_NAV_LINKS.map(link => (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className="font-inter font-normal text-[16px] leading-none text-ink-800 hover:text-primary-600 focus-visible:text-primary-600 transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none whitespace-nowrap cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>
            {/* Right group — fixed 179.78px wide like Figma's Frame 1000012132 (Login at x=0, Buttons slot at x=66 / 113.78 wide) so the
                Register expand/collapse never changes any sibling's position. */}
            <div className="hidden md:flex items-center gap-5 w-[179.78px] shrink-0">
              <button onClick={() => onLoginClick?.(UserRole.PATIENT)} className="w-[46px] shrink-0 text-left font-inter font-normal text-[16px] leading-none text-ink-800 hover:text-primary-600 focus-visible:text-primary-600 transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none cursor-pointer">
                Login
              </button>
              {/* Reserved 113.78px slot: the circle stays right-aligned and the label expands leftwards inside it. */}
              <div className="w-[113.78px] shrink-0 flex justify-end">
                {/* Figma's "Button Featured Hover" (80:4763): collapses to a 43.78 x 44.73 icon-only circle by default and expands to 113.78 wide
                    with the "Register" label on hover / keyboard focus — 300ms EASE_OUT, label fades in while the width grows. */}
                <button
                  onClick={() => onRegisterClick?.()}
                  aria-label="Register"
                  className="group inline-flex items-center h-[44.73px] rounded-full overflow-hidden text-white bg-gradient-to-b from-primary-400 to-primary-600 cursor-pointer btn-sheen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  <span className="grid grid-cols-[0fr] opacity-0 -mr-0 transition-[grid-template-columns,margin,opacity] duration-ds-fast ease-ds-out motion-reduce:transition-none group-hover:grid-cols-[1fr] group-hover:opacity-100 group-hover:-mr-2 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100 group-focus-visible:-mr-2">
                    <span className="min-w-0 overflow-hidden">
                      <span className="block whitespace-nowrap pl-4 font-display text-[16px] leading-[normal]">Register</span>
                    </span>
                  </span>
                  <img src="/assets/figma/booking-arrow-right-btn.svg" alt="" width={43.78} height={44.73} className="relative z-[1] w-[43.78px] h-[44.73px] shrink-0" />
                </button>
              </div>
            </div>

            {/* Mobile UI Controls */}
            <button
              className="lg:hidden text-content-secondary p-2 rounded-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </nav>
      )}

      {/* MOBILE PREMIUM DRAWER (Contextual Sidebar) — public visitors only */}
      {isPublic && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          {/* Scrim — Figma overlay scrim is 25% black */}
          <div
            className="absolute inset-0 bg-black/25 ds-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="ds-drawer-in absolute right-0 top-0 h-full w-[85%] max-w-[320px] bg-white shadow-ds-modal flex flex-col font-display">
            {/* Drawer Header */}
            <div className="p-6 flex justify-between items-center border-b border-ink-100">
              <img src={DS_ICONS.logoFavicon} alt="" width={40} height={40} className="size-10" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 hover:bg-ink-100 rounded-xl transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none text-content-secondary cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
              {/* Navigation — exact Figma navbar tags */}
              <div className="space-y-1">
                {MARKETING_NAV_LINKS.map(link => (
                  <button
                    key={link.path}
                    onClick={() => { onNavigate(link.path); setIsMobileMenuOpen(false); }}
                    className="w-full text-left p-3 rounded-xl hover:bg-ink-50 text-ink-800 font-inter font-normal text-[16px] transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none cursor-pointer"
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              {/* Account Section */}
              <div className="space-y-4 pt-4 border-t border-ink-100">
                <h3 className="text-[12px] font-medium text-content-tertiary px-1">Switch Account</h3>
                <div className="grid gap-3">
                  <button
                    onClick={() => { onRegisterClick?.(); setIsMobileMenuOpen(false); }}
                    className="btn-sheen w-full h-12 rounded-full text-white flex items-center justify-center font-display text-[16px] bg-gradient-to-b from-primary-400 to-primary-600 cursor-pointer"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => { onLoginClick?.(UserRole.PATIENT); setIsMobileMenuOpen(false); }}
                    className="w-full p-4 rounded-2xl bg-primary-500 text-white flex items-center gap-4 cursor-pointer"
                  >
                    <div className="bg-white/20 p-2 rounded-lg">
                      <User size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-medium leading-none mb-1">Patient Portal</p>
                      <p className="text-[12px] opacity-80">Book & Track Serial</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { onNavigate('/doctor-login'); setIsMobileMenuOpen(false); }}
                    className="w-full p-4 rounded-2xl bg-white border border-ink-200 text-content-primary flex items-center gap-4 hover:border-primary-500 transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none cursor-pointer"
                  >
                    <div className="bg-ink-50 p-2 rounded-lg text-primary-500">
                      <Stethoscope size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-medium leading-none mb-1">Doctor Portal</p>
                      <p className="text-[12px] text-content-tertiary">Queue & Prescriptions</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Supporting Links */}
              <div className="space-y-4 pt-4 border-t border-ink-100">
                <h3 className="text-[12px] font-medium text-content-tertiary px-1">Resources</h3>
                <div className="space-y-1">
                  {[
                    { icon: Activity, label: 'About DocOclock' },
                    { icon: Gift, label: 'Help & Support' },
                    { icon: ShieldCheck, label: 'Privacy Policy' }
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center gap-4 p-3 hover:bg-ink-50 rounded-xl transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none text-content-secondary group cursor-pointer">
                      <item.icon size={16} className="text-content-tertiary group-hover:text-primary-500" />
                      <span className="text-[14px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-ink-100 text-center">
              <p className="text-[12px] text-content-tertiary">© {new Date().getFullYear()} DocOclock v2.0</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className={mainClass}>
        <div className={innerClass}>
          {/* While the doctor navbar shows the tabs, per-page <DoctorTabBar/> copies render nothing (see DoctorTabBar.tsx). */}
          <DoctorNavbarContext.Provider value={isDoctorConsole}>
            {children}
          </DoctorNavbarContext.Provider>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* BROWSE MODE BANNER — shown when admin/doctor views the public site */}
      {browseMode && onReturnToDashboard && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-content-primary/95 backdrop-blur-md text-white pl-4 pr-2 py-2 rounded-2xl shadow-2xl border border-white/10 text-sm whitespace-nowrap">
          <Globe size={14} className="text-primary-400 shrink-0" />
          <span className="font-medium text-content-disabled text-xs">Viewing as visitor</span>
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none cursor-pointer"
          >
            <ArrowLeft size={12} /> Dashboard
          </button>
        </div>
      )}

      {/* PHONE / TABLET BOTTOM BAR — Figma Card 4 (570:20777). Desktop uses the navbar tabs instead. */}
      {showBottomBar && (
        <BottomTabBar
          className="lg:hidden"
          items={isDoctorConsole ? DOCTOR_BOTTOM_TABS : PATIENT_BOTTOM_TABS}
          activeId={isDoctorConsole ? getDoctorActiveTab(path) : path}
          onSelect={onNavigate}
        />
      )}
    </div>
  );
};
