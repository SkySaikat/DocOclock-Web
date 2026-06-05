import React from 'react';
import { 
  Activity, Mail, MapPin, Phone, Facebook, 
  Twitter, Instagram, Linkedin, Search, 
  Calendar, CreditCard, Clock, FileText, 
  ChevronRight, Heart, ExternalLink
} from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 pt-20 pb-10 text-slate-300 overflow-hidden relative">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Brand & About */}
          <div className="space-y-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => onNavigate('/')}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg shadow-white/10">
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                  <path d="M30 35 C 30 20, 70 20, 70 35" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
                  <path d="M50 50 L 50 85" stroke="#14b8a6" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="10" fill="#0f172a" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                DocOclock
              </span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Transforming healthcare delivery through digital excellence. Find doctors, manage appointments, and access your medical history anytime, anywhere.
            </p>

            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Navigation</h3>
            <ul className="space-y-4">
              {[
                { label: 'Find a Doctor', path: '/patient/doctors' },
                { label: 'Doctor Registration', path: '/for-doctors' },
                { label: 'Medicine Tracker', path: '/patient/medicine-tracker' },
                { label: 'Support Center', path: '#' },
                { label: 'Privacy Policy', path: '#' }
              ].map((link, i) => (
                <li key={i}>
                  <button 
                    onClick={() => onNavigate(link.path)}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors font-bold text-sm"
                  >
                    <ChevronRight size={14} /> {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* How it Works */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">How It Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { 
                  icon: Search, 
                  title: 'Discover', 
                  desc: 'Find the right specialist based on category and expertise.' 
                },
                { 
                  icon: Calendar, 
                  title: 'Booking', 
                  desc: 'Instant appointment or reappointment issued by your doctor.' 
                },
                { 
                  icon: Clock, 
                  title: 'Live Tracking', 
                  desc: 'Track if your doctor is on time or late to save your valuable time.' 
                },
                { 
                  icon: FileText, 
                  title: 'Digital Rx', 
                  desc: 'Get electronic prescriptions on your email and dashboard instantly.' 
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-lg shadow-blue-500/10">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10 border-t border-slate-800/50">
          <div className="flex items-center gap-4 text-sm font-bold">
            <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400">
              <Activity size={20} />
            </div>
            <span>Electronic Prescriptions</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
              <Clock size={20} />
            </div>
            <span>Real-time Doctor Status</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <MapPin size={20} />
            </div>
            <span>Access-Anywhere History</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} DocOclock. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
