import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Shield, Trash2, Pencil, Lock, Phone, User, Check, X } from 'lucide-react';
import { DashboardButton } from '../dashboard';
import { PanelHeader } from './manage/PanelHeader';
import { PatientAvatar } from './queue/PatientAvatar';
import { useToast } from '../ToastProvider';
import { useAuth } from '../../AuthContext';
import bcrypt from 'bcryptjs';

export const AssistantManager = () => {
  const { profile } = useAuth();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  // Figma Assistants list: the edited row is highlighted (primary-50) and expands to its permission toggles + remove.
  const [openId, setOpenId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    manage_queue: true,
    manage_appointments: true,
  });

  useEffect(() => {
    fetchAssistants();
  }, [profile?.id]);

  const fetchAssistants = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'ASSISTANT')
      .eq('parent_id', profile.id);
    
    if (data) setAssistants(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(formData.password, salt);

    const permissions = {
      manage_queue: formData.manage_queue,
      manage_appointments: formData.manage_appointments,
    };

    const { error } = await supabase.from('profiles').insert({
      full_name: formData.full_name,
      phone: formData.phone,
      password: hashedPassword,
      role: 'ASSISTANT',
      parent_id: profile?.id,
      permissions: permissions,
      registration_status: 'approved'
    });

    if (!error) {
      setIsCreating(false);
      setFormData({ full_name: '', phone: '', password: '', manage_queue: true, manage_appointments: true });
      fetchAssistants();
    } else {
      showToast('Error creating assistant: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this assistant?")) {
      await supabase.from('profiles').delete().eq('id', id);
      fetchAssistants();
    }
  };

  const togglePermission = async (id: string, currentPermissions: any, key: string) => {
    const newPerms = { ...currentPermissions, [key]: !currentPermissions[key] };
    await supabase.from('profiles').update({ permissions: newPerms }).eq('id', id);
    fetchAssistants();
  };

  if (loading) return <p className="py-8 text-center text-ds-body text-content-tertiary">Loading staff...</p>;

  const FIELD = 'h-[46px] w-full rounded-2xl bg-ink-50 pl-10 pr-4 text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';
  const TOGGLE = (on: boolean) => `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ds-small transition-colors duration-ds-fast ease-ds-out ${on ? 'bg-primary-500 text-white' : 'bg-white text-content-tertiary'}`;

  return (
    <div className="flex flex-col gap-6 font-display">
      <PanelHeader title="Assistants" action="Add Assistant" onAction={!isCreating ? () => setIsCreating(true) : undefined} />

      {/* Add Assistant modal (Figma 368:17322) */}
      {isCreating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 ds-fade-in" role="dialog" aria-modal="true" aria-labelledby="add-assistant-title">
          <form onSubmit={handleCreate} className="relative flex w-full max-w-[644px] flex-col gap-5 rounded-ds-xl bg-white p-6 shadow-ds-modal md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h3 id="add-assistant-title" className="text-ds-title-24 text-content-primary">Add Assistant</h3>
                <p className="text-ds-body text-content-secondary">Give your staff their own login to help run the queue.</p>
              </div>
              <button type="button" onClick={() => setIsCreating(false)} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-50 text-content-tertiary hover:text-[#ed7272]"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <span className="text-ds-paragraph text-content-secondary">Name</span>
                <span className="relative block">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
                  <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className={FIELD} placeholder="e.g. John Doe" />
                </span>
              </label>
              <label className="flex flex-col gap-3">
                <span className="text-ds-paragraph text-content-secondary">Phone Number (Login ID)</span>
                <span className="relative block">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={FIELD} placeholder="+880..." />
                </span>
              </label>
              <label className="flex flex-col gap-3 md:col-span-2">
                <span className="text-ds-paragraph text-content-secondary">Password</span>
                <span className="relative block">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={FIELD} placeholder="••••••••" />
                </span>
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-2 text-ds-paragraph text-content-secondary"><Shield size={16} className="text-primary-500" /> Role</span>
              <div className="flex flex-wrap gap-2 rounded-2xl bg-ink-50 p-2">
                <button type="button" aria-pressed={formData.manage_queue} onClick={() => setFormData({...formData, manage_queue: !formData.manage_queue})} className={TOGGLE(formData.manage_queue)}>
                  {formData.manage_queue ? <Check size={12} /> : <X size={12} />} Queue Manager
                </button>
                <button type="button" aria-pressed={formData.manage_appointments} onClick={() => setFormData({...formData, manage_appointments: !formData.manage_appointments})} className={TOGGLE(formData.manage_appointments)}>
                  {formData.manage_appointments ? <Check size={12} /> : <X size={12} />} Appointment Manager
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <DashboardButton type="button" variant="secondary" icon={false} onClick={() => setIsCreating(false)} className="flex-1 px-4">Cancel</DashboardButton>
              <DashboardButton type="submit" variant="primary" icon={false} className="flex-[2] px-4">Create Account</DashboardButton>
            </div>
          </form>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {assistants.length === 0 && (
          <li className="rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ds-body text-content-tertiary">You haven't added any assistants yet.</li>
        )}
        {assistants.map(assistant => {
          const open = openId === assistant.id;
          const perms = assistant.permissions || {};
          return (
            <li key={assistant.id} className={`flex flex-col gap-3 rounded-2xl p-4 transition-colors duration-ds-fast ease-ds-out ${open ? 'bg-primary-50' : ''}`}>
              <div className="flex items-center gap-3">
                <PatientAvatar name={assistant.full_name || '?'} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ds-body text-content-primary">{assistant.full_name}</p>
                  <p className="truncate text-ds-body text-content-secondary">
                    {[perms.manage_queue && 'Queue', perms.manage_appointments && 'Appointments'].filter(Boolean).join(' · ') || 'No access'} · {assistant.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : assistant.id)}
                  aria-expanded={open}
                  aria-label={`Edit ${assistant.full_name}`}
                  className={`grid size-[42px] shrink-0 place-items-center rounded-full border transition-colors duration-ds-fast ease-ds-out ${open ? 'border-primary-500 text-primary-500' : 'border-ink-200 text-content-secondary'}`}
                >
                  <Pencil size={14} />
                </button>
              </div>
              {open && (
                <div className="flex flex-wrap items-center gap-2 pl-12">
                  <button onClick={() => togglePermission(assistant.id, perms, 'manage_queue')} aria-pressed={!!perms.manage_queue} className={TOGGLE(!!perms.manage_queue)}>
                    {perms.manage_queue ? <Check size={12} /> : <X size={12} />} Queue Access
                  </button>
                  <button onClick={() => togglePermission(assistant.id, perms, 'manage_appointments')} aria-pressed={!!perms.manage_appointments} className={TOGGLE(!!perms.manage_appointments)}>
                    {perms.manage_appointments ? <Check size={12} /> : <X size={12} />} Appointments Access
                  </button>
                  <button onClick={() => handleDelete(assistant.id)} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-ds-small text-[#ed7272] hover:bg-white">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
