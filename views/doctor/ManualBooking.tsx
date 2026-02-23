import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { ClipboardList, UserPlus, CheckCircle, Pencil, Check, X, Plus, Minus } from 'lucide-react';
import { getDoctorPolicy, saveDoctorPolicy, DoctorStorage, bookManualAppointment, fetchAppointments } from '../../storage';
import { getLocalISODate } from '../../utils/date';

export const ManualBooking: React.FC = () => {
   const doctor = DoctorStorage.get();
   const doctorId = doctor?.id || 'd-default';
   const today = getLocalISODate();

   const [activeChamber, setActiveChamber] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [assignedSerial, setAssignedSerial] = useState<number>(1);
   const [isEditingSerial, setIsEditingSerial] = useState(false);
   const [tempSerial, setTempSerial] = useState<string>('1');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const [formData, setFormData] = useState({
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      paymentStatus: 'Paid'
   });

   const [enableReservedSlots, setEnableReservedSlots] = useState(false);
   const [reservedSlotsCount, setReservedSlotsCount] = useState<number>(0);
   const [isPolicyLoaded, setIsPolicyLoaded] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);

   // Load persistent policy and active chamber on mount
   useEffect(() => {
      const init = async () => {
         setIsLoading(true);
         try {
            // Load Policy
            const policy = getDoctorPolicy(doctorId);
            setEnableReservedSlots(policy.reservedSlotsEnabled);
            setReservedSlotsCount(policy.reservedSlotCount);
            setIsPolicyLoaded(true);

            // Load Chamber
            const { fetchDoctorChambers } = await import('../../storage');
            const chambers = await fetchDoctorChambers(doctorId);
            const todayNumeric = new Date(today + "T00:00:00").getDay();
            const match = chambers.find(c =>
               c.scheduleDays?.includes(todayNumeric) || c.schedule.some(s => s.day === todayNumeric)
            );
            setActiveChamber(match);

            // Calculate Serial
            const apps = await fetchAppointments({ doctorId, date: today });
            const baseOffset = policy.reservedSlotsEnabled ? policy.reservedSlotCount : 0;
            const validApps = apps.filter(a => a.status !== 'cancelled');
            const nextSerial = baseOffset + validApps.length + 1;
            setAssignedSerial(nextSerial);
            setTempSerial(nextSerial.toString());

         } catch (error) {
            console.error('Error initializing manual booking:', error);
         } finally {
            setIsLoading(false);
         }
      };
      if (doctorId) init();
   }, [doctorId, today]);

   // Save policy whenever it changes
   useEffect(() => {
      if (doctorId && isPolicyLoaded) {
         saveDoctorPolicy(doctorId, {
            reservedSlotsEnabled: enableReservedSlots,
            reservedSlotCount: reservedSlotsCount
         });
      }
   }, [enableReservedSlots, reservedSlotsCount, doctorId, isPolicyLoaded]);

   const handleEditSerial = () => {
      setIsEditingSerial(true);
      setTempSerial(assignedSerial.toString());
   };

   const saveSerial = () => {
      const newSerial = parseInt(tempSerial);
      if (!isNaN(newSerial) && newSerial > 0) {
         setAssignedSerial(newSerial);
      }
      setIsEditingSerial(false);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!doctor || !activeChamber) return;

      setIsSubmitting(true);
      try {
         await bookManualAppointment(
            doctor.id,
            doctor.name || doctor.full_name,
            activeChamber.id,
            activeChamber.hospitalName,
            activeChamber.address,
            activeChamber.fee || activeChamber.feeNormal,
            today,
            activeChamber.schedule.find(s => s.day === new Date(today + "T00:00:00").getDay())?.startTime || 'N/A',
            `p-manual-${Date.now()}`,
            formData.name,
            formData.phone || '01XXXXXXXXX',
            assignedSerial
         );

         setIsSuccess(true);
         setTimeout(async () => {
            setIsSuccess(false);
            setFormData({ name: '', age: '', gender: 'Male', phone: '', paymentStatus: 'Paid' });
            // Recalculate next serial
            const apps = await fetchAppointments({ doctorId, date: today });
            const policy = getDoctorPolicy(doctorId);
            const baseOffset = policy.reservedSlotsEnabled ? policy.reservedSlotCount : 0;
            const validApps = apps.filter(a => a.status !== 'cancelled');
            const nextSerial = baseOffset + validApps.length + 1;
            setAssignedSerial(nextSerial);
            setTempSerial(nextSerial.toString());
         }, 2000);
      } catch (error) {
         console.error('Manual booking failed:', error);
         alert('Failed to save booking. Please try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Cloud Queue...</p>
         </div>
      );
   }

   return (
      <div className="max-w-2xl mx-auto space-y-6">
         <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
               <ClipboardList size={28} />
            </div>
            <div>
               <h1 className="text-2xl font-bold text-slate-800">Manual Booking</h1>
               <p className="text-slate-500">Add walk-in or emergency patients directly to today's queue.</p>
            </div>
         </div>

         {/* Booking Policy Section */}
         <GlassCard className="p-6 border-l-4 border-teal-500 bg-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                     <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Booking Policy</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-500 max-w-[280px]">Settings below apply to all future dates until changed manually.</p>
               </div>

               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" htmlFor="reserved-toggle">
                           Reserved Slots
                        </label>
                        <div className="flex items-center gap-3">
                           <span className={`text-xs font-black uppercase tracking-wider ${enableReservedSlots ? 'text-teal-600' : 'text-slate-400'}`}>
                              {enableReservedSlots ? 'Active' : 'Disabled'}
                           </span>
                           <div
                              className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${enableReservedSlots ? 'bg-teal-500 shadow-md shadow-teal-100' : 'bg-slate-200'}`}
                              onClick={() => setEnableReservedSlots(!enableReservedSlots)}
                           >
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${enableReservedSlots ? 'translate-x-6' : ''}`}></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {enableReservedSlots && (
                     <div className="flex flex-col animate-fade-in">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                           Daily Reservation Count
                        </label>
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                           <button
                              onClick={() => setReservedSlotsCount(Math.max(1, reservedSlotsCount - 1))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all font-black"
                           >
                              <Minus size={16} />
                           </button>
                           <input
                              type="number"
                              min="1"
                              max="20"
                              value={reservedSlotsCount}
                              onChange={(e) => setReservedSlotsCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                              className="w-12 bg-transparent border-0 text-center font-black text-teal-600 outline-none h-8 text-sm"
                           />
                           <button
                              onClick={() => setReservedSlotsCount(Math.min(20, reservedSlotsCount + 1))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all font-black"
                           >
                              <Plus size={16} />
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {enableReservedSlots && (
               <div className="mt-4 p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center gap-3 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></div>
                  <p className="text-[11px] font-bold text-teal-700">
                     These slots remain reserved every day until turned off. You can change the number anytime.
                  </p>
               </div>
            )}
         </GlassCard>

         <GlassCard className="p-8">
            {isSuccess ? (
               <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                     <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Booking Confirmed!</h2>
                  <p className="text-slate-500 mb-6">Patient added to queue with Serial #{assignedSerial}</p>
                  <Button onClick={() => setIsSuccess(false)}>Add Another Patient</Button>
               </div>
            ) : (
               <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Assigned Serial Card with Edit Option */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex justify-between items-center relative group">
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Serial</p>
                        {isEditingSerial ? (
                           <div className="flex items-center gap-2 animate-fade-in">
                              <span className="text-3xl font-black text-blue-600">#</span>
                              <input
                                 type="number"
                                 value={tempSerial}
                                 onChange={(e) => setTempSerial(e.target.value)}
                                 className="w-24 bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-2xl font-black text-blue-600 outline-none"
                                 autoFocus
                                 onKeyDown={(e) => e.key === 'Enter' && saveSerial()}
                              />
                              <button
                                 type="button"
                                 onClick={saveSerial}
                                 className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                 <Check size={18} />
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setIsEditingSerial(false)}
                                 className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                              >
                                 <X size={18} />
                              </button>
                           </div>
                        ) : (
                           <div className="flex items-center gap-3">
                              <p className="text-4xl font-black text-blue-600 tracking-tight">#{assignedSerial}</p>
                              <button
                                 type="button"
                                 onClick={handleEditSerial}
                                 className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                 title="Edit Serial Number"
                              >
                                 <Pencil size={18} />
                              </button>
                           </div>
                        )}
                     </div>
                     <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Wait</p>
                        <p className="text-lg font-bold text-slate-700">~{(assignedSerial * 12)} mins</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Patient Name</label>
                        <input
                           required
                           value={formData.name}
                           onChange={e => setFormData({ ...formData, name: e.target.value })}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-14"
                           placeholder="Enter full name"
                        />
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-sm font-bold text-slate-700 mb-2">Age</label>
                           <input
                              required
                              type="number"
                              value={formData.age}
                              onChange={e => setFormData({ ...formData, age: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-14"
                              placeholder="Yrs"
                           />
                        </div>
                        <div className="flex-1">
                           <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                           <select
                              value={formData.gender}
                              onChange={e => setFormData({ ...formData, gender: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-14 appearance-none cursor-pointer"
                           >
                              <option>Male</option>
                              <option>Female</option>
                              <option>Other</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number (Optional)</label>
                        <input
                           value={formData.phone}
                           onChange={e => setFormData({ ...formData, phone: e.target.value })}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-14"
                           placeholder="017..."
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Payment Status</label>
                        <div className="flex gap-3">
                           <button
                              type="button"
                              onClick={() => setFormData({ ...formData, paymentStatus: 'Paid' })}
                              className={`flex-1 h-14 rounded-xl font-black transition-all border-2 ${formData.paymentStatus === 'Paid' ? 'bg-green-50 border-green-500 text-green-700 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                           >
                              Paid
                           </button>
                           <button
                              type="button"
                              onClick={() => setFormData({ ...formData, paymentStatus: 'Due' })}
                              className={`flex-1 h-14 rounded-xl font-black transition-all border-2 ${formData.paymentStatus === 'Due' ? 'bg-red-50 border-red-500 text-red-700 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                           >
                              Due
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                     <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        className="h-14 rounded-2xl border-2 font-black text-slate-500"
                        disabled={isSubmitting}
                        onClick={() => {
                           setFormData({ name: '', age: '', gender: 'Male', phone: '', paymentStatus: 'Paid' });
                           setIsEditingSerial(false);
                        }}
                     >
                        Reset Form
                     </Button>
                     <Button type="submit" fullWidth className="h-14 rounded-2xl font-black text-lg gap-3 shadow-xl" disabled={isSubmitting}>
                        {isSubmitting ? (
                           <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                           <><UserPlus size={22} /> Confirm Booking</>
                        )}
                     </Button>
                  </div>
               </form>
            )}
         </GlassCard>
      </div>
   );
};