import React, { useState } from 'react';
import { Building2, Plus, Search, MapPin, Phone, Users, GitBranch, ChevronDown, ChevronUp, Mail, Lock, Check, X, Clock, AlertCircle, Stethoscope } from 'lucide-react';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';

export const HospitalManager: React.FC = () => {
  const {
    allHospitals,
    customChamberRequests,
    createHospital,
    assignHospitalAdmin,
    createBranch,
    approveCustomChamber,
    rejectCustomChamber,
    refreshHospitals,
  } = useSuperAdminData();

  const [activeSubTab, setActiveSubTab] = useState<'hospitals' | 'requests'>('hospitals');
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);
  const [showCreateHospital, setShowCreateHospital] = useState(false);
  const [showAssignAdmin, setShowAssignAdmin] = useState<string | null>(null);
  const [showAddBranch, setShowAddBranch] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [hospForm, setHospForm] = useState({ name: '', address: '', contact_info: '' });
  const [adminForm, setAdminForm] = useState({ email: '', full_name: '', password: '' });
  const [branchForm, setBranchForm] = useState({ name: '', address: '', contact_info: '' });

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createHospital(hospForm.name, hospForm.address, hospForm.contact_info);
    setSaving(false);
    if (result.success) {
      setHospForm({ name: '', address: '', contact_info: '' });
      setShowCreateHospital(false);
    } else {
      alert('Failed: ' + result.error);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignAdmin) return;
    setSaving(true);
    const result = await assignHospitalAdmin(showAssignAdmin, adminForm.email, adminForm.full_name, adminForm.password);
    setSaving(false);
    if (result.success) {
      setAdminForm({ email: '', full_name: '', password: '' });
      setShowAssignAdmin(null);
    } else {
      alert('Failed: ' + result.error);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddBranch) return;
    setSaving(true);
    const result = await createBranch(showAddBranch, branchForm.name, branchForm.address, branchForm.contact_info);
    setSaving(false);
    if (result.success) {
      setBranchForm({ name: '', address: '', contact_info: '' });
      setShowAddBranch(null);
    } else {
      alert('Failed: ' + result.error);
    }
  };

  const handleApproveRequest = async (id: string) => {
    setSaving(true);
    await approveCustomChamber(id);
    setSaving(false);
  };

  const handleRejectRequest = async (id: string) => {
    if (!rejectNote.trim()) { alert('Please provide a rejection reason.'); return; }
    setSaving(true);
    await rejectCustomChamber(id, rejectNote);
    setSaving(false);
    setRejectingId(null);
    setRejectNote('');
  };

  const inputCls = "w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm";
  const labelCls = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('hospitals')}
          className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${activeSubTab === 'hospitals' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Hospitals ({allHospitals.length})
        </button>
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-5 py-2 rounded-xl text-sm font-black transition-all relative ${activeSubTab === 'requests' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Chamber Requests
          {customChamberRequests.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
              {customChamberRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── HOSPITALS TAB ─── */}
      {activeSubTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Registered Hospitals</h3>
            <button
              onClick={() => setShowCreateHospital(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition-all"
            >
              <Plus size={16} /> New Hospital
            </button>
          </div>

          {/* Create Hospital Form */}
          {showCreateHospital && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <h4 className="font-black text-slate-800">Create New Hospital</h4>
              <form onSubmit={handleCreateHospital} className="space-y-4">
                <div>
                  <label className={labelCls}>Hospital Name</label>
                  <input required className={inputCls} placeholder="e.g., Dhaka Medical College Hospital" value={hospForm.name} onChange={e => setHospForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input required className={inputCls} placeholder="Full address" value={hospForm.address} onChange={e => setHospForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Contact Info</label>
                  <input className={inputCls} placeholder="Phone / email" value={hospForm.contact_info} onChange={e => setHospForm(p => ({ ...p, contact_info: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm font-black rounded-xl disabled:opacity-50">{saving ? 'Creating...' : 'Create Hospital'}</button>
                  <button type="button" onClick={() => setShowCreateHospital(false)} className="px-5 py-2 bg-slate-200 text-slate-700 text-sm font-black rounded-xl">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Hospital List */}
          {allHospitals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No hospitals yet. Create your first hospital above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allHospitals.map(h => (
                <div key={h.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedHospital(expandedHospital === h.id ? null : h.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Building2 size={22} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{h.name}</p>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {h.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex gap-4 text-center">
                        <div>
                          <p className="text-lg font-black text-blue-600">{h.branch_count}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Branches</p>
                        </div>
                        <div>
                          <p className="text-lg font-black text-teal-600">{h.doctor_count}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Doctors</p>
                        </div>
                      </div>
                      {expandedHospital === h.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </button>

                  {expandedHospital === h.id && (
                    <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/50">
                      {/* Admin info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Hospital Admin</p>
                          {h.owner ? (
                            <p className="font-bold text-slate-800">{h.owner.full_name} <span className="text-slate-400 font-medium">— {h.owner.email}</span></p>
                          ) : (
                            <p className="text-sm text-orange-500 font-bold">No admin assigned</p>
                          )}
                        </div>
                        <button
                          onClick={() => { setShowAssignAdmin(h.id); setAdminForm({ email: '', full_name: '', password: '' }); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-black rounded-xl"
                        >
                          <Mail size={12} /> {h.owner ? 'Reassign Admin' : 'Assign Admin'}
                        </button>
                      </div>

                      {/* Assign Admin Form */}
                      {showAssignAdmin === h.id && (
                        <form onSubmit={handleAssignAdmin} className="bg-white rounded-xl p-4 border border-blue-100 space-y-3">
                          <p className="text-xs font-black text-blue-700 uppercase tracking-widest">Assign Hospital Admin</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Full Name</label>
                              <input required className={inputCls} placeholder="Admin name" value={adminForm.full_name} onChange={e => setAdminForm(p => ({ ...p, full_name: e.target.value }))} />
                            </div>
                            <div>
                              <label className={labelCls}>Email</label>
                              <input required type="email" className={inputCls} placeholder="admin@hospital.com" value={adminForm.email} onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div>
                              <label className={labelCls}>Password</label>
                              <input required type="password" className={inputCls} placeholder="Min 8 chars" value={adminForm.password} onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl disabled:opacity-50">{saving ? 'Saving...' : 'Assign'}</button>
                            <button type="button" onClick={() => setShowAssignAdmin(null)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-black rounded-xl">Cancel</button>
                          </div>
                        </form>
                      )}

                      {/* Branch actions */}
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Branches</p>
                        <button
                          onClick={() => { setShowAddBranch(h.id); setBranchForm({ name: '', address: '', contact_info: '' }); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-black rounded-xl"
                        >
                          <GitBranch size={12} /> Add Branch
                        </button>
                      </div>

                      {showAddBranch === h.id && (
                        <form onSubmit={handleAddBranch} className="bg-white rounded-xl p-4 border border-teal-100 space-y-3">
                          <p className="text-xs font-black text-teal-700 uppercase tracking-widest">Add New Branch</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Branch Name</label>
                              <input required className={inputCls} placeholder="e.g., North Branch" value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                              <label className={labelCls}>Address</label>
                              <input required className={inputCls} placeholder="Branch address" value={branchForm.address} onChange={e => setBranchForm(p => ({ ...p, address: e.target.value }))} />
                            </div>
                            <div>
                              <label className={labelCls}>Contact Info</label>
                              <input className={inputCls} placeholder="Phone / email" value={branchForm.contact_info} onChange={e => setBranchForm(p => ({ ...p, contact_info: e.target.value }))} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white text-xs font-black rounded-xl disabled:opacity-50">{saving ? 'Adding...' : 'Add Branch'}</button>
                            <button type="button" onClick={() => setShowAddBranch(null)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-black rounded-xl">Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── CHAMBER REQUESTS TAB ─── */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800">Doctor Chamber Requests</h3>
          <p className="text-sm text-slate-500">Doctors requesting to join a registered hospital. Approve to create their chamber automatically.</p>

          {customChamberRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Clock size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No pending chamber requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customChamberRequests.map(req => (
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
                          <p className="text-xs text-slate-600 font-bold flex items-center gap-1.5"><Building2 size={12} /> {req.hospital?.name}</p>
                          {req.branch && <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><GitBranch size={12} /> {req.branch?.name}</p>}
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><MapPin size={12} /> {req.hospital?.address}</p>
                          <p className="text-xs font-bold text-teal-600">Proposed Fee: ৳{req.proposed_fee}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black rounded-xl transition-all disabled:opacity-50"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-xl border border-red-100 transition-all"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>

                  {rejectingId === req.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <label className={labelCls}>Rejection Reason</label>
                      <input className={inputCls} placeholder="Provide reason for rejection" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectRequest(req.id)} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl disabled:opacity-50">{saving ? 'Rejecting...' : 'Confirm Reject'}</button>
                        <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-black rounded-xl">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
