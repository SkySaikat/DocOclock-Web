import React, { useState, useEffect } from 'react';
import { Doctor, Chamber, UserRole, Relationship, Appointment } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { MapPin, Clock, Calendar, ArrowLeft, Star, GraduationCap, AlertCircle, CheckCircle, X, ChevronRight, Briefcase, Award, Users, Heart, Share2 } from 'lucide-react';
import { getCurrentSession, bookAppointment } from '../../storage';
import { ChamberCard } from '../../components/ui/ChamberCard';
import { validateBooking } from '../../utils/bookingUtils';
import { getLocalISODate, getWeekdayNumber } from '../../utils/date';

interface DoctorProfileProps {
  doctor: Doctor;
  onBack: () => void;
  onBookSuccess: () => void;
  userRole?: UserRole;
  onLoginRequest: () => void;
  onNavigate?: (path: string) => void;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({ doctor, onBack, onBookSuccess, userRole, onLoginRequest, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'About' | 'Availability' | 'Experience' | 'Education' | 'Reviews'>('About');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [confirmedApp, setConfirmedApp] = useState<Appointment | null>(null);

  const [chambers, setChambers] = useState<any[]>([]);
  const [isLoadingChambers, setIsLoadingChambers] = useState(true);

  useEffect(() => {
    const loadChambers = async () => {
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
  }, [doctor.id]);

  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [availableChambers, setAvailableChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);

  const session = getCurrentSession();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(session?.id || '');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ name: '', gender: 'Male' as const, relationship: 'Other' as Relationship });

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

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

  const handleBookClick = () => {
    if (userRole === UserRole.PATIENT) {
      setIsBookingModalOpen(true);
    } else {
      onLoginRequest();
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedChamber || !selectedDate || !session) return;
    setIsBooking(true);
    setBookingError(null);

    const validation = await validateBooking({
      doctorId: doctor.id,
      chamberId: selectedChamber.id,
      selectedDate
    });

    if (!validation.success) {
      setBookingError(validation.reason || 'UNKNOWN');
      setIsBooking(false);
      return;
    }

    const familySuffix = session.id.includes('-') ? session.id.split('-')[1] : session.id;
    const finalPatientId = isAddingNew ? `family-${familySuffix}-${Date.now()}` : session.id;

    const newApp = await bookAppointment(
      doctor.id,
      doctor.name,
      selectedChamber.id,
      (selectedChamber as any).hospitalName || '',
      (selectedChamber as any).address || '',
      (selectedChamber as any).feeNormal || 0,
      selectedDate,
      (selectedChamber as any).schedule[0]?.startTime || 'N/A',
      finalPatientId,
      isAddingNew ? newPatientData.name : session.name,
      session.phone
    );

    setTimeout(() => {
      setConfirmedApp(newApp);
      setIsBooking(false);
    }, 800);
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
        return "Unable to complete booking. Please try again.";
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
                <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{doctor.specialty}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
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
                { icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50", label: "Experience", val: `${doctor.experienceYears || 12} Years` },
                { icon: Star, color: "text-amber-500", bg: "bg-amber-50", label: "Rating", val: doctor.rating || 4.8 },
                { icon: Users, color: "text-indigo-500", bg: "bg-indigo-50", label: "Patients", val: `${doctor.totalPatients || "2500"}+` }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-100 p-2.5 px-4 rounded-2xl flex items-center gap-3 min-w-[110px] shadow-sm hover:border-slate-200 transition-all">
                  <div className={`${stat.bg} ${stat.color} p-1.5 rounded-lg`}>
                    <stat.icon size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-900 leading-none mb-0.5">{stat.val}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Image Column - More compact */}
          <div className="md:w-[280px] shrink-0 relative mt-4 md:mt-0">
            <div className="w-56 h-72 md:w-full md:h-[320px] bg-slate-100 rounded-[32px] overflow-hidden shadow-xl transition-all duration-700">
              <img
                src={doctor.imageUrl || `https://picsum.photos/400/600?random=${doctor.id}`}
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000"
                alt={doctor.name}
              />
            </div>
            {/* Experience Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 px-6 rounded-[24px] shadow-premium border border-slate-100 hidden md:flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Elite Specialist</p>
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
              className={`px-6 py-3 text-sm font-black transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-fade-in"></div>
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
                  <button className="text-blue-600 font-black ml-2">...More</button>
                </p>
              </div>

              {/* Key Metrics Grid - Removed Session Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Award, label: "Follow-Up Charge", val: `৳ ${Math.floor((chambers[0]?.feeNormal || 840) * 0.6)}`, sub: "Within 30 days" },
                  { icon: Clock, label: "Avg. Duration", val: "12-15 Minutes" },
                  { icon: Users, label: "Total Cases", val: `${doctor.totalPatients || "2.5k"}+ Treated` }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50/40 border border-slate-100/50 p-4 px-6 rounded-3xl flex items-center gap-4 group hover:bg-white hover:border-blue-100 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm group-hover:text-blue-600 transition-all">
                      <stat.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{stat.val}</span>
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
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[48px]">
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

          {(activeTab === 'Experience' || activeTab === 'Education' || activeTab === 'Reviews') && (
            <div className="py-20 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Section Empty</h3>
              <p className="text-slate-400 font-bold mt-2">The doctor hasn't uploaded these details yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOOKING CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-12 pointer-events-none md:bg-none bg-gradient-to-t from-white via-white/90 to-transparent">
        <div className="max-w-4xl mx-auto flex justify-center md:justify-end">
          <Button
            onClick={handleBookClick}
            className="h-16 px-16 rounded-[28px] bg-blue-600 text-white font-black text-lg shadow-2xl shadow-blue-500/50 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-3 group w-full md:w-auto shadow-blue-200"
          >
            <span>Book Appointment</span>
            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </div>

      {/* BOOKING MODAL (STAYS SAME LOGIC) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg bg-white p-0 overflow-hidden relative max-h-[90vh] overflow-y-auto rounded-[40px]">
            {confirmedApp ? (
              <div className="p-10 text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Booking Confirmed!</h2>
                <p className="text-slate-500 mb-10 font-medium">Your appointment is scheduled with <br /><span className="text-blue-600 font-bold">{doctor.name}</span></p>

                <div className="bg-slate-50 rounded-[2.5rem] p-10 mb-10 border border-slate-100 flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Your Serial No.</p>
                  <p className="text-7xl font-black text-slate-900 leading-none">#{confirmedApp.serialNumber ?? "-"}</p>
                </div>

                <Button fullWidth className="h-14 text-sm font-black uppercase tracking-widest bg-slate-900" onClick={finishAndGoToAppointments}>View My Schedule</Button>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 p-8 text-white relative flex justify-between items-center">
                  <div>
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Clinic Booking</h3>
                    <h3 className="text-2xl font-black tracking-tight leading-none">Secure Today's Slot</h3>
                  </div>
                  <button onClick={() => setIsBookingModalOpen(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center rounded-xl"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Date</label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-slate-900 outline-none focus:ring-2 ring-blue-500/20 transition-all cursor-pointer" />
                  </div>

                  {selectedDate && (
                    <div className="space-y-4 animate-fade-in-up">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Hospital</label>
                      {availableChambers.length === 0 ? (
                        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex items-center gap-4 text-rose-600">
                          <AlertCircle size={24} className="shrink-0" />
                          <p className="text-sm font-black">Specialist not available on this date.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableChambers.map((c: any) => (
                            <div key={c.id} onClick={() => setSelectedChamber(c)} className={`p-6 rounded-[2rem] cursor-pointer transition-all border-2 flex items-center justify-between ${selectedChamber?.id === c.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                              <div>
                                <h4 className="font-black text-slate-900">{c.hospitalName}</h4>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{c.schedule[0]?.startTime} - {c.schedule[0]?.endTime}</p>
                              </div>
                              <span className="text-lg font-black text-blue-600">৳ {c.feeNormal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedChamber && (
                    <div className="space-y-8 pt-4 animate-fade-in-up">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Patient Details</label>
                        <select
                          value={isAddingNew ? 'ADD_NEW' : selectedPatientId}
                          onChange={e => {
                            if (e.target.value === 'ADD_NEW') setIsAddingNew(true);
                            else { setIsAddingNew(false); setSelectedPatientId(e.target.value); }
                          }}
                          className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-slate-900 outline-none"
                        >
                          {session && <option value={session.id}>{session.name} (Self)</option>}
                          <option value="ADD_NEW">+ Family Member</option>
                        </select>
                      </div>

                      {isAddingNew && (
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 animate-fade-in">
                          <input placeholder="Full Name" value={newPatientData.name} onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })} className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 font-bold outline-none" />
                          <div className="flex gap-2">
                            <select className="flex-1 h-12 bg-white border border-slate-200 rounded-xl px-4 font-bold outline-none" onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value as any })}>
                              <option>Male</option><option>Female</option>
                            </select>
                            <select className="flex-1 h-12 bg-white border border-slate-200 rounded-xl px-4 font-bold outline-none" onChange={e => setNewPatientData({ ...newPatientData, relationship: e.target.value as any })}>
                              <option>Child</option><option>Spouse</option><option>Parent</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-50 rounded-[2.5rem] p-5 sm:p-6 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center"><span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Consultation Fee</span><span className="font-black text-slate-900">৳ {(selectedChamber as any).feeNormal}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Discount Code</span><span className="text-emerald-600 font-bold whitespace-nowrap">- ৳ 200</span></div>
                        <div className="border-t border-slate-200 pt-4 flex justify-between items-center"><span className="text-xs sm:text-sm font-black text-slate-900">Amount to Pay</span><span className="text-xl sm:text-2xl font-black text-blue-600">৳ {(selectedChamber as any).feeNormal - 200}</span></div>
                      </div>

                      {bookingError && (
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 flex items-center gap-3 animate-shake">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="text-[10px] sm:text-sm font-black uppercase tracking-widest">{getBookingErrorMessage(bookingError)}</p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                        <Button fullWidth variant="outline" className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest order-2 sm:order-1" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                        <Button fullWidth className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-blue-600 text-white order-1 sm:order-2" onClick={handleConfirmBooking} disabled={isBooking}>
                          {isBooking ? "Finalizing..." : "Confirm Securely"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
