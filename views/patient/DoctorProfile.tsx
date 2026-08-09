import React, { useState, useEffect } from 'react';
import { Doctor, Chamber, UserRole, Relationship, Appointment } from '../../types';
import { Button } from '../../components/ui/Button';
import { MapPin, Clock, Calendar, ArrowLeft, Star, GraduationCap, AlertCircle, CheckCircle, X, ChevronRight, Briefcase, Award, Users, Heart, Share2, Send, Loader2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-white pb-32 font-sans overflow-x-hidden">
      {/* HEADER NAVIGATION */}
      <div className="max-w-4xl mx-auto px-6 pt-6 flex justify-between items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-900 bg-white shadow-sm hover:bg-slate-50 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-900 bg-white shadow-sm hover:bg-slate-50 transition-all">
            <Heart size={20} />
          </button>
          <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-900 bg-white shadow-sm hover:bg-slate-50 transition-all">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
          {/* Doctor Info Column */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-8 bg-medical-600 rounded-full"></div>
                <span className="text-[10px] font-black text-medical-600 uppercase tracking-widest">{doctor.specialty}</span>
              </div>
              <h1 className="font-display text-2xl md:text-4xl font-black text-ink-800 tracking-tight leading-tight">
                {doctor.name}
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider max-w-md mx-auto md:mx-0 leading-relaxed">
                {doctor.degrees || "MBBS, MD, FCPS (Cardiology), FACC (USA)"}
              </p>
            </div>

            {/* Micro Stats Row - High Spacing Removed */}

            {/* Micro Stats Row */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {[
                { icon: Briefcase, color: "text-medical-500", bg: "bg-medical-50", label: "Experience", val: `${doctor.experienceYears || 12} Years` },
                { icon: Star, color: "text-amber-500", bg: "bg-amber-50", label: "Rating", val: doctor.rating || 4.8 },
                { icon: Users, color: "text-indigo-500", bg: "bg-indigo-50", label: "Patients", val: `${doctor.totalPatients || "2500"}+` }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-100 p-2.5 px-4 rounded-2xl flex items-center gap-3 min-w-[110px] shadow-ds-card hover:border-slate-200 transition-all">
                  <div className={`${stat.bg} ${stat.color} p-1.5 rounded-lg`}>
                    <stat.icon size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-ink-800 leading-none mb-0.5">{stat.val}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Image Column - More compact */}
          <div className="md:w-[280px] shrink-0 relative mt-4 md:mt-0">
            <div className="w-56 h-72 md:w-full md:h-[320px] bg-slate-100 rounded-ds-xl overflow-hidden shadow-xl transition-all duration-700">
              <img
                src={doctor.imageUrl || `https://picsum.photos/400/600?random=${doctor.id}`}
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000"
                alt={doctor.name}
              />
            </div>
            {/* Experience Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 px-6 rounded-ds-lg shadow-premium border border-slate-100 hidden md:flex items-center gap-3">
              <div className="bg-medical-600 p-2 rounded-xl text-white">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-ink-800">Elite Specialist</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Top Tier Verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION - Compact margins */}
        <div className="mt-12 flex gap-1 border-b border-slate-50 overflow-x-auto no-scrollbar py-2">
          {['About', 'Availability', 'Experience', 'Education', 'Reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-black transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-medical-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-medical-600 rounded-full animate-fade-in"></div>
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT Area - Compact margins */}
        <div className="mt-6 min-h-[300px]">
          {activeTab === 'About' && (
            <div className="space-y-12 animate-fade-in-up">
              <div className="space-y-4">
                <p className="text-slate-500 font-medium leading-[1.8] text-lg max-w-2xl">
                  {doctor.about || `${doctor.name} is a board-certified specialist with over ${doctor.experienceYears || 12} years of experience in the field of cardiovascular medicine. He specializes in advanced cardiac imaging and preventive cardiology.`}
                  <button className="text-medical-600 font-black ml-2">...More</button>
                </p>
              </div>

              {/* Key Metrics Grid - Removed Session Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Award, label: "Follow-Up Charge", val: `৳ ${Math.floor((chambers[0]?.feeNormal || 840) * 0.6)}`, sub: "Within 30 days" },
                  { icon: Clock, label: "Avg. Duration", val: "12-15 Minutes" },
                  { icon: Users, label: "Total Cases", val: `${doctor.totalPatients || "2.5k"}+ Treated` }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50/40 border border-slate-100/50 p-4 px-6 rounded-3xl flex items-center gap-4 group hover:bg-white hover:border-medical-100 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-700 shadow-ds-card group-hover:text-medical-600 transition-all">
                      <stat.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-ink-800">{stat.val}</span>
                        {stat.sub && <span className="text-[9px] font-bold text-slate-400">({stat.sub})</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Availability' && (
            <div className="space-y-4 animate-fade-in-up">
              {chambers.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-ds-xl">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Chamber Schedule Set</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chambers.map(c => (
                    <ChamberCard
                      key={c.id}
                      chamber={{
                        hospitalName: c.hospitalName,
                        location: c.address,
                        schedule: c.schedule,
                        fee: c.feeNormal,
                        availableToday: true
                      }}
                      onSelect={handleBookClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Experience' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-medical-50 text-medical-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h4 className="font-display text-lg font-black text-ink-800">Senior Specialist</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Over {doctor.experienceYears || 10} Years of Practice</p>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Extensive experience in clinical practice, specifically focusing on {doctor.specialty}.
                    Managed over {doctor.totalPatients || '2,500'} successful cases with a consistent track record of patient satisfaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Education' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h4 className="font-display text-lg font-black text-ink-800">Academic Background</h4>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Verified Degrees & Certifications</p>
                  <div className="space-y-3">
                    {doctor.degrees?.split(',').map((degree, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-medical-500 rounded-full" />
                        <span className="text-slate-700 font-bold">{degree.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Leave a Review */}
              {userRole === UserRole.PATIENT && !reviewSubmitted && (
                <div className="bg-medical-50/50 border border-medical-100 rounded-ds-lg p-6">
                  <h4 className="font-black text-ink-800 mb-4">Leave a Review</h4>
                  {/* Star rating */}
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-125"
                      >
                        <Star
                          size={28}
                          className={star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-black text-slate-600 self-center">{reviewRating}/5</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Share your experience with this doctor..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none resize-none focus:border-medical-400 transition-all"
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
                    className="mt-3 flex items-center gap-2 px-6 py-2.5 bg-medical-600 text-white text-sm font-black rounded-xl hover:bg-medical-700 transition-all disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit Review
                  </button>
                </div>
              )}
              {reviewSubmitted && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">Review submitted! Thank you.</span>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="py-16 text-center">
                  <Star size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-400">No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-ds-lg p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-medical-100 rounded-xl flex items-center justify-center text-medical-700 font-black text-sm">
                            {r.patient_name?.charAt(0) || 'P'}
                          </div>
                          <span className="font-black text-slate-800 text-sm">{r.patient_name || 'Patient'}</span>
                        </div>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={14} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{r.comment}</p>
                      <p className="text-[10px] text-slate-300 font-bold mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOOKING CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-12 pointer-events-none md:bg-none bg-gradient-to-t from-white via-white/90 to-transparent">
        <div className="max-w-4xl mx-auto flex justify-center md:justify-end">
          <Button
            onClick={handleBookClick}
            className="h-16 px-16 font-black text-lg shadow-2xl shadow-medical-500/50 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-3 group w-full md:w-auto"
          >
            <span>Book Appointment</span>
            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
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
                <div className="bg-[#3988ff] relative overflow-hidden pt-9 pb-[68px] px-7">
                  <img src="/assets/figma/booking-vector25.svg" alt="" className="absolute -top-2 right-6 w-24 opacity-90 pointer-events-none" />
                  <img src="/assets/figma/booking-vector26.svg" alt="" className="absolute top-8 right-24 w-16 opacity-70 pointer-events-none" />
                  <div className="relative flex items-start justify-between">
                    <h3 className="font-sans font-medium text-white text-[28px] sm:text-[32px] tracking-[0.64px] leading-tight max-w-[240px]">Get an Appointment</h3>
                    <button onClick={() => setIsBookingModalOpen(false)} className="w-10 h-10 bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center rounded-full shrink-0" aria-label="Close"><X size={18} className="text-white" /></button>
                  </div>
                </div>

                {/* Floating stepper card */}
                <div className="mx-3.5 -mt-14 relative bg-[#f7faff] border-8 border-white rounded-[20px] py-6 px-4 sm:px-6 shadow-[0px_8px_20px_rgba(30,80,180,0.08)]">
                  <div className="flex items-center w-full">
                    {BOOKING_STEPS.map((step, i) => {
                      const idx = i + 1;
                      const isActive = idx === bookingStep;
                      const isDone = idx < bookingStep;
                      const isOn = isActive || isDone;
                      return (
                        <React.Fragment key={step.label}>
                          {i > 0 && <div className={`flex-1 h-px min-w-[8px] transition-colors duration-500 ${idx <= bookingStep ? 'bg-[#3fa2ff]' : 'bg-[#d7e3f5]'}`} />}
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isOn ? 'bg-[#3fa2ff] shadow-[0_0_0_4px_rgba(63,162,255,0.15)]' : 'bg-white border border-[#e2eaf5]'} ${isActive ? 'scale-110' : ''}`}>
                              <img src={step.icon} alt="" className={`w-4 h-4 ${isOn ? 'brightness-0 invert' : 'opacity-50'}`} />
                            </div>
                            <p className={`text-[10px] sm:text-[12px] font-medium text-center leading-tight max-w-[74px] transition-colors duration-300 ${isOn ? 'text-[#3fa2ff]' : 'text-[#96a7b8]'}`}>{step.label}</p>
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
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 font-medium text-[#171717] outline-none focus:ring-2 ring-[#3fa2ff]/30 transition-all cursor-pointer" />
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
                                  className={`w-full text-left bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] px-4 py-3 flex items-center justify-between transition-all ${selectedChamber?.id === c.id ? 'ring-2 ring-[#3fa2ff]' : 'hover:ring-1 ring-[#d7e3f5]'}`}
                                >
                                  <div>
                                    <h4 className="font-semibold text-[#171717] text-[14px]">{c.hospitalName}</h4>
                                    <p className="text-[12px] text-[#909090] mt-0.5">{c.schedule[0]?.startTime} - {c.schedule[0]?.endTime}</p>
                                  </div>
                                  <span className="text-[15px] font-semibold text-[#2e8cff] shrink-0">৳ {c.feeNormal}</span>
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
                      <div className="flex items-center justify-between bg-[#f7faff] rounded-[8px] px-4 py-3">
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
                                    className={`p-3 rounded-[8px] text-center transition-all ${taken ? 'bg-slate-50 opacity-40 cursor-not-allowed' : selected ? 'bg-[#eaf3ff] ring-2 ring-[#2e8cff] text-[#2e8cff]' : 'bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] hover:ring-1 ring-[#d7e3f5] text-[#171717]'}`}
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
                        <div className="bg-[#f7faff] rounded-[8px] p-6 text-center">
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
                        <div className="p-5 bg-[#f7faff] rounded-[12px] space-y-3 animate-fade-in">
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
                        <textarea rows={2} placeholder="e.g. Chest pain, shortness of breath..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} className="w-full px-4 py-3 bg-white drop-shadow-[0px_0px_0.5px_rgba(0,0,0,0.25)] rounded-[8px] text-sm font-medium text-[#171717] outline-none resize-none focus:ring-2 ring-[#3fa2ff]/30 transition-all" />
                      </div>
                    </div>
                  )}

                  {bookingStep === 4 && selectedChamber && (
                    <div className="space-y-5 animate-fade-in-up">
                      <p className="font-sans text-[15px] text-[#171717] mb-1">Review And Confirm</p>
                      <div className="bg-[#f7faff] rounded-[16px] p-5 space-y-3.5">
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Doctor</span><span className="font-semibold text-[#171717] text-[13px]">{doctor.name}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Hospital</span><span className="font-semibold text-[#171717] text-[13px]">{(selectedChamber as any).hospitalName}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Date</span><span className="font-semibold text-[#171717] text-[13px]">{selectedDate}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Patient</span><span className="font-semibold text-[#171717] text-[13px]">{isAddingNew ? newPatientData.name || '—' : session?.name}</span></div>
                        {selectedTimeSlot && <div className="flex justify-between items-center"><span className="text-[12px] text-[#909090]">Time Slot</span><span className="font-semibold text-[#2e8cff] text-[13px]">{selectedTimeSlot.time} · Serial #{selectedTimeSlot.serial}</span></div>}
                        <div className="border-t border-[#e2eaf5] pt-3.5 flex justify-between items-center"><span className="text-[13px] font-semibold text-[#171717]">Amount to Pay</span><span className="text-xl font-bold text-[#2e8cff]">৳ {(selectedChamber as any).feeNormal}</span></div>
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
                    className="bg-[#2e8cff] hover:bg-[#2478e8] flex-1 min-w-0 flex items-center justify-center gap-2 rounded-full h-12 text-[15px] text-white font-medium transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
