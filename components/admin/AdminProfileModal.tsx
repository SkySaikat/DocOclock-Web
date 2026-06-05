import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, UserX, UserCheck, ShieldCheck, Phone, Calendar } from 'lucide-react';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';

interface AdminProfileModalProps {
  user: any;
  onClose: () => void;
  onRefresh: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ user, onClose, onRefresh }) => {
  const { updateUserStatus, resetUserPassword } = useSuperAdminData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleStatusToggle = async () => {
    setIsProcessing(true);
    setStatusMsg('');
    const newStatus = user.registration_status === 'approved' ? 'rejected' : 'approved';
    const res = await updateUserStatus(user.id, newStatus);
    
    if (res.success) {
      user.registration_status = newStatus; // Optimistic local update
      setStatusMsg(`Account successfully ${newStatus === 'rejected' ? 'Suspended' : 'Reactivated'}.`);
      setTimeout(() => onRefresh(), 1500); 
    } else {
      setStatusMsg(`Error: ${res.error}`);
    }
    setIsProcessing(false);
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      setStatusMsg('Error: Password must be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    setStatusMsg('');
    const res = await resetUserPassword(user.id, newPassword);
    
    if (res.success) {
      setNewPassword('');
      setStatusMsg('Password override successful.');
    } else {
      setStatusMsg(`Error: ${res.error}`);
    }
    setIsProcessing(false);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Body */}
      <div className="relative bg-white w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        
        <button 
           onClick={onClose} 
           className="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors"
        >
           <X size={20} />
        </button>

        {/* Left Pane - Profile Visuals & Data */}
        <div className="w-full md:w-5/12 bg-slate-50 p-8 border-r border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
           {user.image_url ? (
             <div className="w-32 h-32 rounded-[24px] overflow-hidden border-4 border-white shadow-xl rotate-3 transition-transform hover:rotate-0 duration-500 z-10 relative bg-slate-200">
                <img src={user.image_url} alt="Profile" className="w-full h-full object-cover" />
             </div>
           ) : (
             <div className="w-32 h-32 rounded-[24px] bg-indigo-100 text-indigo-500 font-black text-4xl flex items-center justify-center border-4 border-white shadow-xl rotate-3 relative z-10">
                {user.full_name.charAt(0)}
             </div>
           )}

           <div className="mt-8 text-center z-10 relative w-full">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight px-4">{user.full_name}</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-6">System Role: {user.role}</p>

              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 text-left">
                  <div className="flex items-center gap-3">
                     <Phone size={16} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">{user.phone || user.contact_number || 'No Phone/Email'}</span>
                  </div>
                  {user.bmdc_number && (
                    <div className="flex items-center gap-3">
                       <ShieldCheck size={16} className="text-slate-400" />
                       <span className="text-sm font-bold text-slate-700">BMDC: {user.bmdc_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                     <Calendar size={16} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
              </div>

              {user.registration_status && (
                <div className={`mt-6 inline-flex px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                  user.registration_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.registration_status === 'approved' ? 'Active / Approved' : 'Suspended / Rejected'}
                </div>
              )}
           </div>

           {/* Decorator */}
           <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl mix-blend-multiply" />
        </div>

        {/* Right Pane - Security Controls */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
            
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                 <ShieldAlert className="text-rose-500" /> Security Controls
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-2">These actions have immediate effect. Suspension forcefully drops logic permissions and prevents subsequent logins.</p>
            </div>

            {statusMsg && (
              <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${
                 statusMsg.startsWith('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {statusMsg}
              </div>
            )}

            <div className="space-y-6">
               {/* Deactivate Module */}
               <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50/50">
                  <div className="flex gap-4 items-start">
                     <div className={`p-3 rounded-2xl ${user.registration_status === 'approved' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {user.registration_status === 'approved' ? <UserX size={24} /> : <UserCheck size={24} />}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-black text-slate-900">
                          {user.registration_status === 'approved' ? 'Suspend Account' : 'Reactivate Account'}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 mt-1 mb-4 leading-relaxed">
                          {user.registration_status === 'approved' 
                            ? 'Instantly blocks user from accessing patient data, schedules, and login sessions.' 
                            : 'Restores all system access and reinstates their public profile visibility.'}
                        </p>
                        <button 
                           onClick={handleStatusToggle}
                           disabled={isProcessing}
                           className={`h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                             user.registration_status === 'approved'
                             ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                             : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                           } disabled:opacity-50`}
                        >
                           {isProcessing ? 'Processing...' : user.registration_status === 'approved' ? 'Confirm Suspension' : 'Confirm Reactivation'}
                        </button>
                     </div>
                  </div>
               </div>

               {/* Password Override Module */}
               <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50/50">
                  <div className="flex gap-4 items-start">
                     <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                        <KeyRound size={24} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-black text-slate-900">Force Password Reset</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1 mb-4 leading-relaxed">
                          By-pass the security protocol to generate a new hashed key for this user. Will forcefully sever any outdated client reliance upon next authentication attempt.
                        </p>
                        
                        <div className="flex gap-3">
                           <input 
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New Password (min 6)"
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                           />
                           <button 
                              onClick={handlePasswordReset}
                              disabled={isProcessing || newPassword.length < 6}
                              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all"
                           >
                             Reset
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

        </div>

      </div>
    </div>
  );
};
