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

export const ClassicPrescription: React.FC<{ data: PrescriptionData }> = ({ data }) => {
  return (
    <div className="bg-white w-full max-w-[800px] mx-auto shadow-2xl" style={{ fontFamily: "'Times New Roman', serif" }}>
      {/* Header */}
      <div className="border-b-4 border-double border-slate-800 p-8 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{data.doctorName}</h1>
            <p className="text-sm text-slate-600 mt-1">{data.doctorDegrees}</p>
            <p className="text-sm text-slate-600">{data.doctorSpecialty}</p>
            <p className="text-xs text-slate-500 mt-2">BMDC Reg: {data.doctorBmdc}</p>
          </div>
          <div className="text-right">
            {data.hospitalName && (
              <p className="text-sm font-bold text-slate-800">{data.hospitalName}</p>
            )}
            {data.hospitalAddress && (
              <p className="text-xs text-slate-500 max-w-[200px]">{data.hospitalAddress}</p>
            )}
            {data.doctorPhone && (
              <p className="text-xs text-slate-500 mt-2">📞 {data.doctorPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-6 text-sm">
        <div><span className="text-slate-500">Patient:</span> <strong className="text-slate-800">{data.patientName}</strong></div>
        <div><span className="text-slate-500">Age:</span> <strong>{data.patientAge}</strong></div>
        <div><span className="text-slate-500">Gender:</span> <strong>{data.patientGender}</strong></div>
        <div className="ml-auto"><span className="text-slate-500">Date:</span> <strong>{data.date}</strong></div>
      </div>

      {/* Rx Symbol + Medicines */}
      <div className="p-8 min-h-[400px]">
        <div className="flex gap-8">
          {/* Rx Symbol */}
          <div className="shrink-0">
            <span className="text-6xl font-bold text-slate-300 italic" style={{ fontFamily: 'serif' }}>℞</span>
          </div>

          {/* Medicines List */}
          <div className="flex-1 space-y-4">
            {data.diagnosis && (
              <div className="mb-6 pb-4 border-b border-dashed border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnosis:</span>
                <p className="text-sm text-slate-800 font-medium mt-1">{data.diagnosis}</p>
              </div>
            )}

            {data.medicines.map((med, i) => (
              <div key={i} className="flex items-start gap-4 py-2">
                <span className="text-xs font-bold text-slate-400 mt-1">{i + 1}.</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{med.name}</p>
                  <div className="flex gap-8 mt-1 text-xs text-slate-600">
                    <span>Dosage: <strong>{med.dosage}</strong></span>
                    <span>Duration: <strong>{med.duration}</strong></span>
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-slate-500 mt-1 italic">{med.instructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t-2 border-slate-800 flex justify-between items-end">
        <div>
          {data.advice && (
            <div className="mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Advice:</span>
              <p className="text-sm text-slate-700 mt-1">{data.advice}</p>
            </div>
          )}
          {data.followUpDate && (
            <p className="text-xs text-slate-500">Follow-up: <strong className="text-slate-700">{data.followUpDate}</strong></p>
          )}
        </div>
        <div className="text-center">
          <div className="w-48 border-t border-slate-400 pt-2">
            <p className="text-xs text-slate-500">Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassicPrescription;
