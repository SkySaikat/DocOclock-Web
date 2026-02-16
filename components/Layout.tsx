import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { LogOut, Menu, X, Users, Home, FileText, Calendar, Activity, Gift, MoreHorizontal, User, ChevronDown, Stethoscope, BriefcaseMedical, BarChart2, ClipboardList, LayoutDashboard, Pill, UserCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
  onNavigate: (path: string) => void;
  onLoginClick?: (role: UserRole) => void;
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

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, onNavigate, onLoginClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLoginDropdownOpen(false);
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

      {/* NAVBAR (TOP) */}
      <nav className="fixed top-0 w-full z-50 px-4 py-4 pointer-events-none">
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
              <>
                <button onClick={() => onNavigate('/doctor/dashboard')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                <button onClick={() => onNavigate('/doctor/serial-manager')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <Users size={18} /> Queue
                </button>
                <button onClick={() => onNavigate('/doctor/prescription')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <FileText size={18} /> RX
                </button>
                <button onClick={() => onNavigate('/doctor/analytics')} className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-blue-50 transition-all">
                  <BarChart2 size={18} /> Analytics
                </button>
                <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-black hover:text-red-700 bg-red-50 px-4 py-2 rounded-xl transition ml-2">
                  <LogOut size={18} /> Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile UI Controls */}
          {isPublic && (
            <button className="md:hidden text-slate-700 p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          )}
          {(isPatient || isDoctor) && (
            <button className="md:hidden w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500" onClick={() => onNavigate(isPatient ? '/patient/medicine-tracker' : '/doctor/analytics')}>
              {isPatient ? <Pill size={20} /> : <BarChart2 size={20} />}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE OVERLAY MENU (Public Sidebar) */}
      {isMobileMenuOpen && isPublic && (
        <div className="fixed inset-0 z-[45] bg-white/95 backdrop-blur-xl pt-24 px-8 flex flex-col gap-4 animate-fade-in md:hidden">
          <button onClick={() => { onNavigate('/for-doctors'); setIsMobileMenuOpen(false); }} className="w-full text-left py-4 text-xl font-black border-b border-slate-100 flex justify-between items-center">
            For Doctors <BriefcaseMedical size={20} />
          </button>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => { onLoginClick?.(UserRole.PATIENT); setIsMobileMenuOpen(false); }} fullWidth className="h-14 text-lg font-black">Patient Login</Button>
            <Button variant="outline" onClick={() => { onNavigate('/doctor-login'); setIsMobileMenuOpen(false); }} fullWidth className="h-14 text-lg font-black border-2">Doctor Login</Button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="pt-24 px-4 pb-28 md:pb-12 max-w-7xl mx-auto min-h-screen">
        {children}
      </main>

      {/* DOCTOR MOBILE BOTTOM NAV - FLOATING PREMIUM */}
      {isDoctor && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-premium px-2 flex justify-around items-center h-14 rounded-[28px]">
            <button onClick={() => onNavigate('/doctor/dashboard')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-400 transition-colors">
              <LayoutDashboard size={18} /> Dash
            </button>
            <button onClick={() => onNavigate('/doctor/serial-manager')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-400 transition-colors">
              <Users size={18} /> Queue
            </button>
            <button onClick={() => onNavigate('/doctor/prescription')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-400 transition-colors">
              <FileText size={18} /> Rx
            </button>
            <button onClick={() => onNavigate('/doctor/manual-booking')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-400 transition-colors">
              <ClipboardList size={18} /> Book
            </button>
            <button onClick={onLogout} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-red-400 active:text-red-500 transition-colors">
              <LogOut size={18} /> Exit
            </button>
          </div>
        </div>
      )}

      {/* PATIENT MOBILE BOTTOM NAV - FLOATING PREMIUM */}
      {isPatient && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
          <div className="bg-white/95 backdrop-blur-2xl border border-medical-100 shadow-premium px-2 flex justify-around items-center h-14 rounded-[28px]">
            <button onClick={() => onNavigate('/patient/home')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-500 transition-colors">
              <Home size={18} /> Home
            </button>
            <button onClick={() => onNavigate('/patient/appointments')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-500 transition-colors">
              <Calendar size={18} /> Apps
            </button>
            <button onClick={() => onNavigate('/patient/medicine-tracker')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-500 transition-colors">
              <Pill size={18} /> Meds
            </button>
            <button onClick={() => onNavigate('/patient/doctor-profile')} className="flex flex-col items-center gap-0.5 font-bold text-[9px] text-slate-400 active:text-medical-500 transition-colors">
              <UserCircle size={18} /> Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};