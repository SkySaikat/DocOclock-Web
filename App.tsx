import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DoctorLanding } from './views/doctor/DoctorLanding';
import { DoctorProfile } from './views/patient/DoctorProfile';
import { LiveSerial } from './views/patient/LiveSerial';
import { Home } from './views/patient/Home';
import { Appointments } from './views/patient/Appointments';
import { Rewards } from './views/patient/Rewards';
import { More } from './views/patient/More';
import { Prescriptions } from './views/patient/Prescriptions';
import { Consultations } from './views/patient/Consultations';
import { MedicineTracker } from './views/patient/MedicineTracker';
import { LoginModal } from './components/auth/LoginModal';

import { DoctorDashboard } from './views/doctor/Dashboard';
import { DoctorAnalytics } from './views/doctor/Analytics';
import { PrescriptionEditor } from './views/doctor/PrescriptionEditor';
import { SerialManager } from './views/doctor/SerialManager';
import { ManualBooking } from './views/doctor/ManualBooking';
import { DoctorPracticeSettings } from './views/doctor/DoctorPracticeSettings';
import { UserRole, Doctor, Patient } from './types';

import { Activity, ShieldAlert, Lock, User } from 'lucide-react';
import { PatientStorage, DoctorStorage } from './storage';

import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { profile, userRole: authRole, loading: authLoading, logout: authLogout, login: authLogin } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [focusSearchTrigger, setFocusSearchTrigger] = useState<number>(0);


  // Auth & Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'NONE' | 'BOOKING'>('NONE');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Shared state for passing patient data to prescription
  const [activeRxPatient, setActiveRxPatient] = useState<{ id: string; name: string; age?: number; gender: string; phone: string; appointmentId: string; hospitalId: string } | null>(null);

  // Initialize AuthContext sync
  useEffect(() => {

    if (!authLoading) {
      setUserRole(authRole);
      setSessionUser(profile);

      // Auto-navigation on first load if already logged in
      if (profile && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
        if (authRole === UserRole.DOCTOR) {
          setCurrentPath('/doctor/dashboard');
        } else if (authRole === UserRole.PATIENT) {
          setCurrentPath('/patient/home');
        }
      }
    }
  }, [profile, authRole, authLoading]);

  const navigate = (path: string, appointmentId?: string) => {
    if ((path === '/' || path === '/patient/home') && (currentPath === '/' || currentPath === '/patient/home')) {
      setFocusSearchTrigger(Date.now());
    }

    if (appointmentId) {
      setActiveAppointmentId(appointmentId);
    } else if (path !== '/live-serial') {
      setActiveAppointmentId(null);
    }

    setCurrentPath(path);
    window.scrollTo(0, 0);
  };


  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    navigate('/patient/profile');
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    if (pendingAction === 'BOOKING' && currentPath === '/patient/profile') {
      // Logic for after booking login
    } else {
      navigate('/patient/home');
    }
    setPendingAction('NONE');
  };

  const handleBookSuccess = () => {
    navigate('/live-serial');
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const bmdc = formData.get('bmdc') as string;
    const password = formData.get('password') as string;

    setLoginError(null);
    const result = await authLogin(bmdc, password, UserRole.DOCTOR);

    if (result.success) {
      setCurrentPath('/doctor/dashboard');
    } else {
      setLoginError(result.error || 'Invalid BMDC Number or Password.');
    }
  };

  const handleLogout = () => {
    authLogout();
    navigate('/');
  };

  const openLoginModal = (role: UserRole = UserRole.PATIENT) => {
    if (role === UserRole.DOCTOR) {
      navigate('/doctor-login');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleSavePrescription = (newRx: any) => {
    setActiveRxPatient(null);
    navigate('/doctor/serial-manager');
  };

  const renderView = () => {
    const isPatient = userRole === UserRole.PATIENT;
    const isDoctor = userRole === UserRole.DOCTOR;

    if (isDoctor) {
      switch (currentPath) {
        case '/doctor/dashboard': return <DoctorDashboard onNavigate={navigate} />;
        case '/doctor/analytics': return <DoctorAnalytics />;
        case '/doctor/serial-manager': return <SerialManager onNavigate={navigate} onStartPrescription={setActiveRxPatient} />;
        case '/doctor/manual-booking': return <ManualBooking />;
        case '/doctor/practice-settings': return <DoctorPracticeSettings />;
        case '/doctor/prescription': return (
          <PrescriptionEditor
            initialPatient={activeRxPatient}
            onClearInitial={() => setActiveRxPatient(null)}
            onSave={handleSavePrescription}
          />
        );
        default: return <DoctorDashboard onNavigate={navigate} />;
      }
    }

    switch (currentPath) {
      case '/':
      case '/patient/home':
        return <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} focusSearchTrigger={focusSearchTrigger} />;
      case '/for-doctors': return <DoctorLanding onNavigate={navigate} />;
      case '/patient/profile':
        return selectedDoctor ? (
          <DoctorProfile doctor={selectedDoctor} onBack={() => navigate('/patient/home')} onBookSuccess={handleBookSuccess} userRole={userRole} onLoginRequest={() => { setPendingAction('BOOKING'); setIsLoginModalOpen(true); }} onNavigate={navigate} />
        ) : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} focusSearchTrigger={focusSearchTrigger} />;
      case '/patient/appointments': return isPatient ? <Appointments onNavigate={navigate} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case '/patient/rewards': return isPatient ? <Rewards /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case '/patient/more': return isPatient ? <More onNavigate={navigate} onLogout={handleLogout} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case '/patient/prescriptions': return isPatient ? <Prescriptions onNavigate={navigate} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case '/patient/consultations': return isPatient ? <Consultations onNavigate={navigate} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case '/patient/medicine-tracker': return isPatient ? <MedicineTracker /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case '/live-serial': return isPatient ? <LiveSerial appointmentId={activeAppointmentId} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;

      case '/doctor-login': return (
        <div className="max-w-md mx-auto mt-6 md:mt-10 px-4 animate-fade-in-up">
          <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] text-center border-0 ring-1 ring-slate-200 shadow-2xl bg-white">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-100 rounded-3xl flex items-center justify-center text-teal-600 mx-auto mb-6 shadow-inner">
              <Activity size={32} className="md:w-10 md:h-10" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2 text-slate-900 tracking-tight">Doctor Portal</h2>
            <p className="text-slate-500 font-bold mb-8 text-[13px] md:text-sm">Secure access to your practice dashboard.</p>

            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] md:text-xs font-black rounded-2xl flex gap-3 text-left shadow-sm">
                <ShieldAlert size={16} className="shrink-0" /> <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleDoctorLogin} className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                <input name="bmdc" required className="w-full pl-12 p-3.5 md:p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all" placeholder="BMDC Number" />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                <input name="password" type="password" required className="w-full pl-12 p-3.5 md:p-4 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all" placeholder="Password" />
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3.5 md:py-4 rounded-2xl font-black hover:bg-teal-700 transition shadow-xl shadow-teal-200 text-lg active:scale-[0.98]">
                Login to Dashboard
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-500">New to DocOclock?</p>
              <button onClick={() => navigate('/for-doctors')} className="text-teal-600 font-black mt-2 hover:underline text-sm">Apply for Doctor Account</button>
            </div>
          </div>
        </div>
      );
      default: return <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} focusSearchTrigger={focusSearchTrigger} />;
    }
  };

  return (
    <Layout
      userRole={userRole}
      onLogout={handleLogout}
      onNavigate={navigate}
      onLoginClick={openLoginModal}
      hideMobileBottomNav={currentPath === '/patient/profile'}
    >
      {renderView()}
      {isLoginModalOpen && (
        <LoginModal onClose={() => { setIsLoginModalOpen(false); setPendingAction('NONE'); }} onLoginSuccess={handleLoginSuccess} onDoctorLoginClick={() => { setIsLoginModalOpen(false); navigate('/doctor-login'); }} />
      )}
    </Layout>
  );
};

export default App;