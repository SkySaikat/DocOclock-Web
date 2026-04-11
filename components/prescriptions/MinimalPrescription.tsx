import React from 'react';

interface PrescriptionData {
  doctorName: string;
  doctorDegrees: string;
  doctorSpecialty: string;
  doctorBmdc: string;
  doctorPhone?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  date: string;
  diagnosis?: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  advice?: string;
  followUpDate?: string;
}

export const MinimalPrescription: React.FC<{ data: PrescriptionData }> = ({ data }) => {
  return (
    <div className="bg-white w-full max-w-[800px] mx-auto shadow-2xl border border-slate-200" style={{ fontFamily: "'SF Pro', 'Inter', sans-serif" }}>
      {/* Minimal Header */}
      <div className="p-8 flex justify-between items-start border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-black">℞</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">{data.doctorName}</h1>
            <p className="text-xs text-slate-500 font-medium">{data.doctorDegrees} · {data.doctorSpecialty}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold">BMDC {data.doctorBmdc}</p>
          {data.doctorPhone && <p className="text-xs text-slate-400 mt-1">{data.doctorPhone}</p>}
        </div>
      </div>

      {/* Patient Strip */}
      <div className="px-8 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
        <div className="flex gap-6">
          <span>{data.patientName}</span>
          <span className="text-slate-400">Age: {data.patientAge}</span>
          <span className="text-slate-400">{data.patientGender}</span>
        </div>
        <span className="text-slate-400">{data.date}</span>
      </div>

      {/* Two Column Layout */}
      <div className="flex min-h-[400px]">
        {/* Left - Diagnosis & Advice */}
        <div className="w-[200px] border-r border-slate-100 p-6 bg-slate-50/50 space-y-6">
          {data.diagnosis && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">CC / Diagnosis</p>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">{data.diagnosis}</p>
            </div>
          )}
          
          {data.advice && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Advice</p>
              <p className="text-xs text-slate-700 leading-relaxed">{data.advice}</p>
            </div>
          )}
          
          {data.followUpDate && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Follow-up</p>
              <p className="text-xs font-bold text-slate-800">{data.followUpDate}</p>
            </div>
          )}

          {data.hospitalName && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clinic</p>
              <p className="text-xs font-bold text-slate-700">{data.hospitalName}</p>
              {data.hospitalAddress && <p className="text-[10px] text-slate-500 mt-1">{data.hospitalAddress}</p>}
            </div>
          )}
        </div>

        {/* Right - Medicines */}
        <div className="flex-1 p-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Medications</p>
          
          <div className="space-y-0">
            {data.medicines.map((med, i) => (
              <div key={i} className={`flex items-start gap-3 py-3 ${i !== data.medicines.length - 1 ? 'border-b border-dashed border-slate-100' : ''}`}>
                <span className="text-[10px] font-black text-slate-300 mt-0.5 w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-black text-slate-900">{med.name}</p>
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{med.dosage}</span>
                    <span className="text-[10px] font-bold text-slate-500">× {med.duration}</span>
                  </div>
                  {med.instructions && (
                    <p className="text-[10px] text-slate-400 mt-1.5 italic">{med.instructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-16 border-t border-slate-200 flex items-center justify-between px-8">
        <p className="text-[10px] text-slate-300">Generated by DocOclock · {new Date().getFullYear()}</p>
        <div className="text-center">
          <div className="w-40 border-t border-slate-300 pt-1">
            <p className="text-[10px] text-slate-400 font-bold">Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalPrescription;
