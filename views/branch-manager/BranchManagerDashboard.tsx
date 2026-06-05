import React, { useState } from 'react';
import { GitBranch, LogOut, Users, Clock, Activity, Check, X, Plus, Stethoscope, Tag } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useBranchManagerData } from '../../hooks/useBranchManagerData';

export const BranchManagerDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const { loading, branch, hospital, roster, sectors, doctorRequests, stats, approveRequest, rejectRequest, createSector } = useBranchManagerData();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REQUESTS' | 'ROSTER' | 'SECTORS'>('OVERVIEW');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [newSector, setNewSector] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); onNavigate('/'); };

  const handleApprove = async (id: string) => {
    setSaving(true);
    await approveRequest(id);
    setSaving(false);
  };

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) { alert('Please provide a reason.'); return; }
    setSaving(true);
    await rejectRequest(id, rejectNote);
    setSaving(false);
    setRejectingId(null);
    setRejectNote('');
  };

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSector.trim()) return;
    setSaving(true);
    await createSector(newSector.trim());
    setSaving(false);
    setNewSector('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-500 animate-pulse">Loading Branch Data...</p>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <GitBranch size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Branch Assigned</h2>
        <p className="text-slate-500 font-bold max-w-md">Your account is not linked to any branch. Contact your Hospital Admin.</p>
        <button onClick={handleLogout} className="mt-8 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl">Sign Out</button>
      </div>
    );
  }

  const tabs = [
    { id: 'OVERVIEW' as const,  label: 'Overview',        icon: Activity },
    { id: 'REQUESTS' as const,  label: 'Doctor Requests', icon: Clock,   badge: doctorRequests.length },
    { id: 'ROSTER' as const,    label: 'Roster',          icon: Users },
    { id: 'SECTORS' as const,   label: 'Sectors',         icon: Tag },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden mb-8 border border-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center">
              <GitBranch size={32} className="text-teal-400" />
            </div>
            <div>
              <p className="text-teal-400 text-xs font-black uppercase tracking-widest mb-1">Branch Management</p>
              <h1 className="text-3xl font-black tracking-tight">{branch.name}</h1>
              <p className="text-sm font-bold text-slate-400 mt-1">{hospital?.name} — {branch.address}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all text-sm group">
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col gap-2 sticky top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between p-4 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className="flex items-center gap-3"><tab.icon size={18} />{tab.label}</span>
                {tab.badge ? <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-600 rounded-lg font-black">{tab.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Doctors', value: stats.totalDoctors, color: 'teal' },
                  { label: 'Pending Requests', value: stats.pendingRequests, color: 'orange' },
                  { label: 'Total Visits', value: stats.totalVisits, color: 'blue' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-5 text-center`}>
                    <p className={`text-3xl font-black text-${s.color}-600`}>{s.value}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 mb-4">Branch Info</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><span className="font-bold text-slate-400">Hospital:</span> {hospital?.name}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-400">Branch:</span> {branch.name}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-400">Address:</span> {branch.address}</p>
                  {branch.contact_info && <p className="text-slate-600"><span className="font-bold text-slate-400">Contact:</span> {branch.contact_info}</p>}
                  <p className="text-slate-600"><span className="font-bold text-slate-400">Sectors:</span> {sectors.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCTOR REQUESTS */}
          {activeTab === 'REQUESTS' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">Pending Doctor Requests</h3>
              {doctorRequests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Clock size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-slate-400">No pending requests for this branch.</p>
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
                            {req.sector && <p className="text-xs text-slate-500 font-medium">Sector: {req.sector.name}</p>}
                            <p className="text-xs font-bold text-teal-600">Proposed Fee: ৳{req.proposed_fee}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => handleApprove(req.id)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-xl disabled:opacity-50">
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
                          <button onClick={() => handleReject(req.id)} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl">{saving ? '...' : 'Confirm Reject'}</button>
                          <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-black rounded-xl">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ROSTER */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">Branch Roster ({roster.length})</h3>
              {roster.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Users size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-slate-400">No doctors in this branch yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roster.map((doc: any) => (
                    <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <img src={doc.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name)}&background=0d9488&color=fff`} alt={doc.full_name} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 truncate">{doc.full_name}</p>
                        <p className="text-xs text-slate-500 font-medium">{doc.specialty}</p>
                        {doc.sector_id && <p className="text-xs text-teal-600 font-bold mt-1">{sectors.find(s => s.id === doc.sector_id)?.name || 'Sector assigned'}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-yellow-500">★ {doc.rating?.toFixed(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTORS */}
          {activeTab === 'SECTORS' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800">Sectors / Departments</h3>
              <form onSubmit={handleCreateSector} className="flex gap-3">
                <input
                  value={newSector}
                  onChange={e => setNewSector(e.target.value)}
                  placeholder="e.g., Cardiology, Neurology..."
                  className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                />
                <button type="submit" disabled={saving || !newSector.trim()} className="px-5 py-3 bg-teal-600 text-white text-sm font-black rounded-xl disabled:opacity-50 flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </form>
              {sectors.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Tag size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="font-bold text-slate-400">No sectors created yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sectors.map(sector => (
                    <div key={sector.id} className="bg-white border border-teal-100 rounded-xl p-4 text-center">
                      <p className="font-black text-slate-800">{sector.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
