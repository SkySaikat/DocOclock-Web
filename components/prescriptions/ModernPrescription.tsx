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

export const ModernPrescription: React.FC<{ data: PrescriptionData }> = ({ data }) => {
  return (
    <div className="bg-white w-full max-w-[800px] mx-auto shadow-2xl rounded-3xl overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header - Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-black">D</div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{data.doctorName}</h1>
                <p className="text-blue-200 text-sm font-medium">{data.doctorDegrees}</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-blue-200">
              <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">{data.doctorSpecialty}</span>
              <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">BMDC: {data.doctorBmdc}</span>
            </div>
          </div>
          <div className="text-right text-sm">
            {data.hospitalName && <p className="font-bold text-white/90">{data.hospitalName}</p>}
            {data.hospitalAddress && <p className="text-blue-200 text-xs max-w-[200px]">{data.hospitalAddress}</p>}
            {data.doctorPhone && <p className="text-blue-200 text-xs mt-2">{data.doctorPhone}</p>}
          </div>
        </div>
      </div>

      {/* Patient Info Cards */}
      <div className="px-8 py-5 bg-slate-50 border-b border-slate-100">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient</p>
            <p className="text-sm font-black text-slate-900">{data.patientName}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age</p>
            <p className="text-sm font-black text-slate-900">{data.patientAge}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gender</p>
            <p className="text-sm font-black text-slate-900">{data.patientGender}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
            <p className="text-sm font-black text-slate-900">{data.date}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 min-h-[400px]">
        {data.diagnosis && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Diagnosis</p>
            <p className="text-sm font-bold text-amber-900">{data.diagnosis}</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="text-2xl text-blue-600">℞</span> Prescribed Medications
          </p>
          
          {data.medicines.map((med, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors group">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-blue-100 transition-colors">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900">{med.name}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{med.dosage}</span>
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{med.duration}</span>
                </div>
                {med.instructions && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium">📝 {med.instructions}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-end">
        <div className="space-y-3">
          {data.advice && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl max-w-[400px]">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Advice</p>
              <p className="text-xs text-emerald-800 font-medium">{data.advice}</p>
            </div>
          )}
          {data.followUpDate && (
            <p className="text-xs text-slate-500">Next Visit: <strong className="text-blue-600">{data.followUpDate}</strong></p>
          )}
        </div>
        <div className="text-center">
          <div className="w-48 border-t-2 border-blue-600 pt-3">
            <p className="text-xs font-bold text-slate-500">Doctor's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPrescription;
