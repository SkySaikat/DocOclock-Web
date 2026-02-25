import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { X, Phone, KeyRound, ArrowRight, User, Hash, ShieldCheck } from 'lucide-react';
import { UserRole, Gender } from '../../types';
import { useAuth } from '../../AuthContext';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (role: UserRole, phone?: string) => void;
  onDoctorLoginClick: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess, onDoctorLoginClick }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'phone' | 'password'>('phone');

  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [password, setPassword] = useState('');

  // Signup State
  const [signupData, setSignupData] = useState({
    name: '',
    age: '',
    gender: 'Male' as Gender,
    phone: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone.length < 11) return;
    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError(null);

    const result = await login(loginPhone, password, UserRole.PATIENT);

    if (result.success) {
      onLoginSuccess(UserRole.PATIENT, loginPhone);
    } else {
      setError(result.error || "Login failed.");
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, age, phone, password: signupPassword } = signupData;

    if (!name || !age || phone.length < 11 || !signupPassword) {
      setError("Please fill all fields correctly.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await signup(signupData, UserRole.PATIENT);

    if (result.success) {
      onLoginSuccess(UserRole.PATIENT, phone);
    } else {
      setError(result.error || "Signup failed.");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[400px] max-h-[calc(100vh-2rem)] bg-white rounded-[24px] shadow-2xl relative border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300">

        {/* Close Button - Always Accessible */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 z-50 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Refined Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100/50">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              {mode === 'login' ? 'Login to book appointments and track your live queue.' : 'Join DocOclock to manage your health records.'}
            </p>
          </div>

          <div className="px-8 pb-10">
            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold rounded-xl animate-in shake duration-500 flex items-start gap-3 shadow-sm shadow-red-50">
                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">!</div>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {mode === 'login' ? (
              // ... existing login logic unaffected but now scrollable
              step === 'phone' ? (
                <form onSubmit={handleNextStep} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mobile Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input
                        type="tel"
                        placeholder="017xxxxxxxx"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading || loginPhone.length < 11}
                    className="h-12 text-[15px] font-black rounded-xl shadow-lg shadow-blue-500/10 bg-gradient-to-r from-blue-600 to-blue-700 active:scale-[0.98] transition-all"
                  >
                    {isLoading ? 'Checking...' : 'Continue'}
                  </Button>
                  <div className="text-center">
                    <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="text-[13px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                      Don't have an account? <span className="text-blue-600">Sign Up</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5 animate-in slide-in-from-right duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 font-bold flex items-center gap-1">
                      No: <span className="text-blue-600 font-black tracking-tight">{loginPhone}</span> • <button type="button" onClick={() => setStep('phone')} className="text-blue-600 hover:underline">Change</button>
                    </p>
                  </div>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoading || !password}
                    className="h-12 text-[15px] font-black rounded-xl shadow-lg shadow-blue-500/10 bg-gradient-to-r from-blue-600 to-blue-700 active:scale-[0.98] transition-all"
                  >
                    {isLoading ? 'Verifying...' : 'Login Now'}
                  </Button>
                </form>
              )
            ) : (
              <form onSubmit={handleSignup} className="space-y-4 animate-in slide-in-from-right duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input
                        required
                        placeholder="Enter Name"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                        value={signupData.name}
                        onChange={e => setSignupData({ ...signupData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Age</label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input
                        required
                        type="number"
                        placeholder="Age"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                        value={signupData.age}
                        onChange={e => setSignupData({ ...signupData, age: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Gender</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base cursor-pointer appearance-none transition-all"
                      value={signupData.gender}
                      onChange={e => setSignupData({ ...signupData, gender: e.target.value as Gender })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mobile Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input
                      required
                      type="tel"
                      placeholder="017xxxxxxxx"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                      value={signupData.phone}
                      onChange={e => setSignupData({ ...signupData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  fullWidth
                  disabled={isLoading}
                  className="h-12 text-[15px] font-black rounded-xl shadow-lg shadow-blue-500/10 bg-gradient-to-r from-blue-600 to-blue-700 active:scale-[0.98] transition-all mt-2"
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </Button>
                <div className="text-center space-y-3">
                  <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-[13px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                    Already have an account? <span className="text-blue-600">Login</span>
                  </button>
                  <div className="pt-2">
                    <button type="button" onClick={onClose} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                      Cancel & Go Back
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Section Divider - Better Hierarchy for Doctor Portal */}
            <div className="mt-8 pt-6 border-t border-slate-100/80 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Are you a healthcare provider?</p>
              <button
                onClick={onDoctorLoginClick}
                className="w-full h-11 border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-500 hover:bg-teal-50/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-[13px] group"
              >
                Doctor Portal Login <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
