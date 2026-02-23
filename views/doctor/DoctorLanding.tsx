import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Stethoscope, TrendingUp, Users, ArrowRight, CheckCircle, Quote, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { UserRole } from '../../types';


interface DoctorLandingProps {
  onNavigate: (path: string) => void;
}

type Step = 'landing' | 'criteria' | 'registration' | 'success';

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
  });
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const fullDoctorName = `${formData.title} ${formData.name}`;
    const result = await signup({
      ...formData,
      name: fullDoctorName
    }, UserRole.DOCTOR);

    if (result.success) {
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
            ].map((req, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50">
                <CheckCircle className="text-teal-600 shrink-0 mt-0.5" size={20} />
                <span className="font-medium text-slate-700 text-sm">{req}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('landing')} fullWidth>Cancel</Button>
            <Button onClick={() => setStep('registration')} fullWidth className="bg-teal-600 hover:bg-teal-700">I Understand</Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- STEP 3: REGISTRATION ---
  if (step === 'registration') {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <button onClick={() => setStep('criteria')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold">
          <ArrowLeft size={20} /> Back
        </button>
        <GlassCard className="p-8 md:p-10 border-t-4 border-teal-600">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Doctor Registration</h2>

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
                  <option>General Medicine</option><option>Cardiology</option><option>Neurology</option><option>Pediatrics</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                <input name="phone" type="tel" required placeholder="017..." value={formData.phone} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input name="email" type="email" required placeholder="doctor@example.com" value={formData.email} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input name="password" type="password" required placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none" />
            </div>
            <Button fullWidth size="lg" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 h-14 text-lg font-black">
              {isLoading ? 'Processing...' : 'Complete Registration'}
            </Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // --- STEP 4: SUCCESS ---
  if (step === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 animate-fade-in">
        <GlassCard className="max-w-md w-full p-10 text-center">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Registration Complete!</h2>
          <p className="text-slate-500 mb-8 font-bold">Your doctor account is ready. You can now log in to manage your queue.</p>
          <Button onClick={() => onNavigate('/doctor-login')} fullWidth className="bg-teal-600 h-14 font-black">Go to Login</Button>
        </GlassCard>
      </div>
    );
  }

  return null;
};