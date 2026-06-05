import React, { useState, useRef } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Stethoscope, TrendingUp, Users, ArrowRight, CheckCircle, ArrowLeft, ShieldAlert, Mail, Loader2, Check, Clock, Camera, Upload, IdCard } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { UserRole } from '../../types';
import { useEmailOTP } from '../../hooks/useEmailOTP';
import { supabase } from '../../supabase';


interface DoctorLandingProps {
  onNavigate: (path: string) => void;
}

type Step = 'landing' | 'criteria' | 'email_verify' | 'otp_verify' | 'registration' | 'success';

export const DoctorLanding: React.FC<DoctorLandingProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<Step>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Dr.',
    name: '',
    specialty: 'General Medicine',
    bmdcNumber: '',
    phone: '',
    email: '',
    password: '',
    idPhotoUrl: '',
  });
  const [idPhotoPreview, setIdPhotoPreview] = useState<string>('');
  const [uploadingId, setUploadingId] = useState(false);
  const idPhotoRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();
  const { otpState, sendOTP, verifyOTP, resetOTP, isVerified } = useEmailOTP();
  const [otpCode, setOtpCode] = useState('');

  const handleIdPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingId(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setIdPhotoPreview(preview);

      const ext = file.name.split('.').pop();
      const path = `doctor-id-${formData.email}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('doctor-id-photos').upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('doctor-id-photos').getPublicUrl(path);
      setFormData(prev => ({ ...prev, idPhotoUrl: data.publicUrl }));
    } catch (err) {
      console.error('ID photo upload error:', err);
      setError('Failed to upload ID photo. Please try again.');
    } finally {
      setUploadingId(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Email OTP handlers ──
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    const sent = await sendOTP(formData.email);
    if (sent) {
      setStep('otp_verify');
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
      setStep('registration');
    } else {
      setError(otpState.error || 'Invalid or expired code.');
    }
    setIsLoading(false);
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setError('Please verify your email first.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const fullDoctorName = `${formData.title} ${formData.name}`;
    const result = await signup({
      ...formData,
      name: fullDoctorName
    }, UserRole.DOCTOR);

    if (result.success) {
      setStep('success');
    } else if (result.error === 'PENDING_APPROVAL') {
      setStep('success');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    setIsLoading(false);
  };

  // --- STEP 1: LANDING VIEW ---
  if (step === 'landing') {
    return (
      <div className="space-y-16 py-8 animate-fade-in">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">
            For Specialists
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Grow Your Practice with <span className="text-teal-600">DocOclock</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Manage patient serials, reduce no-shows, issue digital prescriptions, and streamline your chambers — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-200 h-14 px-8 text-lg" onClick={() => setStep('criteria')}>
              Apply to Join
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" onClick={() => onNavigate('/doctor-login')}>
              Login to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Users, title: "Reach More Patients", desc: "Showcase your profile to millions of patients across the country." },
            { icon: TrendingUp, title: "Reduce No-Shows", desc: "Secure advance booking payments and manage live serial tracking." },
            { icon: Stethoscope, title: "Digital Rx", desc: "Issue professional printed prescriptions using customizable templates." }
          ].map((item, idx) => (
            <GlassCard key={idx} className="p-8 text-center hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <item.icon size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </div>

        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-3xl p-12 text-center text-white shadow-2xl shadow-teal-200 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to modernize your practice?</h2>
          <Button onClick={() => setStep('criteria')} className="bg-white text-teal-800 hover:bg-teal-50 border-none h-14 px-10 text-lg font-bold shadow-none">
            Apply to Join DocOclock <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // --- STEP 2: CRITERIA ---
  if (step === 'criteria') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-10 animate-fade-in">
        <GlassCard className="max-w-xl w-full p-10 border-t-4 border-teal-600">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Eligibility Criteria</h2>
            <p className="text-slate-500 mt-2">Please confirm you meet the following requirements before proceeding.</p>
          </div>
          <div className="space-y-4 mb-8">
            {[
              "Valid BMDC Registration Number required.",
              "Minimum MBBS qualification.",
              "Digital-first approach to patient care.",
              "Email verification required for all registrations.",
            ].map((req, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50">
                <CheckCircle className="text-teal-600 shrink-0 mt-0.5" size={20} />
                <span className="font-medium text-slate-700 text-sm">{req}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('landing')} fullWidth>Cancel</Button>
            <Button onClick={() => setStep('email_verify')} fullWidth className="bg-teal-600 hover:bg-teal-700">I Understand</Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- STEP 3: EMAIL VERIFICATION ---
  if (step === 'email_verify') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-10 animate-fade-in">
        <GlassCard className="max-w-md w-full p-10 border-t-4 border-teal-600">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
            <p className="text-slate-500 mt-2 text-sm">We'll send a 6-digit code to your email address.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex gap-3">
              <ShieldAlert size={16} className="shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="doctor@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300"
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" fullWidth disabled={isLoading || !formData.email.includes('@')} className="bg-teal-600 hover:bg-teal-700 h-12 font-black">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Sending...</span>
              ) : 'Send Verification Code'}
            </Button>
            <button type="button" onClick={() => setStep('criteria')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 font-bold">
              ← Go Back
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // --- STEP 4: OTP INPUT ---
  if (step === 'otp_verify') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-10 animate-fade-in">
        <GlassCard className="max-w-md w-full p-10 border-t-4 border-teal-600">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Enter OTP Code</h2>
            <p className="text-slate-500 mt-2 text-sm">Code sent to <span className="font-bold text-slate-700">{formData.email}</span></p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex gap-3">
              <ShieldAlert size={16} className="shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">6-Digit Code</label>
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
              <div className="flex justify-between mt-3">
                <button type="button" onClick={() => { setStep('email_verify'); setError(null); setOtpCode(''); }} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                  Change Email
                </button>
                <button type="button" onClick={() => { sendOTP(formData.email); setError(null); }} className="text-xs font-bold text-blue-600 hover:underline">
                  Resend Code
                </button>
              </div>
            </div>
            <Button type="submit" fullWidth disabled={isLoading || otpCode.length !== 6} className="bg-teal-600 hover:bg-teal-700 h-12 font-black">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Verifying...</span>
              ) : 'Verify Code'}
            </Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // --- STEP 5: REGISTRATION FORM ---
  if (step === 'registration') {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <button onClick={() => setStep('email_verify')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold">
          <ArrowLeft size={20} /> Back
        </button>
        <GlassCard className="p-8 md:p-10 border-t-4 border-teal-600">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Doctor Registration</h2>

          {/* Verified badge */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold text-emerald-700">{formData.email} — Email Verified ✓</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex gap-3 text-left animate-shake">
              <ShieldAlert size={16} className="shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegistrationSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                <select name="title" value={formData.title} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none">
                  <option>Dr.</option><option>Prof. Dr.</option><option>Assoc. Prof. Dr.</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input name="name" required placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">BMDC Reg. Number</label>
                <input name="bmdcNumber" required placeholder="A-XXXXX" value={formData.bmdcNumber} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Specialty</label>
                <select name="specialty" value={formData.specialty} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none">
                  <option>General Medicine</option><option>Cardiology</option><option>Neurology</option><option>Pediatrics</option><option>Orthopedics</option><option>Dermatology</option><option>ENT</option><option>Gynecology</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone <span className="text-slate-300">(Optional)</span></label>
              <input name="phone" type="tel" placeholder="017..." value={formData.phone} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input name="password" type="password" required placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
            </div>

            {/* ID Photo Upload */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                BMDC Card / Government ID Photo <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-3">Take a photo of your BMDC registration card or government-issued ID. This will be reviewed by admin.</p>
              <input
                ref={idPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleIdPhotoCapture}
              />
              {idPhotoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={idPhotoPreview} alt="ID preview" className="w-full h-40 object-cover" />
                  {uploadingId && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-teal-600" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => idPhotoRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-black rounded-lg"
                  >
                    Retake
                  </button>
                  {formData.idPhotoUrl && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1">
                      <Check size={10} /> Uploaded
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => idPhotoRef.current?.click()}
                  disabled={uploadingId}
                  className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-teal-400 hover:text-teal-500 transition-all"
                >
                  {uploadingId ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <Camera size={28} />
                      <span className="text-xs font-black uppercase tracking-wider">Take Photo / Upload</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <Button fullWidth size="lg" disabled={isLoading || !formData.idPhotoUrl} className="bg-teal-600 hover:bg-teal-700 h-14 text-lg font-black disabled:opacity-50">
              {isLoading ? 'Processing...' : !formData.idPhotoUrl ? 'Upload ID Photo to Continue' : 'Complete Registration'}
            </Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // --- STEP 6: SUCCESS (Pending Approval) ---
  if (step === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 animate-fade-in">
        <GlassCard className="max-w-md w-full p-10 text-center">
          <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-100">
            <Clock size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Registration Submitted!</h2>
          <p className="text-slate-500 mb-3 font-bold">Your account has been created and is now <span className="text-amber-600 font-black">pending approval</span> by a Super Admin.</p>
          <p className="text-slate-400 text-sm mb-8">You'll be able to log in once your account is approved. This typically takes 24-48 hours.</p>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-left space-y-2 mb-8">
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Email:</span><span className="font-black text-slate-700">{formData.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">BMDC:</span><span className="font-black text-slate-700">{formData.bmdcNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold">Status:</span><span className="font-black text-amber-600">Pending Review</span></div>
          </div>

          <Button onClick={() => onNavigate('/')} fullWidth className="bg-slate-900 h-14 font-black">Back to Home</Button>
        </GlassCard>
      </div>
    );
  }

  return null;
};