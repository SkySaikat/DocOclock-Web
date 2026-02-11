import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  FileText, Clipboard, User, HelpCircle, Shield, FileCheck, 
  LogOut, ChevronRight, Activity, Bell, Pill, Wallet, 
  CreditCard, Settings, Gift, Heart, UserCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getCurrentSession } from '../../storage';

interface MoreProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const More: React.FC<MoreProps> = ({ onNavigate, onLogout }) => {
  const session = getCurrentSession();
  
  const sections = [
    { 
      title: "Active Health",
      items: [
        { icon: Pill, label: "Medicine Tracker", path: "/patient/medicine-tracker", color: "text-indigo-600", bg: "bg-indigo-50", desc: "Track daily dosage & alerts" },
        { icon: Activity, label: "Check Status", path: "/live-serial", color: "text-red-500", bg: "bg-red-50", desc: "Track live serial queue" },
      ]
    },
    { 
      title: "Medical Vault",
      items: [
        { icon: FileText, label: "Prescriptions", path: "/patient/prescriptions", color: "text-blue-600", bg: "bg-blue-50", desc: "Digital Rx history" },
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
      title: "Account & Preferences",
      items: [
        { icon: UserCircle2, label: "Profile Information", path: "#", color: "text-slate-600", bg: "bg-slate-50" },
        { icon: Settings, label: "App Settings", path: "#", color: "text-slate-600", bg: "bg-slate-50" },
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
    <div className="space-y-10 animate-fade-in max-w-2xl mx-auto pb-10 px-2">
       
       {/* USER PROFILE CARD */}
       <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-400 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-500"></div>
          <GlassCard className="p-8 bg-white border-0 ring-1 ring-slate-100 shadow-xl rounded-[2.5rem]">
             <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-4 ring-white">
                     {session?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-2xl shadow-lg flex items-center justify-center">
                     <CheckCircle2 size={16} className="text-white"/>
                  </div>
                </div>
                <div className="flex-1">
                   <h2 className="text-3xl font-black text-slate-900 leading-tight">{session?.name || 'User Profile'}</h2>
                   <p className="text-slate-500 font-bold text-base mt-1">{session?.phone || 'No phone number'}</p>
                   <div className="flex gap-2 mt-3">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">Member Level 1</span>
                      <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase rounded-lg border border-purple-100">0 Points</span>
                   </div>
                </div>
             </div>
          </GlassCard>
       </div>

       {/* SECTIONS */}
       <div className="space-y-10">
         {sections.map((section, idx) => (
           <div key={idx} className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] px-4">{section.title}</h3>
              <GlassCard className="p-0 overflow-hidden bg-white border-0 ring-1 ring-slate-100 shadow-sm rounded-[2rem]">
                 <div className="divide-y divide-slate-50">
                    {section.items.map((item, i) => (
                       <div 
                         key={i} 
                         onClick={() => item.path !== '#' && onNavigate(item.path)}
                         className="p-6 flex items-center gap-5 hover:bg-blue-50/30 transition-all cursor-pointer group"
                       >
                          <div className={`p-4 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                             <item.icon size={28} />
                          </div>
                          <div className="flex-1">
                             <span className="block font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{item.label}</span>
                             {item.desc && <span className="text-xs text-slate-400 font-bold leading-tight block mt-0.5">{item.desc}</span>}
                          </div>
                          <ChevronRight size={22} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all"/>
                       </div>
                    ))}
                 </div>
              </GlassCard>
           </div>
         ))}
       </div>

       {/* LOGOUT BUTTON */}
       <div className="pt-10">
         <Button 
           variant="outline" 
           onClick={onLogout}
           fullWidth 
           className="h-16 rounded-3xl border-2 border-red-100 text-red-600 font-black flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-200 transition-all shadow-none text-lg"
         >
            <LogOut size={24} /> Logout Account
         </Button>
         <div className="flex flex-col items-center gap-2 mt-16 pb-12 opacity-30">
            <Heart size={20} className="text-red-500" fill="currentColor"/>
            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">DocOclock Bangladesh • v1.0.44</p>
         </div>
       </div>
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
