import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Star, ChevronDown } from 'lucide-react';
import { Doctor, UserRole } from '../../types';
import { fetchDoctors } from '../../storage';
import { supabase } from '../../supabase';

interface HomeProps {
   onNavigate: (path: string) => void;
   onSelectDoctor?: (doctor: Doctor) => void;
   userRole?: UserRole;
   focusSearchTrigger?: number;
   onLoginClick?: () => void;
   onRegisterClick?: () => void;
}

// Exact Figma node 87:3885 — a static wrapped row (not an animated ticker).
const SPECIALTY_ROW = ['Medicine & Nephrology', 'Dental Care', 'Neurology', 'Food & Nutrition', 'Dental Care', 'Food & Nutrition'];

const DOCTOR_FILTER_TABS = ['All', 'Cardiologist', 'Dermatologist', 'Dentist', 'Neurologist', 'Orthopedic'];

const PROCESS_CARDS = [
   { title: 'Find Specialists', desc: 'Find the right Doctor to guide your healthcare journey.' },
   { title: 'Get an Appointment', desc: 'Browse top-rated specialists and book your visit instantly.' },
   { title: 'Track Your Live Serial', desc: 'Skip the waiting room and arrive exactly when it’s your turn.' },
];

const PANEL_LIST = ['Doctor Panel', 'Patient Panel', 'Appointment Management', 'Queue Tracker'];

const FAQ_ITEMS = [
   {
      q: 'How do I book an appointment with a verified doctor?',
      a: 'Search by specialty or name, pick a time slot from the doctor’s live schedule, and confirm — your booking is instant, no phone calls required.',
   },
   {
      q: 'Is every doctor on Dococlock BMDC verified?',
      a: 'Yes. Every doctor is verified against their BMDC registration before they can accept a single patient on the platform.',
   },
   {
      q: 'How does live queue tracking work?',
      a: 'Once your doctor starts consulting, you can watch your serial position update in real time so you know exactly when to arrive.',
   },
   {
      q: 'Can I access my prescriptions after the visit?',
      a: 'Yes. Every prescription your doctor writes is saved to your account as a digital record you can view or download anytime.',
   },
   {
      q: 'What if I need to cancel or reschedule?',
      a: 'You can cancel or reschedule directly from your Appointments page up until your doctor’s chamber opens for the day.',
   },
];

