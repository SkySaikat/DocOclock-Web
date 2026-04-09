import React from 'react';
import { Check, X, FileText, User } from 'lucide-react';
import { useToast } from '../ToastProvider';

interface ApprovalQueueProps {
  pendingDoctors: any[];
  onApprove: (id: string) => Promise<{ success: boolean }>;
  onReject: (id: string) => Promise<{ success: boolean }>;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ pendingDoctors, onApprove, onReject }) => {
  const { showToast } = useToast();

  const handleApprove = async (id: string) => {
    const result = await onApprove(id);
    if (result.success) {
      showToast('Doctor approved successfully', 'success');
    } else {
      showToast('Failed to approve doctor', 'error');
    }
  };

  const handleReject = async (id: string) => {
    const result = await onReject(id);
    if (result.success) {
      showToast('Doctor application rejected', 'warning');
    } else {
      showToast('Failed to reject doctor', 'error');
    }
  };
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Pending Doctor Approvals</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">Review new registrations before they go live on the platform.</p>
        </div>
        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black">
          {pendingDoctors.length} Pending
        </div>
      </div>

      {pendingDoctors.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-500">You're all caught up!</p>
          <p className="text-sm">There are no pending doctor applications.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6 font-bold">Doctor Profile</th>
                <th className="p-4 font-bold">BMDC / Contact</th>
                <th className="p-4 font-bold">Degrees & Experience</th>
                <th className="p-4 pr-6 text-right font-bold w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDoctors.map(doctor => (
                <tr key={doctor.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                        {doctor.image_url ? (
                          <img src={doctor.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{doctor.full_name}</p>
                        <p className="text-xs font-bold text-blue-600">{doctor.specialty || 'General'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700 tabular-nums">{doctor.bmdc_number}</p>
                    <p className="text-xs text-slate-500">{new Date(doctor.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{doctor.degrees || 'MBBS'}</p>
                    <p className="text-xs text-slate-500">{doctor.experience_years ? `${doctor.experience_years} years` : 'N/A'}</p>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleReject(doctor.id)}
                        className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all group"
                        title="Reject Application"
                      >
                         <X size={18} className="group-active:scale-90 transition-transform" />
                      </button>
                      <button 
                         onClick={() => handleApprove(doctor.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                         <Check size={16} /> Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
