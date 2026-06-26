import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { LoginModal } from './components/auth/LoginModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// --- Lazy Loaded Views ---
// Patient Views
const Home = lazy(() => import('./views/patient/Home').then(m => ({ default: m.Home })));
const DoctorProfile = lazy(() => import('./views/patient/DoctorProfile').then(m => ({ default: m.DoctorProfile })));
const LiveSerial = lazy(() => import('./views/patient/LiveSerial').then(m => ({ default: m.LiveSerial })));
const Appointments = lazy(() => import('./views/patient/Appointments').then(m => ({ default: m.Appointments })));
const Rewards = lazy(() => import('./views/patient/Rewards').then(m => ({ default: m.Rewards })));
const More = lazy(() => import('./views/patient/More').then(m => ({ default: m.More })));
const Prescriptions = lazy(() => import('./views/patient/Prescriptions').then(m => ({ default: m.Prescriptions })));
const Consultations = lazy(() => import('./views/patient/Consultations').then(m => ({ default: m.Consultations })));
const MedicineTracker = lazy(() => import('./views/patient/MedicineTracker').then(m => ({ default: m.MedicineTracker })));
const DoctorSearch = lazy(() => import('./views/patient/DoctorSearchView').then(m => ({ default: m.DoctorSearchView })));

// Doctor Views
const DoctorLanding = lazy(() => import('./views/doctor/DoctorLanding').then(m => ({ default: m.DoctorLanding })));
const DoctorDashboard = lazy(() => import('./views/doctor/Dashboard').then(m => ({ default: m.DoctorDashboard })));
const DoctorAnalytics = lazy(() => import('./views/doctor/Analytics').then(m => ({ default: m.DoctorAnalytics })));
const PrescriptionEditor = lazy(() => import('./views/doctor/PrescriptionEditor').then(m => ({ default: m.PrescriptionEditor })));
const SerialManager = lazy(() => import('./views/doctor/SerialManager').then(m => ({ default: m.SerialManager })));
const PatientManualRegistry = lazy(() => import('./views/doctor/PatientManualRegistry').then(m => ({ default: m.PatientManualRegistry })));
const DoctorPracticeSettings = lazy(() => import('./views/doctor/DoctorPracticeSettings').then(m => ({ default: m.DoctorPracticeSettings })));
const DoctorMore = lazy(() => import('./views/doctor/DoctorMore').then(m => ({ default: m.DoctorMore })));
const DoctorProfileEditor = lazy(() => import('./views/doctor/DoctorProfileEditor').then(m => ({ default: m.DoctorProfileEditor })));

// Assistant Views
const AssistantLayout = lazy(() => import('./views/assistant/AssistantLayout').then(m => ({ default: m.AssistantLayout })));
const AssistantDashboard = lazy(() => import('./views/assistant/AssistantDashboard').then(m => ({ default: m.AssistantDashboard })));

