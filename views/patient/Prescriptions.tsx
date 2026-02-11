import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { 
  FileText, Download, ChevronDown, ChevronUp, Search, Calendar, 
  Stethoscope, Building2, Eye, ShieldCheck, Heart, Brain, X, 
  Printer, Share2, MapPin, User, BadgeCheck, FileDigit, Phone
} from 'lucide-react';

interface PrescriptionsProps {
  onNavigate: (path: string) => void;
  customPrescriptions?: any[];
}

interface MedicineDetail {
  name: string;
  strength: string;
  type: string;
  generic: string;
  dose: string;
  instruction: string;
  duration: string;
}

interface DemoRx {
  id: string;
  date: string;
  hospital: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalLogo: string;
  patientName?: string;
  age?: string;
  diagnosis: string[];
  findings: string[];
  tests: string[];
  medicines: MedicineDetail[];
  advice: string;
  doctorName: string;
  doctorDegrees: string;
  specialty: string;
  bmdc: string;
}

export const Prescriptions: React.FC<PrescriptionsProps> = ({ onNavigate, customPrescriptions = [] }) => {
  const [expandedDept, setExpandedDept] = useState<string | null>('Cardiology');
  const [selectedRx, setSelectedRx] = useState<DemoRx | null>(null);

  // BASE MOCK DATA
  const initialData = [
    {
      department: 'Cardiology',
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-50',
      doctors: [
        {
          name: 'Dr. Sarah Ahmed',
          prescriptions: [
            { 
              id: 'PRES-9512', 
              date: '04/02/2024', 
              hospital: 'Square Hospital Ltd.',
              hospitalAddress: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205',
              hospitalPhone: '10616, 09610010616',
              hospitalLogo: 'https://cdn-icons-png.flaticon.com/512/5996/5996258.png',
              patientName: 'Nasreen Akter',
              age: '23',
              diagnosis: ['Hypertension', 'Mild Angina'], 
              findings: ['Chest pain (mild)', 'Shortness of breath'],
              tests: ['ECG', 'Lipid Profile'],
              medicines: [
                { name: 'Napa Extend', strength: '665mg', type: 'Tablet', generic: 'Paracetamol', dose: '1+0+1', instruction: 'After Meal', duration: '7 Days' },
                { name: 'Seclo', strength: '20mg', type: 'Capsule', generic: 'Omeprazole', dose: '1+0+1', instruction: 'Before Meal', duration: '14 Days' },
              ],
              advice: 'Avoid fatty foods. Walk for 30 mins daily.',
              doctorName: 'Dr. Sarah Ahmed', 
              doctorDegrees: 'MBBS, FCPS (Cardiology), MD', 
              specialty: 'Cardiologist', 
              bmdc: 'A-12345' 
            }
          ]
        }
      ]
    }
  ];

  // Merge custom prescriptions from the shared session
  const displayData = [...initialData];
  if (customPrescriptions.length > 0) {
      customPrescriptions.forEach(rx => {
          const dept = displayData.find(d => d.department === rx.specialty) || displayData[0];
          const doctor = dept.doctors.find(d => d.name === rx.doctorName);
          if (doctor) {
              if (!doctor.prescriptions.some(p => p.id === rx.id)) {
                doctor.prescriptions.unshift(rx);
              }
          } else {
              dept.doctors.unshift({
                  name: rx.doctorName,
                  prescriptions: [rx]
              });
          }
      });
  }

  const PrescriptionFlashCard = ({ rx }: { rx: DemoRx }) => (
    <div className="flex flex-col h-full bg-white relative font-sans">
      <div className="p-6 md:p-8 border-b-2 border-blue-600 bg-white">
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-4">
             <div className="w-14 h-14 md:w-16 md:h-16 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                <img src={rx.hospitalLogo} className="w-full h-full object-contain" alt="Logo" />
             </div>
             <div className="max-w-[200px] md:max-w-xs">
                <h2 className="text-xl md:text-2xl font-black text-blue-600 leading-tight">{rx.hospital}</h2>
                <div className="text-[9px] md:text-[10px] text-slate-500 font-bold mt-1.5 space-y-0.5">
                   <p className="flex items-start gap-1"><MapPin size={10} className="mt-0.5 shrink-0"/> {rx.hospitalAddress}</p>
                   <p className="flex items-center gap-1"><Phone size={10}/> {rx.hospitalPhone}</p>
                </div>
             </div>
          </div>
          <div className="text-right">
             <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">{rx.doctorName}</h3>
             <p className="text-[10px] md:text-xs text-blue-600 font-black uppercase tracking-widest mt-0.5">{rx.specialty}</p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-x-8 gap-y-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
         <div className="flex items-center gap-2"><span className="text-blue-600">Name:</span> <span className="text-slate-600">{rx.patientName || 'Patient'}</span></div>
         <div className="flex items-center gap-2"><span className="text-blue-600">Age:</span> <span className="text-slate-600">{rx.age || 'N/A'}</span></div>
         <div className="flex items-center gap-2"><span className="text-blue-600">Date:</span> <span className="text-slate-600">{rx.date}</span></div>
         <div className="ml-auto text-blue-600 flex items-center gap-2">ID: <span className="text-slate-600">#{rx.id}</span></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row p-6 md:p-8 overflow-hidden">
        <div className="w-full md:w-1/3 md:border-r border-slate-100 space-y-8 md:pr-6 mb-8 md:mb-0">
           <section>
              <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Findings / Diagnosis</h4>
              <ul className="space-y-1.5 pl-4 list-disc text-xs font-bold text-slate-700 marker:text-slate-300">
                 {rx.findings.filter(f => f.trim()).map((f, i) => <li key={i}>{f}</li>)}
                 {rx.diagnosis.filter(d => d.trim()).map((d, i) => <li key={i}>{d}</li>)}
              </ul>
           </section>
           <section>
              <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Tests</h4>
              <ol className="space-y-1.5 pl-4 list-decimal text-xs font-bold text-slate-700 marker:text-slate-300">
                 {rx.tests.filter(t => t.trim()).map((t, i) => <li key={i}>{t}</li>)}
              </ol>
           </section>
        </div>

        <div className="flex-1 md:pl-8 flex flex-col relative">
           <div className="absolute top-0 right-0 opacity-[0.05] pointer-events-none select-none"><span className="text-8xl font-black italic">Rx</span></div>
           <div className="flex-1 space-y-6">
              {rx.medicines.map((med, i) => (
                <div key={i} className="relative group">
                   <h4 className="font-black text-slate-900 text-base md:text-lg flex items-center gap-2">
                      {i + 1}. {med.name} <span className="text-xs font-bold text-slate-400">{med.strength}</span>
                   </h4>
                   <p className="text-[10px] text-slate-400 italic font-medium -mt-0.5">({med.generic})</p>
                   <div className="flex items-center gap-6 mt-3">
                      <div className="bg-slate-100 px-3 py-1 rounded-lg font-black tracking-widest text-slate-800 text-xs border border-slate-200">{med.dose}</div>
                      <div className="text-xs text-slate-500 font-bold">{med.instruction} | {med.duration}</div>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Advice:</h4>
              <p className="text-sm font-bold text-slate-600 italic leading-relaxed">{rx.advice}</p>
           </div>
        </div>
      </div>

      <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col items-center">
         <p className="text-[9px] text-slate-400 text-center max-w-xs mb-6">Verified Digital Prescription • DocOclock Health</p>
         <div className="w-full flex justify-between items-end">
            <div className="text-[9px] font-bold text-slate-400">Recorded: {rx.date}</div>
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Health Records</h1>
            <p className="text-slate-500 font-bold text-lg mt-2">Your digital medical history vault.</p>
         </div>
         <div className="relative w-full md:w-auto shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
               placeholder="Search records..."
               className="w-full md:w-64 bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none font-bold text-sm shadow-sm"
            />
         </div>
      </div>

      <div className="space-y-6">
        {displayData.map((dept) => (
          <div key={dept.department} className="space-y-4">
            <div 
              className="group p-6 bg-white rounded-[2rem] border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-xl hover:border-blue-100 transition-all shadow-sm"
              onClick={() => setExpandedDept(expandedDept === dept.department ? null : dept.department)}
            >
                <div className="flex items-center gap-5">
                   <div className={`${dept.bg} ${dept.color} p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                      <dept.icon size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">{dept.department}</h3>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {dept.doctors.length} Specialists • {dept.doctors.reduce((acc, d) => acc + d.prescriptions.length, 0)} Records
                      </p>
                   </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${expandedDept === dept.department ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                   {expandedDept === dept.department ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                </div>
            </div>

            {expandedDept === dept.department && (
               <div className="space-y-8 pl-4 md:pl-10 animate-fade-in">
                  {dept.doctors.map((doc, idx) => (
                     <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                           <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Files from {doc.name}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {doc.prescriptions.map((rx) => (
                             <GlassCard key={rx.id} className="p-0 overflow-hidden bg-white border-0 ring-1 ring-slate-100 shadow-lg hover:shadow-2xl transition-all flex flex-col">
                                <div className="p-6">
                                   <div className="flex justify-between items-start mb-6">
                                      <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider border border-blue-100">
                                         <Calendar size={14} /> {rx.date}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-slate-300">
                                         <ShieldCheck size={14} className="text-teal-500"/>
                                         <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                      </div>
                                   </div>
                                   <div className="space-y-4 mb-6">
                                      <div className="flex items-start gap-4">
                                         <Building2 size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                         <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p><p className="text-base font-black text-slate-800">{rx.hospital}</p></div>
                                      </div>
                                      <div className="flex items-start gap-4">
                                         <Stethoscope size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                         <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</p><p className="text-base font-black text-slate-800 truncate">{rx.diagnosis.join(', ') || 'General Consultation'}</p></div>
                                      </div>
                                   </div>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                                   <Button onClick={() => setSelectedRx(rx)} variant="outline" className="flex-1 h-12 rounded-xl font-black text-sm bg-white border-slate-200 gap-2"><Eye size={18} /> View Rx</Button>
                                   <Button className="flex-1 h-12 rounded-xl font-black text-sm gap-2"><Download size={18} /> Download</Button>
                                </div>
                             </GlassCard>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            )}
          </div>
        ))}
      </div>

      {selectedRx && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 animate-fade-in">
           <div className="bg-white w-full max-w-lg h-auto max-h-[90vh] rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden animate-fade-in-up">
              <button onClick={() => setSelectedRx(null)} className="absolute top-6 right-6 z-[210] p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all"><X size={28} /></button>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <PrescriptionFlashCard rx={selectedRx} />
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                 <Button fullWidth className="h-14 rounded-2xl text-lg font-black shadow-xl gap-3"><Printer size={20} /> Print File</Button>
                 <Button variant="outline" className="h-14 w-16 p-0 rounded-2xl bg-white border-slate-200 shrink-0 flex items-center justify-center shadow-sm"><Share2 size={20} /></Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};