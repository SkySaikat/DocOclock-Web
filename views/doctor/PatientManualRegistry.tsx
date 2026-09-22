import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Gender } from '../../types';
import { Loader2, Minus, Plus, X, CalendarCheck, UserSquare, FileText, ChevronDown } from 'lucide-react';
import { DashboardButton, MaskIcon } from '../../components/dashboard';
import { useToast } from '../../components/ToastProvider';
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
    const { showToast } = useToast();
    // Figma "Book an appointment" (255:12870 → 255:13068 → 255:14107): Appointment → Patient Details → Reserved slot / serial.
    const [step, setStep] = useState<0 | 1 | 2>(0);
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
            showToast(`This chamber has a total limit of ${maxCapacity} patients.`, 'warning');
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
                showToast(`Serial #${finalSerial} is already assigned to another patient. Please choose a different number.`, 'warning');
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
            showToast(`${formData.name} registered as serial #${finalSerial} and added to today's queue.`, 'success');
            setStep(0);
            // Refresh serial for next entry
            const nextSerial = finalSerial + 1;
            setFormData({ name: '', phone: '', age: '', gender: 'Male', serialNumber: nextSerial.toString() });
            setTimeout(() => setSuccessMessage(false), 3000);
        } catch (error) {
            console.error('Error booking walk-in:', error);
            showToast('Failed to register patient. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeTo = () => onNavigate('/doctor/appointments');
    const maxCapacity = selectedChamber?.dailyBookingLimit || 30;
    const canNext = step === 0 ? !!selectedChamber : step === 1 ? !!formData.name && !!formData.phone : true;

    return (
        // Rendered as Figma's centred booking modal (612 wide) on the page; the route stays /doctor/manual-booking.
        <div className="flex animate-fade-in justify-center py-4 font-display md:py-10">
            <form
                onSubmit={step === 2 ? handleBooking : (e) => { e.preventDefault(); if (canNext) setStep((step + 1) as 1 | 2); }}
                className="flex w-full max-w-[612px] flex-col gap-6 rounded-ds-xl bg-white p-6 shadow-ds-modal md:p-6"
                aria-labelledby="book-title"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 id="book-title" className="text-ds-title-24 text-content-primary">Book an appointment</h1>
                        <p className="text-ds-body text-content-secondary">Walk-in patients join today's queue as soon as you confirm.</p>
                    </div>
                    <button type="button" onClick={closeTo} aria-label="Close" className="grid size-9 shrink-0 place-items-center rounded-full text-content-secondary transition-colors duration-ds-fast ease-ds-out hover:text-[#ed7272]"><X size={22} /></button>
                </div>

                <BookSteps step={step} />

                {isLoading ? (
                    <div className="flex min-h-[160px] items-center justify-center gap-3 text-ds-body text-content-tertiary">
                        <Loader2 className="size-5 animate-spin text-primary-500" /> Loading chambers...
                    </div>
                ) : step === 0 ? (
                    <div className="flex flex-col gap-4">
                        <Field label="Choose Hospital">
                            <Select value={selectedChamberId} onChange={setSelectedChamberId} placeholder="Select Hospital"
                                options={chambers.map(c => ({ value: c.id, label: c.hospitalName }))} />
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Choose Date">
                                <div className={`${FIELD} flex items-center text-content-secondary`}>{new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</div>
                            </Field>
                            <Field label="Session Type">
                                <div className={`${FIELD} flex items-center text-content-secondary`}>Walk-in</div>
                            </Field>
                        </div>
                    </div>
                ) : step === 1 ? (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                        <Field label="Name">
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={FIELD} placeholder="Enter patient name" />
                        </Field>
                        <Field label="Age">
                            <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className={FIELD} placeholder="Enter Age" />
                        </Field>
                        <Field label="Gender">
                            <Select value={formData.gender} onChange={v => setFormData({ ...formData, gender: v as Gender })} options={['Male', 'Female'].map(g => ({ value: g, label: g }))} />
                        </Field>
                        <div />
                        <div className="col-span-2">
                            <Field label="Phone Number">
                                <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`${FIELD} border border-ink-100 bg-white`} placeholder="01XXXXXXXXX" />
                            </Field>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <Field label="Reserved Slot">
                            <div className={`${FIELD} flex items-center justify-between`}>
                                <span className="text-content-secondary">{reservedSlotsCount} reserved · serials {maxCapacity - reservedSlotsCount + 1}–{maxCapacity}</span>
                                <span className="flex items-center gap-1">
                                    <button type="button" aria-label="Fewer reserved slots" onClick={() => handleSaveReservedCount(Math.max(0, reservedSlotsCount - 1))} disabled={isSavingReserved}
                                        className="grid size-7 place-items-center rounded-full bg-white text-content-secondary disabled:opacity-50"><Minus size={12} /></button>
                                    <button type="button" aria-label="More reserved slots" onClick={() => handleSaveReservedCount(reservedSlotsCount + 1)} disabled={isSavingReserved || (selectedChamber ? reservedSlotsCount >= selectedChamber.dailyBookingLimit : false)}
                                        className="grid size-7 place-items-center rounded-full bg-white text-content-secondary disabled:opacity-50"><Plus size={12} /></button>
                                </span>
                            </div>
                        </Field>
                        <Field label="Slot No">
                            <input type="number" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} className={FIELD} aria-describedby="slot-hint" />
                            <span id="slot-hint" className="text-ds-small text-content-tertiary">Assigned automatically — you can change it.</span>
                        </Field>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {step > 0 && <DashboardButton type="button" variant="secondary" icon={false} onClick={() => setStep((step - 1) as 0 | 1)} className="flex-1 px-4">Back</DashboardButton>}
                    <DashboardButton type="submit" variant="primary" icon={false} disabled={!canNext || isSubmitting || isLoading} className={`${step > 0 ? 'flex-[2]' : 'w-full'} px-4`}>
                        {step < 2 ? 'Next' : isSubmitting ? 'Registering...' : 'Confirm'}
                    </DashboardButton>
                </div>
            </form>
        </div>
    );
};

const FIELD = 'h-[43px] w-full rounded-2xl bg-ink-50 px-3 text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="flex min-w-0 flex-col gap-3">
        <span className="text-ds-paragraph text-content-secondary">{label}</span>
        {children}
    </label>
);

const Select: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }> = ({ value, onChange, options, placeholder }) => (
    <span className="relative block">
        <select value={value} onChange={e => onChange(e.target.value)} className={`${FIELD} appearance-none pr-10`}>
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-[12px] text-content-secondary" />
    </span>
);

