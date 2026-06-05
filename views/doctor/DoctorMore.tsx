import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    FileText, Clipboard, User, HelpCircle, Shield,
    LogOut, ChevronRight, Activity, Bell, Pill, Wallet,
    CreditCard, Settings, Gift, Heart, UserCircle2,
    Stethoscope, BriefcaseMedical, LayoutDashboard,
    ShieldCheck, Banknote, History, Globe, UserCheck, Calendar, Link, Unlink
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DoctorStorage } from '../../storage';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

interface DoctorMoreProps {
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

export const DoctorMore: React.FC<DoctorMoreProps> = ({ onNavigate, onLogout }) => {
    const doctor = DoctorStorage.get();
    const { isConnected, isConfigured, connect, disconnect } = useGoogleCalendar();

    const sections = [
        {
            title: "Professional Identity",
            items: [
                {
                    icon: UserCheck,
                    label: "Profile Settings",
                    path: "/doctor/profile-editor",
                    color: "text-teal-600",
                    bg: "bg-teal-50",
                    desc: "Edit degrees, bio, experience & photo"
                },
                {
                    icon: UserCircle2,
                    label: "View Public Profile",
                    path: "#",
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                    desc: "See how patients view your profile"
                },
            ]
        },
        {
            title: "Practice & Finances",
            items: [
                { icon: Settings, label: "Chamber & Schedule", path: "/doctor/practice-settings", color: "text-blue-600", bg: "bg-blue-50", desc: "Manage visiting hours and fees" },
                { icon: Banknote, label: "Payout Options", path: "#", color: "text-amber-600", bg: "bg-amber-50", desc: "Manage bKash/Bank details" },
            ]
        },
        {
            title: "Support & Security",
            items: [
                { icon: ShieldCheck, label: "Account Security", path: "#", color: "text-slate-600", bg: "bg-slate-50" },
                { icon: HelpCircle, label: "Help & FAQ", path: "#", color: "text-slate-400", bg: "bg-slate-50" },
            ]
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10 px-2 lg:px-0">
            {/* DOCTOR PROFILE CARD */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-blue-500 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-500"></div>
                <GlassCard className="p-6 bg-slate-900 border-0 shadow-2xl rounded-[2.5rem]">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-tr from-teal-400 to-blue-400 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl ring-4 ring-slate-800 overflow-hidden">
                                {doctor?.image ? (
                                    <img src={doctor.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    doctor?.name?.charAt(0) || 'D'
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-500 border-4 border-slate-900 rounded-2xl shadow-lg flex items-center justify-center">
                                <ShieldCheck size={16} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-white leading-tight">{doctor?.name || 'Dr. Account'}</h2>
                            <div className="flex flex-col gap-1 mt-1">
                                <p className="text-teal-400 font-bold text-sm flex items-center gap-2">
                                    <Stethoscope size={14} className="text-teal-400" />
                                    {doctor?.specialty || 'General Practitioner'}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                                        BMDC: {doctor?.bmdcNumber || doctor?.bmdc_number || '123456'}
                                    </span>
                                    {doctor?.degrees && (
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                                            {doctor.degrees}
                                        </span>
                                    )}
                                </div>
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
                                        className={`p-4 flex items-center gap-4 hover:bg-teal-50/30 transition-all cursor-pointer group ${item.path === '#' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                    >
                                        <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                            <item.icon size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="block font-black text-slate-800 text-base group-hover:text-teal-700 transition-colors">{item.label}</span>
                                                {item.path === '#' && <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">Soon</span>}
                                            </div>
                                            {item.desc && <span className="text-xs text-slate-400 font-bold leading-tight block mt-0.5">{item.desc}</span>}
                                        </div>
                                        <ChevronRight size={22} className="text-slate-300 group-hover:text-teal-500 transform group-hover:translate-x-1 transition-all" />
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
                                    {isConnected ? 'Connected — appointments will sync automatically' : isConfigured ? 'Click Connect to sync your appointments' : 'Add VITE_GOOGLE_CLIENT_ID to .env to enable'}
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
                                Syncing automatically — future appointments will appear in your Google Calendar
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
                    <Heart size={20} className="text-teal-500" fill="currentColor" />
                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">DocOclock for Doctors • v2.0.1</p>
                </div>
            </div>
        </div>
    );
};
