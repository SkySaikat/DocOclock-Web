import React, { useState } from 'react';
import { GitBranch, Users, Clock, Activity, Check, X, Plus, Stethoscope, Tag } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useBranchManagerData } from '../../hooks/useBranchManagerData';
import { AdminLayout, AdminNavItem } from '../../components/layout/AdminLayout';

export const BranchManagerDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { logout, profile } = useAuth();
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
        <p className="font-bold text-ink-500 animate-pulse">Loading Branch Data...</p>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <GitBranch size={64} className="text-ink-300 mb-4" />
        <h2 className="font-display text-2xl font-black text-ink-800 mb-2">No Branch Assigned</h2>
        <p className="text-ink-500 font-bold max-w-md">Your account is not linked to any branch. Contact your Hospital Admin.</p>
        <button onClick={handleLogout} className="mt-8 px-6 py-2 bg-navy-900 text-white font-bold rounded-ds-sm">Sign Out</button>
      </div>
    );
  }

  const navItems: AdminNavItem[] = [
    { id: 'OVERVIEW',  label: 'Overview', icon: Activity },
    { id: 'REQUESTS',  label: 'Requests', icon: Clock, badge: doctorRequests.length },
    { id: 'ROSTER',    label: 'Roster',   icon: Users },
    { id: 'SECTORS',   label: 'Sectors',  icon: Tag },
  ];

  return (
    <AdminLayout
      title="Branch Manager"
      subtitle={`${branch.name} — ${hospital?.name || ''}`}
      navItems={navItems}
      activeId={activeTab}
      onSelect={(id) => setActiveTab(id as typeof activeTab)}
      onLogout={handleLogout}
      recipientId={profile?.id}
      onNavigateNotification={onNavigate}
    >
        <div className="min-w-0">
          {/* OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Doctors', value: stats.totalDoctors, color: 'teal' },
                  { label: 'Pending Requests', value: stats.pendingRequests, color: 'orange' },
                  { label: 'Total Visits', value: stats.totalVisits, color: 'medical' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-ds-md p-5 text-center`}>
                    <p className={`font-stat text-3xl font-black text-${s.color}-600`}>{s.value}</p>
                    <p className="text-xs font-bold text-ink-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-ds-md p-6 border border-ink-100 shadow-sm">
                <h3 className="font-black text-ink-800 mb-4">Branch Info</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-ink-600"><span className="font-bold text-ink-400">Hospital:</span> {hospital?.name}</p>
                  <p className="text-ink-600"><span className="font-bold text-ink-400">Branch:</span> {branch.name}</p>
                  <p className="text-ink-600"><span className="font-bold text-ink-400">Address:</span> {branch.address}</p>
                  {branch.contact_info && <p className="text-ink-600"><span className="font-bold text-ink-400">Contact:</span> {branch.contact_info}</p>}
                  <p className="text-ink-600"><span className="font-bold text-ink-400">Sectors:</span> {sectors.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCTOR REQUESTS */}
          {activeTab === 'REQUESTS' && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-black text-ink-800">Pending Doctor Requests</h3>
              {doctorRequests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-ds-md border border-ink-100">
                  <Clock size={48} className="mx-auto mb-3 text-ink-200" />
                  <p className="font-bold text-ink-400">No pending requests for this branch.</p>
                </div>
              ) : (
                doctorRequests.map(req => (
                  <div key={req.id} className="bg-white border border-ink-100 rounded-ds-md p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-ds-sm bg-teal-50 flex items-center justify-center shrink-0">
                          <Stethoscope size={18} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="font-black text-ink-800">{req.doctor?.full_name}</p>
                          <p className="text-xs text-ink-500 font-medium">{req.doctor?.specialty} — {req.doctor?.bmdc_number}</p>
                          <div className="mt-2 space-y-1">
                            {req.sector && <p className="text-xs text-ink-500 font-medium">Sector: {req.sector.name}</p>}
                            <p className="text-xs font-bold text-teal-600">Proposed Fee: ৳{req.proposed_fee}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => handleApprove(req.id)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-black rounded-ds-sm disabled:opacity-50">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => setRejectingId(req.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded-ds-sm border border-red-100">
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                    {rejectingId === req.id && (
                      <div className="mt-4 pt-4 border-t border-ink-100 space-y-3">
                        <input className="w-full p-3 rounded-ds-sm border border-ink-200 bg-ink-50 text-sm font-bold outline-none focus:border-red-400" placeholder="Rejection reason" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => handleReject(req.id)} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-ds-sm">{saving ? '...' : 'Confirm Reject'}</button>
                          <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="px-4 py-2 bg-ink-200 text-ink-700 text-xs font-black rounded-ds-sm">Cancel</button>
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
              <h3 className="font-display text-lg font-black text-ink-800">Branch Roster ({roster.length})</h3>
              {roster.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-ds-md border border-ink-100">
                  <Users size={48} className="mx-auto mb-3 text-ink-200" />
                  <p className="font-bold text-ink-400">No doctors in this branch yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roster.map((doc: any) => (
                    <div key={doc.id} className="bg-white border border-ink-100 rounded-ds-md p-4 shadow-sm flex items-center gap-4">
                      <img src={doc.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name)}&background=0d9488&color=fff`} alt={doc.full_name} className="w-12 h-12 rounded-ds-sm object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-ink-800 truncate">{doc.full_name}</p>
                        <p className="text-xs text-ink-500 font-medium">{doc.specialty}</p>
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
              <h3 className="font-display text-lg font-black text-ink-800">Sectors / Departments</h3>
              <form onSubmit={handleCreateSector} className="flex gap-3">
                <input
                  value={newSector}
                  onChange={e => setNewSector(e.target.value)}
                  placeholder="e.g., Cardiology, Neurology..."
                  className="flex-1 p-3 rounded-ds-sm border border-ink-200 bg-ink-50 font-bold text-ink-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                />
                <button type="submit" disabled={saving || !newSector.trim()} className="px-5 py-3 bg-teal-600 text-white text-sm font-black rounded-ds-sm disabled:opacity-50 flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </form>
              {sectors.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-ds-md border border-ink-100">
                  <Tag size={48} className="mx-auto mb-3 text-ink-200" />
                  <p className="font-bold text-ink-400">No sectors created yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sectors.map(sector => (
                    <div key={sector.id} className="bg-white border border-teal-100 rounded-ds-sm p-4 text-center">
                      <p className="font-black text-ink-800">{sector.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
    </AdminLayout>
  );
};
