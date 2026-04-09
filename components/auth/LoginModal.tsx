import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { X, Phone, KeyRound, ArrowRight, User, Hash, ShieldCheck, Mail, Check, Loader2 } from 'lucide-react';
import { UserRole, Gender } from '../../types';
import { useAuth } from '../../AuthContext';
import { useEmailOTP } from '../../hooks/useEmailOTP';

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
  const [signupStep, setSignupStep] = useState<'EMAIL' | 'OTP' | 'DETAILS'>('EMAIL');
  const [signupEmail, setSignupEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [signupData, setSignupData] = useState({
    name: '',
    age: '',
    gender: 'Male' as Gender,
    phone: '',
    password: '',
    email: ''
  });

  const { otpState, sendOTP, verifyOTP, resetOTP, isVerified } = useEmailOTP();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // ── EMAIL OTP FLOW ──────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setIsLoading(true);

    const sent = await sendOTP(signupEmail);
    if (sent) {
      setSignupStep('OTP');
      setSignupData(prev => ({ ...prev, email: signupEmail }));
    } else {
      setError(otpState.error || 'Failed to send verification code.');
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const verified = await verifyOTP(otpCode);
    if (verified) {
      setSignupStep('DETAILS');
    } else {
      setError(otpState.error || 'Invalid or expired code.');
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

    if (!isVerified) {
      setError("Please verify your email first.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await signup({ ...signupData, email: signupEmail }, UserRole.PATIENT);

    if (result.success) {
      if (result.error === 'PENDING_APPROVAL') {
        setSuccessMessage('Registration successful! Your account is pending admin approval.');
      } else {
        onLoginSuccess(UserRole.PATIENT, phone);
      }
    } else {
      setError(result.error || "Signup failed.");
    }
    setIsLoading(false);
  };

  // Reset everything when switching modes
  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setSignupStep('EMAIL');
    setOtpCode('');
    setSignupEmail('');
    resetOTP();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[400px] max-h-[calc(100vh-2rem)] bg-white rounded-[24px] shadow-2xl relative border border-slate-100 flex flex-col animate-in zoom-in-95 duration-300">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 z-50 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100/50">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1">
              {mode === 'login' ? 'Welcome Back' : (
                signupStep === 'EMAIL' ? 'Verify Your Email' :
                signupStep === 'OTP' ? 'Enter OTP Code' :
                'Create Account'
              )}
            </h2>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              {mode === 'login' ? 'Login to book appointments and track your live queue.' : (
                signupStep === 'EMAIL' ? 'We\'ll send a 6-digit code to verify your email.' :
                signupStep === 'OTP' ? `Code sent to ${signupEmail}` :
                'Fill in your details to get started.'
              )}
            </p>
          </div>

          <div className="px-8 pb-10">
            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold rounded-xl animate-in shake duration-500 flex items-start gap-3 shadow-sm shadow-red-50">
                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[9px]">!</div>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] font-bold rounded-xl animate-in fade-in duration-500 flex items-start gap-3">
                <Check size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <p className="leading-tight">{successMessage}</p>
                  <button
                    onClick={() => { switchMode('login'); setSuccessMessage(null); }}
                    className="mt-3 text-emerald-600 underline font-black text-xs"
                  >
                    Go to Login →
                  </button>
                </div>
              </div>
            )}

            {!successMessage && mode === 'login' ? (
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
                    <button type="button" onClick={() => switchMode('signup')} className="text-[13px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
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
            ) : !successMessage && (
              <>
                {/* ── STEP 1: Email Input ── */}
                {signupStep === 'EMAIL' && (
                  <form onSubmit={handleSendOTP} className="space-y-5 animate-in slide-in-from-right duration-300">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          required
                          type="email"
                          placeholder="your@email.com"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                          value={signupEmail}
                          onChange={e => setSignupEmail(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      fullWidth
                      disabled={isLoading || !signupEmail.includes('@')}
                      className="h-12 text-[15px] font-black rounded-xl shadow-lg shadow-blue-500/10 bg-gradient-to-r from-blue-600 to-blue-700 active:scale-[0.98] transition-all"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Sending Code...</span>
                      ) : 'Send Verification Code'}
                    </Button>
                    <div className="text-center">
                      <button type="button" onClick={() => switchMode('login')} className="text-[13px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                        Already have an account? <span className="text-blue-600">Login</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ── STEP 2: OTP Verification ── */}
                {signupStep === 'OTP' && (
                  <form onSubmit={handleVerifyOTP} className="space-y-5 animate-in slide-in-from-right duration-300">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">6-Digit Code</label>
                      <input
                        required
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        className="w-full text-center text-3xl font-black tracking-[16px] py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200 placeholder:tracking-[16px]"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                      />
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[11px] text-slate-400 font-bold">
                          Sent to <span className="text-blue-600">{signupEmail}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => { sendOTP(signupEmail); setError(null); }}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Resend Code
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      fullWidth
                      disabled={isLoading || otpCode.length !== 6}
                      className="h-12 text-[15px] font-black rounded-xl shadow-lg shadow-blue-500/10 bg-gradient-to-r from-blue-600 to-blue-700 active:scale-[0.98] transition-all"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Verifying...</span>
                      ) : 'Verify Code'}
                    </Button>
                  </form>
                )}

                {/* ── STEP 3: Profile Details ── */}
                {signupStep === 'DETAILS' && (
                  <form onSubmit={handleSignup} className="space-y-4 animate-in slide-in-from-right duration-300">
                    {/* Verified Badge */}
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-2">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-700">{signupEmail} — Verified ✓</span>
                    </div>

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
                            autoFocus
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
                      <button type="button" onClick={() => switchMode('login')} className="text-[13px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
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
              </>
            )}

            {/* Doctor Portal Link */}
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
