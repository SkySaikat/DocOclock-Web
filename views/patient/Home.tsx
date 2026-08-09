import React, { useEffect, useMemo, useRef, useState } from 'react';
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
   { title: 'Find Specialists', desc: 'Find the right Doctor to guide your healthcare journey.', image: '/assets/figma/process-card-1.png' },
   { title: 'Get an Appointment', desc: 'Browse top-rated specialists and book your visit instantly.', image: '/assets/figma/process-card-2.png' },
   { title: 'Track Your Live Serial', desc: 'Skip the waiting room and arrive exactly when it’s your turn.', image: null as string | null },
];

const PANEL_LIST = ['Doctor Panel', 'Patient Panel', 'Appointment Management', 'Queue Tracker'];

const TRANSPARENCY_STATS = [
   { target: 15, suffix: '+', format: (n: number) => `${n}`, label: 'Years of Combined Experience' },
   { target: 5000, suffix: '+', format: (n: number) => n.toLocaleString(), label: 'Smiles Transformed' },
   { target: 100, suffix: '%', format: (n: number) => `${n}`, label: 'Patient Satisfaction' },
];

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
   const [activePanel, setActivePanel] = useState(0);
   const doctorScrollRef = useRef<HTMLDivElement>(null);
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
                  <img src="/assets/figma/hero-doctor.png" alt="" className="w-full h-full object-cover object-top -scale-x-100" />
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

         {/* SPECIALTY ROW — Figma node 87:3885 is a static row, but turned into a continuous
             auto-scrolling loop per explicit request. Generic "gemini-fill" icon (Google's
             Gemini logo) substituted with a plain sparkle glyph — not appropriate to ship here. */}
         <div className="bg-white py-7 border-b border-ink-100 overflow-hidden">
            <div className="flex w-max animate-marquee">
               {[...SPECIALTY_ROW, ...SPECIALTY_ROW].map((label, i) => (
                  <span key={i} className="flex items-center gap-4 text-[#868887] text-[18px] leading-7 px-9 whitespace-nowrap shrink-0">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-medical-400 shrink-0">
                        <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="currentColor" />
                     </svg>
                     {label}
                  </span>
               ))}
            </div>
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
                        {card.image ? (
                           <div className="h-36 rounded-2xl bg-medical-50 overflow-hidden">
                              <img src={card.image} alt="" className="w-full h-full object-cover" />
                           </div>
                        ) : (
                           <div className="flex items-center gap-4">
                              <div className="flex -space-x-3 shrink-0">
                                 {['avatar-stack-1', 'avatar-stack-2', 'avatar-stack-3'].map((img) => (
                                    <img key={img} src={`/assets/figma/${img}.png`} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white" />
                                 ))}
                              </div>
                              <span className="text-[15px] text-ink-800">&lt;15 Min Average Wait Time</span>
                           </div>
                        )}
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
               {filteredDoctors.length > 0 ? (
                  <div ref={doctorScrollRef} className="flex gap-6 w-full overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory scroll-smooth">
                     {filteredDoctors.map((doc) => (
                        <div
                           key={doc.id}
                           onClick={() => onSelectDoctor?.(doc)}
                           className="w-[384px] max-w-[85vw] shrink-0 rounded-[24px] overflow-hidden shadow-[0px_-8px_20px_0px_rgba(0,0,0,0.05)] cursor-pointer snap-start"
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
                                 <p className="text-[16px] text-ink-500 leading-[22px]">{doc.degrees || `MBBS, FCPS(${doc.specialty.toUpperCase()})`}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 pt-1">
                                 <Star size={16} className="text-amber-500 fill-amber-500" />
                                 <span className="text-[16px] text-black">{doc.rating || '4.5'}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-ink-400 text-sm py-10">No doctors found for this specialty yet.</p>
               )}
               <button
                  onClick={() => {
                     const el = doctorScrollRef.current;
                     if (!el) return;
                     const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
                     el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + 410, behavior: 'smooth' });
                  }}
                  className="w-11 h-11 rounded-full bg-medical-500 text-white flex items-center justify-center hover:bg-medical-600 transition-colors"
                  aria-label="See more doctors"
               >
                  <ArrowRight size={18} />
               </button>
            </div>

            {/* TRANSPARENCY STATEMENT + floating/parallax badges + count-up stats — exact Figma node 87:3864 */}
            <div className="py-16 md:py-[96px] flex flex-col items-center gap-16 md:gap-[120px]">
               <p className="font-display text-2xl md:text-[46px] text-[#131215] text-center leading-[1.3] md:leading-[58px] tracking-[0.92px] max-w-[1054px]">
                  DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly.
               </p>
               <ParallaxBadgeField />
               <div className="flex flex-wrap justify-center gap-x-[90px] gap-y-8">
                  {TRANSPARENCY_STATS.map((stat) => (
                     <CountUpStat key={stat.label} {...stat} />
                  ))}
               </div>
            </div>

            {/* SIMPLIFYING HEALTHCARE — exact Figma node 87:3912. The source design only had
                one static image behind this list; made the list clickable so each panel shows
                its own preview, per your request. */}
            <div className="py-16 md:py-[96px] flex flex-col gap-14">
               <SectionEyebrowHeader eyebrow="How it works" title="Simplifying healthcare appointments from booking to consultation." titleClassName="max-w-[792px]" />
               <div className="flex flex-col lg:flex-row gap-14 items-center">
                  <div className="flex-1 w-full max-w-[570px] flex flex-col gap-5">
                     {PANEL_LIST.map((label, i) => (
                        <button key={label} onClick={() => setActivePanel(i)} className="flex flex-col gap-5 text-left">
                           <div className="flex items-center gap-4 px-2">
                              {activePanel === i && <span className="w-4 h-4 bg-medical-500 shrink-0" />}
                              <span className={`text-[24px] transition-colors ${activePanel === i ? 'text-black' : 'text-ink-500 hover:text-ink-700'}`}>{label}</span>
                           </div>
                           <div className={`h-px w-full transition-colors ${activePanel === i ? 'bg-medical-500' : 'bg-ink-200'}`} />
                        </button>
                     ))}
                  </div>
                  <div className="flex-1 w-full max-w-[577px] h-[380px] md:h-[552px] rounded-[24px] bg-[#efefef] relative overflow-hidden">
                     <PanelMockup panel={activePanel} />
                  </div>
               </div>
            </div>

            {/* WHAT OUR PATIENTS SAY — real approved reviews only. The Figma source text for
                this section was corrupted/duplicated placeholder copy, so it was not reproduced. */}
            {testimonials.length > 0 && (
               <div className="py-16 md:py-[96px] flex flex-col gap-14">
                  <SectionEyebrowHeader eyebrow="Testimonials" title="What Our Patients Say" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {testimonials.map((t) => (
                        <div
                           key={t.id}
                           className="flex flex-col gap-8 p-8 rounded-[24px] shadow-ds-soft"
                           style={{ background: 'linear-gradient(160deg, #F5FAFF 0%, #FFFFFF 55%)' }}
                        >
                           <p className="text-[20px] text-black tracking-[-0.6px] leading-8">“{t.comment}”</p>
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-medical-50 shrink-0 ring-2 ring-white shadow-sm">
                                 {t.patientImage ? (
                                    <img src={t.patientImage} alt={t.patientName} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center text-medical-400 font-bold text-lg">{t.patientName.charAt(0)}</div>
                                 )}
                              </div>
                              <span className="text-[18px] text-black tracking-[-0.5px] font-medium">{t.patientName}</span>
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

// Center photo + 3 floating cards. Each card combines a CSS float animation (outer
// wrapper) with a JS mouse-parallax offset (inner wrapper) so the two transforms
// compose instead of fighting over the same property.
const ParallaxBadgeField: React.FC = () => {
   const fieldRef = useRef<HTMLDivElement>(null);
   const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);

   useEffect(() => {
      const field = fieldRef.current;
      if (!field) return;
      const strengths = [14, 20, 10];
      const handleMove = (e: MouseEvent) => {
         const rect = field.getBoundingClientRect();
         const px = (e.clientX - rect.left) / rect.width - 0.5;
         const py = (e.clientY - rect.top) / rect.height - 0.5;
         badgeRefs.current.forEach((el, i) => {
            if (!el) return;
            const s = strengths[i] ?? 12;
            el.style.transform = `translate(${px * s}px, ${py * s}px)`;
         });
      };
      const handleLeave = () => {
         badgeRefs.current.forEach((el) => { if (el) el.style.transform = 'translate(0,0)'; });
      };
      field.addEventListener('mousemove', handleMove);
      field.addEventListener('mouseleave', handleLeave);
      return () => {
         field.removeEventListener('mousemove', handleMove);
         field.removeEventListener('mouseleave', handleLeave);
      };
   }, []);

   const badges = [
      { icon: '/assets/figma/icon-queue.svg', iconSize: 'w-9 h-9', label: 'Live Queue Tracking', pos: 'left-[2%] top-[15%] w-[190px]', float: 'animate-float-1' },
      { icon: '/assets/figma/icon-prescription.svg', iconSize: 'w-9 h-9', label: 'Digital Prescription', pos: 'right-[2%] top-0 w-[190px]', float: 'animate-float-2' },
      { icon: '/assets/figma/icon-verified.svg', iconSize: 'w-7 h-7', label: 'BMDC Verified', pos: 'right-[10%] bottom-0 w-[170px]', float: 'animate-float-3' },
   ];

   return (
      <div ref={fieldRef} className="relative w-full max-w-[803px] h-[380px] md:h-[500px]">
         <div className="absolute left-1/2 -translate-x-1/2 top-[8%] w-[42%] h-[85%] rounded-[34px] overflow-hidden">
            <img src="/assets/figma/badge-photo-1.png" alt="" className="w-full h-full object-cover" />
         </div>
         {badges.map((b, i) => (
            <div key={b.label} className={`absolute ${b.pos} ${b.float}`}>
               <div
                  ref={(el) => { badgeRefs.current[i] = el; }}
                  className="bg-white rounded-[20px] px-4 py-7 flex flex-col items-center gap-4 shadow-ds-card transition-transform duration-150 ease-out"
               >
                  <img src={b.icon} alt="" className={b.iconSize} />
                  <p className="font-display font-medium text-[20px] text-black text-center">{b.label}</p>
               </div>
            </div>
         ))}
      </div>
   );
};

// Animates 0 → target once the stat scrolls into view.
const CountUpStat: React.FC<{ target: number; suffix: string; format: (n: number) => string; label: string }> = ({ target, suffix, format, label }) => {
   const ref = useRef<HTMLDivElement>(null);
   const [value, setValue] = useState(0);
   const hasRun = useRef(false);

   useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const observer = new IntersectionObserver(
         ([entry]) => {
            if (entry.isIntersecting && !hasRun.current) {
               hasRun.current = true;
               const duration = 1400;
               const start = performance.now();
               const tick = (now: number) => {
                  const progress = Math.min((now - start) / duration, 1);
                  const eased = 1 - Math.pow(1 - progress, 3);
                  setValue(Math.round(target * eased));
                  if (progress < 1) requestAnimationFrame(tick);
               };
               requestAnimationFrame(tick);
            }
         },
         { threshold: 0.4 }
      );
      observer.observe(el);
      return () => observer.disconnect();
   }, [target]);

   return (
      <div ref={ref} className="flex flex-col items-center gap-3">
         <span className="font-sans font-medium text-[70px] text-black leading-none tabular-nums">{format(value)}{suffix}</span>
         <span className="text-[16px] text-ink-500">{label}</span>
      </div>
   );
};

// One real Figma asset (Doctor Panel) + three lightweight mockups built from the app's
// own dashboard tokens (Figma only ever defined one static image for this whole section).
const PanelMockup: React.FC<{ panel: number }> = ({ panel }) => {
   if (panel === 0) {
      return <img src="/assets/figma/dashboard-mockup.png" alt="Doctor dashboard preview" className="absolute inset-0 w-full h-full object-cover animate-fade-in" />;
   }

   if (panel === 1) {
      return (
         <div className="absolute inset-0 p-8 flex flex-col gap-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 shadow-ds-card flex items-center gap-4">
               <div className="w-14 h-14 rounded-full bg-medical-100 flex items-center justify-center text-medical-500 font-display font-bold">DR</div>
               <div className="flex-1">
                  <p className="font-display font-bold text-ink-800">Dr. Sarah Rahman</p>
                  <p className="text-[12px] text-ink-500">Cardiology &middot; Today, 4:30 PM</p>
               </div>
               <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Confirmed</span>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-ds-card flex items-center justify-between">
               <div>
                  <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wide">Your Serial</p>
                  <p className="font-display font-bold text-3xl text-ink-800">24</p>
               </div>
               <button className="h-10 px-5 rounded-full bg-medical-500 text-white text-[13px] font-semibold">Track Live</button>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-ds-card flex-1">
               <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-3">Recent Prescriptions</p>
               {['Amoxicillin 500mg', 'Paracetamol 500mg'].map((rx) => (
                  <div key={rx} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                     <span className="w-2 h-2 rounded-full bg-medical-500 shrink-0" />
                     <span className="text-[13px] text-ink-700">{rx}</span>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   if (panel === 2) {
      return (
         <div className="absolute inset-0 p-8 flex flex-col gap-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 shadow-ds-card">
               <p className="font-display font-bold text-ink-800 mb-4">February 2026</p>
               <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 14 }).map((_, i) => (
                     <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[12px] ${i === 9 ? 'bg-medical-500 text-white font-bold' : 'bg-ink-50 text-ink-500'}`}>
                        {i + 1}
                     </div>
                  ))}
               </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-ds-card flex-1 flex flex-col gap-2">
               <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wide mb-1">Today's Appointments</p>
               {[{ t: '10:00 AM', n: 'John Doe' }, { t: '11:30 AM', n: 'Fatima Akter' }, { t: '2:00 PM', n: 'Rahim Uddin' }].map((appt) => (
                  <div key={appt.t} className="flex items-center gap-3 bg-ink-50/60 rounded-xl px-3 py-2.5">
                     <span className="text-[12px] font-bold text-medical-600 w-16 shrink-0">{appt.t}</span>
                     <span className="text-[13px] text-ink-700">{appt.n}</span>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 animate-fade-in">
         <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#2E8CFF 0deg 300deg, #E5F1FF 300deg 360deg)' }}>
            <div className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center">
               <span className="font-display font-bold text-3xl text-ink-800">18</span>
               <span className="text-[11px] text-ink-400">Minutes Left</span>
            </div>
         </div>
         <div className="flex items-center gap-3 bg-white rounded-2xl shadow-ds-card px-5 py-3">
            <span className="w-9 h-9 rounded-full bg-medical-500 text-white flex items-center justify-center font-bold text-sm">24</span>
            <div>
               <p className="text-[13px] font-bold text-ink-800">John Doe</p>
               <p className="text-[11px] text-ink-400">Now Serving</p>
            </div>
         </div>
      </div>
   );
};
