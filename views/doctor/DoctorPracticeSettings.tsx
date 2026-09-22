import React, { useState, useEffect } from 'react';
import { Hospital, MapPin, CreditCard, Save, X, Pencil, Trash2, Clock, Search, GitBranch, Tag, Send } from 'lucide-react';
import { DashboardButton, DS_ICONS, MaskIcon } from '../../components/dashboard';
import { useToast } from '../../components/ToastProvider';
import { PanelHeader } from '../../components/doctor/manage/PanelHeader';
import { fetchDoctorChambers, saveChamberWithSchedules, deleteChamberFromSupabase, submitChamberRequest, fetchChamberRequests, PracticeChamber, DoctorPracticeSettings as SettingsType, WeeklyDaySchedule, DoctorStorage } from '../../storage';
import { supabase } from '../../supabase';
import { AssistantManager } from '../../components/doctor/AssistantManager';
import { DoctorTabBar } from '../../components/doctor/DoctorTabBar';

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

export const DoctorPracticeSettings: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
    const session = DoctorStorage.get();
    const doctorId = session?.id || '';
    const { showToast } = useToast();

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
                showToast('Request submitted! The hospital admin will review your chamber request.', 'success');
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
            showToast('Failed to save chamber. Please try again.', 'error');
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
                showToast('Failed to delete chamber.', 'error');
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

    const pendingRequests = chamberRequests.filter(r => r.status === 'pending');
    const rejectedRequests = chamberRequests.filter(r => r.status === 'rejected');

    return (
        // Figma "Manage" 257:10013: welcome header + View Profile, Hospitals panel | Assistants panel (436). Layout owns bg + gutters.
        <div className="flex animate-fade-in flex-col gap-6 font-display">
            {onNavigate && <DoctorTabBar currentPath="/doctor/practice-settings" onNavigate={onNavigate} />}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Welcome{session?.name ? `, ${session.name}` : ''}</h1>
                    <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Manage your chambers, fees, weekly schedule and assistants</p>
                </div>
                {onNavigate && (
                    <DashboardButton variant="gradient" icon={<MaskIcon src={DS_ICONS.change} size={16} />} onClick={() => onNavigate('/doctor/profile')} className="self-start pr-3 md:self-auto">
                        <span className="relative z-[1] px-3">View Profile</span>
                    </DashboardButton>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_436px]">
                {/* HOSPITALS */}
                <section aria-label="Hospitals" className="flex min-h-[536px] flex-col gap-6 rounded-ds-lg bg-white p-5">
                    <PanelHeader title="Hospitals" action="Add Hospital" onAction={!showAddForm ? () => setShowAddForm(true) : undefined} />

                    {(pendingRequests.length > 0 || rejectedRequests.length > 0) && (
                        <div className="flex flex-col gap-2">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-ds-body text-content-primary">{req.hospital?.name}</p>
                                        <p className="truncate text-ds-small text-content-tertiary">{[req.branch?.name, req.sector?.name, req.hospital?.address].filter(Boolean).join(' · ')}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-ds-small text-orange-700"><Clock size={12} /> Pending Approval</span>
                                        <p className="mt-1 text-ds-small text-content-tertiary">Fee: ৳{req.proposed_fee}</p>
                                    </div>
                                </div>
                            ))}
                            {rejectedRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-ds-body text-content-primary">{req.hospital?.name}</p>
                                        {req.note && <p className="text-ds-small text-red-600">Reason: {req.note}</p>}
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-ds-small text-red-700"><X size={12} /> Rejected</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {isLoading ? (
                        <p className="py-16 text-center text-ds-body text-content-tertiary">Loading chambers...</p>
                    ) : settings.chambers.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                            <Hospital size={40} className="text-ink-300" />
                            <p className="max-w-xs text-ds-body text-content-tertiary">No chambers added yet. Start by adding your first hospital or clinic.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {settings.chambers.map((chamber) => (
                                <HospitalCard
                                    key={chamber.id}
                                    name={chamber.hospitalName}
                                    address={chamber.address}
                                    days={(chamber.schedule || []).map(sc => Number(sc.day))}
                                    fee={chamber.feeNormal}
                                    summary={getScheduleSummary(chamber.schedule)}
                                    onEdit={() => handleEditChamber(chamber)}
                                    onDelete={() => handleDeleteChamber(chamber.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ASSISTANTS */}
                <section aria-label="Assistants" className="flex min-h-[536px] flex-col gap-6 rounded-ds-lg bg-white p-5">
                    <AssistantManager />
                </section>
            </div>

            {/* ADD/EDIT CHAMBER FORM MODAL */}
            {showAddForm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 ds-fade-in" role="dialog" aria-modal="true" aria-labelledby="chamber-form-title">
                    <div className="relative max-h-[90vh] w-full max-w-[696px] overflow-y-auto rounded-ds-xl bg-white p-6 font-display shadow-ds-modal md:p-9">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h2 id="chamber-form-title" className="text-ds-title-24 text-content-primary">
                                    {editingChamberId ? 'Edit Hospital' : 'Add Hospital'}
                                </h2>
                                <p className="text-ds-body text-content-secondary">Please provide accurate information for patient booking.</p>
                            </div>
                            <button onClick={resetForm} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-50 text-content-tertiary transition-colors duration-ds-fast ease-ds-out hover:text-[#ed7272]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveChamber} className="space-y-6">
                            {/* BASIC INFO */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* HOSPITAL SELECTOR */}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                        <Hospital size={14} className="text-medical-500" /> Hospital / Clinic
                                        {selectedHospitalId && (
                                            <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-ds-small text-primary-600">Registered Hospital Linked</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-tertiary">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={hospitalSearchQuery}
                                            onChange={e => searchHospitals(e.target.value)}
                                            placeholder="Search registered hospitals… or type custom name below"
                                            className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 pl-11"
                                        />
                                        {selectedHospitalId && (
                                            <button type="button" onClick={() => { setSelectedHospitalId(undefined); setHospitalSearchQuery(''); setFormData(p => ({ ...p, hospitalName: '', address: '' })); }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-[#ed7272]">
                                                <X size={16} />
                                            </button>
                                        )}
                                        {hospitalSearchResults.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-ds-rise-lg outline outline-1 -outline-offset-1 outline-surface">
                                                {hospitalSearchResults.map(h => (
                                                    <button key={h.id} type="button"
                                                        onClick={() => selectHospital(h)}
                                                        className="w-full border-b border-ink-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-primary-50">
                                                        <p className="text-ds-body text-content-primary">{h.name}</p>
                                                        <p className="text-ds-small text-content-tertiary">{h.address}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-ds-small text-content-tertiary">
                                        Select a registered hospital to send a join request. Or fill in manually below for a custom chamber.
                                    </p>
                                </div>

                                {/* Branch & Sector dropdowns — shown when a registered hospital is selected */}
                                {requestMode && selectedHospitalId && (
                                    <>
                                        {branches.length > 0 && (
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                                    <GitBranch size={14} className="text-medical-500" /> Select Branch (optional)
                                                </label>
                                                <select
                                                    value={selectedBranchId}
                                                    onChange={e => { setSelectedBranchId(e.target.value); setSelectedSectorId(''); }}
                                                    className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                                >
                                                    <option value="">Hospital-wide (no specific branch)</option>
                                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {sectors.filter(s => !selectedBranchId || s.branch_id === selectedBranchId || !s.branch_id).length > 0 && (
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                                    <Tag size={14} className="text-purple-500" /> Select Sector (optional)
                                                </label>
                                                <select
                                                    value={selectedSectorId}
                                                    onChange={e => setSelectedSectorId(e.target.value)}
                                                    className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                                >
                                                    <option value="">No specific sector</option>
                                                    {sectors.filter(s => !selectedBranchId || s.branch_id === selectedBranchId || !s.branch_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="rounded-2xl bg-primary-50 p-4 md:col-span-2">
                                            <p className="text-ds-body text-primary-700">Request Mode Active</p>
                                            <p className="mt-1 text-ds-small text-primary-600">Clicking Save will submit a join request to the hospital admin. Your chamber will be created once approved.</p>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                        <Hospital size={14} className="text-medical-500" /> Hospital / Clinic Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.hospitalName}
                                        onChange={(e) => { setFormData({ ...formData, hospitalName: e.target.value }); if (selectedHospitalId) setSelectedHospitalId(undefined); }}
                                        placeholder="e.g., Evercare Hospital, Dhaka"
                                        className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                        <MapPin size={14} className="text-medical-500" /> Full Address
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="e.g., Plot 81, Block E, Bashundhara"
                                        className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                        <CreditCard size={14} className="text-medical-500" /> Normal Consultation Fee (৳)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.feeNormal}
                                        onChange={(e) => setFormData({ ...formData, feeNormal: parseInt(e.target.value) })}
                                        className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
                                        <CreditCard size={14} className="text-medical-500" /> Report / Follow-up Fee (৳)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.feeReport}
                                        onChange={(e) => setFormData({ ...formData, feeReport: parseInt(e.target.value) })}
                                        className="w-full h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                    />
                                </div>
                            </div>

                            {/* CONSULTATION DURATION */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-ds-paragraph text-content-secondary">
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
                                        className="w-32 h-[46px] rounded-2xl bg-ink-50 px-4 font-display text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                    />
                                    <div className="text-ds-small">
                                        {formData.consultationDurationMinutes > 0
                                            ? <span className="text-primary-600">Patients will see time slots ({formData.consultationDurationMinutes} min each)</span>
                                            : <span className="text-content-tertiary">Set to 0 to use serial numbers only (no time slots)</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* WEEKLY SCHEDULE */}
                            <div className="space-y-4">
                                <h3 className="text-ds-title-20 text-content-primary">Weekly Schedule</h3>

                                <div className="space-y-3">
                                    {DAYS.map(day => (
                                        <div key={day} className={`flex flex-col gap-4 rounded-2xl p-4 transition-colors duration-ds-fast ease-ds-out md:flex-row md:items-center ${scheduleState[day].active ? 'bg-primary-50' : 'bg-ink-50'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                                                <input
                                                    type="checkbox"
                                                    checked={scheduleState[day].active}
                                                    onChange={(e) => setScheduleState({
                                                        ...scheduleState,
                                                        [day]: { ...scheduleState[day], active: e.target.checked }
                                                    })}
                                                    className="size-5 rounded accent-[rgb(var(--color-primary-500))]"
                                                />
                                                <span className={`text-ds-body ${scheduleState[day].active ? 'text-primary-700' : 'text-content-secondary'}`}>{DAY_LABELS[day]}</span>
                                            </label>

                                            {scheduleState[day].active && (
                                                <div className="flex-1 grid grid-cols-3 gap-3 animate-fade-in">
                                                    <div className="space-y-1">
                                                        <label className="text-ds-small text-content-tertiary">Start</label>
                                                        <input
                                                            type="time"
                                                            value={scheduleState[day].startTime}
                                                            onChange={(e) => setScheduleState({
                                                                ...scheduleState,
                                                                [day]: { ...scheduleState[day], startTime: e.target.value }
                                                            })}
                                                            className="h-9 w-full rounded-xl bg-white px-2 text-ds-body text-content-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-ds-small text-content-tertiary">End</label>
                                                        <input
                                                            type="time"
                                                            value={scheduleState[day].endTime}
                                                            onChange={(e) => setScheduleState({
                                                                ...scheduleState,
                                                                [day]: { ...scheduleState[day], endTime: e.target.value }
                                                            })}
                                                            className="h-9 w-full rounded-xl bg-white px-2 text-ds-body text-content-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-ds-small text-content-tertiary">Limit</label>
                                                        <input
                                                            type="number"
                                                            value={scheduleState[day].dailyLimit}
                                                            onChange={(e) => setScheduleState({
                                                                ...scheduleState,
                                                                [day]: { ...scheduleState[day], dailyLimit: parseInt(e.target.value) || 0 }
                                                            })}
                                                            className="h-9 w-full rounded-xl bg-white px-2 text-ds-body text-content-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-2 pt-2 md:flex-row">
                                <DashboardButton type="button" variant="secondary" icon={false} onClick={resetForm} className="flex-1 px-4">Cancel</DashboardButton>
                                <DashboardButton type="submit" variant="primary" disabled={isSaving} icon={requestMode && selectedHospitalId && !editingChamberId ? <Send size={16} /> : <Save size={16} />} className="flex-[2] pr-4">
                                    <span className="px-3">
                                        {requestMode && selectedHospitalId && !editingChamberId
                                            ? (isSaving ? 'Sending Request...' : 'Send Join Request')
                                            : (editingChamberId ? 'Update Configuration' : isSaving ? 'Saving...' : 'Save & Activate Chamber')}
                                    </span>
                                </DashboardButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Figma hospital card: r16, 1px ink-100 stroke, faint primary wash bottom-right; name, address, available-day chips, fee, pencil ring.
const HospitalCard: React.FC<{ name: string; address: string; days: number[]; fee: number; summary: string; onEdit: () => void; onDelete: () => void }> = ({ name, address, days, fee, summary, onEdit, onDelete }) => (
    <article className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-ink-100 bg-[linear-gradient(135deg,#fff_55%,rgb(var(--color-primary-50))_100%)] p-5" title={summary}>
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-2">
                <h3 className="truncate text-ds-title-20 text-content-primary">{name}</h3>
                <p className="flex items-start gap-1.5 text-ds-small text-content-secondary"><MapPin size={14} className="mt-px shrink-0 text-primary-500" /> <span className="line-clamp-2">{address}</span></p>
            </div>
            <div className="flex shrink-0 gap-1">
                <button type="button" onClick={onEdit} aria-label={`Edit ${name}`} className="grid size-[42px] place-items-center rounded-full border border-ink-100 bg-white text-content-secondary transition-colors duration-ds-fast ease-ds-out hover:border-primary-300 hover:text-primary-600"><Pencil size={14} /></button>
                <button type="button" onClick={onDelete} aria-label={`Delete ${name}`} className="grid size-[42px] place-items-center rounded-full border border-ink-100 bg-white text-content-tertiary transition-colors duration-ds-fast ease-ds-out hover:border-red-200 hover:text-[#ed7272]"><Trash2 size={14} /></button>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <span className="text-ds-small text-content-tertiary">Available</span>
            <div className="flex flex-wrap gap-1">
                {days.length === 0 ? <span className="text-ds-small text-content-tertiary">No schedule set</span> : Array.from(new Set<number>(days)).sort((a, b) => a - b).map(d => (
                    <span key={d} className="rounded-full bg-primary-50 px-2 py-0.5 text-ds-small text-primary-600">{SHORT_DAYS[d]}</span>
                ))}
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-ds-small text-content-tertiary">Consultation Fee</span>
            <span className="text-ds-paragraph text-content-primary">{fee} BDT</span>
        </div>
    </article>
);
