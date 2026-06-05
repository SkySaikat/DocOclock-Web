import React, { useState } from 'react';
import { Check, X, User, Image, ExternalLink } from 'lucide-react';
import { useToast } from '../ToastProvider';

interface ApprovalQueueProps {
  pendingDoctors: any[];
  onApprove: (id: string) => Promise<{ success: boolean }>;
  onReject: (id: string) => Promise<{ success: boolean }>;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ pendingDoctors, onApprove, onReject }) => {
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <div className="divide-y divide-slate-50">
          {pendingDoctors.map(doctor => (
            <div key={doctor.id} className="p-5">
              <div className="flex items-start gap-4">
                {/* Profile + ID photos */}
                <div className="flex gap-3 shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                    {doctor.image_url ? (
                      <img src={doctor.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={24} /></div>
                    )}
                  </div>
                  {doctor.id_photo_url && (
                    <a href={doctor.id_photo_url} target="_blank" rel="noreferrer" title="View ID photo" className="w-14 h-14 rounded-xl bg-blue-50 overflow-hidden border border-blue-200 relative group">
                      <img src={doctor.id_photo_url} alt="ID" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink size={14} className="text-white" />
                      </div>
                    </a>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900 text-base">{doctor.full_name}</p>
                      <p className="text-xs font-bold text-blue-600">{doctor.specialty || 'General'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReject(doctor.id)}
                        className="p-2 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() => handleApprove(doctor.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Check size={16} /> Approve
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">BMDC: {doctor.bmdc_number}</span>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{doctor.degrees || 'MBBS'}</span>
                    {doctor.email && <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{doctor.email}</span>}
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{new Date(doctor.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* ID photo expanded view */}
                  {doctor.id_photo_url && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedId(expandedId === doctor.id ? null : doctor.id)}
                        className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Image size={12} /> {expandedId === doctor.id ? 'Hide ID Photo' : 'View Full ID Photo'}
                      </button>
                      {expandedId === doctor.id && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-blue-100 max-w-sm">
                          <img src={doctor.id_photo_url} alt="Doctor ID" className="w-full object-contain max-h-48" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
