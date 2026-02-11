import React, { useState, useEffect } from 'react';
import { Doctor, Chamber, UserRole, Relationship, Appointment } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { MapPin, Clock, Calendar, ArrowLeft, Star, GraduationCap, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getCurrentSession, bookAppointment } from '../../storage';

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

  const [selectedDate, setSelectedDate] = useState('');
  const [availableChambers, setAvailableChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
  
  // Patient Profile Flow
  const session = getCurrentSession();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(session?.id || ''); 
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ name: '', gender: 'Male' as const, relationship: 'Other' as Relationship });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    setSelectedChamber(null);

    if (!dateStr) {
      setAvailableChambers([]);
      return;
    }

    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const matches = doctor.chambers.filter(c => c.visitingDays.includes(dayName));
    setAvailableChambers(matches);
    if (matches.length === 1) setSelectedChamber(matches[0]);
  };

  const handleConfirmBooking = () => {
    if (!selectedChamber || !selectedDate || !session) return;

    const finalPatientId = isAddingNew ? `family-${Date.now()}` : session.id;
    const finalPatientName = isAddingNew ? newPatientData.name : session.name;
    const finalPatientPhone = isAddingNew ? session.phone : session.phone; // Assuming family members share same phone or use main user's

    const newApp = bookAppointment(
      doctor.id,
      doctor.name,
      selectedChamber.id,
      selectedDate,
      selectedChamber.visitingHours,
      finalPatientId,
      finalPatientName,
      finalPatientPhone
    );

    setConfirmedApp(newApp);
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
    <div className="max-w-4xl mx-auto space-y-6 pb-32 relative">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-2">
        <ArrowLeft size={20} /> Back to Search
      </button>

      <GlassCard className="p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
          <img src={doctor.imageUrl} alt={doctor.name} className="w-28 h-28 md:w-40 md:h-40 rounded-3xl object-cover shadow-lg bg-slate-100" />
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-1">{doctor.name}</h1>
                <p className="text-lg md:text-xl text-teal-600 font-bold mb-2">{doctor.specialty}</p>
                <div className="flex items-center gap-2 text-slate-600 text-sm mb-3">
                    <GraduationCap size={16} />
                    <span>{doctor.degrees}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  BMDC: {doctor.bmdcNumber}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg font-bold">
                    <Star size={16} fill="currentColor"/> {doctor.rating}
                 </div>
                 <span className="text-xs text-slate-400">{doctor.totalPatients}+ Patients</span>
              </div>
            </div>
            <div className="flex gap-4 md:gap-8 mt-6 pt-6 border-t border-slate-200/60">
              <div><p className="text-xl md:text-2xl font-bold text-slate-800">{doctor.experienceYears}+</p><p className="text-xs text-slate-500 uppercase font-bold">Years Exp.</p></div>
              <div><p className="text-xl md:text-2xl font-bold text-slate-800">{doctor.totalPatients}+</p><p className="text-xs text-slate-500 uppercase font-bold">Patients</p></div>
              <div className="ml-auto hidden md:block"><Button onClick={handleBookClick} className="px-8 shadow-lg shadow-blue-200">Book Serial Now</Button></div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-6 border-b border-slate-200 px-2 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Overview {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}</button>
        <button onClick={() => setActiveTab('chambers')} className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'chambers' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Chambers {activeTab === 'chambers' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}</button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'overview' ? (
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-3 text-slate-800">About Doctor</h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">{doctor.about}</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {doctor.chambers.map(chamber => (
              <GlassCard key={chamber.id} className="p-6 border-l-4 border-l-blue-500">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin size={20} className="text-blue-600" />{chamber.name}</h3>
                    <p className="text-slate-600 text-sm ml-7">{chamber.address}</p>
                    <div className="flex flex-wrap gap-3 ml-7 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded"><Calendar size={14} />{chamber.visitingDays.join(', ')}</div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded"><Clock size={14} />{chamber.visitingHours}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold">Fee</p>
                    <p className="text-xl font-bold text-slate-800">৳ {chamber.fee}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* MOBILE CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-[100] pb-8">
         <Button onClick={handleBookClick} fullWidth className="h-14 text-lg font-bold shadow-xl shadow-blue-200">Book Serial Now</Button>
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
                 <p className="text-slate-500 mb-8 font-medium">Your appointment is scheduled with <br/><span className="text-blue-600 font-bold">{doctor.name}</span></p>
                 
                 <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Serial Number</p>
                    <p className="text-6xl font-black text-blue-600">#{confirmedApp.tokenNumber}</p>
                 </div>

                 <Button fullWidth className="h-14 text-lg shadow-xl" onClick={finishAndGoToAppointments}>View Appointments</Button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white relative">
                  <h3 className="text-2xl font-bold">Book Appointment</h3>
                  <button onClick={() => setIsBookingModalOpen(false)} className="absolute top-4 right-4 bg-white/20 p-1 rounded-full"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">Appointment Date</label>
                      <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={handleDateChange} className="w-full p-3 border border-slate-300 rounded-xl outline-none" />
                  </div>

                  {selectedDate && (
                    <div className="animate-fade-in-up">
                        {availableChambers.length === 0 ? (
                          <div className="bg-red-50 p-4 rounded-xl text-red-700 text-sm flex gap-3"><AlertCircle size={18}/>Doctor not available today.</div>
                        ) : (
                          <div className="space-y-3">
                              <p className="text-sm font-bold text-slate-700">Choose Chamber:</p>
                              {availableChambers.map(c => (
                                <div key={c.id} onClick={() => setSelectedChamber(c)} className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedChamber?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between font-bold text-slate-800"><span>{c.name}</span><span>৳ {c.fee}</span></div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock size={12}/> {c.visitingHours}</div>
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
                            <input placeholder="New Patient Name" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                            <div className="flex gap-4">
                              <select value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value as any})} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl">
                                <option>Male</option><option>Female</option>
                              </select>
                              <select value={newPatientData.relationship} onChange={e => setNewPatientData({...newPatientData, relationship: e.target.value as any})} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl">
                                <option>Daughter</option><option>Son</option><option>Spouse</option><option>Parent</option><option>Other</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="bg-blue-600/5 p-4 rounded-xl text-sm space-y-2">
                            <div className="flex justify-between"><span>Fee</span><span className="font-bold">৳ {selectedChamber.fee}</span></div>
                            <div className="flex justify-between text-blue-600"><span>Booking Charge</span><span className="font-bold">- ৳ 200</span></div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-black"><span>Due at Chamber</span><span className="text-lg">৳ {selectedChamber.fee - 200}</span></div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" fullWidth onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
                          <Button fullWidth onClick={handleConfirmBooking}>Confirm Booking</Button>
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