// Step header: three labelled tabs over an 8px track filled up to the current step (same motif as the prescription wizard).
const BOOK_STEPS = [
    { label: 'Appointment', Icon: CalendarCheck },
    { label: 'Patient Details', Icon: UserSquare },
    { label: 'Review And Confirm', Icon: FileText },
] as const;
const BookSteps: React.FC<{ step: 0 | 1 | 2 }> = ({ step }) => {
    const pct = step === 0 ? 12.5 : step === 1 ? 39.5 : 79;
    return (
        <div className="flex flex-col gap-3" aria-label={`Step ${step + 1} of 3`}>
            <div className="flex justify-between gap-2">
                {BOOK_STEPS.map(({ label, Icon }, i) => (
                    <span key={label} aria-current={i === step ? 'step' : undefined} className={`flex items-center gap-1.5 text-ds-small ${i <= step ? 'text-primary-500' : 'text-content-secondary'}`}>
                        <Icon size={16} strokeWidth={1.5} /> <span className="max-sm:hidden">{label}</span>
                    </span>
                ))}
            </div>
            <div className="relative h-2 rounded-full bg-primary-50">
                <div className="h-full rounded-full bg-primary-500 transition-[width] duration-ds-slow ease-ds-out" style={{ width: `${pct}%` }} />
                <MaskIcon src="/assets/figma/patient-live-appts/progress-indicator.svg" size={7} className="absolute -top-[9px] -translate-x-1/2 text-primary-500 transition-[left] duration-ds-slow ease-ds-out" style={{ left: `${pct}%` }} />
            </div>
        </div>
    );
};
