import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { UserRole } from '../../types';

export const AdminLogin: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [adminType, setAdminType] = useState<UserRole>(UserRole.HOSPITAL_ADMIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await login(email, password, adminType);
    if (result.success) {
      // [M1] Dashboard renders based on role state, not path — navigate to root
      onNavigate('/');
    } else {
      setError(result.error || 'Invalid Admin Credentials');
    }
  };

  return (
    <div className="max-w-[400px] mx-auto mt-20 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col items-center text-center">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />

        <button 
          onClick={() => onNavigate('/')} 
          className="absolute top-6 left-6 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20 relative z-10 shadow-lg shadow-blue-500/20">
          <ShieldCheck size={32} />
        </div>
        
        <h2 className="text-2xl font-black text-white tracking-tight mb-4">
          {adminType === UserRole.SUPER_ADMIN ? 'Super Admin Portal' : 'Hospital Portal'}
        </h2>

        {/* Role Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-xl mb-6 w-full">
           <button 
             onClick={() => setAdminType(UserRole.HOSPITAL_ADMIN)}
             className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${adminType === UserRole.HOSPITAL_ADMIN ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
           >
             Hospital Admin
           </button>
           <button 
             onClick={() => setAdminType(UserRole.SUPER_ADMIN)}
             className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${adminType === UserRole.SUPER_ADMIN ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
           >
             Super Admin
           </button>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl animate-in shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4 relative z-10 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Admin Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none font-bold text-sm text-white transition-all placeholder:text-slate-600"
                placeholder={adminType === UserRole.SUPER_ADMIN ? "superadmin@dococlock.com" : "hospital@dococlock.com"}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Security Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                name="password"
                type="password"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none font-bold text-sm text-white transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl font-black text-[14px] shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all"
            >
              Authorize Access
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
