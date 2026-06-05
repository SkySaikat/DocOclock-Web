import React, { useRef, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FileText, Clipboard, User, HelpCircle, Shield, FileCheck,
  LogOut, ChevronRight, Activity, Bell, Pill, Wallet,
  CreditCard, Settings, Gift, Heart, UserCircle2, Camera,
  Calendar, Link, Unlink, Loader2, Mail
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getCurrentSession, PatientStorage } from '../../storage';
import { supabase } from '../../supabase';
import { useAuth } from '../../AuthContext';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

interface MoreProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const More: React.FC<MoreProps> = ({ onNavigate, onLogout }) => {
  const session = getCurrentSession();
  const { setProfile } = useAuth();
  const { isConnected, isConfigured, connect, disconnect } = useGoogleCalendar();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(session?.image_url || session?.image || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !session?.id) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop();
      const path = `patient-${session.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = data.publicUrl;
      await supabase.from('profiles').update({ image_url: url }).eq('id', session.id);
      setAvatarUrl(url);
      const updated = { ...session, image_url: url, image: url };
      PatientStorage.set(updated);
      if (setProfile) setProfile(updated);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const sections = [
    {
      title: "Medical Vault",
      items: [
        { icon: Clipboard, label: "Consultation History", path: "/patient/consultations", color: "text-teal-600", bg: "bg-teal-50", desc: "Summary of past visits" },
      ]
    },
    {
      title: "Finances & Rewards",
      items: [
        { icon: Gift, label: "My Rewards", path: "/patient/rewards", color: "text-purple-600", bg: "bg-purple-50", desc: "Redeem points for discounts" },
        { icon: CreditCard, label: "Payment History", path: "#", color: "text-emerald-600", bg: "bg-emerald-50" },
      ]
    },
    {
      title: "Support & Legal",
      items: [
        { icon: HelpCircle, label: "Help & FAQ", path: "#", color: "text-slate-400", bg: "bg-slate-50" },
        { icon: Shield, label: "Privacy & Security", path: "#", color: "text-slate-400", bg: "bg-slate-50" },
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10 px-2">

      {/* USER PROFILE CARD */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-400 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-500"></div>
        <GlassCard className="p-6 bg-white border-0 ring-1 ring-slate-100 shadow-xl rounded-[2.5rem]">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl ring-4 ring-white overflow-hidden">
                {uploading ? (
                  <Loader2 size={28} className="animate-spin text-white" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  session?.name?.charAt(0) || 'U'
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 border-4 border-white rounded-2xl shadow-lg flex items-center justify-center"
              >
                <Camera size={14} className="text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-black text-slate-900 leading-tight">{session?.name || 'User Profile'}</h2>
              <p className="text-slate-500 font-bold text-sm mt-1 flex items-center gap-1">
                <Mail size={13} className="text-slate-400" />
                {session?.email || 'No email'}
              </p>
              <div className="flex gap-2 mt-3">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">Member Level 1</span>
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase rounded-lg border border-purple-100">0 Points</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* SECTIONS */}
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-4">{section.title}</h3>
            <GlassCard className="p-0 overflow-hidden bg-white border-0 ring-1 ring-slate-100 shadow-sm rounded-[2rem]">
              <div className="divide-y divide-slate-50">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => item.path !== '#' && onNavigate(item.path)}
                    className={`p-4 flex items-center gap-4 hover:bg-blue-50/30 transition-all cursor-pointer group ${item.path === '#' ? 'opacity-60' : ''}`}
                  >
                    <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <item.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <span className="block font-black text-slate-800 text-base group-hover:text-blue-600 transition-colors">{item.label}</span>
                      {(item as any).desc && <span className="text-xs text-slate-400 font-bold leading-tight block mt-0.5">{(item as any).desc}</span>}
                    </div>
                    <ChevronRight size={22} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* GOOGLE CALENDAR SYNC */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-4">Integrations</h3>
        <GlassCard className="p-5 bg-white border-0 ring-1 ring-slate-100 shadow-sm rounded-[2rem]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-50' : 'bg-slate-50'}`}>
                <Calendar size={22} className={isConnected ? 'text-green-600' : 'text-slate-400'} />
              </div>
              <div>
                <p className="font-black text-slate-800">Google Calendar</p>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {isConnected ? 'Connected — appointments sync automatically' : isConfigured ? 'Connect to sync your appointments' : 'Add VITE_GOOGLE_CLIENT_ID to .env to enable'}
                </p>
              </div>
            </div>
            {isConnected ? (
              <button onClick={disconnect} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-100 hover:bg-red-100 transition-all">
                <Unlink size={14} /> Disconnect
              </button>
            ) : (
              <button onClick={connect} disabled={!isConfigured} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <Link size={14} /> Connect
              </button>
            )}
          </div>
          {isConnected && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-green-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                Syncing automatically — your appointments appear in Google Calendar
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="pt-6">
        <Button
          variant="outline"
          onClick={onLogout}
          fullWidth
          className="h-16 rounded-3xl border-2 border-red-100 text-red-600 font-black flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-200 transition-all shadow-none text-lg"
        >
          <LogOut size={24} /> Logout Account
        </Button>
        <div className="flex flex-col items-center gap-2 mt-8 pb-8 opacity-30">
          <Heart size={20} className="text-red-500" fill="currentColor" />
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">DocOclock Bangladesh • v2.0.1</p>
        </div>
      </div>
    </div>
  );
};
