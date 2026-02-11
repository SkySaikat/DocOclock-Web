import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { 
  Plus, Bell, BellOff, Clock, Trash2, Calendar, 
  ChevronRight, Pill, Droplets, FlaskConical, Search, 
  CheckCircle2, AlertCircle, Info, Heart
} from 'lucide-react';

interface MedicineTrackerProps {
  allPrescriptions?: any[];
}

interface UserMedicine {
  id: string;
  name: string;
  strength: string;
  type: string;
  dose: string; // e.g. "1+0+1"
  instruction: string;
  duration: string;
  isAutoAdded: boolean;
  doctorName?: string;
  alertsEnabled: boolean;
}

export const MedicineTracker: React.FC<MedicineTrackerProps> = ({ allPrescriptions = [] }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualMeds, setManualMeds] = useState<UserMedicine[]>([]);

  // 1. Extract medicines from all prescriptions
  const prescribedMeds: UserMedicine[] = useMemo(() => {
    const meds: UserMedicine[] = [];
    allPrescriptions.forEach(rx => {
      rx.medicines.forEach((m: any, idx: number) => {
        meds.push({
          id: `auto-${rx.id}-${idx}`,
          name: m.name,
          strength: m.strength,
          type: m.type,
          dose: m.dose,
          instruction: m.instruction,
          duration: m.duration,
          isAutoAdded: true,
          doctorName: rx.doctorName,
          alertsEnabled: true
        });
      });
    });
    return meds;
  }, [allPrescriptions]);

  const allMeds = [...prescribedMeds, ...manualMeds];

  // 2. Organize by Time Slots
  const timeSlots = {
    Morning: allMeds.filter(m => m.dose.split('+')[0] !== '0'),
    Noon: allMeds.filter(m => m.dose.split('+')[1] !== '0'),
    Night: allMeds.filter(m => m.dose.split('+')[2] !== '0'),
  };

  const handleAddManual = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMed: UserMedicine = {
      id: `manual-${Date.now()}`,
      name: formData.get('name') as string,
      strength: formData.get('strength') as string,
      type: formData.get('type') as string,
      dose: `${formData.get('d1')}+${formData.get('d2')}+${formData.get('d3')}`,
      instruction: formData.get('instruction') as string,
      duration: 'Ongoing',
      isAutoAdded: false,
      alertsEnabled: true
    };
    setManualMeds([newMed, ...manualMeds]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Medicine Tracker</h1>
            <p className="text-slate-500 font-bold">Track your daily dosage and set reminders.</p>
         </div>
         <Button onClick={() => setIsAddModalOpen(true)} className="rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-blue-100">
            <Plus size={20}/> Add Medicine
         </Button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <GlassCard className="p-6 bg-indigo-600 text-white border-0 shadow-xl shadow-indigo-100">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Active</p>
            <h2 className="text-4xl font-black">{allMeds.length}</h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl w-fit">
               <Pill size={14}/> {manualMeds.length} Self Added
            </div>
         </GlassCard>
         <GlassCard className="p-6 bg-white border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prescribed By Doctor</p>
            <h2 className="text-4xl font-black text-slate-800">{prescribedMeds.length}</h2>
            <div className="mt-4 text-xs font-bold text-teal-600">Synced from records</div>
         </GlassCard>
         <GlassCard className="p-6 bg-white border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reminders</p>
            <h2 className="text-4xl font-black text-slate-800">{allMeds.filter(m => m.alertsEnabled).length}</h2>
            <div className="mt-4 text-xs font-bold text-blue-500 flex items-center gap-1"><Bell size={14}/> Active Alerts</div>
         </GlassCard>
      </div>

      {/* DAILY SCHEDULE */}
      <div className="space-y-10">
         {(['Morning', 'Noon', 'Night'] as const).map(slot => (
           <div key={slot} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                 <div className={`w-2 h-2 rounded-full ${slot === 'Morning' ? 'bg-orange-400' : slot === 'Noon' ? 'bg-yellow-400' : 'bg-indigo-400'}`}></div>
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{slot} Routine</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {timeSlots[slot].length > 0 ? timeSlots[slot].map(med => (
                   <GlassCard key={med.id + slot} className="p-6 bg-white border-0 ring-1 ring-slate-100 hover:ring-indigo-100 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${med.isAutoAdded ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                               <Pill size={24} />
                            </div>
                            <div>
                               <h4 className="font-black text-slate-900 text-lg leading-tight">{med.name}</h4>
                               <p className="text-xs text-slate-400 font-bold">{med.strength} • {med.type}</p>
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <button className={`p-2 rounded-xl transition-all ${med.alertsEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                               {med.alertsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                            </button>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">Dose: {med.dose}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{med.instruction}</span>
                         </div>
                         {med.isAutoAdded && (
                           <div className="text-[9px] font-black text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                             Rx: {med.doctorName}
                           </div>
                         )}
                      </div>
                   </GlassCard>
                 )) : (
                   <div className="col-span-full py-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                      <Clock size={24} className="mb-2 opacity-30" />
                      <p className="text-xs font-bold">No medication scheduled for {slot}</p>
                   </div>
                 )}
              </div>
           </div>
         ))}
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
           <GlassCard className="w-full max-w-lg bg-white p-0 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)]">
              <div className="bg-indigo-600 p-8 text-white relative">
                 <h2 className="text-2xl font-black">Add Manual Medicine</h2>
                 <p className="text-indigo-100 text-sm font-bold opacity-80 mt-1">Track non-prescribed health products.</p>
                 <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleAddManual} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Medicine Name</label>
                       <input name="name" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. Napa, Vitamin C..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Strength</label>
                          <input name="strength" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="e.g. 500mg" />
                       </div>
                       <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                          <select name="type" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                             <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Drop</option><option>Injection</option>
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Daily Dosage (Morning+Noon+Night)</label>
                       <div className="flex gap-2">
                          <select name="d1" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-center"><option>0</option><option>1</option><option>2</option></select>
                          <select name="d2" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-center"><option>0</option><option>1</option><option>2</option></select>
                          <select name="d3" className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-center"><option>0</option><option>1</option><option>2</option></select>
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Instruction</label>
                       <select name="instruction" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                          <option>After Meal</option><option>Before Meal</option><option>With Meal</option><option>Empty Stomach</option>
                       </select>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" fullWidth onClick={() => setIsAddModalOpen(false)} className="h-14 rounded-2xl border-2 font-black">Cancel</Button>
                    <Button type="submit" fullWidth className="h-14 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-100">Save Medicine</Button>
                 </div>
              </form>
           </GlassCard>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);