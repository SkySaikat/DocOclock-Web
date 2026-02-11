import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Calendar, User, FileText, Clock, ArrowRight, MapPin } from 'lucide-react';

interface ConsultationsProps {
  onNavigate: (path: string) => void;
}

export const Consultations: React.FC<ConsultationsProps> = ({ onNavigate }) => {
  // Mocking data that would come from the backend synced with the prescription
  const nextFollowUp = {
    date: new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    doctor: "Dr. Sarah Ahmed",
    specialty: "Cardiology",
    location: "Square Hospital",
    note: "Review lipid profile report and adjust blood pressure medication if necessary."
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Consultation History</h1>
          <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">ID: #P-8832</div>
       </div>

       <div className="space-y-6">
          {/* Active Follow Up Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
            <GlassCard className="p-5 relative border-0 ring-1 ring-slate-100">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Upcoming</span>
                     <span className="text-2xl font-bold text-slate-800">Next Follow-up</span>
                  </div>
                  <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-100 flex items-center gap-2">
                     <Calendar size={16} />
                     {nextFollowUp.date}
                  </div>
               </div>

               <div className="flex items-start gap-4 mt-2 border-t border-slate-100 pt-4">
                  <img src="https://picsum.photos/200/200?random=1" className="w-14 h-14 rounded-2xl object-cover bg-slate-100" alt="Doctor" />
                  <div className="flex-1">
                     <h3 className="font-bold text-slate-800 text-lg">{nextFollowUp.doctor}</h3>
                     <p className="text-sm text-teal-600 font-bold mb-1">{nextFollowUp.specialty}</p>
                     <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} /> {nextFollowUp.location}
                     </div>
                  </div>
               </div>

               {nextFollowUp.note && (
                 <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Doctor's Note</p>
                    <p className="text-sm text-slate-600 italic">
                       "{nextFollowUp.note}"
                    </p>
                 </div>
               )}
            </GlassCard>
          </div>

          <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 px-1">Past Consultations</h3>
             <div className="space-y-3">
               {[1, 2, 3].map((i) => (
                  <GlassCard key={i} className="p-4 flex items-center justify-between group cursor-pointer hover:border-blue-300 transition hover:shadow-md">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${i === 1 ? 'bg-blue-500' : 'bg-slate-400'}`}>
                           <User size={20}/>
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800">{i === 1 ? 'Dr. Rafiqul Islam' : 'Dr. Anika Tabassum'}</h4>
                           <p className="text-xs text-slate-500 font-medium">12 Oct 2023 • {i === 1 ? 'Neurology' : 'Dermatology'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="hidden md:inline text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">View Prescription</span>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition"/>
                     </div>
                  </GlassCard>
               ))}
             </div>
          </div>
       </div>
    </div>
  );
};