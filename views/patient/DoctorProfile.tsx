import React, { useState, useEffect } from 'react';
import { Doctor, Chamber, UserRole, Relationship, Appointment } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { MapPin, Clock, Calendar, ArrowLeft, Star, GraduationCap, AlertCircle, CheckCircle, X, ChevronRight, Briefcase, Award } from 'lucide-react';
import { getCurrentSession, bookAppointment, getDoctorPracticeSettings } from '../../storage';
import { StatCard } from '../../components/ui/StatCard';
import { DoctorCard } from '../../components/ui/DoctorCard';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'chambers'>('overview');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [confirmedApp, setConfirmedApp] = useState<Appointment | null>(null);

  // SYNC: Load real-time chambers from Practice Settings
  const practice = getDoctorPracticeSettings(doctor.id);
  const chambers = practice.chambers || [];

  const [selectedDate, setSelectedDate] = useState(getLocalISODate());

  const [availableChambers, setAvailableChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);

  // Patient Profile Flow
  const session = getCurrentSession();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(session?.id || '');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ name: '', gender: 'Male' as const, relationship: 'Other' as Relationship });

  // Booking UI State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // AUTO-REVALIDATION
  useEffect(() => {
    if (selectedDate && isBookingModalOpen) {
      const dayNumeric = getWeekdayNumber(selectedDate);
      const matches = chambers.filter(c => c.scheduleDays?.includes(dayNumeric) || c.schedule.some(s => s.day === dayNumeric));
      setAvailableChambers(matches as any);

      // If currently selected chamber is not in matches, reset it
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setSelectedDate(dateStr);
    // Intersection will be handled by useEffect
  };

  const handleConfirmBooking = () => {
    if (!selectedChamber || !selectedDate || !session) return;

    setIsBooking(true);
    setBookingError(null);

    // Smart Validation Layer
    const validation = validateBooking({
      doctorId: doctor.id,
      chamberId: selectedChamber.id,
      selectedDate
    });

    if (!validation.success) {
      setBookingError(getBookingErrorMessage(validation.reason || 'UNKNOWN'));
      setIsBooking(false);
      return;
    }

    const familySuffix = session.id.includes('-') ? session.id.split('-')[1] : session.id;
    const finalPatientId = isAddingNew ? `family-${familySuffix}-${Date.now()}` : session.id;

    const finalPatientName = isAddingNew ? newPatientData.name : session.name;
    const finalPatientPhone = isAddingNew ? session.phone : session.phone; // Assuming family members share same phone or use main user's

    const newApp = bookAppointment(
      doctor.id,
      doctor.name,
      selectedChamber.id,
      (selectedChamber as any).hospitalName || '',
      (selectedChamber as any).address || '',
      (selectedChamber as any).feeNormal || 0,
      selectedDate,
      (selectedChamber as any).schedule[0]?.startTime || 'N/A',
      finalPatientId,
      finalPatientName,
      finalPatientPhone
    );

    // Artificial delay to show processing state (demo UX)
    setTimeout(() => {
      setConfirmedApp(newApp);
      setIsBooking(false);
    }, 800);
  };

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW') {
      setIsAddingNew(true);
      setSelectedPatientId('');
    } else {
      setIsAddingNew(false);
      setSelectedPatientId(val);
    }
  };

  const finishAndGoToAppointments = () => {
    setIsBookingModalOpen(false);
    if (onNavigate) {
      onNavigate('/patient/appointments');
    } else {
      // Fallback if onNavigate not provided
      onBookSuccess();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 relative animate-fade-in px-4 md:px-0">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-medical-600 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Search
      </button>

      <DoctorCard
        doctor={{
          name: doctor.name,
          specialty: doctor.specialty,
          bmdcNumber: doctor.bmdcNumber,
          image: doctor.imageUrl,
          hospitalName: chambers[0]?.hospitalName,
          experience: doctor.experienceYears,
          rating: doctor.rating,
          reviews: doctor.totalPatients
        }}
        ctaLabel="Book Appointment"
        onCtaClick={handleBookClick}
      />

      <div className="flex gap-4 border-b border-slate-100 px-2 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('overview')} className={`pb-4 px-4 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-medical-600' : 'text-slate-400 hover:text-slate-600'}`}>{activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-1 bg-medical-600 rounded-t-full"></div>} Overview</button>
        <button onClick={() => setActiveTab('chambers')} className={`pb-4 px-4 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'chambers' ? 'text-medical-600' : 'text-slate-400 hover:text-slate-600'}`}>{activeTab === 'chambers' && <div className="absolute bottom-0 left-0 w-full h-1 bg-medical-600 rounded-t-full"></div>} Chambers</button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'overview' ? (
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-3 text-slate-800">About Doctor</h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">{doctor.about}</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {chambers.length === 0 ? (
              <div className="p-20 bg-white border border-dashed border-slate-200 rounded-[32px] text-center shadow-soft">
                <MapPin size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No chambers available for this specialist</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chambers.map(chamber => (
                  <ChamberCard
                    key={chamber.id}
                    chamber={{
                      hospitalName: chamber.hospitalName,
                      location: chamber.address,
                      schedule: chamber.schedule || [],
                      fee: chamber.feeNormal,
                      availableToday: true // Mock logic for now
                    }}
                    onSelect={handleBookClick}
                  />
                ))}
              </div>
            )}
          </div>

        )}
      </div>

      {/* MOBILE CTA */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
        <Button
          onClick={handleBookClick}
          fullWidth
          className="h-16 text-sm font-black uppercase tracking-widest bg-medical-600 text-white rounded-[24px] shadow-premium"
        >
          Book Appointment Now
        </Button>
      </div>

      {/* BOOKING MODAL */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg bg-white p-0 overflow-hidden relative max-h-[90vh] overflow-y-auto">
            {confirmedApp ? (
              <div className="p-10 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-500 mb-8 font-medium">Your appointment is scheduled with <br /><span className="text-blue-600 font-bold">{doctor.name}</span></p>

                <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Serial Number</p>
                  <p className="text-6xl font-black text-blue-600">#{confirmedApp.serialNumber ?? "-"}</p>
                </div>

                <Button fullWidth className="h-14 text-lg shadow-xl" onClick={finishAndGoToAppointments}>View Appointments</Button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white relative">
                  <h3 className="text-2xl font-bold">Book Appointment</h3>
                  <button onClick={() => setIsBookingModalOpen(false)} className="absolute top-4 right-4 bg-white/20 p-1 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">Appointment Date</label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={handleDateChange} className="w-full p-3 border border-slate-300 rounded-xl outline-none" />
                  </div>

                  {selectedDate && (
                    <div className="animate-fade-in-up">
                      {availableChambers.length === 0 ? (
                        <div className="bg-red-50 p-4 rounded-xl text-red-700 text-sm flex gap-3"><AlertCircle size={18} />Doctor not available today.</div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-700">Choose Chamber:</p>
                          {availableChambers.map((c: any) => (
                            <div key={c.id} onClick={() => setSelectedChamber(c)} className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedChamber?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                              <div className="flex justify-between font-bold text-slate-800"><span>{c.hospitalName}</span><span>৳ {c.feeNormal}</span></div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Clock size={12} /> {c.schedule[0]?.startTime} - {c.schedule[0]?.endTime}
                              </div>
                            </div>
                          ))}

                        </div>
                      )}
                    </div>
                  )}

                  {selectedChamber && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patient Selection</label>
                        <select
                          value={isAddingNew ? 'ADD_NEW' : selectedPatientId}
                          onChange={handlePatientSelect}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                        >
                          {session && <option value={session.id}>{session.name} (Self)</option>}
                          <option value="ADD_NEW">+ Add New Family Member</option>
                        </select>
                      </div>

                      {isAddingNew && (
                        <div className="space-y-4 animate-fade-in bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <input placeholder="New Patient Name" value={newPatientData.name} onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                          <div className="flex gap-4">
                            <select value={newPatientData.gender} onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value as any })} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl">
                              <option>Male</option><option>Female</option>
                            </select>
                            <select value={newPatientData.relationship} onChange={e => setNewPatientData({ ...newPatientData, relationship: e.target.value as any })} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl">
                              <option>Daughter</option><option>Son</option><option>Spouse</option><option>Parent</option><option>Other</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-600/5 p-4 rounded-xl text-sm space-y-2">
                        <div className="flex justify-between"><span>Fee</span><span className="font-bold">৳ {(selectedChamber as any).feeNormal}</span></div>
                        <div className="flex justify-between text-blue-600"><span>Booking Charge</span><span className="font-bold">- ৳ 200</span></div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-black"><span>Due at Chamber</span><span className="text-lg">৳ {(selectedChamber as any).feeNormal - 200}</span></div>
                      </div>


                      {bookingError && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="text-sm font-bold">{bookingError}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" fullWidth onClick={() => { setIsBookingModalOpen(false); setBookingError(null); }} disabled={isBooking}>Cancel</Button>
                        <Button fullWidth onClick={handleConfirmBooking} disabled={isBooking}>
                          {isBooking ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </div>
                          ) : "Confirm Booking"}
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
