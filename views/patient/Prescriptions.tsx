import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import {
   Download, Search, Calendar, Stethoscope, Building2,
   Eye, ShieldCheck, X, Printer, Share2, User, FileDigit
} from 'lucide-react';
import { PatientStorage, getPrescriptions, getAppointments, getDoctorPracticeSettings, getDoctors } from '../../storage';
import { Prescription, Appointment, Doctor } from '../../types';

interface PrescriptionsProps {
   onNavigate: (path: string) => void;
}

export const Prescriptions: React.FC<PrescriptionsProps> = ({ onNavigate }) => {
   const [selectedRx, setSelectedRx] = useState<any | null>(null);
   const [searchQuery, setSearchQuery] = useState('');

   // 1. Get Current Patient
   const patient = PatientStorage.get();
   const currentPatientId = patient?.id;

   // 2. Fetch Structured Data (Exactly as requested)
   const prescriptions = JSON.parse(localStorage.getItem('demo_prescriptions') || '[]');
   const patientPrescriptions = prescriptions.filter(
      (p: any) => String(p.patientId) === String(currentPatientId)
   );

   // 3. Join logic for display names (since Prescription only stores IDs)
   const allDoctors = getDoctors();
   const enrichedPrescriptions = patientPrescriptions.map((rx: any) => {
      const doctor = allDoctors.find(d => String(d.id) === String(rx.doctorId));
      const practiceSettings = rx.doctorId ? getDoctorPracticeSettings(rx.doctorId) : null;
      const hospital = practiceSettings?.chambers.find(c => String(c.id) === String(rx.hospitalId));

      return {
         ...rx,
         doctorName: doctor?.name || 'Unknown Doctor',
         specialty: doctor?.specialty || 'General Physician',
         hospitalName: hospital?.hospitalName || 'Unknown Hospital',
         displayDate: rx.date
      };
   }).sort((a: any, b: any) => b.createdAt - a.createdAt);

   const filteredRx = enrichedPrescriptions.filter((rx: any) =>
      rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const PrescriptionFlashCard = ({ rx }: { rx: any }) => (
      <div className="flex flex-col h-full bg-white relative font-sans">
         <div className="p-6 md:p-8 border-b-2 border-blue-600 bg-white">
            <div className="flex justify-between items-start gap-4">
               <div className="flex gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center justify-center shrink-0">
                     <Stethoscope size={28} className="text-blue-600" />
                  </div>
                  <div className="max-w-[200px] md:max-w-xs">
                     <h2 className="text-xl md:text-2xl font-black text-blue-600 leading-tight">{rx.hospitalName}</h2>
                     <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-1.5 uppercase tracking-widest">Medical Record</p>
                  </div>
               </div>
               <div className="text-right">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">{rx.doctorName}</h3>
                  <p className="text-[10px] md:text-xs text-blue-600 font-black uppercase tracking-widest mt-0.5">{rx.specialty}</p>
               </div>
            </div>
         </div>

         <div className="px-6 md:px-8 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-x-8 gap-y-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="text-blue-600">Patient:</span> <span className="text-slate-600">{patient?.name}</span></div>
            <div className="flex items-center gap-2"><span className="text-blue-600">Date:</span> <span className="text-slate-600">{rx.displayDate}</span></div>
            <div className="ml-auto text-blue-600 flex items-center gap-2">ID: <span className="text-slate-600">#{rx.id}</span></div>
         </div>

         <div className="flex-1 flex flex-col p-6 md:p-8 overflow-hidden">
            <div className="mb-8">
               <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Clinical Diagnosis</h4>
               <p className="text-sm font-bold text-slate-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100">{rx.diagnosis || 'No diagnosis recorded'}</p>
            </div>

            <div className="flex-1 relative">
               <div className="absolute top-0 right-0 opacity-[0.05] pointer-events-none select-none"><span className="text-8xl font-black italic">Rx</span></div>
               <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Medications</h4>
               <div className="space-y-6">
                  {rx.medicines.map((med: any, i: number) => (
                     <div key={i} className="relative group border-b border-slate-50 pb-4 last:border-0">
                        <h4 className="font-black text-slate-900 text-base md:text-lg flex items-center gap-2">
                           {i + 1}. {med.name}
                        </h4>
                        <div className="flex items-center gap-6 mt-3">
                           <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black tracking-widest text-xs shadow-sm shadow-blue-200">{med.dosage}</div>
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{med.beforeAfterMeal} Meal • {med.durationDays} Days</div>
                        </div>
                     </div>
                  ))}
               </div>
               {rx.notes && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                     <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Instructions / Advice:</h4>
                     <p className="text-sm font-bold text-slate-600 italic leading-relaxed">{rx.notes}</p>
                  </div>
               )}
            </div>
         </div>

         <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col items-center">
            <p className="text-[9px] text-slate-400 text-center max-w-xs mb-6 italic">Securely stored and verified by DocOclock Digital Health Registry.</p>
            <div className="w-full flex justify-between items-end">
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recorded: {rx.displayDate}</div>
               <div className="text-center">
                  <div className="w-32 md:w-40 border-b border-slate-300 mb-1 h-8"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Auth</p>
               </div>
            </div>
         </div>
      </div>
   );

   return (
      <div className="space-y-10 pb-16 animate-fade-in max-w-4xl mx-auto px-2">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Prescriptions</h1>
               <p className="text-slate-500 font-bold text-lg mt-2">Your digital health records archive.</p>
            </div>
            <div className="relative w-full md:w-auto shrink-0">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input
                  placeholder="Search doctor or diagnosis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 bg-white border border-slate-200 pl-11 pr-4 py-4 rounded-2xl outline-none font-bold text-sm shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
               />
            </div>
         </div>

         {filteredRx.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {filteredRx.map((rx: any) => (
                  <GlassCard key={rx.id} className="p-0 overflow-hidden bg-white border-0 ring-1 ring-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col">
                     <div className="p-8">
                        <div className="flex justify-between items-start mb-8">
                           <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-200">
                              <Calendar size={14} /> {rx.displayDate}
                           </div>
                           <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                              <ShieldCheck size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Verified Record</span>
                           </div>
                        </div>

                        <div className="space-y-6 mb-2">
                           <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                                 <Building2 size={20} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Provider</p>
                                 <p className="text-lg font-black text-slate-800 leading-tight">{rx.hospitalName}</p>
                              </div>
                           </div>

                           <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                                 <User size={20} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doctor</p>
                                 <p className="text-lg font-black text-slate-900 leading-tight">{rx.doctorName}</p>
                                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{rx.specialty}</p>
                              </div>
                           </div>

                           <div className="flex items-start gap-4 pt-2">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                                 <Stethoscope size={20} />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                 <p className="text-base font-bold text-slate-600 truncate">{rx.diagnosis || 'General Checkup'}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex gap-3 mt-auto">
                        <Button onClick={() => setSelectedRx(rx)} variant="outline" className="flex-1 h-14 rounded-2xl font-black text-sm bg-white border-slate-200 gap-3 shadow-sm hover:bg-slate-50"><Eye size={20} /> View Rx</Button>
                        <Button className="flex-1 h-14 rounded-2xl font-black text-sm gap-3 bg-blue-600 shadow-xl shadow-blue-100"><Download size={20} /> Download</Button>
                     </div>
                  </GlassCard>
               ))}
            </div>
         ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <FileDigit className="mx-auto text-slate-200 mb-6" size={80} />
               <h3 className="text-2xl font-black text-slate-900 mb-2">No Records Found</h3>
               <p className="text-slate-400 font-bold max-w-xs mx-auto">Your prescriptions will appear here once your doctor shares them digitally.</p>
            </div>
         )}

         {selectedRx && (
            <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 animate-fade-in transition-all">
               <div className="bg-white w-full max-w-lg h-auto max-h-[95vh] rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden animate-fade-in-up">
                  <button
                     onClick={() => setSelectedRx(null)}
                     className="absolute top-6 right-6 z-[210] p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all shadow-sm"
                  >
                     <X size={24} />
                  </button>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                     <PrescriptionFlashCard rx={selectedRx} />
                  </div>
                  <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
                     <Button fullWidth className="h-16 rounded-[2rem] text-lg font-black bg-blue-600 shadow-2xl shadow-blue-200 gap-4"><Printer size={24} /> Print Rx</Button>
                     <Button variant="outline" className="h-16 w-16 p-0 rounded-[2rem] bg-white border-slate-200 shrink-0 flex items-center justify-center shadow-sm hover:bg-slate-50"><Share2 size={24} className="text-slate-600" /></Button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};