import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Hospital, MapPin, CreditCard, Save, X, Edit2, Trash2, Clock, ChevronRight, Search, GitBranch, Tag, Send } from 'lucide-react';
import { ChamberCard } from '../../components/ui/ChamberCard';
import { fetchDoctorChambers, saveChamberWithSchedules, deleteChamberFromSupabase, submitChamberRequest, fetchChamberRequests, PracticeChamber, DoctorPracticeSettings as SettingsType, WeeklyDaySchedule, DoctorStorage } from '../../storage';
import { supabase } from '../../supabase';

const DAY_LABELS: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
};

const DAYS = [6, 0, 1, 2, 3, 4, 5]; // Starting with Saturday as per local convention

export const DoctorPracticeSettings: React.FC = () => {
    const session = DoctorStorage.get();
    const doctorId = session?.id || '';

    const [settings, setSettings] = useState<SettingsType>({ dailyBookingLimit: 40, reportFreeDays: 7, chambers: [] });
    const [chamberRequests, setChamberRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadSettings = async () => {
        if (!doctorId) return;
        setIsLoading(true);
        try {
            const [chambers, requests] = await Promise.all([
                fetchDoctorChambers(doctorId),
                fetchChamberRequests(doctorId),
            ]);
            setSettings(prev => ({ ...prev, chambers }));
            setChamberRequests(requests);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [doctorId]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingChamberId, setEditingChamberId] = useState<string | null>(null);

    // Body scroll lock & Layout Hiding
    useEffect(() => {
        if (showAddForm) {
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('data-modal-open', 'true');
        } else {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.removeAttribute('data-modal-open');
        };
    }, [showAddForm]);

    const [formData, setFormData] = useState({
        hospitalName: '',
        address: '',
        feeNormal: 500,
        feeReport: 300,
        consultationDurationMinutes: 0,
    });

    // Hospital search for linking to registered hospitals
    const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
    const [hospitalSearchResults, setHospitalSearchResults] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>(undefined);
    const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);

    // Branch / Sector selection (populated when a hospital is selected)
    const [branches, setBranches] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedSectorId, setSelectedSectorId] = useState<string>('');

    // Chamber request mode: when a registered hospital is selected, the form submits a request instead of creating directly
    const [requestMode, setRequestMode] = useState(false);

    const searchHospitals = async (query: string) => {
        setHospitalSearchQuery(query);
        if (query.length < 2) { setHospitalSearchResults([]); return; }
        setIsSearchingHospitals(true);
        try {
            const { data } = await supabase
                .from('hospitals')
                .select('id, name, address')
                .ilike('name', `%${query}%`)
                .limit(8);
            setHospitalSearchResults(data || []);
        } catch { setHospitalSearchResults([]); }
        setIsSearchingHospitals(false);
    };

    const selectHospital = async (h: any) => {
        setSelectedHospitalId(h.id);
        setFormData(prev => ({ ...prev, hospitalName: h.name, address: h.address }));
        setHospitalSearchQuery(h.name);
        setHospitalSearchResults([]);
        setRequestMode(true);
        setSelectedBranchId('');
        setSelectedSectorId('');

        // Load branches and sectors for this hospital
        const [branchRes, sectorRes] = await Promise.all([
            supabase.from('hospital_branches').select('id, name, address').eq('hospital_id', h.id).order('name'),
            supabase.from('hospital_sectors').select('id, name, branch_id').eq('hospital_id', h.id).order('name'),
        ]);
        setBranches(branchRes.data || []);
        setSectors(sectorRes.data || []);
    };

    const [scheduleState, setScheduleState] = useState<Record<number, { active: boolean; startTime: string; endTime: string; dailyLimit: number }>>(
        DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { active: false, startTime: '17:00', endTime: '21:00', dailyLimit: 20 }
        }), {})
    );

    const handleSaveChamber = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // If a registered hospital is selected (request mode), submit a chamber request instead
            if (requestMode && selectedHospitalId && !editingChamberId) {
                await submitChamberRequest(
                    doctorId,
                    selectedHospitalId,
                    formData.feeNormal,
                    selectedBranchId || undefined,
                    selectedSectorId || undefined,
                );
                await loadSettings();
                resetForm();
                alert('Request submitted! The hospital admin will review your chamber request.');
                return;
            }

            const schedule: WeeklyDaySchedule[] = DAYS
                .filter(day => scheduleState[day].active)
                .map(day => ({
                    day,
                    startTime: scheduleState[day].startTime,
                    endTime: scheduleState[day].endTime,
                    dailyLimit: scheduleState[day].dailyLimit,
                }));

            const chamberToSave: PracticeChamber = {
                id: editingChamberId || '',
                hospitalName: formData.hospitalName,
                address: formData.address,
                schedule,
                feeNormal: formData.feeNormal,
                feeReport: formData.feeReport,
                dailyBookingLimit: settings.dailyBookingLimit,
                linkedHospitalId: selectedHospitalId,
                consultationDurationMinutes: formData.consultationDurationMinutes || 0,
            };

            await saveChamberWithSchedules(doctorId, chamberToSave);
            await loadSettings();
            resetForm();
        } catch (error) {
            console.error('Failed to save chamber:', error);
            alert('Failed to save chamber. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditChamber = (chamber: PracticeChamber) => {
        setFormData({
            hospitalName: chamber.hospitalName,
            address: chamber.address,
            feeNormal: chamber.feeNormal,
            feeReport: chamber.feeReport,
            consultationDurationMinutes: chamber.consultationDurationMinutes || 0,
        });
        setSelectedHospitalId(chamber.linkedHospitalId);
        setHospitalSearchQuery(chamber.linkedHospitalId ? chamber.hospitalName : '');

        const newScheduleState = { ...scheduleState };
        // Reset all to inactive first
        DAYS.forEach(day => {
            newScheduleState[day] = { ...newScheduleState[day], active: false };
        });
        // Fill from chamber schedule
        chamber.schedule.forEach(s => {
            const dayNum = typeof s.day === 'string' ? Number(s.day) : s.day; // Defensive for transition
            newScheduleState[dayNum] = {
                active: true,
                startTime: s.startTime,
                endTime: s.endTime,
                dailyLimit: s.dailyLimit
            };
        });

        setScheduleState(newScheduleState);
        setEditingChamberId(chamber.id);
        setShowAddForm(true);
    };

    const handleDeleteChamber = async (id: string) => {
        if (window.confirm("Delete this chamber?")) {
            setIsLoading(true);
            try {
                await deleteChamberFromSupabase(id);
                await loadSettings();
            } catch (error) {
                console.error('Failed to delete chamber:', error);
                alert('Failed to delete chamber.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditingChamberId(null);
        setFormData({ hospitalName: '', address: '', feeNormal: 500, feeReport: 300, consultationDurationMinutes: 0 });
        setSelectedHospitalId(undefined);
        setHospitalSearchQuery('');
        setHospitalSearchResults([]);
        setRequestMode(false);
        setBranches([]);
        setSectors([]);
        setSelectedBranchId('');
        setSelectedSectorId('');
        setScheduleState(
            DAYS.reduce((acc, day) => ({
                ...acc,
                [day]: { active: false, startTime: '17:00', endTime: '21:00', dailyLimit: 20 }
            }), {})
        );
    };

    const getScheduleSummary = (schedule: WeeklyDaySchedule[]) => {
        if (!schedule || schedule.length === 0) return "No schedule set";

        const dayShorts = schedule.map(s => DAY_LABELS[s.day].substring(0, 3));
        const first = schedule[0];
        // Assuming similar times for preview as per requirements "Simple text summary only"
        return `${dayShorts.join(', ')} — ${first.startTime}–${first.endTime} (Limit: ${first.dailyLimit})`;
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Practice Settings</h1>
                    <p className="text-slate-500 font-bold">Manage your consultation chambers, fees, and weekly schedule.</p>
                </div>
            </div>

            {/* PENDING CHAMBER REQUESTS */}
            {chamberRequests.filter(r => r.status === 'pending').length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Clock size={20} className="text-orange-500" /> Pending Requests
                    </h2>
                    {chamberRequests.filter(r => r.status === 'pending').map(req => (
                        <div key={req.id} className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between gap-4">
                            <div>
                                <p className="font-black text-slate-900">{req.hospital?.name}</p>
                                {req.branch && <p className="text-xs text-slate-500 font-medium">{req.branch.name}</p>}
                                {req.sector && <p className="text-xs text-slate-500 font-medium">{req.sector.name}</p>}
                                <p className="text-xs text-slate-400 font-medium mt-1">{req.hospital?.address}</p>
                            </div>
                            <div className="shrink-0 text-right">
                                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-black rounded-full uppercase tracking-wider">⏳ Pending Approval</span>
                                <p className="text-xs text-slate-400 font-medium mt-1">Fee: ৳{req.proposed_fee}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* REJECTED REQUESTS */}
            {chamberRequests.filter(r => r.status === 'rejected').length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <X size={20} className="text-red-500" /> Rejected Requests
                    </h2>
                    {chamberRequests.filter(r => r.status === 'rejected').map(req => (
                        <div key={req.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                            <p className="font-black text-slate-900">{req.hospital?.name}</p>
                            {req.note && <p className="text-xs text-red-600 font-bold mt-1">Reason: {req.note}</p>}
                            <span className="mt-1 inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full">Rejected</span>
                        </div>
                    ))}
                </div>
            )}

            {/* CHAMBERS LIST */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800">Your Chambers</h2>
                    {!showAddForm && (
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-teal-600 hover:bg-teal-700 h-10 px-4 rounded-xl text-xs font-black flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Chamber
                        </Button>
                    )}
                </div>

                {settings.chambers.length === 0 ? (
                    <div className="p-20 bg-white border-2 border-dashed border-slate-100 rounded-[32px] text-center shadow-soft">
                        <Hospital size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">No chambers added yet. Start by adding your first hospital or clinic.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {settings.chambers.map((chamber) => (
                            <ChamberCard
                                key={chamber.id}
                                chamber={{
                                    hospitalName: chamber.hospitalName,
                                    location: chamber.address,
                                    schedule: chamber.schedule || [],
                                    fee: chamber.feeNormal,
                                }}
                                onEdit={() => handleEditChamber(chamber)}
                                onDelete={() => handleDeleteChamber(chamber.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ADD/EDIT CHAMBER FORM MODAL */}
            {showAddForm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-premium border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 relative">
                        <div className="flex justify-between items-center mb-10">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editingChamberId ? 'Edit Chamber Configuration' : 'Setup New Chamber'}
                                </h2>
                                <p className="text-sm font-bold text-slate-400">Please provide accurate information for patient booking.</p>
                            </div>
                            <button onClick={resetForm} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveChamber} className="space-y-8">
                            {/* BASIC INFO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* HOSPITAL SELECTOR */}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Hospital size={14} className="text-medical-500" /> Hospital / Clinic
                                        {selectedHospitalId && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase tracking-wider">Registered Hospital Linked</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={hospitalSearchQuery}
                                            onChange={e => searchHospitals(e.target.value)}
                                            placeholder="Search registered hospitals… or type custom name below"
                                            className="w-full pl-12 pr-5 py-4 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                                        />
                                        {selectedHospitalId && (
                                            <button type="button" onClick={() => { setSelectedHospitalId(undefined); setHospitalSearchQuery(''); setFormData(p => ({ ...p, hospitalName: '', address: '' })); }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                                                <X size={16} />
                                            </button>
                                        )}
                                        {hospitalSearchResults.length > 0 && (
                                            <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                                                {hospitalSearchResults.map(h => (
                                                    <button key={h.id} type="button"
                                                        onClick={() => selectHospital(h)}
                                                        className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                                                        <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{h.address}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold ml-1">
                                        Select a registered hospital to send a join request. Or fill in manually below for a custom chamber.
                                    </p>
                                </div>

                                {/* Branch & Sector dropdowns — shown when a registered hospital is selected */}
                                {requestMode && selectedHospitalId && (
                                    <>
                                        {branches.length > 0 && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <GitBranch size={14} className="text-blue-500" /> Select Branch (optional)
                                                </label>
                                                <select
                                                    value={selectedBranchId}
                                                    onChange={e => { setSelectedBranchId(e.target.value); setSelectedSectorId(''); }}
                                                    className="w-full p-4 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                                                >
                                                    <option value="">Hospital-wide (no specific branch)</option>
                                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {sectors.filter(s => !selectedBranchId || s.branch_id === selectedBranchId || !s.branch_id).length > 0 && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Tag size={14} className="text-purple-500" /> Select Sector (optional)
                                                </label>
                                                <select
                                                    value={selectedSectorId}
                                                    onChange={e => setSelectedSectorId(e.target.value)}
                                                    className="w-full p-4 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all"
                                                >
                                                    <option value="">No specific sector</option>
                                                    {sectors.filter(s => !selectedBranchId || s.branch_id === selectedBranchId || !s.branch_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                            <p className="text-xs font-black text-blue-700">Request Mode Active</p>
                                            <p className="text-xs text-blue-600 font-medium mt-1">Clicking Save will submit a join request to the hospital admin. Your chamber will be created once approved.</p>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Hospital size={14} className="text-medical-500" /> Hospital / Clinic Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.hospitalName}
                                        onChange={(e) => { setFormData({ ...formData, hospitalName: e.target.value }); if (selectedHospitalId) setSelectedHospitalId(undefined); }}
                                        placeholder="e.g., Evercare Hospital, Dhaka"
                                        className="w-full p-5 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <MapPin size={14} className="text-medical-500" /> Full Address
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="e.g., Plot 81, Block E, Bashundhara"
                                        className="w-full p-5 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <CreditCard size={14} className="text-medical-500" /> Normal Consultation Fee (৳)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.feeNormal}
                                        onChange={(e) => setFormData({ ...formData, feeNormal: parseInt(e.target.value) })}
                                        className="w-full p-5 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <CreditCard size={14} className="text-medical-500" /> Report / Follow-up Fee (৳)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.feeReport}
                                        onChange={(e) => setFormData({ ...formData, feeReport: parseInt(e.target.value) })}
                                        className="w-full p-5 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* CONSULTATION DURATION */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Clock size={14} className="text-medical-500" /> Time Per Patient (minutes)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={0}
                                        max={120}
                                        step={5}
                                        value={formData.consultationDurationMinutes}
                                        onChange={(e) => setFormData({ ...formData, consultationDurationMinutes: parseInt(e.target.value) || 0 })}
                                        className="w-32 p-5 rounded-[20px] border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all"
                                    />
                                    <div className="text-sm text-slate-500 font-medium">
                                        {formData.consultationDurationMinutes > 0
                                            ? <span className="text-teal-600 font-bold">Patients will see time slots ({formData.consultationDurationMinutes} min each)</span>
                                            : <span className="text-slate-400">Set to 0 to use serial numbers only (no time slots)</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* WEEKLY SCHEDULE */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 ml-1">Weekly Schedule</h3>

                                <div className="space-y-3">
                                    {DAYS.map(day => (
                                        <div key={day} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl transition-all ${scheduleState[day].active ? 'bg-teal-50/50 border border-teal-100' : 'bg-slate-50 border border-transparent'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                                                <input
                                                    type="checkbox"
                                                    checked={scheduleState[day].active}
                                                    onChange={(e) => setScheduleState({
                                                        ...scheduleState,
                                                        [day]: { ...scheduleState[day], active: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 rounded-lg border-slate-200 text-teal-600 focus:ring-teal-500"
                                                />
                                                <span className={`text-sm font-black ${scheduleState[day].active ? 'text-teal-700' : 'text-slate-500'}`}>{DAY_LABELS[day]}</span>
                                            </label>

                                            {scheduleState[day].active && (
                                                <div className="flex-1 grid grid-cols-3 gap-3 animate-fade-in">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Start</label>
                                                        <input
                                                            type="time"
                                                            value={scheduleState[day].startTime}
                                                            onChange={(e) => setScheduleState({
                                                                ...scheduleState,
                                                                [day]: { ...scheduleState[day], startTime: e.target.value }
                                                            })}
                                                            className="w-full p-2 rounded-xl border border-teal-100 font-bold text-xs bg-white focus:ring-2 focus:ring-teal-500/20 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">End</label>
                                                        <input
                                                            type="time"
                                                            value={scheduleState[day].endTime}
                                                            onChange={(e) => setScheduleState({
                                                                ...scheduleState,
                                                                [day]: { ...scheduleState[day], endTime: e.target.value }
                                                            })}
                                                            className="w-full p-2 rounded-xl border border-teal-100 font-bold text-xs bg-white focus:ring-2 focus:ring-teal-500/20 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Limit</label>
                                                        <input
                                                            type="number"
                                                            value={scheduleState[day].dailyLimit}
                                                            onChange={(e) => setScheduleState({
                                                                ...scheduleState,
                                                                [day]: { ...scheduleState[day], dailyLimit: parseInt(e.target.value) || 0 }
                                                            })}
                                                            className="w-full p-2 rounded-xl border border-teal-100 font-bold text-xs bg-white focus:ring-2 focus:ring-teal-500/20 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                                <Button type="submit" disabled={isSaving} className="bg-medical-600 hover:bg-medical-500 text-white flex-1 h-16 rounded-[20px] font-black text-sm shadow-xl shadow-medical-100 uppercase tracking-widest gap-2">
                                    {requestMode && selectedHospitalId && !editingChamberId
                                        ? <><Send size={20} /> {isSaving ? 'Sending Request...' : 'Send Join Request'}</>
                                        : <><Save size={20} /> {editingChamberId ? 'Update Configuration' : isSaving ? 'Saving...' : 'Save & Active Chamber'}</>
                                    }
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm} className="h-16 px-10 rounded-[20px] font-black text-sm border-slate-200 text-slate-500 hover:bg-slate-50">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
