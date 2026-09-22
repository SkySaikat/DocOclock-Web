import React, { useState, useEffect } from 'react';
import { Doctor, Chamber, UserRole, Relationship, Appointment } from '../../types';
import { Button } from '../../components/ui/Button';
import { MapPin, Clock, Calendar, ArrowLeft, Star, GraduationCap, AlertCircle, CheckCircle, X, ChevronRight, Briefcase, Award, Users, Send, Loader2 } from 'lucide-react';
import { getCurrentSession, bookAppointment, fetchDoctorReviews, submitDoctorReview, createNotification } from '../../storage';
import { ChamberCard } from '../../components/ui/ChamberCard';
import { validateBooking } from '../../utils/bookingUtils';
import { getLocalISODate, getWeekdayNumber } from '../../utils/date';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

interface DoctorProfileProps {
  doctor?: Doctor;
  doctorId?: string;
  onBack: () => void;
  onBookSuccess: () => void;
  userRole?: UserRole;
  onLoginRequest: () => void;
  onNavigate?: (path: string) => void;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({ doctor: initialDoctor, doctorId, onBack, onBookSuccess, userRole, onLoginRequest, onNavigate }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(initialDoctor || null);
  const [activeTab, setActiveTab] = useState<'About' | 'Availability' | 'Experience' | 'Education' | 'Reviews'>('About');
  const { autoSync, isConnected: calConnected } = useGoogleCalendar();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [confirmedApp, setConfirmedApp] = useState<Appointment | null>(null);
  const [bookingStep, setBookingStep] = useState(1);

  const [chambers, setChambers] = useState<any[]>([]);
  const [isLoadingChambers, setIsLoadingChambers] = useState(true);

  useEffect(() => {
    const fetchDoctorById = async () => {
      if (initialDoctor) {
        setDoctor(initialDoctor);
        return;
      }
      if (!doctorId) return;

      try {
        const { supabase } = await import('../../supabase');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', doctorId)
          .single();
        
        if (error) throw error;
        if (data) setDoctor({ ...data, name: (data as any).full_name || (data as any).name || '' } as any);
      } catch (err) {
        console.error('Error fetching doctor by ID:', err);
      }
    };
    fetchDoctorById();
  }, [initialDoctor, doctorId]);

  useEffect(() => {
    const loadChambers = async () => {
      if (!doctor?.id) return;
      setIsLoadingChambers(true);
      try {
        const { fetchDoctorChambers } = await import('../../storage');
        const data = await fetchDoctorChambers(doctor.id);
        setChambers(data);
      } catch (error) {
        console.error('Error loading chambers:', error);
      } finally {
        setIsLoadingChambers(false);
      }
    };
    loadChambers();
  }, [doctor?.id]);

  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [availableChambers, setAvailableChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);

  const session = getCurrentSession();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(session?.id || '');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ name: '', gender: 'Male' as const, relationship: 'Other' as Relationship });

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Time slot & visit details
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ serial: number; time: string } | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [visitType, setVisitType] = useState('new_patient');
  const [takenSerials, setTakenSerials] = useState<Set<number>>(new Set());

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (activeTab === 'Reviews' && doctor?.id) {
      fetchDoctorReviews(doctor.id).then(setReviews);
    }
  }, [activeTab, doctor?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (selectedDate && isBookingModalOpen) {
      const dayNumeric = getWeekdayNumber(selectedDate);
      const matches = chambers.filter(c => c.scheduleDays?.includes(dayNumeric) || c.schedule.some(s => s.day === dayNumeric));
      setAvailableChambers(matches as any);

      if (selectedChamber && !matches.some(m => m.id === selectedChamber.id)) {
        setSelectedChamber(null);
      } else if (matches.length === 1 && !selectedChamber) {
        setSelectedChamber(matches[0] as any);
      }
    }
  }, [selectedDate, chambers, isBookingModalOpen]);

  // Fetch taken serials when chamber + date change (for time slot picker)
  useEffect(() => {
    if (!selectedChamber || !selectedDate) return;
    import('../../storage').then(({ fetchAppointments }) => {
      fetchAppointments({ doctorId: doctor?.id, hospitalId: selectedChamber.id, date: selectedDate })
        .then((apps: any[]) => {
          const active = apps.filter((a: any) => a.status !== 'cancelled');
          setTakenSerials(new Set(active.map((a: any) => a.serialNumber)));
        })
        .catch(() => {});
    });
    setSelectedTimeSlot(null);
  }, [selectedChamber?.id, selectedDate]);

  const handleBookClick = () => {
    if (userRole === UserRole.PATIENT) {
      setBookingStep(1);
      setConfirmedApp(null);
      setIsBookingModalOpen(true);
    } else {
      onLoginRequest();
    }
  };

  const BOOKING_STEPS = [
    { label: 'Hospital', icon: '/assets/figma/booking-icon-hospital.svg' },
    { label: 'Appointment', icon: '/assets/figma/booking-icon-appointment.svg' },
    { label: 'Patient Details', icon: '/assets/figma/booking-icon-patient.svg' },
    { label: 'Review And Confirm', icon: '/assets/figma/booking-icon-patient.svg' },
  ];

  const canAdvanceFromStep = (step: number) => {
    if (step === 1) return !!selectedChamber;
    if (step === 3) return !isAddingNew || newPatientData.name.trim().length > 0;
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!selectedChamber || !selectedDate || !session) return;
    setIsBooking(true);
    setBookingError(null);

    try {
      const validation = await validateBooking({
        doctorId: doctor.id,
        chamberId: selectedChamber.id,
        selectedDate
      });

      if (!validation.success) {
        setBookingError(validation.reason || 'UNKNOWN');
        return;
      }

      const familySuffix = session.id.includes('-') ? session.id.split('-')[1] : session.id;
      const finalPatientId = isAddingNew ? `family-${familySuffix}-${Date.now()}` : session.id;
      const appointmentTime = selectedTimeSlot?.time || (selectedChamber as any).schedule[0]?.startTime || 'N/A';

      const doctorName = doctor.name || (doctor as any).full_name || '';
      const newApp = await bookAppointment(
        doctor.id,
        doctorName,
        selectedChamber.id,
        (selectedChamber as any).hospitalName || '',
        (selectedChamber as any).address || '',
        (selectedChamber as any).feeNormal || 0,
        selectedDate,
        appointmentTime,
        finalPatientId,
        isAddingNew ? newPatientData.name : session.name,
        session.phone || '',
        {
          preferredSerial: selectedTimeSlot?.serial,
          chiefComplaint: chiefComplaint || undefined,
          visitType: visitType || undefined,
        }
      );

      // Sync to patient's Google Calendar if connected (non-blocking)
      if (newApp && calConnected) {
        autoSync([{
          id: newApp.id,
          patientName: isAddingNew ? newPatientData.name : session.name,
          patientEmail: session.email,
          date: selectedDate,
          time: appointmentTime,
          chamberName: (selectedChamber as any).hospitalName || '',
          chamberLocation: (selectedChamber as any).address || '',
          fee: (selectedChamber as any).feeNormal || 0,
          serialNumber: newApp.serialNumber || 0,
        }]);
      }

      // Fire-and-forget notifications
      const patientId = isAddingNew ? null : session?.id;
      const chamberName = (selectedChamber as any).hospitalName || 'the clinic';
      if (patientId) {
        createNotification({
          recipient_id: patientId,
          title: 'Appointment Confirmed',
          body: `Serial #${newApp.serialNumber} with Dr. ${doctorName} on ${selectedDate} at ${chamberName}.`,
          type: 'appointment_booked',
          link: '/patient/appointments',
          metadata: { appointment_id: newApp.id, doctor_id: doctor.id },
        });
      }
      if (doctor.id) {
        createNotification({
          recipient_id: doctor.id,
          title: 'New Appointment Booked',
          body: `${isAddingNew ? newPatientData?.name || 'A patient' : session?.name || 'A patient'} booked on ${selectedDate}.`,
          type: 'appointment_booked',
          link: '/doctor/serial-manager',
          metadata: { appointment_id: newApp.id },
        });
      }

      setConfirmedApp(newApp);
    } catch (err: any) {
      setBookingError(err.message || 'UNKNOWN');
    } finally {
      setIsBooking(false);
    }
  };

  const getBookingErrorMessage = (reason: string) => {
    switch (reason) {
      case "LIMIT_REACHED":
        return "Booking limit reached for this date. Please try another day.";
      case "NO_SCHEDULE":
        return "Doctor is not available at this hospital on selected date.";
      case "DOCTOR_OFF":
        return "Doctor is unavailable on selected date.";
      default:
        // Show actual error for non-standard codes (e.g. Supabase column errors)
        return reason && reason.length < 200 ? reason : "Unable to complete booking. Please try again.";
    }
  };

  const finishAndGoToAppointments = () => {
    setIsBookingModalOpen(false);
    if (onNavigate) {
      onNavigate('/patient/appointments');
    } else {
      onBookSuccess();
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-medical-100 border-t-medical-600 rounded-full animate-spin mb-4" />
        <p className="font-bold text-slate-400">Loading Specialist Profile...</p>
      </div>
    );
  }

  const consultFee = chambers[0]?.feeNormal;
  const followUpFee = Math.floor((chambers[0]?.feeNormal || 840) * 0.6);
  const infoRows: [string, React.ReactNode][] = [
    ['BMDC Number', doctor.bmdcNumber || (doctor as any).bmdc_number || '—'],
    ['Specialty', doctor.specialty || '—'],
    ['Consultation Fee', consultFee != null ? <>৳{consultFee} <span className="ml-2 text-content-tertiary">(inc. VAT)</span></> : '—'],
    ['Follow-Up Fee', <>৳{followUpFee} <span className="ml-2 text-content-tertiary">(within 30 days)</span></>],
    ['Experience', `${doctor.experienceYears || (doctor as any).experience_years || 0}+ years`],
    ['Patients Treated', `${doctor.totalPatients || (doctor as any).total_patients || 0}+`],
  ];

  return (
    // Figma doctor detail (601:13524): back title, hero (cover + round portrait + name/verified/rating + stats), tabs, info box | "Get an Appointment" card.
    <div className="mx-auto w-full max-w-[1312px] px-4 pb-32 pt-6 font-display md:px-6 md:pb-12">
      <button onClick={onBack} className="mb-6 flex items-center gap-3 text-[28px] leading-[normal] text-content-primary md:text-ds-h36">
        <ArrowLeft size={30} strokeWidth={1.5} /> Doctor Profile
      </button>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[811px]">
          {/* Hero */}
          <section className="overflow-hidden rounded-ds-lg bg-white">
            <div className="relative h-[220px] md:h-[353px]">
              <img src="/assets/figma/patient-doctors/profile-cover.png" alt="" aria-hidden="true" className="h-[180px] w-full rounded-t-ds-lg object-cover md:h-[297px]" />
              <img
                src={doctor.imageUrl || `https://picsum.photos/400/600?random=${doctor.id}`}
                alt={doctor.name}
                className="absolute bottom-0 left-1/2 size-[140px] -translate-x-1/2 rounded-full border-4 border-white object-cover shadow-ds-pill md:size-[256px]"
              />
            </div>
            <div className="flex flex-col gap-4 p-6 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2 text-ds-title-24 text-content-primary">
                    <span className="truncate">{doctor.name}</span>
                    <img src="/assets/figma/icon-verified.svg" alt="Verified" className="size-7 shrink-0" />
                  </h1>
                  <p className="text-ds-paragraph text-content-secondary">{doctor.degrees || doctor.specialty}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-ds-paragraph text-content-secondary"><Star size={16} className="fill-ink-400 text-ink-400" /> {doctor.rating || 4.8}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-ds-paragraph text-content-secondary">Experience</span>
                  <span className="text-ds-paragraph text-content-primary">{doctor.experienceYears || (doctor as any).experience_years || 0}+</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-ds-paragraph text-content-secondary">Patients</span>
                  <span className="text-ds-paragraph text-content-primary">{doctor.totalPatients || (doctor as any).total_patients || 0}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div role="tablist" className="no-scrollbar flex gap-2 overflow-x-auto px-2">
            {(['About', 'Availability', 'Experience', 'Education', 'Reviews'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap px-4 py-2 text-[14px] transition-colors duration-ds-fast ease-ds-out ${activeTab === tab ? 'text-primary-500' : 'text-content-secondary hover:text-content-primary'}`}
              >
                {tab}
                {activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-500" />}
              </button>
            ))}
          </div>

          {/* Info Box */}
          <section className="flex min-h-[240px] flex-col gap-6 rounded-ds-lg bg-white p-6">
            {activeTab === 'About' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-ds-title-24 text-content-primary">Personal Information</h2>
                  <Users size={22} strokeWidth={1.5} className="text-content-secondary" />
                </div>
                {doctor.about && <p className="text-ds-paragraph leading-relaxed text-content-secondary">{doctor.about}</p>}
                <dl className="flex flex-col gap-4">
                  {infoRows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 text-ds-paragraph">
                      <dt className="text-content-secondary">{k}</dt>
                      <dd className="text-right text-content-secondary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {activeTab === 'Availability' && (
              chambers.length === 0 ? (
                <p className="py-16 text-center text-ds-body text-content-tertiary">No chamber schedule set</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {chambers.map(c => (
                    <ChamberCard
                      key={c.id}
                      chamber={{ hospitalName: c.hospitalName, location: c.address, schedule: c.schedule, fee: c.feeNormal, availableToday: true }}
                      onSelect={handleBookClick}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'Experience' && (
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-500"><Briefcase size={22} /></span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-ds-title-20 text-content-primary">{doctor.specialty}</h3>
                  <p className="text-ds-small text-content-tertiary">Over {doctor.experienceYears || (doctor as any).experience_years || 0} years of practice</p>
                  <p className="text-ds-paragraph leading-relaxed text-content-secondary">
                    Clinical practice focused on {doctor.specialty}, with {doctor.totalPatients || (doctor as any).total_patients || 0}+ patients treated.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'Education' && (
              <div className="flex flex-col gap-3">
                {(doctor.degrees || '').split(',').map(d => d.trim()).filter(Boolean).map((degree, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-[20px] bg-page p-4">
                    <GraduationCap size={18} className="text-primary-500" />
                    <span className="text-ds-paragraph text-content-primary">{degree}</span>
                  </div>
                ))}
                {!doctor.degrees && <p className="text-ds-body text-content-tertiary">No degrees listed.</p>}
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="flex flex-col gap-6">
                {userRole === UserRole.PATIENT && !reviewSubmitted && (
                  <div className="flex flex-col gap-4 rounded-2xl bg-primary-50 p-5">
                    <h4 className="text-ds-title-20 text-content-primary">Leave a Review</h4>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setReviewRating(star)} aria-label={`${star} star${star > 1 ? 's' : ''}`} className="transition-transform duration-ds-fast ease-ds-out hover:scale-110">
                          <Star size={26} className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-ink-300'} />
                        </button>
                      ))}
                      <span className="ml-2 text-ds-body text-content-secondary">{reviewRating}/5</span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Share your experience with this doctor..."
                      className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-ds-body text-content-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                    />
                    <button
                      disabled={submittingReview || !reviewComment.trim()}
                      onClick={async () => {
                        if (!session || !doctor?.id) return;
                        setSubmittingReview(true);
                        try {
                          await submitDoctorReview(doctor.id, session.id, session.name, reviewRating, reviewComment);
                          setReviewSubmitted(true);
                          fetchDoctorReviews(doctor.id).then(setReviews);
                        } catch { }
                        setSubmittingReview(false);
                      }}
                      className="btn-sheen relative flex w-fit items-center gap-2 overflow-hidden rounded-full bg-primary-500 px-5 py-2.5 text-ds-body text-white disabled:opacity-50"
                    >
                      {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Review
                    </button>
                  </div>
                )}
                {reviewSubmitted && (
                  <p className="flex items-center gap-3 rounded-2xl bg-primary-50 p-4 text-ds-body text-primary-700"><CheckCircle size={18} /> Review submitted! Thank you.</p>
                )}
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Star size={30} className="text-ink-300" />
                    <p className="text-ds-body text-content-tertiary">No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reviews.map((r, i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-[20px] bg-page p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center rounded-full bg-primary-100 text-ds-small text-primary-700">{r.patient_name?.charAt(0) || 'P'}</span>
                            <span className="text-ds-body text-content-primary">{r.patient_name || 'Patient'}</span>
                          </span>
                          <span className="flex">
                            {[1, 2, 3, 4, 5].map(st => <Star key={st} size={14} className={st <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-300'} />)}
                          </span>
                        </div>
                        <p className="text-ds-body leading-relaxed text-content-secondary">{r.comment}</p>
                        <p className="text-ds-small text-content-tertiary">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* "Get an Appointment" card (349) */}
        <aside className="hidden w-[349px] shrink-0 flex-col gap-6 rounded-ds-lg bg-white p-6 lg:mt-7 lg:flex">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-ds-title-24 text-content-primary">Get an Appointment</h2>
            <button onClick={handleBookClick} aria-label="Book an appointment" className="btn-sheen relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-500 text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="mt-20 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-ds-body text-content-secondary"><Calendar size={14} /> Consultation Fee</span>
              <span className="text-ds-title-24 text-content-primary">{consultFee != null ? `BDT ${consultFee}` : '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-ds-body text-content-secondary"><Clock size={14} /> Average Duration</span>
              <span className="text-ds-title-24 text-content-primary">12-15 minutes</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Phone: sticky booking CTA (the side card is desktop-only) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(90px+env(safe-area-inset-bottom))] z-50 px-4 lg:hidden">
        <button onClick={handleBookClick} className="btn-sheen pointer-events-auto relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary-500 text-ds-paragraph text-white shadow-ds-rise-lg">
          Get an Appointment <ChevronRight size={20} />
        </button>
      </div>

      {/* BOOKING MODAL — 4-step wizard matching Figma "Get an Appointment" stepper */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[560px] bg-[#fdfdfd] p-0 overflow-hidden relative max-h-[90vh] overflow-y-auto rounded-[20px] shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.08)] animate-fade-in-up">
            {confirmedApp ? (
              <div className="p-10 text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle size={48} />
                </div>
                <h2 className="font-display text-3xl font-black text-ink-800 mb-2 tracking-tight">Booking Confirmed!</h2>
                <p className="text-slate-500 mb-10 font-medium">Your appointment is scheduled with <br /><span className="text-medical-600 font-bold">{doctor.name}</span></p>

                <div className="bg-slate-50 rounded-ds-xl p-10 mb-10 border border-slate-100 flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Your Serial No.</p>
                  <p className="font-stat text-7xl font-black text-ink-800 leading-none">#{confirmedApp.serialNumber ?? "-"}</p>
                </div>

                <Button fullWidth className="h-14 text-sm font-black uppercase tracking-widest" onClick={finishAndGoToAppointments}>View My Schedule</Button>
              </div>
            ) : (
              <>
                {/* Blue header banner — exact Figma treatment */}
                <div className="bg-medical-500 relative overflow-hidden pt-9 pb-[68px] px-7">
                  <img src="/assets/figma/booking-vector25.svg" alt="" className="absolute -top-2 right-6 w-24 opacity-90 pointer-events-none" />
                  <img src="/assets/figma/booking-vector26.svg" alt="" className="absolute top-8 right-24 w-16 opacity-70 pointer-events-none" />
                  <div className="relative flex items-start justify-between">
                    <h3 className="font-sans font-medium text-white text-[28px] sm:text-[32px] tracking-[0.64px] leading-tight max-w-[240px]">Get an Appointment</h3>
                    <button onClick={() => setIsBookingModalOpen(false)} className="w-10 h-10 bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center rounded-full shrink-0" aria-label="Close"><X size={18} className="text-white" /></button>
                  </div>
                </div>

                {/* Floating stepper card */}
                <div className="mx-3.5 -mt-14 relative bg-medical-50 border-8 border-white rounded-[20px] py-6 px-4 sm:px-6 shadow-[0px_8px_20px_rgb(var(--color-primary-700)_/_8%)]">
                  <div className="flex items-center w-full">
                    {BOOKING_STEPS.map((step, i) => {
                      const idx = i + 1;
                      const isActive = idx === bookingStep;
                      const isDone = idx < bookingStep;
                      const isOn = isActive || isDone;
                      return (
                        <React.Fragment key={step.label}>
                          {i > 0 && <div className={`flex-1 h-px min-w-[8px] transition-colors duration-500 ${idx <= bookingStep ? 'bg-medical-400' : 'bg-medical-200'}`} />}
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isOn ? 'bg-medical-400 shadow-[0_0_0_4px_rgb(var(--color-primary-400)_/_15%)]' : 'bg-white border border-medical-200'} ${isActive ? 'scale-110' : ''}`}>
                              <img src={step.icon} alt="" className={`w-4 h-4 ${isOn ? 'brightness-0 invert' : 'opacity-50'}`} />
                            </div>
                            <p className={`text-[10px] sm:text-[12px] font-medium text-center leading-tight max-w-[74px] transition-colors duration-300 ${isOn ? 'text-medical-400' : 'text-[#96a7b8]'}`}>{step.label}</p>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* STEP BODY */}
                <div className="p-6 sm:p-7 space-y-6 min-h-[240px]">
                  {bookingStep === 1 && (
                    <div className="space-y-6 animate-fade-in-up">
                      <div className="space-y-2.5">
                        <p className="font-sans text-[15px] text-[#171717]">Choose Date</p>
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium text-[#171717] outline-none focus:ring-2 ring-medical-400/30 transition-all cursor-pointer" />
                      </div>

                      {selectedDate && (
                        <div className="space-y-2.5 animate-fade-in-up">
                          <p className="font-sans text-[15px] text-[#171717]">Choose Hospital</p>
                          {availableChambers.length === 0 ? (
                            <div className="bg-rose-50 p-5 rounded-[8px] border border-rose-100 flex items-center gap-3 text-rose-600">
                              <AlertCircle size={20} className="shrink-0" />
                              <p className="text-sm font-bold">Specialist not available on this date.</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {availableChambers.map((c: any) => (
                                <button
                                  key={c.id}
                                  onClick={() => setSelectedChamber(c)}
                                  className={`w-full text-left bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 flex items-center justify-between transition-all ${selectedChamber?.id === c.id ? 'ring-2 ring-medical-400' : 'hover:ring-1 ring-medical-200'}`}
                                >
                                  <div>
                                    <h4 className="font-semibold text-[#171717] text-[14px]">{c.hospitalName}</h4>
                                    <p className="text-[12px] text-[#909090] mt-0.5">{c.schedule[0]?.startTime} - {c.schedule[0]?.endTime}</p>
                                  </div>
                                  <span className="text-[15px] font-semibold text-medical-500 shrink-0">৳ {c.feeNormal}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {bookingStep === 2 && selectedChamber && (
                    <div className="space-y-6 animate-fade-in-up">
                      <div className="flex items-center justify-between bg-medical-50 rounded-[8px] px-4 py-3">
                        <span className="text-[13px] font-medium text-[#171717]">{(selectedChamber as any).hospitalName}</span>
                        <span className="text-[12px] text-[#909090]">{selectedDate}</span>
                      </div>
                      {(selectedChamber as any).consultationDurationMinutes > 0 ? (() => {
                        const dur = (selectedChamber as any).consultationDurationMinutes as number;
                        const startTime: string = (selectedChamber as any).schedule[0]?.startTime || '09:00';
                        const endTime: string = (selectedChamber as any).schedule[0]?.endTime || '17:00';
                        const limit: number = (selectedChamber as any).dailyBookingLimit || 20;
                        const [startH, startM] = startTime.split(':').map(Number);
                        const [endH, endM] = endTime.split(':').map(Number);
                        const totalMins = (endH * 60 + endM) - (startH * 60 + startM);
                        const maxSlots = Math.min(limit, Math.floor(totalMins / dur));
                        const slots = Array.from({ length: maxSlots }, (_, i) => {
                          const totalOffset = startH * 60 + startM + i * dur;
                          const h = Math.floor(totalOffset / 60);
                          const m = totalOffset % 60;
                          const period = h >= 12 ? 'PM' : 'AM';
                          const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                          return { serial: i + 1, time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, label: `${h12}:${String(m).padStart(2,'0')} ${period}` };
                        });
                        return (
                          <div className="space-y-2.5">
                            <p className="font-sans text-[15px] text-[#171717]">Choose Time Slot</p>
                            <div className="grid grid-cols-3 gap-2">
                              {slots.map(slot => {
                                const taken = takenSerials.has(slot.serial);
                                const selected = selectedTimeSlot?.serial === slot.serial;
                                return (
                                  <button
                                    key={slot.serial}
                                    disabled={taken}
                                    onClick={() => setSelectedTimeSlot(selected ? null : slot)}
                                    className={`p-3 rounded-[8px] text-center transition-all ${taken ? 'bg-slate-50 opacity-40 cursor-not-allowed' : selected ? 'bg-medical-100 ring-2 ring-medical-500 text-medical-500' : 'bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] hover:ring-1 ring-medical-200 text-[#171717]'}`}
                                  >
                                    <p className="text-xs font-semibold">{slot.label}</p>
                                    <p className="text-[9px] text-[#909090] mt-0.5">#{slot.serial}</p>
                                    {taken && <p className="text-[8px] font-bold text-rose-400 mt-0.5">Taken</p>}
                                  </button>
                                );
                              })}
                            </div>
                            {!selectedTimeSlot && <p className="text-[11px] text-[#909090]">Select a slot to book a specific time, or skip to get the next available serial.</p>}
                          </div>
                        );
                      })() : (
                        <div className="bg-medical-50 rounded-[8px] p-6 text-center">
                          <p className="text-sm font-medium text-[#171717]">You'll be assigned the next available serial</p>
                          <p className="text-[12px] text-[#909090] mt-1">This doctor doesn't use fixed time slots</p>
                        </div>
                      )}
                    </div>
                  )}

                  {bookingStep === 3 && (
                    <div className="space-y-6 animate-fade-in-up">
                      <div className="space-y-2.5">
                        <p className="font-sans text-[15px] text-[#171717]">Who is this appointment for?</p>
                        <select
                          value={isAddingNew ? 'ADD_NEW' : selectedPatientId}
                          onChange={e => {
                            if (e.target.value === 'ADD_NEW') setIsAddingNew(true);
                            else { setIsAddingNew(false); setSelectedPatientId(e.target.value); }
                          }}
                          className="w-full bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium text-[#171717] outline-none"
                        >
                          {session && <option value={session.id}>{session.name} (Self)</option>}
                          <option value="ADD_NEW">+ Family Member</option>
                        </select>
                      </div>

                      {isAddingNew && (
                        <div className="p-5 bg-medical-50 rounded-[12px] space-y-3 animate-fade-in">
                          <input placeholder="Full Name" value={newPatientData.name} onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })} className="w-full bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium outline-none" />
                          <div className="flex gap-2">
                            <select className="flex-1 bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium outline-none" onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value as any })}>
                              <option>Male</option><option>Female</option>
                            </select>
                            <select className="flex-1 bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium outline-none" onChange={e => setNewPatientData({ ...newPatientData, relationship: e.target.value as any })}>
                              <option>Child</option><option>Spouse</option><option>Parent</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <p className="font-sans text-[15px] text-[#171717]">Visit Type</p>
                        <select value={visitType} onChange={e => setVisitType(e.target.value)} className="w-full bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium text-[#171717] outline-none">
                          <option value="new_patient">New Patient</option>
                          <option value="follow_up">Follow-up</option>
                          <option value="report_discussion">Report Discussion</option>
                          <option value="chronic_condition">Chronic Condition</option>
                          <option value="emergency">Emergency</option>
                        </select>
                      </div>
                      <div className="space-y-2.5">
                        <p className="font-sans text-[15px] text-[#171717]">Chief Complaint <span className="text-[#909090] text-[12px]">(optional)</span></p>
                        <textarea rows={2} placeholder="e.g. Chest pain, shortness of breath..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} className="w-full px-4 py-3 bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] text-sm font-medium text-[#171717] outline-none resize-none focus:ring-2 ring-medical-400/30 transition-all" />
                      </div>
                    </div>
                  )}

                  {bookingStep === 4 && selectedChamber && (
                    <div className="space-y-5 animate-fade-in-up">
                      <p className="font-sans text-[15px] text-[#171717] mb-1">Review And Confirm</p>
                      <div className="bg-medical-50 rounded-[16px] p-5 space-y-3.5">
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Doctor</span><span className="font-semibold text-[#171717] text-[13px]">{doctor.name}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Hospital</span><span className="font-semibold text-[#171717] text-[13px]">{(selectedChamber as any).hospitalName}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Date</span><span className="font-semibold text-[#171717] text-[13px]">{selectedDate}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Patient</span><span className="font-semibold text-[#171717] text-[13px]">{isAddingNew ? newPatientData.name || '—' : session?.name}</span></div>
                        {selectedTimeSlot && <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Time Slot</span><span className="font-semibold text-medical-500 text-[13px]">{selectedTimeSlot.time} · Serial #{selectedTimeSlot.serial}</span></div>}
                        <div className="border-t border-medical-200 pt-3.5 flex justify-between items-center"><span className="text-[13px] font-semibold text-[#171717]">Amount to Pay</span><span className="text-xl font-bold text-medical-500">৳ {(selectedChamber as any).feeNormal}</span></div>
                      </div>

                      {bookingError && (
                        <div className="p-4 bg-rose-50 rounded-[12px] border border-rose-100 text-rose-600 flex items-center gap-3 animate-shake">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="text-[11px] sm:text-sm font-bold">{getBookingErrorMessage(bookingError)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer — exact Figma pill buttons */}
                <div className="flex gap-2 items-center p-4">
                  <button
                    onClick={() => bookingStep === 1 ? setIsBookingModalOpen(false) : setBookingStep(s => s - 1)}
                    className="bg-white hover:bg-slate-50 border border-[#eee] flex items-center justify-center rounded-full shrink-0 w-[110px] h-12 text-[15px] text-[#202020] font-medium transition-colors active:scale-[0.98]"
                  >
                    {bookingStep === 1 ? 'Cancel' : 'Back'}
                  </button>
                  <button
                    onClick={() => bookingStep === 4 ? handleConfirmBooking() : (canAdvanceFromStep(bookingStep) && setBookingStep(s => s + 1))}
                    disabled={!canAdvanceFromStep(bookingStep) || (bookingStep === 4 && isBooking)}
                    className="bg-medical-500 hover:bg-medical-600 flex-1 min-w-0 flex items-center justify-center gap-2 rounded-full h-12 text-[15px] text-white font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {bookingStep === 4 && isBooking && <Loader2 size={16} className="animate-spin" />}
                    {bookingStep === 4 ? (isBooking ? 'Finalizing...' : 'Confirm') : 'Continue'}
                    {bookingStep < 4 && <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
