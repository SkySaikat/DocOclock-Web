import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Shield, Plus, Trash2, Edit2, Lock, Phone, User, Check, X } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import bcrypt from 'bcryptjs';

export const AssistantManager = () => {
  const { profile } = useAuth();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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
      alert("Error creating assistant: " + error.message);
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

  if (loading) return <div className="p-4 text-slate-400 font-bold text-sm">Loading staff...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Clinic Assistants</h2>
          <p className="text-sm font-bold text-slate-500">Manage access for your staff.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Add Assistant
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" placeholder="e.g. John Doe" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number (Login ID)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" placeholder="+880..." />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" placeholder="••••••••" />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-indigo-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Shield size={16} className="text-indigo-600"/> Access Permissions</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.manage_queue} onChange={e => setFormData({...formData, manage_queue: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-sm font-bold text-slate-700">Manage Queue & Delays</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.manage_appointments} onChange={e => setFormData({...formData, manage_appointments: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-sm font-bold text-slate-700">View Appointments</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">Create Account</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {assistants.length === 0 && !isCreating && (
          <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
             <p className="font-bold text-slate-400">You haven't added any assistants yet.</p>
          </div>
        )}
        {assistants.map(assistant => (
          <div key={assistant.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
                {assistant.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-slate-900 leading-tight">{assistant.full_name}</h3>
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1"><Phone size={12}/> {assistant.phone}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => togglePermission(assistant.id, assistant.permissions || {}, 'manage_queue')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${assistant.permissions?.manage_queue ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                {assistant.permissions?.manage_queue ? <Check size={12} /> : <X size={12} />} Queue Access
              </button>
              <button 
                onClick={() => togglePermission(assistant.id, assistant.permissions || {}, 'manage_appointments')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${assistant.permissions?.manage_appointments ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                {assistant.permissions?.manage_appointments ? <Check size={12} /> : <X size={12} />} Appointments Access
              </button>
            </div>

            <button onClick={() => handleDelete(assistant.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors ml-auto md:ml-0">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
