import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { LogOut, Menu, X, Users, Home, FileText, Calendar, Activity, Gift, MoreHorizontal, User, ChevronDown, Stethoscope, BriefcaseMedical, BarChart2, ClipboardList, LayoutDashboard, Pill, UserCircle, PlusCircle, ShieldCheck, Settings, Wallet, Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';
import { Footer } from './Footer';
import { NotificationBell } from './ui/NotificationBell';

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
  { label: 'Doctor', path: '/for-doctors' },
  { label: 'Hospital', path: '/hospitals' },
  { label: 'Lab&Diagnostic', path: '/lab-diagnostics' },
  { label: 'Blogs', path: '/blogs' },
  { label: 'About us', path: '/about-us' },
  { label: 'Contact us', path: '/contact-us' },
];

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#88BEFF" />
        <stop offset="1" stopColor="#2E8CFF" />
      </linearGradient>
    </defs>
    <path d="M30 35 C 30 20, 70 20, 70 35" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="50" r="35" stroke="url(#logoGradient)" strokeWidth="4" strokeOpacity="0.3" fill="white" />
    <path d="M20 50 C 20 80, 50 85, 50 85" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="85" r="6" fill="url(#logoGradient)" />
    <path d="M50 50 L 35 40" stroke="#171717" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 50 L 65 40" stroke="#171717" strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="50" r="4" fill="#171717" />
    <g transform="translate(70, 20)">
      <rect x="0" y="8" width="24" height="6" rx="3" fill="#2E8CFF" />
      <rect x="9" y="-1" width="6" height="24" rx="3" fill="#2E8CFF" />
    </g>
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, onNavigate, onLoginClick, onRegisterClick, hideMobileBottomNav, currentPath, browseMode, onBrowsePublicSite, onReturnToDashboard }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDoctorProfileOpen, setIsDoctorProfileOpen] = useState(false);
  const [isNavCompact, setIsNavCompact] = useState(false);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
        setIsDoctorProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navbar shrinks on scroll-down, grows back on scroll-up.
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 80) setIsNavCompact(true);
      else if (y < lastY) setIsNavCompact(false);
      lastY = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isPublic = !userRole;
  const isPatient = userRole === UserRole.PATIENT;
  const isDoctor = userRole === UserRole.DOCTOR;
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const isHospitalAdmin = userRole === UserRole.HOSPITAL_ADMIN;

  if ((isSuperAdmin || isHospitalAdmin) && !browseMode) {
    return <div className="min-h-screen relative font-sans text-slate-800 bg-slate-50 py-10">{children}</div>;
  }

  return (
    <div className="min-h-screen relative font-sans text-slate-800 bg-medical-50">

      {/* NAVBAR (TOP) - Added safe area top padding. Shrinks on scroll-down, grows on scroll-up. */}
      <nav className={`fixed top-0 w-full z-50 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pointer-events-none transition-[padding] duration-300 ${isNavCompact ? 'pb-2' : 'pb-4'}`}>
        <div className={`max-w-7xl mx-auto px-6 flex justify-between items-center rounded-full pointer-events-auto transition-all duration-300 ${isNavCompact ? 'h-11 py-2' : 'h-14 py-3'} ${isPublic ? 'bg-white shadow-ds-pill' : 'glass-panel shadow-premium border-medical-100/50'}`}>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => onNavigate('/')}>
            <div className={`transition-transform duration-300 ${isNavCompact ? 'scale-75' : 'scale-100'}`}>
              <Logo />
            </div>
            <span className={`font-display font-bold tracking-tight text-ink-800 transition-all duration-300 ${isNavCompact ? 'text-lg' : 'text-2xl'}`}>
              DocOclock
            </span>
          </div>

          {/* Desktop Navigation — exact Figma navbar tags */}
          <div className="hidden lg:flex items-center gap-[44px]">
            {isPublic && MARKETING_NAV_LINKS.map(link => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className="font-normal text-[16px] leading-none text-ink-800 hover:text-medical-600 transition-colors whitespace-nowrap"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-5">
            {isPublic && (
              <>
                <button onClick={() => onLoginClick?.(UserRole.PATIENT)} className="font-normal text-[16px] text-ink-800 hover:text-medical-600 transition-colors">
                  Login
                </button>
                <button
                  onClick={() => onRegisterClick?.()}
                  className="inline-flex items-center rounded-full text-white overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #88BEFF 0%, #2E8CFF 100%)' }}
                >
                  <span className="pl-4 pr-0 text-[16px] font-display">Register</span>
                  <span className="flex items-center justify-center px-[18px] py-4">
                    <ArrowRight size={14} />
                  </span>
                </button>
              </>
            )}

            {isPatient && (
              <>
                <button onClick={() => onNavigate('/patient/home')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-medical-50 transition-all">
                  <Home size={18} /> Home
                </button>
                <button onClick={() => onNavigate('/patient/medicine-tracker')} className="font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-indigo-50 transition-all">
                  <Pill size={18} /> Meds
                </button>
                <button onClick={() => onNavigate('/patient/appointments')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-medical-50 transition-all">
                  <Calendar size={18} /> Appointments
                </button>
                <button onClick={() => onNavigate('/patient/prescriptions')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-medical-50 transition-all">
                  <FileText size={18} /> Rx
                </button>
                <button onClick={() => onNavigate('/patient/more')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-medical-50 transition-all">
                  <UserCircle size={18} /> Profile
                </button>
                <NotificationBell recipientId={profile?.id} onNavigate={onNavigate} />
              </>
            )}

            {(isDoctor || (browseMode && (isSuperAdmin || isHospitalAdmin))) && (
              <div className="flex items-center gap-4 lg:gap-6">
                {isDoctor && !browseMode && (
                  <>
                    <button onClick={() => onNavigate('/doctor/dashboard')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-medical-50 transition-all">
                      <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button onClick={() => onNavigate('/doctor/serial-manager')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-medical-50 transition-all">
                      <Users size={18} /> Queue
                    </button>
                    <button onClick={() => onNavigate('/doctor/prescription')} className="font-bold text-slate-600 hover:text-medical-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-medical-50 transition-all">
                      <FileText size={18} /> RX
                    </button>
                  </>
                )}
                <NotificationBell recipientId={profile?.id} onNavigate={onNavigate} />

                {/* Doctor Profile Dropdown */}
                {isDoctor && !browseMode && <div ref={doctorDropdownRef} className="relative ml-2">
                  <button
                    onClick={() => setIsDoctorProfileOpen(!isDoctorProfileOpen)}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-medical-50 hover:border-medical-100 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-medical-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-medical-500/20 overflow-hidden">
                      {profile?.image ? <img src={profile.image} alt="" className="w-full h-full object-cover" /> : <User size={16} />}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-[11px] font-black text-slate-900 leading-none mb-0.5">{profile?.name || 'Dr. Account'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Settings</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDoctorProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDoctorProfileOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]">
                      <div className="p-4 bg-teal-50/50 border-b border-slate-50">
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Authenticated As</p>
                        <p className="text-[13px] font-black text-slate-900 truncate">{profile?.name || 'Doctor'}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">BMDC: {profile?.bmdcNumber || profile?.bmdc_number || 'Verified'}</p>
                      </div>
                      <div className="p-2 flex flex-col gap-1">
                        <button
                          onClick={() => { onNavigate('/doctor/profile'); setIsDoctorProfileOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-teal-50/50 rounded-2xl transition-all text-slate-700 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-100 transition-all">
                            <UserCircle size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-[13px] leading-tight group-hover:text-teal-700">My Profile</p>
                            <p className="text-[10px] text-slate-400 font-bold">Personal Settings</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { onNavigate('/doctor/analytics'); setIsDoctorProfileOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-teal-50/50 rounded-2xl transition-all text-slate-700 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-100 transition-all">
                            <Wallet size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-[13px] leading-tight group-hover:text-teal-700">Earnings & Payments</p>
                            <p className="text-[10px] text-slate-400 font-bold">Financial Options</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { onNavigate('/doctor/practice-settings'); setIsDoctorProfileOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-teal-50/50 rounded-2xl transition-all text-slate-700 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-100 transition-all">
                            <Settings size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-[13px] leading-tight group-hover:text-teal-700">Chamber Settings</p>
                            <p className="text-[10px] text-slate-400 font-bold">Schedule & Fees</p>
                          </div>
                        </button>

                        <div className="my-1.5 h-px bg-slate-100 mx-2" />

                        {onBrowsePublicSite && (
                          <button
                            onClick={() => { onBrowsePublicSite(); setIsDoctorProfileOpen(false); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-medical-50/60 rounded-2xl transition-all text-slate-700 group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-medical-600 group-hover:border-medical-100 transition-all">
                              <Globe size={18} />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-[13px] leading-tight group-hover:text-medical-700">View Website</p>
                              <p className="text-[10px] text-slate-400 font-bold">Browse as patient</p>
                            </div>
                          </button>
                        )}

                        <div className="my-1.5 h-px bg-slate-100 mx-2" />

                        <button
                          onClick={() => { onLogout?.(); setIsDoctorProfileOpen(false); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-2xl transition-all text-red-600 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white border border-red-50 flex items-center justify-center text-red-400 group-hover:text-red-600 group-hover:border-red-100 transition-all shadow-sm shadow-red-50/50">
                            <LogOut size={18} />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-[13px] leading-tight">Exit Portal</p>
                            <p className="text-[10px] text-red-400 font-bold">Log out safely</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>}
              </div>
            )}
          </div>

          {/* Mobile UI Controls */}
          {isPublic && (
            <button className="lg:hidden text-slate-700 p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          )}
          {(isPatient || isDoctor || browseMode) && (
            <div className="md:hidden flex items-center gap-1">
              <NotificationBell recipientId={profile?.id} onNavigate={onNavigate} />
              <button
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden hover:bg-slate-200 transition-colors"
                onClick={() => onNavigate(isPatient || browseMode ? '/patient/more' : '/doctor/profile')}
              >
                {isPatient || browseMode ? <UserCircle size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}

        </div>
      </nav>

      {/* MOBILE PREMIUM DRAWER (Contextual Sidebar) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop Blur & Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-100 flex flex-col">
            {/* Drawer Header */}
            <div className="p-6 flex justify-between items-center border-b border-slate-50">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <UserCircle size={24} />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
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
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-ink-800 font-medium text-[15px] transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              {/* Account Section */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Switch Account</h3>
                <div className="grid gap-3">
                  <button
                    onClick={() => { onRegisterClick?.(); setIsMobileMenuOpen(false); }}
                    className="w-full p-4 rounded-[16px] text-white flex items-center justify-center gap-2 font-display font-semibold active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(180deg, #88BEFF 0%, #2E8CFF 100%)' }}
                  >
                    Register <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => { onLoginClick?.(UserRole.PATIENT); setIsMobileMenuOpen(false); }}
                    className="w-full p-4 rounded-[16px] bg-medical-600 text-white flex items-center gap-4 group transition-all active:scale-95 shadow-lg shadow-medical-500/20"
                  >
                    <div className="bg-white/20 p-2 rounded-lg">
                      <User size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Patient Portal</p>
                      <p className="text-[10px] opacity-70 font-medium">Book & Track Serial</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { onNavigate('/doctor-login'); setIsMobileMenuOpen(false); }}
                    className="w-full p-4 rounded-[16px] bg-white border border-slate-200 text-slate-900 flex items-center gap-4 hover:border-medical-600 transition-all active:scale-95"
                  >
                    <div className="bg-slate-50 p-2 rounded-lg text-medical-600">
                      <Stethoscope size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Doctor Portal</p>
                      <p className="text-[10px] text-slate-400 font-medium">Queue & Prescriptions</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Supporting Links */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Resources</h3>
                <div className="space-y-1">
                  {[
                    { icon: Activity, label: 'About DocOclock' },
                    { icon: Gift, label: 'Help & Support' },
                    { icon: ShieldCheck, label: 'Privacy Policy' }
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 group">
                      <item.icon size={16} className="text-slate-400 group-hover:text-medical-600" />
                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© {new Date().getFullYear()} DocOclock v2.0</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA - Accounts for safe area top */}
      <main className={`pt-[calc(6.5rem+env(safe-area-inset-top))] ${hideMobileBottomNav ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-32'} max-w-7xl mx-auto min-h-screen`}>
        <div className="w-full">
          {children}
        </div>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* BROWSE MODE BANNER — shown when admin/doctor views the public site */}
      {browseMode && onReturnToDashboard && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white pl-4 pr-2 py-2 rounded-2xl shadow-2xl border border-white/10 text-sm whitespace-nowrap">
          <Globe size={14} className="text-medical-400 shrink-0" />
          <span className="font-bold text-slate-300 text-xs">Viewing as visitor</span>
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-colors"
          >
            <ArrowLeft size={12} /> Dashboard
          </button>
        </div>
      )}

      {/* DOCTOR MOBILE BOTTOM NAV - FLOATING DOCK - Respects safe area bottom */}
      {isDoctor && !hideMobileBottomNav && !browseMode && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl px-2 flex justify-around items-center h-16 rounded-[32px] ring-1 ring-white/5">
            <button onClick={() => onNavigate('/doctor/dashboard')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-slate-400 hover:text-white transition-all">
              <LayoutDashboard size={20} /> <span className="scale-90">Dash</span>
            </button>
            <button onClick={() => onNavigate('/doctor/serial-manager')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-slate-400 hover:text-white transition-all">
              <Users size={20} /> <span className="scale-90">Queue</span>
            </button>
            <button onClick={() => onNavigate('/doctor/manual-booking')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-medical-400 hover:text-medical-300 transition-all">
              <PlusCircle size={22} className="shadow-lg shadow-medical-500/20" /> <span className="scale-90">Enroll</span>
            </button>
            <button onClick={() => onNavigate('/doctor/prescription')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-slate-400 hover:text-white transition-all">
              <FileText size={20} /> <span className="scale-90">Rx</span>
            </button>
            <button onClick={() => onNavigate('/doctor/analytics')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-slate-400 hover:text-white transition-all">
              <BarChart2 size={20} /> <span className="scale-90">Analytics</span>
            </button>
          </div>
        </div>
      )}

      {/* PATIENT MOBILE BOTTOM NAV - REFINED PREMIUM DOCK - Respects safe area bottom */}
      {(isPatient || browseMode) && !hideMobileBottomNav && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[340px] z-50">
          <div className="bg-white border-t border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] px-1.5 flex justify-around items-center h-[54px] rounded-[20px]">
            {[
              { path: '/patient/home', icon: Home, label: 'Home' },
              { path: '/patient/appointments', icon: Calendar, label: 'Apps' },
              { path: '/patient/medicine-tracker', icon: Pill, label: 'Meds' },
              { path: '/patient/prescriptions', icon: FileText, label: 'Rx' }
            ].map((item) => {
              const isActive = (currentPath || '/') === item.path || (item.path === '/patient/home' && ((currentPath || '/') === '/' || (currentPath || '/') === '/index.html'));
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="relative flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] transition-all duration-300 group"
                >
                  <div className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-medical-50/60 shadow-sm shadow-medical-500/5 text-medical-600' : 'text-slate-400'}`}>
                    <item.icon
                      size={isActive ? 19 : 18}
                      className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};