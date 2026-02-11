
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Users, CreditCard, Activity, Clock, TrendingUp, MapPin, BadgeCheck, AlertCircle } from 'lucide-react';
import { DoctorStorage, getAppointments } from '../../storage';
import { Appointment } from '../../types';

interface DoctorDashboardProps {
  onNavigate?: (path: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate }) => {
  // 1. Retrieve the actual logged-in doctor session
  const doctor = DoctorStorage.get();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const today = new Date().toISOString().split('T')[0];

  // 2. HARD GUARD: Redirect to login if no session found
  useEffect(() => {
    if (!doctor) {
      if (onNavigate) {
        onNavigate('/doctor-login');
      } else {
        window.location.href = '/doctor-login';
      }
      return;
    }

    // Load real appointments for stats
    const all = getAppointments();
    setAppointments(all.filter(a => a.doctorId === doctor.id && a.date === today));
  }, [doctor, onNavigate, today]);

  if (!doctor) return null;

  const currentChamber = doctor.chambers?.[0] || { name: 'No primary chamber set' };
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const waitingCount = appointments.filter(a => a.status === 'waiting').length;

  return (
    <div className="space-y-8 pb-10 animate-fade-in">

      {/* SECTION 1: DOCTOR PROFILE HEADER */}
      <GlassCard className="p-6 border-l-4 border-blue-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 z-0 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <img
              src={doctor.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-slate-50"
              alt="Doctor Avatar"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
              <BadgeCheck size={16} />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{doctor.name}</h1>
              <span className="hidden md:inline-flex px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-100">Verified Professional</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-slate-600 font-bold">
              <span className="text-teal-600 uppercase tracking-wide">{doctor.specialty}</span>
              <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-black">BMDC: {doctor.bmdcNumber}</span>
              <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-red-500" /> {currentChamber.name}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-xl font-black border-slate-200">Practice Settings</Button>
          </div>
        </div>
      </GlassCard>

      {/* SECTION 2: TODAY'S OVERVIEW */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" /> Today's Statistics
          </h2>
          <div className="text-xs font-black text-slate-400 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Operational Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Patients', value: appointments.length, sub: 'Today\'s bookings', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { title: 'Revenue (Today)', value: `৳ ${completedCount * (doctor.chambers?.[0]?.fee || 0)}`, sub: 'Collected fee', icon: CreditCard, color: 'text-teal-600', bg: 'bg-teal-50' },
            { title: 'Remaining', value: waitingCount, sub: 'Patients waiting', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
            { title: 'Experience', value: `${doctor.experienceYears || '1'}y`, sub: 'Practice history', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, idx) => (
            <GlassCard key={idx} className="p-6 flex items-center gap-5 hover:scale-[1.02] transition-all border-0 ring-1 ring-slate-100 shadow-sm">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-3xl font-black text-slate-800 leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-bold">{stat.sub}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Recent Appointments Table */}
        <GlassCard className="p-8 border-0 ring-1 ring-slate-100 shadow-sm bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Today's Registry</h3>
            <button onClick={() => onNavigate?.('/doctor/serial-manager')} className="text-xs text-blue-600 font-black uppercase tracking-widest hover:underline flex items-center gap-2">
              Manage Queue <TrendingUp size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] bg-slate-50/50">
                  <th className="py-4 pl-4 rounded-l-2xl">Serial</th>
                  <th className="py-4">Patient Name</th>
                  <th className="py-4">Time Slot</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 pr-4 rounded-r-2xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-sm">
                {appointments.length > 0 ? appointments.sort((a, b) => a.tokenNumber - b.tokenNumber).slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 group">
                    <td className="py-5 pl-4 font-black text-blue-600">#{row.tokenNumber.toString().padStart(2, '0')}</td>
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">P</div>
                        <span className="font-bold text-slate-800">{row.patientName}</span>
                      </div>
                    </td>
                    <td className="py-5 font-bold text-slate-500">{row.time}</td>
                    <td className="py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${row.status === 'waiting' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                          row.status === 'consulting' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-green-50 text-green-600 border-green-100'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-right">
                      <button onClick={() => onNavigate?.('/doctor/serial-manager')} className="text-slate-400 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-widest border border-slate-200 px-4 py-2 rounded-xl hover:border-blue-200 hover:bg-blue-50/50">Manage</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-bold">No bookings for today yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><AlertCircle size={20} /></div>
              <p className="text-xs font-bold text-slate-600">This dashboard reflects real-time bookings from patients. New entries appear automatically as they occur.</p>
            </div>
            <Button onClick={() => onNavigate?.('/doctor/manual-booking')} className="h-11 px-6 rounded-xl text-xs font-black shadow-none whitespace-nowrap bg-slate-800">Add Walk-in Patient</Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
