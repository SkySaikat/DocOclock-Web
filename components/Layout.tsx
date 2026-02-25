import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { LogOut, Menu, X, Users, Home, FileText, Calendar, Activity, Gift, MoreHorizontal, User, ChevronDown, Stethoscope, BriefcaseMedical, BarChart2, ClipboardList, LayoutDashboard, Pill, UserCircle, PlusCircle, ShieldCheck, Settings, Wallet } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
  onNavigate: (path: string) => void;
  onLoginClick?: (role: UserRole) => void;
  hideMobileBottomNav?: boolean;
  currentPath?: string;
}

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0EA5E9" />
        <stop offset="1" stopColor="#14B8A6" />
      </linearGradient>
    </defs>
    <path d="M30 35 C 30 20, 70 20, 70 35" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="50" r="35" stroke="url(#logoGradient)" strokeWidth="4" strokeOpacity="0.3" fill="white" />
    <path d="M20 50 C 20 80, 50 85, 50 85" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="85" r="6" fill="url(#logoGradient)" />
    <path d="M50 50 L 35 40" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
    <path d="M50 50 L 65 40" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="50" r="4" fill="#0F172A" />
    <g transform="translate(70, 20)">
      <rect x="0" y="8" width="24" height="6" rx="3" fill="#38BDF8" />
      <rect x="9" y="-1" width="6" height="24" rx="3" fill="#38BDF8" />
    </g>
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, onNavigate, onLoginClick, hideMobileBottomNav, currentPath }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isDoctorProfileOpen, setIsDoctorProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLoginDropdownOpen(false);
      }
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node)) {
        setIsDoctorProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPublic = !userRole;
  const isPatient = userRole === UserRole.PATIENT;
  const isDoctor = userRole === UserRole.DOCTOR;

  return (
    <div className="min-h-screen relative font-sans text-slate-800 bg-medical-50">

      {/* NAVBAR (TOP) - Added safe area top padding */}
      <nav className="fixed top-0 w-full z-50 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 pointer-events-none">
        <div className="glass-panel max-w-7xl mx-auto rounded-[24px] px-6 py-3 flex justify-between items-center h-14 shadow-premium pointer-events-auto border-medical-100/50">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => onNavigate('/')}>
            <Logo />
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-600">
              DocOclock
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {isPublic && (
              <>
                <button onClick={() => onNavigate('/for-doctors')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors">
                  <BriefcaseMedical size={18} /> For Doctors
                </button>
                <div ref={dropdownRef} className="relative">
                  <Button onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)} className="gap-2 px-6 font-black h-11 rounded-xl shadow-lg shadow-blue-100">
                    Login <ChevronDown size={16} className={`transition-transform ${isLoginDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {isLoginDropdownOpen && (
                    <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in z-[60]">
                      <button onClick={() => { onLoginClick?.(UserRole.PATIENT); setIsLoginDropdownOpen(false); }} className="w-full text-left p-4 hover:bg-slate-50 flex items-center gap-3 font-bold text-slate-700">
                        <User size={18} className="text-blue-500" /> Patient Portal
                      </button>
                      <button onClick={() => { onNavigate('/doctor-login'); setIsLoginDropdownOpen(false); }} className="w-full text-left p-4 hover:bg-slate-50 flex items-center gap-3 font-bold text-slate-700 border-t border-slate-50">
                        <Stethoscope size={18} className="text-teal-500" /> Doctor Portal
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isPatient && (
              <>
                <button onClick={() => onNavigate('/patient/home')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-blue-50 transition-all">
                  <Home size={18} /> Home
                </button>
                <button onClick={() => onNavigate('/patient/medicine-tracker')} className="font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-indigo-50 transition-all">
                  <Pill size={18} /> Meds
                </button>
                <button onClick={() => onNavigate('/patient/appointments')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-blue-50 transition-all">
                  <Calendar size={18} /> Appointments
                </button>
                <button onClick={() => onNavigate('/patient/prescriptions')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-blue-50 transition-all">
                  <FileText size={18} /> Rx
                </button>
                <button onClick={() => onNavigate('/patient/more')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-blue-50 transition-all">
                  <UserCircle size={18} /> Profile
                </button>
              </>
            )}

            {isDoctor && (
              <div className="flex items-center gap-4 lg:gap-6">
                <button onClick={() => onNavigate('/doctor/dashboard')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                <button onClick={() => onNavigate('/doctor/serial-manager')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <Users size={18} /> Queue
                </button>
                <button onClick={() => onNavigate('/doctor/prescription')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <FileText size={18} /> RX
                </button>

                {/* Doctor Profile Dropdown */}
                <div ref={doctorDropdownRef} className="relative ml-2">
                  <button
                    onClick={() => setIsDoctorProfileOpen(!isDoctorProfileOpen)}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-100 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 overflow-hidden">
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
                </div>
              </div>
            )}
          </div>

          {/* Mobile UI Controls */}
          {isPublic && (
            <button className="md:hidden text-slate-700 p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          )}
          {(isPatient || isDoctor) && (
            <button
              className="md:hidden w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden hover:bg-slate-200 transition-colors"
              onClick={() => onNavigate(isPatient ? '/patient/more' : '/doctor/profile')}
            >
              {isPatient ? <UserCircle size={20} /> : <Menu size={20} />}
            </button>
          )}

        </div>
      </nav>

      {/* MOBILE PREMIUM DRAWER (Contextual Sidebar) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
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
              {/* Account Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Switch Account</h3>
                <div className="grid gap-3">
                  <button
                    onClick={() => { onLoginClick?.(UserRole.PATIENT); setIsMobileMenuOpen(false); }}
                    className="w-full p-4 rounded-[16px] bg-blue-600 text-white flex items-center gap-4 group transition-all active:scale-95 shadow-lg shadow-blue-500/20"
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
                    className="w-full p-4 rounded-[16px] bg-white border border-slate-200 text-slate-900 flex items-center gap-4 hover:border-blue-600 transition-all active:scale-95"
                  >
                    <div className="bg-slate-50 p-2 rounded-lg text-blue-600">
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
                      <item.icon size={16} className="text-slate-400 group-hover:text-blue-600" />
                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2024 DocOclock v2.0</p>
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

      {/* DOCTOR MOBILE BOTTOM NAV - FLOATING DOCK - Respects safe area bottom */}
      {isDoctor && !hideMobileBottomNav && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl px-2 flex justify-around items-center h-16 rounded-[32px] ring-1 ring-white/5">
            <button onClick={() => onNavigate('/doctor/dashboard')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-slate-400 hover:text-white transition-all">
              <LayoutDashboard size={20} /> <span className="scale-90">Dash</span>
            </button>
            <button onClick={() => onNavigate('/doctor/serial-manager')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-slate-400 hover:text-white transition-all">
              <Users size={20} /> <span className="scale-90">Queue</span>
            </button>
            <button onClick={() => onNavigate('/doctor/manual-booking')} className="flex flex-col items-center gap-1 font-bold text-[10px] text-blue-400 hover:text-blue-300 transition-all">
              <PlusCircle size={22} className="shadow-lg shadow-blue-500/20" /> <span className="scale-90">Enroll</span>
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
      {isPatient && !hideMobileBottomNav && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[340px] z-50">
          <div className="bg-white border-t border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] px-1.5 flex justify-around items-center h-[54px] rounded-[20px]">
            {[
              { path: '/patient/home', icon: Home, label: 'Home' },
              { path: '/patient/appointments', icon: Calendar, label: 'Apps' },
              { path: '/patient/medicine-tracker', icon: Pill, label: 'Meds' },
              { path: '/patient/prescriptions', icon: FileText, label: 'Rx' }
            ].map((item) => {
              const isActive = (currentPath || window.location.pathname) === item.path || (item.path === '/patient/home' && ((currentPath || window.location.pathname) === '/' || (currentPath || window.location.pathname) === '/index.html'));
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className="relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 group"
                >
                  <div className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-blue-50/60 shadow-sm shadow-blue-500/5 text-blue-600' : 'text-slate-400'}`}>
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