// Admin Views
const AdminLogin = lazy(() => import('./views/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const SuperAdminDashboard = lazy(() => import('./views/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const HospitalAdminDashboard = lazy(() => import('./views/hospital-admin/HospitalAdminDashboard').then(m => ({ default: m.HospitalAdminDashboard })));
const BranchManagerDashboard = lazy(() => import('./views/branch-manager/BranchManagerDashboard').then(m => ({ default: m.BranchManagerDashboard })));
import { UserRole, Doctor, Patient } from './types';

import { Activity, ShieldAlert, Lock, User, ArrowRight } from 'lucide-react';
import { PatientStorage, DoctorStorage } from './storage';

import { useAuth } from './AuthContext';
import { useToast } from './components/ToastProvider';

const App: React.FC = () => {
  const { profile, userRole: authRole, loading: authLoading, logout: authLogout, login: authLogin } = useAuth();
  // Initialize from the actual browser URL so direct navigation (e.g. /admin-login) works
  const getInitialPath = () => {
    const path = window.location.pathname;
    // Capacitor/index.html fallback
    return (!path || path === '/index.html') ? '/' : path;
  };
  const [currentPath, setCurrentPath] = useState(getInitialPath);
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [selectedSearchCategory, setSelectedSearchCategory] = useState<string>('All');
  const [focusSearchTrigger, setFocusSearchTrigger] = useState<number>(0);
  const [browsePublicSite, setBrowsePublicSite] = useState(false);
  const { showToast } = useToast();

  // [P7] Listen for session expiration events from storage
  useEffect(() => {
    const handleSessionExpired = () => {
      showToast('Your session has expired. Please log in again.', 'warning', 6000);
      authLogout();
      setCurrentPath('/');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [showToast, authLogout]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(!path || path === '/index.html' ? '/' : path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
      // [M7] Use currentPath state instead of window.location.pathname for Capacitor safety
      if (profile && (currentPath === '/' || currentPath === '/index.html')) {
        if (authRole === UserRole.DOCTOR) {
          setCurrentPath('/doctor/dashboard');
        } else if (authRole === UserRole.PATIENT) {
          setCurrentPath('/patient/home');
        }
      }
    }
  }, [profile, authRole, authLoading]);

  const navigate = (path: string, appointmentId?: string, category: string = 'All') => {
    if ((path === '/' || path === '/patient/home') && (currentPath === '/' || currentPath === '/patient/home')) {
      setFocusSearchTrigger(Date.now());
    }

    if (appointmentId) {
      setActiveAppointmentId(appointmentId);
    } else if (path !== '/live-serial') {
      setActiveAppointmentId(null);
    }

    if (path === '/patient/doctors') {
      setSelectedSearchCategory(category);
    }

    setCurrentPath(path);
    // Sync browser URL bar so the address reflects the current view
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };


  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    navigate(`/doctor/${doctor.id}`);
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
    const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
    const isHospitalAdmin = userRole === UserRole.HOSPITAL_ADMIN;
    const isBranchManager = userRole === UserRole.BRANCH_MANAGER;
    const isAssistant = userRole === UserRole.ASSISTANT;

    // Allow all non-patient roles to browse the public site
    if (browsePublicSite && (isSuperAdmin || isHospitalAdmin || isBranchManager || isDoctor || isAssistant)) {
      return <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={undefined} focusSearchTrigger={focusSearchTrigger} />;
    }

    if (isSuperAdmin) {
      return (
        <ProtectedRoute expectedRole={UserRole.SUPER_ADMIN}>
          <SuperAdminDashboard onNavigate={navigate} onBrowsePublicSite={() => setBrowsePublicSite(true)} />
        </ProtectedRoute>
      );
    }

    if (isHospitalAdmin) {
      return (
        <ProtectedRoute expectedRole={UserRole.HOSPITAL_ADMIN}>
          <HospitalAdminDashboard onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (isBranchManager) {
      return (
        <ProtectedRoute expectedRole={UserRole.BRANCH_MANAGER}>
          <BranchManagerDashboard onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (isDoctor) {
      return (
        <ProtectedRoute expectedRole={UserRole.DOCTOR}>
          {(() => {
            switch (currentPath) {
              case '/doctor/dashboard': return <DoctorDashboard onNavigate={navigate} />;
              case '/doctor/analytics': return <DoctorAnalytics />;
              case '/doctor/serial-manager': return <SerialManager onNavigate={navigate} onStartPrescription={setActiveRxPatient} />;
              case '/doctor/manual-booking': return <PatientManualRegistry onNavigate={navigate} />;
              case '/doctor/practice-settings': return <DoctorPracticeSettings />;
              case '/doctor/profile': return <DoctorMore onNavigate={navigate} onLogout={handleLogout} />;
              case '/doctor/profile-editor': return <DoctorProfileEditor onBack={() => navigate('/doctor/profile')} />;
              case '/doctor/prescription': return (
                <PrescriptionEditor
                  initialPatient={activeRxPatient}
                  onClearInitial={() => setActiveRxPatient(null)}
                  onSave={handleSavePrescription}
                />
              );
              default: return <DoctorDashboard onNavigate={navigate} />;
            }
          })()}
        </ProtectedRoute>
      );
    }

    if (isAssistant) {
      return (
        <ProtectedRoute expectedRole={UserRole.ASSISTANT}>
          <AssistantLayout currentPath={currentPath} onNavigate={navigate}>
            <AssistantDashboard currentPath={currentPath} />
          </AssistantLayout>
        </ProtectedRoute>
      );
    }

    const isDoctorProfilePath = currentPath.startsWith('/doctor/');
    const doctorIdFromPath = isDoctorProfilePath ? currentPath.split('/doctor/')[1] : null;

    switch (true) {
      case currentPath === '/':
      case currentPath === '/patient/home':
        return <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} focusSearchTrigger={focusSearchTrigger} />;
      case currentPath === '/for-doctors': return <DoctorLanding onNavigate={navigate} />;
      case currentPath === '/patient/profile':
      case isDoctorProfilePath:
        return (selectedDoctor || doctorIdFromPath) ? (
          <DoctorProfile 
            doctor={selectedDoctor!} 
            doctorId={doctorIdFromPath || undefined}
            onBack={() => navigate('/patient/home')} 
            onBookSuccess={handleBookSuccess} 
            userRole={userRole} 
            onLoginRequest={() => { setPendingAction('BOOKING'); setIsLoginModalOpen(true); }} 
            onNavigate={navigate} 
          />
        ) : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} focusSearchTrigger={focusSearchTrigger} />;
      case currentPath === '/patient/appointments': return isPatient ? <Appointments onNavigate={navigate} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/patient/rewards': return isPatient ? <Rewards /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/patient/more': return isPatient ? <More onNavigate={navigate} onLogout={handleLogout} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/patient/prescriptions': return isPatient ? <Prescriptions onNavigate={navigate} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/patient/consultations': return isPatient ? <Consultations onNavigate={navigate} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/patient/medicine-tracker': return isPatient ? <MedicineTracker /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/live-serial': return isPatient ? <LiveSerial appointmentId={activeAppointmentId} /> : <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} />;
      case currentPath === '/patient/doctors': return <DoctorSearch onNavigate={navigate} onSelectDoctor={handleSelectDoctor} initialCategory={selectedSearchCategory} />;

      case currentPath === '/admin-login': return <AdminLogin onNavigate={navigate} />;
      case currentPath === '/doctor-login': return (
        <div className="max-w-[400px] mx-auto mt-10 px-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[24px] shadow-2xl relative overflow-hidden border border-slate-100 flex flex-col">
            {/* Refined Header (Aligned with Patient Modal) */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-4 border border-teal-100/50">
                <Activity size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1">
                Doctor Portal
              </h2>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
                Secure access to your practice dashboard.
              </p>
            </div>

            {/* Subtle Divider under header */}
            <div className="w-full h-px bg-slate-100 mb-6" />

            <div className="px-8 pb-10">
              {loginError && (
                <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold rounded-xl animate-in shake duration-500 flex items-start gap-3 shadow-sm shadow-red-50">
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">!</div>
                  <span className="leading-tight">{loginError}</span>
                </div>
              )}

              <form onSubmit={handleDoctorLogin} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">BMDC Number</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={16} />
                    <input
                      name="bmdc"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                      placeholder="BMDC-XXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={16} />
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-12 rounded-xl font-black text-[15px] shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all"
                >
                  Login to Dashboard
                </button>
              </form>

              {/* Secondary CTA - Subtle Outlined */}
              <div className="mt-8 pt-6 border-t border-slate-100/80 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">New to DocOclock?</p>
                <button
                  onClick={() => navigate('/for-doctors')}
                  className="w-full h-11 border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-[13px] group"
                >
                  Apply for Doctor Account <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      default: return <Home onNavigate={navigate} onSelectDoctor={handleSelectDoctor} userRole={userRole} focusSearchTrigger={focusSearchTrigger} />;
    }
  };

  const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-teal-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">Loading View...</div>
      </div>
    </div>
  );

  const handleReturnToDashboard = () => {
    setBrowsePublicSite(false);
    if (userRole === UserRole.DOCTOR) navigate('/doctor/dashboard');
    else if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.HOSPITAL_ADMIN) navigate('/');
    else if (userRole === UserRole.BRANCH_MANAGER) navigate('/');
  };

  return (
    <Layout
      userRole={userRole}
      onLogout={handleLogout}
      onNavigate={navigate}
      onLoginClick={openLoginModal}
      hideMobileBottomNav={currentPath === '/patient/profile'}
      currentPath={currentPath}
      browseMode={browsePublicSite}
      onBrowsePublicSite={() => setBrowsePublicSite(true)}
      onReturnToDashboard={handleReturnToDashboard}
    >
      <Suspense fallback={<PageLoader />}>
        {renderView()}
      </Suspense>
      {isLoginModalOpen && (
        <LoginModal onClose={() => { setIsLoginModalOpen(false); setPendingAction('NONE'); }} onLoginSuccess={handleLoginSuccess} onDoctorLoginClick={() => { setIsLoginModalOpen(false); navigate('/doctor-login'); }} />
      )}
    </Layout>
  );
};

export default App;