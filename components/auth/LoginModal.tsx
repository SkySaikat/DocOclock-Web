import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { X, Phone, KeyRound, ArrowRight, User, Hash } from 'lucide-react';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <GlassCard className="w-full max-w-md p-0 overflow-hidden relative border-0 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
          <X size={24} />
        </button>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 md:p-10 text-white text-center">
          <h2 className="text-xl md:text-3xl font-black mb-2 tracking-tight leading-tight">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="opacity-80 text-[12px] md:text-base font-bold leading-relaxed max-w-[240px] md:max-w-none mx-auto">
            {mode === 'login' ? 'Login to book appointments and track serials.' : 'Join DocOclock to manage your family health.'}
          </p>
        </div>

        <div className="p-6 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold rounded-2xl animate-shake flex items-start gap-3 shadow-sm shadow-red-50">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">!</div>
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            step === 'phone' ? (
              <form onSubmit={handleNextStep} className="space-y-6">
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">Mobile Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                      type="tel"
                      placeholder="017xxxxxxxx"
                      className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-lg transition-all"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" fullWidth disabled={isLoading || loginPhone.length < 11} className="h-14 text-lg font-black rounded-2xl shadow-xl shadow-blue-100">
                  {isLoading ? 'Checking Registry...' : 'Continue'}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="text-sm font-bold text-blue-600 hover:underline">
                    Don't have an account? Sign Up
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">Enter Password</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-lg transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-4 font-bold ml-1">
                    Number: <span className="text-blue-600 font-black">{loginPhone}</span>. <button type="button" onClick={() => setStep('phone')} className="text-blue-600 underline ml-1">Change?</button>
                  </p>
                </div>
                <Button type="submit" fullWidth disabled={isLoading || !password} className="h-14 text-lg font-black rounded-2xl shadow-xl shadow-blue-100">
                  {isLoading ? 'Verifying...' : 'Login'}
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleSignup} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    placeholder="Enter Name"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                    value={signupData.name}
                    onChange={e => setSignupData({ ...signupData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Age</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="number"
                      placeholder="Age"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                      value={signupData.age}
                      onChange={e => setSignupData({ ...signupData, age: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gender</label>
                  <select
                    className="w-full px-4 py-[14px] bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold h-full cursor-pointer appearance-none"
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
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="tel"
                    placeholder="017xxxxxxxx"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                    value={signupData.phone}
                    onChange={e => setSignupData({ ...signupData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
                    value={signupData.password}
                    onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" fullWidth disabled={isLoading} className="h-14 text-lg font-black rounded-2xl shadow-xl shadow-blue-100 mt-2">
                {isLoading ? 'Saving to Registry...' : 'Sign Up'}
              </Button>
              <div className="text-center mt-2">
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-sm font-bold text-blue-600 hover:underline">
                  Already have an account? Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Are you a healthcare provider?</p>
            <button
              onClick={onDoctorLoginClick}
              className="px-6 py-3 bg-slate-50 hover:bg-teal-50 text-teal-600 font-black rounded-xl transition-all flex items-center justify-center gap-2 mx-auto text-sm border border-slate-100 hover:border-teal-100"
            >
              Doctor Portal Login <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};