import React from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../AuthContext';
import { Activity, Clock, LogOut, LayoutDashboard, User } from 'lucide-react';

interface AssistantLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const AssistantLayout = ({ children, currentPath, onNavigate }: AssistantLayoutProps) => {
  const { profile, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-100 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-black text-xl">
            DA
          </div>
          <div>
            <h1 className="font-black text-slate-900 leading-tight">DocOclock</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">Assistant Portal</p>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => onNavigate('/assistant/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              currentPath === '/assistant/dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={20} />
            Overview
          </button>

          <button
            onClick={() => onNavigate('/assistant/appointments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              currentPath === '/assistant/appointments' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User size={20} />
            Patient Reservations
          </button>

          <button
            onClick={() => onNavigate('/assistant/queue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              currentPath === '/assistant/queue' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Clock size={20} />
            Queue Manager
          </button>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
              {profile?.name?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.name}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
         {children}
      </div>
    </div>
  );
};
