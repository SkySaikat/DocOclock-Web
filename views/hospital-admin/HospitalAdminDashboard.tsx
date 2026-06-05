import React, { useState } from 'react';
import { Building2, LogOut, ActivitySquare, Users, Star, FileText, GitBranch, Tag, Clock, Check, X, Plus, Stethoscope, MapPin, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useHospitalAdminData } from '../../hooks/useHospitalAdminData';

import { HospitalAnalytics } from '../../components/hospital-admin/HospitalAnalytics';
import { RosterManager } from '../../components/hospital-admin/RosterManager';
import { ReviewMonitor } from '../../components/hospital-admin/ReviewMonitor';
import { AdminPrescriptionViewer } from '../../components/admin/AdminPrescriptionViewer';

type TabType = 'ANALYTICS' | 'ROSTER' | 'BRANCHES' | 'SECTORS' | 'REQUESTS' | 'REVIEWS' | 'PRESCRIPTIONS';

export const HospitalAdminDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const {
    loading, hospital, roster, branches, sectors, doctorRequests, stats, reviews,
    searchResults, searchDoctors, addDoctorToRoster,
    createBranch, assignBranchManager, createSector,
    approveRequest, rejectRequest,
  } = useHospitalAdminData();

  const [activeTab, setActiveTab] = useState<TabType>('ANALYTICS');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Branch form
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', contact_info: '' });

  // Branch manager assignment
  const [assigningBranch, setAssigningBranch] = useState<string | null>(null);
  const [managerForm, setManagerForm] = useState({ email: '', full_name: '', password: '' });

  // Sector form
  const [sectorName, setSectorName] = useState('');
  const [sectorBranchId, setSectorBranchId] = useState('');

  const handleLogout = () => { logout(); onNavigate('/'); };

  const handleApproveRequest = async (id: string) => {
    setSaving(true);
    await approveRequest(id);
    setSaving(false);
  };

  const handleRejectRequest = async (id: string) => {
    if (!rejectNote.trim()) { alert('Please provide a reason.'); return; }
    setSaving(true);
    await rejectRequest(id, rejectNote);
    setSaving(false);
    setRejectingId(null);
    setRejectNote('');
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createBranch(branchForm.name, branchForm.address, branchForm.contact_info);
    setSaving(false);
    if (result.success) { setBranchForm({ name: '', address: '', contact_info: '' }); setShowBranchForm(false); }
    else alert('Failed: ' + result.error);
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBranch) return;
    setSaving(true);
    const result = await assignBranchManager(assigningBranch, managerForm.email, managerForm.full_name, managerForm.password);
    setSaving(false);
    if (result.success) { setManagerForm({ email: '', full_name: '', password: '' }); setAssigningBranch(null); }
    else alert('Failed: ' + result.error);
  };

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName.trim()) return;
    setSaving(true);
    await createSector(sectorName.trim(), sectorBranchId || undefined);
    setSaving(false);
    setSectorName('');
    setSectorBranchId('');
  };

  const inputCls = "w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-sm";
  const labelCls = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-500 animate-pulse">Loading Facility Data...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Building2 size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Hospital Facility Found</h2>
        <p className="text-slate-500 font-bold max-w-md">Your account is not linked to any hospital. Please contact Super Admin to configure your facility.</p>
        <button onClick={handleLogout} className="mt-8 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl active:scale-95 transition-all">Select Different Account</button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'ANALYTICS',    label: 'Analytics',         icon: ActivitySquare },
    { id: 'ROSTER',       label: 'Roster',             icon: Users,        badge: roster.length },
    { id: 'BRANCHES',     label: 'Branches',           icon: GitBranch,    badge: branches.length },
    { id: 'SECTORS',      label: 'Sectors',            icon: Tag,          badge: sectors.length },
    { id: 'REQUESTS',     label: 'Doctor Requests',    icon: Clock,        badge: doctorRequests.length },
    { id: 'REVIEWS',      label: 'Reviews',            icon: Star },
    { id: 'PRESCRIPTIONS',label: 'Prescriptions',      icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-500 border border-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center">
              <Building2 size={32} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">Facility Management</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{hospital.name}</h1>
              <p className="text-sm font-bold text-slate-400 mt-1">{hospital.address}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all text-sm group">
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col gap-2 sticky top-24">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className="flex items-center gap-3"><tab.icon size={20} />{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${tab.id === 'REQUESTS' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-8">
          {activeTab === 'ANALYTICS' && <HospitalAnalytics stats={stats} />}

          {activeTab === 'ROSTER' && (
            <RosterManager roster={roster} searchResults={searchResults} onSearch={searchDoctors} onAddDoctor={addDoctorToRoster} />
          )}

          {/* BRANCHES */}
          {activeTab === 'BRANCHES' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800">Hospital Branches ({branches.length})</h3>
                <button onClick={() => setShowBranchForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl">
                  <Plus size={16} /> Add Branch
                </button>
              </div>
              {showBranchForm && (
                <form onSubmit={handleCreateBranch} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">New Branch</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Branch Name</label><input required className={inputCls} placeholder="e.g., North Wing" value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><label className={labelCls}>Address</label><input required className={inputCls} placeholder="Full address" value={branchForm.address} onChange={e => setBranchForm(p => ({ ...p, address: e.target.value }))} /></div>
                    <div><label className={labelCls}>Contact Info</label><input className={inputCls} placeholder="Phone / email" value={branchForm.contact_info} onChange={e => setBranchForm(p => ({ ...p, contact_info: e.target.value }))} /></div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl disabled:opacity-50">{saving ? 'Creating...' : 'Create Branch'}</button>
                    <button type="button" onClick={() => setShowBranchForm(false)} className="px-5 py-2 bg-slate-200 text-slate-700 text-sm font-black rounded-xl">Cancel</button>
                  </div>
                </form>
              )}
              {branches.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <GitBranch size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-slate-400">No branches yet. Add your first branch above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map(br => (
                    <div key={br.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <GitBranch size={18} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{br.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {br.address}</p>
                            {br.manager ? (
                              <p className="text-xs text-indigo-600 font-bold mt-1">Manager: {br.manager.full_name}</p>
                            ) : (
                              <p className="text-xs text-orange-500 font-bold mt-1">No manager assigned</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => { setAssigningBranch(br.id); setManagerForm({ email: '', full_name: '', password: '' }); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-xl"
                        >
                          <Mail size={12} /> {br.manager ? 'Reassign Manager' : 'Assign Manager'}
                        </button>
                      </div>
                      {assigningBranch === br.id && (
                        <form onSubmit={handleAssignManager} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">Assign Branch Manager</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelCls}>Full Name</label><input required className={inputCls} placeholder="Manager name" value={managerForm.full_name} onChange={e => setManagerForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                            <div><label className={labelCls}>Email</label><input required type="email" className={inputCls} placeholder="manager@hospital.com" value={managerForm.email} onChange={e => setManagerForm(p => ({ ...p, email: e.target.value }))} /></div>
                            <div><label className={labelCls}>Password</label><input required type="password" className={inputCls} placeholder="Min 8 chars" value={managerForm.password} onChange={e => setManagerForm(p => ({ ...p, password: e.target.value }))} /></div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl disabled:opacity-50">{saving ? 'Saving...' : 'Assign'}</button>
                            <button type="button" onClick={() => setAssigningBranch(null)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-black rounded-xl">Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTORS */}
          {activeTab === 'SECTORS' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">Sectors / Departments ({sectors.length})</h3>
              <form onSubmit={handleCreateSector} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Create Sector</p>
                <div className="flex gap-3">
                  <input value={sectorName} onChange={e => setSectorName(e.target.value)} placeholder="e.g., Cardiology, Neurology..." className={inputCls + ' flex-1'} />
                  <select value={sectorBranchId} onChange={e => setSectorBranchId(e.target.value)} className={inputCls + ' flex-1'}>
                    <option value="">Hospital-wide</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button type="submit" disabled={saving || !sectorName.trim()} className="px-5 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
                    <Plus size={16} /> Add
                  </button>
                </div>
              </form>
              {sectors.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Tag size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-slate-400">No sectors yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sectors.map(sector => (
                    <div key={sector.id} className="bg-white border border-indigo-100 rounded-xl p-4">
                      <p className="font-black text-slate-800">{sector.name}</p>
                      {sector.branch_id && <p className="text-xs text-indigo-500 font-medium mt-0.5">{branches.find(b => b.id === sector.branch_id)?.name || 'Branch sector'}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOCTOR REQUESTS */}
          {activeTab === 'REQUESTS' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">Doctor Chamber Requests</h3>
              {doctorRequests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Clock size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-slate-400">No pending requests.</p>
                </div>
              ) : (
                doctorRequests.map(req => (
                  <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                          <Stethoscope size={18} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{req.doctor?.full_name}</p>
                          <p className="text-xs text-slate-500 font-medium">{req.doctor?.specialty} — {req.doctor?.bmdc_number}</p>
                          <div className="mt-2 space-y-1">
                            {req.branch && <p className="text-xs text-slate-500 font-medium">Branch: {req.branch.name}</p>}
                            {req.sector && <p className="text-xs text-slate-500 font-medium">Sector: {req.sector.name}</p>}
                            <p className="text-xs font-bold text-teal-600">Proposed Fee: ৳{req.proposed_fee}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => handleApproveRequest(req.id)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl disabled:opacity-50">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => setRejectingId(req.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-100">
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                    {rejectingId === req.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        <input className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:border-red-400" placeholder="Rejection reason" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => handleRejectRequest(req.id)} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl">{saving ? '...' : 'Confirm Reject'}</button>
                          <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-black rounded-xl">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'REVIEWS' && <ReviewMonitor reviews={reviews} />}
          {activeTab === 'PRESCRIPTIONS' && <AdminPrescriptionViewer hospitalId={hospital?.id} />}
        </div>
      </div>
    </div>
  );
};