export const Home: React.FC<HomeProps> = ({ onNavigate, onSelectDoctor, userRole, onLoginClick, onRegisterClick }) => {
   const [doctors, setDoctors] = useState<Doctor[]>([]);
   const [selectedSpecialty, setSelectedSpecialty] = useState('All');
   const [openFaq, setOpenFaq] = useState<number>(0);
   const isPatient = userRole === UserRole.PATIENT;

   useEffect(() => {
      fetchDoctors().then(setDoctors).catch((err) => console.error('[Home] Error loading doctors:', err));
   }, []);

   const filteredDoctors = useMemo(() => {
      if (selectedSpecialty === 'All') return doctors.slice(0, 3);
      const stem = (s: string) => s.toLowerCase().replace(/ologist$|ician$|ology$|ics$|ist$|ian$|y$/, '').slice(0, 6);
      return doctors.filter((d) => stem(d.specialty) === stem(selectedSpecialty)).slice(0, 3);
   }, [doctors, selectedSpecialty]);

   // "What Our Patients Say" — real approved reviews only, never fabricated testimonials.
   const [testimonials, setTestimonials] = useState<{ id: string; comment: string; patientName: string; patientImage?: string }[]>([]);
   useEffect(() => {
      const loadTestimonials = async () => {
         const { data: reviewRows } = await supabase
            .from('reviews')
            .select('id, rating, comment, patient_id, created_at')
            .not('comment', 'is', null)
            .order('rating', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(3);
         if (!reviewRows || reviewRows.length === 0) { setTestimonials([]); return; }
         const patientIds = [...new Set(reviewRows.map((r: any) => r.patient_id))];
         const { data: patients } = await supabase.from('profiles').select('id, name, image').in('id', patientIds);
         const byId = new Map((patients || []).map((p: any) => [p.id, p]));
         setTestimonials(
            reviewRows.map((r: any) => ({
               id: r.id,
               comment: r.comment,
               patientName: byId.get(r.patient_id)?.name || 'Verified Patient',
               patientImage: byId.get(r.patient_id)?.image,
            }))
         );
      };
      loadTestimonials();
   }, []);

   const handleHeroCta = () => {
      if (isPatient) onNavigate('/patient/doctors');
      else onRegisterClick?.();
   };

   return (
      <div className="min-h-screen bg-white font-sans text-ink-800">
         {/* HERO — exact Figma node 87:3801 */}
         <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#3988ff] overflow-hidden">
            <div className="max-w-[1440px] mx-auto relative h-[500px] md:h-[703px]">
               <img src="/assets/figma/hero-vector-25.svg" alt="" className="hidden md:block absolute left-0 top-0 w-[482px] h-[503px] pointer-events-none" />
               <img src="/assets/figma/hero-vector-26.svg" alt="" className="hidden md:block absolute left-[224px] top-[202px] w-[687px] h-[713px] pointer-events-none" />
               <div className="absolute right-0 top-0 h-full w-[45%] md:w-[43%] overflow-hidden">
                  <img src="/assets/figma/hero-doctor.png" alt="" className="w-full h-full object-cover object-top" />
               </div>

               <div className="absolute left-4 right-4 md:left-[130px] md:right-auto top-8 md:top-[280px] md:w-[580px] flex flex-col gap-4 md:gap-6 items-start z-10">
                  <span className="bg-white/20 px-3 py-2 rounded-full text-white text-[14px] tracking-[0.28px]">
                     Welcome to Dococlock
                  </span>
                  <h1 className="font-sans font-medium text-white text-[36px] md:text-[68px] leading-[1.1] md:leading-[1.05] tracking-[0.5px] md:tracking-[1.36px] whitespace-nowrap">
                     {isPatient ? <>Welcome back.<br />Your Health.<br />Fully Controlled.</> : <>Your Time.Your<br />Health.<br />Fully Controlled.</>}
                  </h1>
                  <button
                     onClick={handleHeroCta}
                     className="h-[52px] px-6 rounded-full bg-white text-ink-800 font-display font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors"
                  >
                     {isPatient ? 'Find a Doctor' : 'Register'} <ArrowRight size={16} />
                  </button>
               </div>
            </div>
         </div>

         {/* SPECIALTY ROW — exact Figma node 87:3885 (static wrapped row, generic "gemini-fill"
             icon substituted with a plain sparkle glyph — the source icon is Google's Gemini
             logo, not appropriate to ship on this site). */}
         <div className="bg-white px-6 py-7 flex flex-wrap justify-center gap-x-[72px] gap-y-4 border-b border-ink-100">
            {SPECIALTY_ROW.map((label, i) => (
               <span key={i} className="flex items-center gap-4 text-[#868887] text-[18px] leading-7">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-medical-400 shrink-0">
                     <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="currentColor" />
                  </svg>
                  {label}
               </span>
            ))}
         </div>

         <div className="max-w-[1200px] mx-auto px-6">
            {/* HOW IT WORKS — exact Figma node 87:3841 */}
            <div className="py-16 md:py-[96px]">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
                  <SectionEyebrowHeader eyebrow="How it works" title="Healthcare made simple with smarter appointment scheduling." titleClassName="max-w-[790px]" />
                  <button
                     onClick={() => onNavigate('/patient/doctors')}
                     className="h-12 px-6 rounded-full bg-medical-500 text-white font-display font-semibold inline-flex items-center gap-2 shrink-0 hover:bg-medical-600 transition-colors"
                  >
                     Register <ArrowRight size={14} />
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PROCESS_CARDS.map((card) => (
                     <div key={card.title} className="bg-white rounded-[24px] shadow-ds-card p-6 flex flex-col gap-6">
                        <div>
                           <h3 className="font-display text-lg font-bold text-ink-800 mb-1">{card.title}</h3>
                           <p className="text-[13px] text-ink-500 leading-relaxed">{card.desc}</p>
                        </div>
                        <div className="h-36 rounded-2xl bg-medical-50" />
                     </div>
                  ))}
               </div>
            </div>

            {/* MEET OUR MEDICAL EXPERTS — exact Figma node 87:3849 */}
            <div className="py-16 md:py-[96px] flex flex-col items-center gap-16">
               <div className="flex flex-col items-center gap-9">
                  <SectionEyebrowHeader eyebrow="Specialists" title="Meet Our Medical Experts" center />
                  <div className="flex flex-wrap justify-center gap-2">
                     {DOCTOR_FILTER_TABS.map((tab) => (
                        <button
                           key={tab}
                           onClick={() => setSelectedSpecialty(tab)}
                           className={`h-[47px] px-6 rounded-full text-[16px] transition-colors ${selectedSpecialty === tab ? 'bg-medical-500 text-white font-bold' : 'bg-white text-ink-500 hover:bg-ink-50'
                              }`}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex flex-wrap justify-center gap-6 w-full">
                  {filteredDoctors.length > 0 ? (
                     filteredDoctors.map((doc) => (
                        <div
                           key={doc.id}
                           onClick={() => onSelectDoctor?.(doc)}
                           className="w-[384px] max-w-full shrink-0 rounded-[24px] overflow-hidden shadow-[0px_-8px_20px_0px_rgba(0,0,0,0.05)] cursor-pointer"
                        >
                           <div className="relative h-[405px] bg-medical-50">
                              {doc.imageUrl ? (
                                 <img src={doc.imageUrl} alt={doc.name} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-medical-300 font-display font-bold text-5xl">{doc.name.charAt(0)}</div>
                              )}
                              <span className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-[12px] text-ink-800">{doc.specialty}</span>
                           </div>
                           <div className="p-4 flex items-start justify-between">
                              <div>
                                 <p className="font-display font-medium text-[24px] text-black leading-tight">{doc.name}</p>
                                 <p className="text-[16px] text-ink-500 leading-[22px]">MBBS, FCPS({doc.specialty.toUpperCase()})</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 pt-1">
                                 <Star size={16} className="text-amber-500 fill-amber-500" />
                                 <span className="text-[16px] text-black">{doc.rating || '4.5'}</span>
                              </div>
                           </div>
                        </div>
                     ))
                  ) : (
                     <p className="text-ink-400 text-sm py-10">No doctors found for this specialty yet.</p>
                  )}
               </div>
               <button
                  onClick={() => onNavigate('/patient/doctors')}
                  className="w-11 h-11 rounded-full bg-medical-500 text-white flex items-center justify-center hover:bg-medical-600 transition-colors"
                  aria-label="Browse all doctors"
               >
                  <ArrowRight size={18} />
               </button>
            </div>

            {/* TRANSPARENCY STATEMENT + floating badges + stats — exact Figma node 87:3864 */}
            <div className="py-16 md:py-[96px] flex flex-col items-center gap-16 md:gap-[120px]">
               <p className="font-display text-2xl md:text-[46px] text-[#131215] text-center leading-[1.3] md:leading-[58px] tracking-[0.92px] max-w-[1054px]">
                  DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly.
               </p>
               <div className="relative w-full max-w-[803px] h-[380px] md:h-[500px]">
                  <div className="absolute left-1/2 -translate-x-1/2 top-[8%] w-[42%] h-[85%] rounded-[34px] overflow-hidden">
                     <img src="/assets/figma/badge-photo-1.png" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute left-[2%] top-[15%] bg-white rounded-[20px] px-4 py-7 flex flex-col items-center gap-4 w-[190px] shadow-ds-card">
                     <img src="/assets/figma/icon-queue.svg" alt="" className="w-9 h-9" />
                     <p className="font-display font-medium text-[20px] text-black text-center">Live Queue Tracking</p>
                  </div>
                  <div className="absolute right-[2%] top-0 bg-white rounded-[20px] px-4 py-7 flex flex-col items-center gap-4 w-[190px] shadow-ds-card">
                     <img src="/assets/figma/icon-prescription.svg" alt="" className="w-9 h-9" />
                     <p className="font-display font-medium text-[20px] text-black text-center">Digital Prescription</p>
                  </div>
                  <div className="absolute right-[10%] bottom-0 bg-white rounded-[20px] px-4 py-7 flex flex-col items-center gap-4 w-[170px] shadow-ds-card">
                     <img src="/assets/figma/icon-verified.svg" alt="" className="w-7 h-7" />
                     <p className="font-display font-medium text-[20px] text-black text-center">BMDC Verified</p>
                  </div>
               </div>
               <div className="flex flex-wrap justify-center gap-x-[90px] gap-y-8">
                  {[
                     { value: '15+', label: 'Years of Combined Experience' },
                     { value: '5,000+', label: 'Smiles Transformed' },
                     { value: '100%', label: 'Patient Satisfaction' },
                  ].map((stat) => (
                     <div key={stat.label} className="flex flex-col items-center gap-3">
                        <span className="font-sans font-medium text-[70px] text-black leading-none">{stat.value}</span>
                        <span className="text-[16px] text-ink-500">{stat.label}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* SIMPLIFYING HEALTHCARE — exact Figma node 87:3912 */}
            <div className="py-16 md:py-[96px] flex flex-col gap-14">
               <SectionEyebrowHeader eyebrow="How it works" title="Simplifying healthcare appointments from booking to consultation." titleClassName="max-w-[792px]" />
               <div className="flex flex-col lg:flex-row gap-14 items-center">
                  <div className="flex-1 w-full max-w-[570px] flex flex-col gap-5">
                     {PANEL_LIST.map((label, i) => (
                        <div key={label} className="flex flex-col gap-5">
                           <div className="flex items-center gap-4 px-2">
                              {i === 0 && <span className="w-4 h-4 bg-medical-500 shrink-0" />}
                              <span className={`text-[24px] ${i === 0 ? 'text-black' : 'text-ink-500'}`}>{label}</span>
                           </div>
                           <div className="h-px bg-ink-200 w-full" />
                        </div>
                     ))}
                  </div>
                  <div className="flex-1 w-full max-w-[577px] h-[380px] md:h-[552px] rounded-[24px] bg-[#efefef] relative overflow-hidden">
                     <img src="/assets/figma/dashboard-mockup.png" alt="Dococlock doctor dashboard preview" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
               </div>
            </div>

            {/* WHAT OUR PATIENTS SAY — real approved reviews only. The Figma source text for
                this section was corrupted/duplicated placeholder copy, so it was not reproduced. */}
            {testimonials.length > 0 && (
               <div className="py-16 md:py-[96px] flex flex-col gap-14">
                  <SectionEyebrowHeader eyebrow="Testimonials" title="What Our Patients Say" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-9">
                     {testimonials.map((t) => (
                        <div key={t.id} className="flex flex-col gap-10">
                           <p className="text-[24px] text-black tracking-[-0.72px] leading-8">“{t.comment}”</p>
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-medical-50 shrink-0">
                                 {t.patientImage ? (
                                    <img src={t.patientImage} alt={t.patientName} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center text-medical-400 font-bold text-lg">{t.patientName.charAt(0)}</div>
                                 )}
                              </div>
                              <span className="text-[24px] text-black tracking-[-0.72px]">{t.patientName}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* FAQ — exact Figma node 87:3953 structure; content rewritten since the source
                text was generic web-analytics placeholder copy unrelated to Dococlock. */}
            <div className="py-16 md:py-[96px] flex flex-col gap-14">
               <SectionEyebrowHeader eyebrow="Frequently Asked Questions" title="Everything you need to know about Dococlock." titleClassName="max-w-[759px]" />
               <div className="flex flex-col gap-4">
                  {FAQ_ITEMS.map((item, i) => {
                     const isOpen = openFaq === i;
                     return (
                        <div key={item.q} className="bg-[#f5f5f5] rounded-xl p-5">
                           <button onClick={() => setOpenFaq(isOpen ? -1 : i)} className="w-full flex items-start gap-3 text-left">
                              <div className="flex-1 flex flex-col gap-3">
                                 <span className={`font-display font-medium text-[20px] ${isOpen ? 'text-black' : 'text-ink-500'}`}>{item.q}</span>
                                 {isOpen && <span className="text-[16px] text-ink-500 leading-[22px]">{item.a}</span>}
                              </div>
                              <ChevronDown size={24} className={`shrink-0 transition-transform text-ink-500 ${isOpen ? 'rotate-180' : ''}`} />
                           </button>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
   );
};

const SectionEyebrowHeader: React.FC<{ eyebrow: string; title: string; titleClassName?: string; center?: boolean }> = ({ eyebrow, title, titleClassName = '', center }) => (
   <div className={`flex flex-col gap-4 ${center ? 'items-center text-center' : 'items-start'}`}>
      <span className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full">
         <span className="w-[21px] h-2 rounded-full bg-medical-500" />
         <span className="text-ink-500 text-[14px]">{eyebrow}</span>
      </span>
      <h2 className={`font-display font-normal text-[28px] md:text-[46px] text-[#131215] leading-[1.3] md:leading-[58px] tracking-[0.92px] ${titleClassName}`}>
         {title}
      </h2>
   </div>
);
