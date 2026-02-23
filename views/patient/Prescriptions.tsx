import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import {
   Download, Search, Calendar, Stethoscope, Building2,
   Eye, ShieldCheck, X, Printer, Share2, User, FileDigit
} from 'lucide-react';
import { PatientStorage, fetchPrescriptions, fetchDoctorChambers } from '../../storage';
import { Prescription, Appointment, Doctor, UserRole } from '../../types';
import { supabase } from '../../supabase';

interface PrescriptionsProps {
   onNavigate: (path: string) => void;
}

export const Prescriptions: React.FC<PrescriptionsProps> = ({ onNavigate }) => {
   const [selectedRx, setSelectedRx] = useState<any | null>(null);
   const [searchQuery, setSearchQuery] = useState('');

   // 1. Get Current Patient
   const patient = useMemo(() => PatientStorage.get(), []);
   const currentPatientId = patient?.id;

   // 3. Join logic for display names (since Prescription only stores IDs)
   const [enrichedPrescriptions, setEnrichedPrescriptions] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const enrich = async () => {
         if (!currentPatientId) return;
         setIsLoading(true);
         try {
            const rxList = await fetchPrescriptions(currentPatientId);
            if (rxList.length === 0) {
               setEnrichedPrescriptions([]);
               return;
            }

            // 1. Get unique IDs to batch fetch
            const doctorIds = [...new Set(rxList.map(rx => rx.doctorId))].filter(Boolean);
            const hospitalIds = [...new Set(rxList.map(rx => rx.hospitalId))].filter(Boolean);

            // 2. Parallel batch fetch for doctors and chambers
            const [doctorsResponse, chambersResponse] = await Promise.all([
               doctorIds.length > 0
                  ? supabase.from('profiles').select('*').in('id', doctorIds)
                  : Promise.resolve({ data: [] }),
               hospitalIds.length > 0
                  ? supabase.from('chambers').select('*').in('id', hospitalIds)
                  : Promise.resolve({ data: [] })
            ]);

            const allDoctors = doctorsResponse.data || [];
            const allChambers = chambersResponse.data || [];

            // 3. Merging logic
            const results = rxList.map((rx: any) => {
               const doctor = allDoctors.find((d: any) => String(d.id) === String(rx.doctorId));
               const hospital = allChambers.find((c: any) => String(c.id) === String(rx.hospitalId));

               return {
                  ...rx,
                  doctorName: doctor?.full_name || 'Doctor',
                  specialty: doctor?.specialty || 'Specialist',
                  hospitalName: hospital?.hospital_name || 'Health Center',
                  displayDate: rx.date
               };
            });

            setEnrichedPrescriptions(results.sort((a: any, b: any) => b.createdAt - a.createdAt));
         } catch (error) {
            console.error('Error enriching prescriptions:', error);
         } finally {
            setIsLoading(false);
         }
      };
      enrich();
   }, [currentPatientId]);

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

         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
               <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
               <p className="text-slate-400 font-bold animate-pulse">Retrieving medical records...</p>
            </div>
         ) : filteredRx.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
               {filteredRx.map((rx: any) => (
                  <div key={rx.id} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group/card">
                     {/* Section 1: Header Bar */}
                     <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                        <div className="flex items-center gap-2">
                           <Calendar size={12} className="text-slate-400" />
                           <span className="text-[13px] font-semibold text-slate-900">{rx.displayDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-teal-100 bg-teal-50/50 text-teal-700">
                           <ShieldCheck size={10} strokeWidth={3} />
                           <span className="text-[9px] font-black uppercase tracking-tight">Verified</span>
                        </div>
                     </div>

                     {/* Section 2: Core Medical Info */}
                     <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                        {/* Left Column: Provider & Doctor */}
                        <div className="space-y-5">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Provider</p>
                              <div className="flex items-center gap-2">
                                 <Building2 size={13} className="text-slate-400 shrink-0" />
                                 <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">{rx.hospitalName}</p>
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Doctor</p>
                              <div className="flex items-center gap-2">
                                 <User size={13} className="text-slate-400 shrink-0" />
                                 <p className="text-[14px] font-medium text-slate-800 leading-tight truncate">{rx.doctorName}</p>
                              </div>
                           </div>
                        </div>

                        {/* Right Column: Specialty & Diagnosis */}
                        <div className="space-y-5">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Specialty</p>
                              <div className="flex items-center gap-2">
                                 <Stethoscope size={13} className="text-blue-500 shrink-0" />
                                 <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.1em] truncate">{rx.specialty}</p>
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Diagnosis</p>
                              <p className="text-[13px] font-medium text-slate-700 line-clamp-2 leading-relaxed">{rx.diagnosis || 'General Checkup'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Section 3: Action Area */}
                     <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
                        <button
                           onClick={() => setSelectedRx(rx)}
                           className="flex-1 px-4 py-2.5 rounded-[10px] border border-slate-200 text-slate-600 text-[13px] font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                        >
                           <Eye size={16} />
                           View Record
                        </button>
                        <button
                           className="flex-1 px-4 py-2.5 rounded-[10px] bg-gradient-to-br from-slate-800 to-slate-950 text-white text-[13px] font-bold shadow-sm hover:shadow-lg hover:shadow-indigo-900/10 transition-all flex items-center justify-center gap-2"
                        >
                           <Download size={16} />
                           Download
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-500">
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