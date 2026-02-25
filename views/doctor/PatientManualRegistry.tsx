import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Appointment, AppointmentStatus, Gender } from '../../types';
import {
    UserPlus, Phone, MapPin, Calendar,
    ChevronLeft, Loader2, CheckCircle2, User,
    Hash, Users, UserCheck, Minus, Plus
} from 'lucide-react';
import {
    DoctorStorage,
    fetchDoctorChambers,
    upsertAppointment,
    fetchAppointments,
    PracticeChamber,
    fetchQueueSession,
    upsertQueueSession,
    QueueSession,
    DEFAULT_SESSION_META
} from '../../storage';
import { getLocalISODate } from '../../utils/date';

interface PatientManualRegistryProps {
    onNavigate: (path: string) => void;
}

export const PatientManualRegistry: React.FC<PatientManualRegistryProps> = ({ onNavigate }) => {
    const doctor = DoctorStorage.get();
    const [chambers, setChambers] = useState<PracticeChamber[]>([]);
    const [selectedChamberId, setSelectedChamberId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [reservedSlotsCount, setReservedSlotsCount] = useState(0);
    const [isSavingReserved, setIsSavingReserved] = useState(false);
    const [queueSession, setQueueSession] = useState<QueueSession | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        age: '',
        gender: 'Male' as Gender,
        serialNumber: ''
    });

    const today = getLocalISODate();

    useEffect(() => {
        const loadData = async () => {
            if (!doctor?.id) return;
            setIsLoading(true);
            try {
                const data = await fetchDoctorChambers(doctor.id);
                setChambers(data);

                if (data.length > 0) {
                    // Auto-select chamber based on today's schedule
                    const todayDay = new Date().getDay();
                    const scheduledChamber = data.find(c => c.scheduleDays?.includes(todayDay));
                    const initialChamberId = scheduledChamber ? scheduledChamber.id : data[0].id;
                    setSelectedChamberId(initialChamberId);

                    // Fetch Queue Session for Reserved count
                    const session = await fetchQueueSession(doctor.id, initialChamberId, today);
                    setQueueSession(session);
                    setReservedSlotsCount(session.reservedSlotsCount);
                }
            } catch (error) {
                console.error('Error loading chambers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [doctor?.id]);

    useEffect(() => {
        const fetchNextSerial = async () => {
            if (!doctor?.id || !selectedChamberId) return;
            try {
                const existingApps = await fetchAppointments({
                    doctorId: doctor.id,
                    hospitalId: selectedChamberId,
                    date: today
                });
                const existingSerials = new Set(existingApps.map(a => Number(a.serialNumber)));
                const chamber = chambers.find(c => c.id === selectedChamberId);
                const maxCapacity = chamber?.dailyBookingLimit || 30;

                // Suggest from reserved pool [1, reservedSlotsCount] first
                let nextSerial = 1;
                while (existingSerials.has(nextSerial) && nextSerial <= reservedSlotsCount) {
                    nextSerial++;
                }

                // If reserved pool is full, suggest from the rest of the capacity
                if (nextSerial > reservedSlotsCount) {
                    nextSerial = reservedSlotsCount + 1;
                    while (existingSerials.has(nextSerial) && nextSerial <= maxCapacity) {
                        nextSerial++;
                    }
                }

                if (nextSerial > maxCapacity) {
                    setFormData(prev => ({ ...prev, serialNumber: '' }));
                } else {
                    setFormData(prev => ({ ...prev, serialNumber: nextSerial.toString() }));
                }
            } catch (error) {
                console.error('Error fetching next serial:', error);
            }
        };
        fetchNextSerial();
    }, [doctor?.id, selectedChamberId, today]);

    const selectedChamber = useMemo(() =>
        chambers.find(c => c.id === selectedChamberId),
        [chambers, selectedChamberId]);

    const handleSaveReservedCount = async (count: number) => {
        if (!doctor?.id || !selectedChamberId) return;
        setIsSavingReserved(true);
        try {
            const currentSession = queueSession || {
                doctorId: doctor.id,
                hospitalId: selectedChamberId,
                date: today,
                isDoctorArrived: false,
                sessionStatus: 'NOT_STARTED',
                reservedSlotsCount: 0,
                meta: DEFAULT_SESSION_META
            };

            const updatedSession = { ...currentSession, reservedSlotsCount: count };
            await upsertQueueSession(updatedSession);
            setQueueSession(updatedSession);
            setReservedSlotsCount(count);
        } catch (error) {
            console.error('Error saving reserved count:', error);
        } finally {
            setIsSavingReserved(false);
        }
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!doctor || !selectedChamber || !formData.name || !formData.phone) return;

        // Capacity Guard
        const maxCapacity = selectedChamber.dailyBookingLimit || 30;
        const availableMax = maxCapacity - reservedSlotsCount;
        const requestedSerial = parseInt(formData.serialNumber) || 1;

        if (requestedSerial > maxCapacity) {
            alert(`This chamber has a total limit of ${maxCapacity} patients.`);
            return;
        }
        try {
            const finalSerial = parseInt(formData.serialNumber) || 1;

            // Duplicate Check
            const existingApps = await fetchAppointments({
                doctorId: doctor.id,
                hospitalId: selectedChamber.id,
                date: today
            });
            const isTaken = existingApps.some(a => Number(a.serialNumber) === finalSerial && a.status !== 'cancelled');
            if (isTaken) {
                alert(`Serial #${finalSerial} is already assigned to another patient. Please choose a different number.`);
                setIsSubmitting(false);
                return;
            }

            const newApp: Appointment = {
                id: `app-manual-${Date.now()}`,
                patientId: `p-manual-${Date.now()}`,
                patientName: formData.name,
                patientPhone: formData.phone,
                patientAge: parseInt(formData.age) || undefined,
                patientGender: formData.gender,
                doctorId: doctor.id,
                doctorName: doctor.name || 'Doctor',
                hospitalId: selectedChamber.id,
                hospitalName: selectedChamber.hospitalName,
                chamberName: selectedChamber.hospitalName,
                chamberLocation: selectedChamber.address,
                fee: selectedChamber.feeNormal,
                date: today,
                time: 'Walk-in',
                status: 'waiting',
                serialNumber: finalSerial,
                isReserved: false,
                isVisibleToPatient: true,
                hasPrescription: false,
                cancelledAt: null,
                completedAt: null,
                arrivalTime: Date.now(),
                consultationStartTime: null,
                consultationEndTime: null
            };

            await upsertAppointment(newApp);

            setSuccessMessage(true);
            // Refresh serial for next entry
            const nextSerial = finalSerial + 1;
            setFormData({ name: '', phone: '', age: '', gender: 'Male', serialNumber: nextSerial.toString() });
            setTimeout(() => setSuccessMessage(false), 3000);
        } catch (error) {
            console.error('Error booking walk-in:', error);
            alert('Failed to register patient. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Registry...</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto px-4 pb-20 pt-2 animate-fade-in transition-all duration-300">
            {/* Top Navigation Row - Ultra Concise */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate('/doctor/dashboard')}
                        className="w-9 h-9 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Manual Enrollment</h1>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry / Walk-in Patient</p>
                    </div>
                </div>

                <div className="bg-teal-50/50 border border-teal-100/30 rounded-xl px-3 py-1.5 flex items-center gap-2 max-w-[150px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0" />
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-tight truncate">
                        {selectedChamber?.hospitalName || "Today's Session"}
                    </span>
                </div>
            </div>

            {/* Reserved Registry Section - Integrated here */}
            <div className="mb-4 bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-slate-50/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                            <UserCheck size={16} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter block leading-none">Reserved Registry</span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Slots at end of capacity</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 p-0.5 bg-white border border-slate-200/40 rounded-full shadow-sm">
                            <button
                                type="button"
                                onClick={() => handleSaveReservedCount(Math.max(0, reservedSlotsCount - 1))}
                                disabled={isSavingReserved}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200/60 rounded-full text-slate-500 hover:text-teal-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Minus size={12} />
                            </button>
                            <div className="px-2 text-center min-w-[32px]">
                                <span className="font-black text-xs text-slate-900 leading-none">{reservedSlotsCount}</span>
                                <span className="text-[8px] font-black text-slate-400 ml-0.5 uppercase tracking-tighter">Slots</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSaveReservedCount(reservedSlotsCount + 1)}
                                disabled={isSavingReserved || (selectedChamber ? reservedSlotsCount >= selectedChamber.dailyBookingLimit : false)}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200/60 rounded-full text-slate-500 hover:text-teal-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Plus size={12} />
                            </button>
                        </div>

                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                            End Serials: <span className="text-teal-600">{(selectedChamber?.dailyBookingLimit || 30) - reservedSlotsCount + 1} - {selectedChamber?.dailyBookingLimit || 30}</span>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleBooking} className="mt-4 space-y-3">
                <div className="bg-white rounded-[2rem] border border-slate-200/50 shadow-[0_10px_30px_rgba(0,0,0,0.02)] p-6 md:p-8">
                    {/* Visible & Editable Serial Number - Moved to Top */}
                    <div className="mb-6">
                        <div className="bg-teal-50/30 rounded-2xl p-4 border border-teal-100/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="block text-[11px] font-black text-teal-700 uppercase tracking-[0.2em]">Serial</label>
                                    <p className="text-[8px] font-bold text-slate-400 tracking-tight leading-none italic">Assigned automatically (Editable)</p>
                                </div>
                                <div className="relative group w-20">
                                    <input
                                        type="number"
                                        value={formData.serialNumber}
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-teal-100 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none font-black text-teal-600 text-center text-base transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-3">Patient Particulars</h3>

                    <div className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 outline-none font-bold text-slate-800 text-sm transition-all placeholder:text-slate-300"
                                    placeholder="Enter patient name"
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={16} />
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 outline-none font-bold text-slate-800 text-sm transition-all placeholder:text-slate-300"
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Age */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Age</label>
                                <div className="relative group">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={14} />
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full pl-11 px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-teal-500/30 focus:ring-4 focus:ring-teal-500/5 outline-none font-bold text-slate-800 text-sm transition-all placeholder:text-slate-200"
                                        placeholder="Enter age"
                                    />
                                </div>
                            </div>

                            {/* Gender Selection */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Gender</label>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    {['Male', 'Female'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: g as Gender })}
                                            className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${formData.gender === g
                                                ? 'bg-white text-teal-600 shadow-sm'
                                                : 'text-slate-400'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-base shadow-xl shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                ENROLLING...
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                COMPLETE REGISTRY
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {successMessage && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 shadow-2xl">
                    <CheckCircle2 size={18} className="text-teal-400" />
                    <div className="flex flex-col">
                        <p className="font-black text-[10px] uppercase tracking-wider leading-none">Registered Successfully</p>
                        <p className="text-[8px] font-bold opacity-60 mt-1 uppercase">Added to Queue</p>
                    </div>
                </div>
            )}
        </div>
    );
};
