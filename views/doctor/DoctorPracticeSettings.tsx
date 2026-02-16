import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Hospital, MapPin, CreditCard, Save, X, Edit2, Trash2, Clock, ChevronRight } from 'lucide-react';
import { ChamberCard } from '../../components/ui/ChamberCard';
import { getDoctorPracticeSettings, saveDoctorPracticeSettings, PracticeChamber, DoctorPracticeSettings as SettingsType, WeeklyDaySchedule, DoctorStorage } from '../../storage';

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

    const [settings, setSettings] = useState<SettingsType>(() =>
        doctorId ? getDoctorPracticeSettings(doctorId) : { dailyBookingLimit: 40, reportFreeDays: 7, chambers: [] }
    );

    // Refresh settings when doctorId changes (though unlikely to change while mounted)
    useEffect(() => {
        if (doctorId) {
            setSettings(getDoctorPracticeSettings(doctorId));
        }
    }, [doctorId]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingChamberId, setEditingChamberId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        hospitalName: '',
        address: '',
        feeNormal: 500,
        feeReport: 300,
    });

    const [scheduleState, setScheduleState] = useState<Record<number, { active: boolean; startTime: string; endTime: string; dailyLimit: number }>>(
        DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { active: false, startTime: '17:00', endTime: '21:00', dailyLimit: 20 }
        }), {})
    );

    const handleSaveChamber = (e: React.FormEvent) => {
        e.preventDefault();

        const schedule: WeeklyDaySchedule[] = DAYS
            .filter(day => scheduleState[day].active)
            .map(day => ({
                day,
                startTime: scheduleState[day].startTime,
                endTime: scheduleState[day].endTime,
                dailyLimit: scheduleState[day].dailyLimit,
            }));

        const scheduleDays = schedule.map(s => s.day);

        let updatedChambers: PracticeChamber[];

        if (editingChamberId) {
            updatedChambers = settings.chambers.map(c =>
                c.id === editingChamberId
                    ? {
                        ...c,
                        hospitalName: formData.hospitalName,
                        address: formData.address,
                        feeNormal: formData.feeNormal,
                        feeReport: formData.feeReport,
                        schedule,
                        scheduleDays
                    }
                    : c
            );
        } else {
            const newChamber: PracticeChamber = {
                id: Date.now().toString(),
                hospitalName: formData.hospitalName,
                address: formData.address,
                schedule,
                scheduleDays,
                feeNormal: formData.feeNormal,
                feeReport: formData.feeReport,
            };
            updatedChambers = [...settings.chambers, newChamber];
        }

        const updatedSettings = {
            ...settings,
            chambers: updatedChambers,
        };

        saveDoctorPracticeSettings(doctorId, updatedSettings);
        setSettings(updatedSettings);
        resetForm();
    };

    const handleEditChamber = (chamber: PracticeChamber) => {
        setFormData({
            hospitalName: chamber.hospitalName,
            address: chamber.address,
            feeNormal: chamber.feeNormal,
            feeReport: chamber.feeReport,
        });

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

    const handleDeleteChamber = (id: string) => {
        if (window.confirm("Delete this chamber?")) {
            const updatedSettings = {
                ...settings,
                chambers: settings.chambers.filter(c => c.id !== id),
            };
            saveDoctorPracticeSettings(doctorId, updatedSettings);
            setSettings(updatedSettings);
        }
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditingChamberId(null);
        setFormData({
            hospitalName: '',
            address: '',
            feeNormal: 500,
            feeReport: 300,
        });
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Practice Settings</h1>
                    <p className="text-slate-500 font-bold">Manage your consultation chambers, fees, and weekly schedule.</p>
                </div>
                {!showAddForm && (
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-medical-600 hover:bg-medical-500 text-white h-14 px-8 rounded-2xl text-sm font-black flex items-center gap-2 shadow-xl shadow-medical-100"
                    >
                        <Plus size={20} /> Add New Chamber
                    </Button>
                )}
            </div>

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

            {/* ADD/EDIT CHAMBER FORM */}
            {showAddForm && (
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-premium border border-slate-100 animate-scale-in">
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
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Hospital size={14} className="text-medical-500" /> Hospital / Clinic Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.hospitalName}
                                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
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
                            <Button type="submit" className="bg-medical-600 hover:bg-medical-500 text-white flex-1 h-16 rounded-[20px] font-black text-sm shadow-xl shadow-medical-100 uppercase tracking-widest gap-2">
                                <Save size={20} /> {editingChamberId ? 'Update Configuration' : 'Save & Active Chamber'}
                            </Button>
                            <Button type="button" variant="outline" onClick={resetForm} className="h-16 px-10 rounded-[20px] font-black text-sm border-slate-200 text-slate-500 hover:bg-slate-50">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
