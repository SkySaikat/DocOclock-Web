import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Doctor, UserRole } from '../../types';
import { fetchDoctors } from '../../storage';
import { supabase } from '../../supabase';
import { SectionEyebrowHeader } from '../../components/ui/SectionEyebrowHeader';
import { Button } from '../../components/ui/Button';
import { DoctorCard } from '../../components/ui/DoctorCard';
import '../../components/landing/landing.css';

interface HomeProps {
   onNavigate: (path: string) => void;
   onSelectDoctor?: (doctor: Doctor) => void;
   userRole?: UserRole;
   focusSearchTrigger?: number;
   onLoginClick?: () => void;
   onRegisterClick?: () => void;
}

// Figma "Landing Page" 80:1754 (PreLogin 1). The page is a 1460 frame; every section's content sits in a
// 1200 column (`max-w-[1248px] px-6` = 1200 of content on desktop, 24px gutters on phones).
const SECTION = 'w-full max-w-[1248px] px-6';

// Figma Group 18 / Group 17 — a static wrapped row (not an animated ticker in the file); the app keeps its
// continuous loop, and falls back to the static row for prefers-reduced-motion.
const SPECIALTY_ROW = ['Medicine & Nephrology', 'Dental Care', 'Neurology', 'Food & Nutrition', 'Dental Care', 'Food & Nutrition'];

const DOCTOR_FILTER_TABS = ['All', 'Cardiologist', 'Dermatologist', 'Dentist', 'Neurologist', 'Orthopedic'];

// Process Cards (80:4731): the fill is white + a per-card angled #feffff -> #e3e3e3 gradient (Figma literal
// neutral greys, angles converted from each instance's gradientTransform).
const PROCESS_CARDS = [
   {
      title: 'Find Specialists',
      desc: 'Find the right Doctor to guide your healthcare journey.',
      gradient: 'bg-[linear-gradient(149.48deg,#feffff_8.69%,#e3e3e3_88.61%)]',
      gap: 'gap-0', // SPACE_BETWEEN in Figma: no minimum gap
      titleWidth: 'max-w-[180px]',
      descWidth: 'max-w-[441px]',
      image: { src: '/assets/figma/process-card-1.png', crop: true },
   },
   {
      title: 'Get an Appointment',
      desc: 'Browse top-rated specialists and book your visit instantly.',
      gradient: 'bg-[linear-gradient(139.43deg,#feffff_8.69%,#e3e3e3_88.61%)]',
      gap: 'gap-6', // auto-layout gap 24
      titleWidth: 'max-w-[180px]',
      descWidth: 'max-w-[285px]',
      image: { src: '/assets/figma/process-card-2.png', crop: false },
   },
   {
      title: 'Track Your Live Serial',
      desc: 'Skip the waiting room and arrive exactly when it’s your turn',
      gradient: 'bg-[linear-gradient(134.73deg,#feffff_8.69%,#e3e3e3_88.61%)]',
      gap: 'gap-0',
      titleWidth: 'max-w-[192px]',
      descWidth: 'max-w-[190px]',
      image: null,
   },
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

   const scrollDoctors = () => {
      const el = doctorScrollRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + 410, behavior: 'smooth' });
   };

   return (
      <div className="dc-landing min-h-screen bg-page font-display text-ink-800">
         {/* HERO — Figma 80:1755 (1460 x 915). The navbar floats over the photo (hero starts at y = 0). */}
         <section className="relative h-[680px] w-full overflow-hidden bg-page md:h-[915px]">
            {/* The exported photo has crop + colour grading baked in and a transparent bottom band (~5.6% of its height).
                Figma (Group 80:1756) places it at (-21,-52) sized 1502 x 1018 inside the 1460 x 915 clip, i.e. left -1.4384% / top -5.6831%
                / w 102.8767% / h 111.2568% of the hero, so the band is pushed past the clip edge and never shows. `cover` keeps the
                aspect ratio at other widths (it equals Figma's vertical scale at 1460); object-position y 85% keeps the band out of
                the clip on wider screens. Phones get a 108% tall box for the same reason. */}
            <img
               src="/assets/figma/landing-home/hero-field-bg.png"
               alt=""
               className="absolute left-0 top-0 h-[108%] w-full max-w-none object-cover object-[50%_85%] md:left-[-1.4384%] md:top-[-5.6831%] md:h-[111.2568%] md:w-[102.8767%]"
            />
            {/* phones crop the photo around the subject, so a soft scrim keeps the white copy legible (not in the desktop frame) */}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent md:hidden" />
            <div className="absolute inset-x-0 bottom-10 md:bottom-[86px]">
               <div className={`mx-auto flex flex-col gap-8 ${SECTION} lg:flex-row lg:items-end lg:justify-between min-[1296px]:justify-start min-[1296px]:gap-[340px]`}>
                  <div className="flex shrink-0 flex-col items-start gap-6 lg:w-[480px]">
                     <span className="rounded-full bg-white/20 px-3 py-2 font-inter text-[14px] leading-[normal] tracking-[0.02em] text-white">
                        Welcome to Dococlock
                     </span>
                     <h1 className="whitespace-nowrap font-inter text-[40px] font-medium leading-[normal] tracking-[0.02em] text-[#fffffd] md:text-[68px]">
                        {isPatient ? <>Welcome back.<br />Your Health.<br />Fully Controlled.</> : <>Your Time.Your<br />Health.<br />Fully Controlled.</>}
                     </h1>
                  </div>
                  <div className="flex shrink-0 flex-col gap-9 lg:w-[387px]">
                     {/* placeholder copy in Figma is from a web-analytics template; rewritten for a doctor-appointment product */}
                     <p className="max-w-[380px] text-[16px] leading-[normal] tracking-[0.02em] text-white">
                        Book verified doctors, follow your live queue and keep every prescription in one place, so you spend less time waiting and more time on your health.
                     </p>
                     <div className="flex items-center gap-[10px]">
                        <Button variant="figma-primary" onClick={handleHeroCta}>{isPatient ? 'Find a Doctor' : 'Register'}</Button>
                        {!isPatient && <Button variant="figma-secondary" onClick={handleHeroCta}>Register</Button>}
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* SPECIALTY ROW — Figma Group 18 (80:1767) */}
         <SpecialtyRow />

         {/* AFTER HERO (80:1794): pad 96, gap 96 between sections */}
         <div className="flex flex-col items-center gap-16 py-16 md:gap-24 md:py-24">
            {/* HOW IT WORKS — 2nd Section 80:1795 */}
            <section className={`${SECTION} flex flex-col gap-10 md:gap-16`}>
               <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <SectionEyebrowHeader variant="figma" eyebrow="How it works" title="Healthcare made simple with smarter appointment scheduling." titleClassName="max-w-[790px]" />
                  <div className="flex flex-col gap-9 lg:w-[387px] lg:shrink-0 lg:justify-end lg:self-stretch">
                     <p className="max-w-[380px] text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary">
                        Delve high-quality consultations to patients<br className="hidden lg:block" /> wherever they are.
                     </p>
                     <div>
                        <Button variant="figma-secondary" onClick={() => onNavigate('/patient/doctors')}>Register</Button>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-6 md:grid-cols-[507fr_349fr_296fr]">
                  {PROCESS_CARDS.map((card) => (
                     <div key={card.title} className={`flex flex-col justify-between rounded-[24px] bg-white p-8 md:min-h-[307.78px] ${card.gap} ${card.gradient}`}>
                        <div className="mb-6 flex flex-col gap-3 md:mb-0">
                           <h3 className={`text-[24px] font-medium leading-[normal] text-ink-800 ${card.titleWidth}`}>{card.title}</h3>
                           <p className={`text-[16px] leading-[22px] text-content-tertiary ${card.descWidth}`}>{card.desc}</p>
                        </div>
                        {card.image ? (
                           <div className="relative aspect-[520/193] w-full overflow-hidden">
                              {card.image.crop ? (
                                 <img src={card.image.src} alt="" className="absolute left-[-0.01%] top-[-15.49%] h-[156.46%] w-[100.03%] max-w-none" />
                              ) : (
                                 <img src={card.image.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                              )}
                           </div>
                        ) : (
                           <div className="flex items-center gap-5">
                              {/* Group 52: three 38px circles at x = 0 / 11 / 28 */}
                              <div className="relative h-[38px] w-[66px] shrink-0">
                                 {['avatar-stack-1', 'avatar-stack-2', 'avatar-stack-3'].map((img, i) => (
                                    <img
                                       key={img}
                                       src={`/assets/figma/${img}.png`}
                                       alt=""
                                       className="absolute top-0 h-[38px] w-[38px] rounded-full object-cover"
                                       style={{ left: [0, 11, 28][i] }}
                                    />
                                 ))}
                              </div>
                              <span className="flex-1 font-inter text-[16px] leading-[normal] text-ink-800">&lt;15 Min Average Wait Time</span>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </section>

            {/* MEET OUR MEDICAL EXPERTS — Frame 1000012208 80:1803 */}
            <section className={`${SECTION} flex flex-col items-center gap-16`}>
               <div className="flex flex-col items-center gap-9">
                  <SectionEyebrowHeader
                     variant="figma"
                     eyebrow="Specialists"
                     title={<>Meet Our Medical{' '}<br className="hidden md:block" />Experts</>}
                     center
                  />
                  {/* Tabs 80:1806: pills h43, pad 12/24; active = accent fill + Inter Bold white, inactive = white + Inter Regular tertiary */}
                  <div className="flex flex-wrap justify-center gap-2">
                     {DOCTOR_FILTER_TABS.map((tab) => {
                        const active = selectedSpecialty === tab;
                        return (
                           <button
                              key={tab}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setSelectedSpecialty(tab)}
                              className={`rounded-full px-6 py-3 font-inter text-[16px] leading-[19px] transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                                 active ? 'bg-primary-500 font-bold text-white' : 'bg-white font-normal text-content-tertiary hover:text-content-primary'
                              }`}
                           >
                              {tab}
                           </button>
                        );
                     })}
                  </div>
               </div>
               {filteredDoctors.length > 0 ? (
                  // Extra 32px of scroll padding (cancelled by the negative margins) so the card's -8/20 drop shadow
                  // is not clipped by the scroller; auto side-margins centre fewer than 3 cards without clipping overflow.
                  <div
                     ref={doctorScrollRef}
                     className="hide-scrollbar -my-8 flex w-[calc(100%+4rem)] snap-x snap-mandatory scroll-pl-8 gap-6 overflow-x-auto scroll-smooth px-8 py-8 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto"
                  >
                     {filteredDoctors.map((doc) => (
                        <DoctorCard
                           key={doc.id}
                           reveal
                           className="snap-start"
                           doctor={{
                              name: doc.name,
                              specialty: doc.specialty,
                              degrees: doc.degrees,
                              bmdcNumber: doc.bmdcNumber,
                              // the profile rows carry snake_case columns at runtime (experience_years / total_patients)
                              experience: doc.experienceYears || (doc as any).experience_years,
                              totalPatients: doc.totalPatients || (doc as any).total_patients,
                              rating: doc.rating,
                              image: doc.imageUrl,
                           }}
                           onClick={() => onSelectDoctor?.(doc)}
                           onCtaClick={() => onSelectDoctor?.(doc)}
                        />
                     ))}
                  </div>
               ) : (
                  <p className="py-10 text-sm text-content-tertiary">No doctors found for this specialty yet.</p>
               )}
               <div className="flex items-center gap-3">
                  {/* The 3-card row (3 x 384 + 2 x 24 = 1200) only fits once the 1248 section (24px gutters) is fully available,
                      so the existing "See more doctors" scroller stays until 1280 (leaves room for a classic scrollbar). */}
                  <Button variant="figma-featured" className="min-[1280px]:hidden" onClick={scrollDoctors} aria-label="See more doctors">
                     Next
                  </Button>
                  {/* Button Featured Hover 80:1817 (the placed "Hovered" instance: label always shown); click -> List Page */}
                  <Button variant="figma-featured" expanded onClick={() => onNavigate('/patient/doctors')}>
                     View All
                  </Button>
               </div>
            </section>

            {/* TRANSPARENCY — Frame 1000012728 80:1818: title (pad 120), badge composition, 3 count-up stats */}
            <section className={`${SECTION} flex flex-col items-center gap-16 md:gap-[120px]`}>
               <p className="max-w-[1054px] pt-8 text-center text-[28px] font-normal leading-[1.3] tracking-[0.02em] text-content-primary md:pt-[120px] md:text-[48px] md:leading-[58px]">
                  DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly.
               </p>
               <div className="w-full md:mt-[120px]">
                  <ParallaxBadgeField />
               </div>
               <div className="flex flex-wrap justify-center gap-x-[90px] gap-y-8">
                  {TRANSPARENCY_STATS.map((stat) => (
                     <CountUpStat key={stat.label} {...stat} />
                  ))}
               </div>
            </section>

            {/* SPECIALTY ROW — Figma Group 17 (80:1839). Its hidden "Trusted by patients..." caption is visible=false, not rendered. */}
            <SpecialtyRow />

            {/* SIMPLIFYING HEALTHCARE — Frame 1000012147 80:1866. The source design only had one static image
                behind this list; the list stays clickable so each panel shows its own preview. */}
            <section className={`${SECTION} flex flex-col gap-10 md:gap-20`}>
               <SectionEyebrowHeader variant="figma" eyebrow="How it works" title="Simplifying healthcare appointments from booking to consultation." titleClassName="max-w-[792px]" />
               <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-14">
                  {/* Featured Tabs 80:4670: active = 16px square bullet + text (pad 0/8, gap 16); inactive = bare text;
                      a 1px #d9d9d9 rule under each (the last item has none in the file) */}
                  <div className="flex w-full flex-col gap-7 py-8 lg:w-[570px] lg:shrink-0">
                     {PANEL_LIST.map((label, i) => {
                        const active = activePanel === i;
                        return (
                           <button
                              key={label}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setActivePanel(i)}
                              className="group flex flex-col gap-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-4"
                           >
                              <div className={`flex items-center gap-4 ${active ? 'px-2' : ''}`}>
                                 {active && <span className="h-4 w-4 shrink-0 bg-primary-500" />}
                                 <span
                                    className={`text-[24px] leading-[normal] transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none ${
                                       active ? 'text-ink-800' : 'text-content-tertiary group-hover:text-content-primary'
                                    }`}
                                 >
                                    {label}
                                 </span>
                              </div>
                              {i < PANEL_LIST.length - 1 && <div className="h-px w-full bg-ink-300" />}
                           </button>
                        );
                     })}
                  </div>
                  {/* Frame 80:1877: 577 x 552, r24, fill #efefef (Figma literal photo backdrop) */}
                  <div className="relative aspect-[577/552] w-full overflow-hidden rounded-[24px] bg-[#efefef] lg:w-[577px] lg:shrink-0">
                     <PanelMockup panel={activePanel} />
                  </div>
               </div>
            </section>

            {/* WHAT OUR PATIENTS SAY — Frame 1000008959 80:1881. Real approved reviews only. The Figma source text
                for this section is broken placeholder copy (and its portraits belong to made-up names), so only
                the layout / type / top fade are reproduced. */}
            {testimonials.length > 0 && (
               <section className={`${SECTION} flex flex-col gap-4`}>
                  <SectionEyebrowHeader variant="figma" eyebrow="Testimonials" title={<>What Our Patients{' '}<br className="hidden md:block" />Say</>} />
                  <div className="relative overflow-hidden md:-mx-[117px] md:px-[117px]">
                     {/* Rectangle 3408: #f6f6f6, layer blur 70 (= CSS blur 35px), drawn over the first lines of the quotes */}
                     <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-[151px] bg-ink-100 blur-[35px] md:block" />
                     <div className="grid grid-cols-1 gap-x-9 gap-y-12 pt-8 md:grid-cols-[389fr_351fr_389fr] md:pt-[106px]">
                        {testimonials.map((t) => (
                           <figure key={t.id} className="m-0 flex flex-col gap-[42px]">
                              <blockquote className="m-0 font-inter text-[24px] leading-8 tracking-[-0.03em] text-ink-800">“{t.comment}”</blockquote>
                              <figcaption className="flex items-center gap-2">
                                 <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary-50">
                                    {t.patientImage ? (
                                       <img src={t.patientImage} alt={t.patientName} className="h-full w-full object-cover" />
                                    ) : (
                                       <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-400">{t.patientName.charAt(0)}</div>
                                    )}
                                 </div>
                                 <span className="font-inter text-[24px] leading-8 tracking-[-0.03em] text-ink-800">{t.patientName}</span>
                              </figcaption>
                           </figure>
                        ))}
                     </div>
                  </div>
               </section>
            )}

            {/* FAQ — Frame 1000012112 80:1907; content rewritten since the source text was generic
                web-analytics placeholder copy unrelated to Dococlock. */}
            <section className={`${SECTION} flex flex-col gap-10 md:gap-[72px]`}>
               <SectionEyebrowHeader variant="figma" eyebrow="Frequently Asked Questions" eyebrowClassName="text-[#7c7b7b]" title="Everything you need to know about Dococlock." titleClassName="max-w-[759px]" />
               <div className="flex flex-col gap-4">
                  {FAQ_ITEMS.map((item, i) => {
                     const isOpen = openFaq === i;
                     return (
                        <div key={item.q} className="rounded-xl bg-neutral-100 p-5">
                           <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={`faq-panel-${i}`}
                              onClick={() => setOpenFaq(isOpen ? -1 : i)}
                              className="flex w-full items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-100"
                           >
                              <span className={`flex-1 text-[20px] font-medium leading-[normal] transition-colors duration-ds-fast ease-ds-out motion-reduce:transition-none ${isOpen ? 'text-content-primary' : 'text-content-tertiary'}`}>
                                 {item.q}
                              </span>
                              {/* arrow-right-s-line rotated 90deg (points down) in both states, as in Figma */}
                              <img src="/assets/figma/landing-home/faq-chevron-right-24.svg" alt="" aria-hidden="true" className="h-6 w-6 shrink-0 rotate-90" />
                           </button>
                           <div
                              id={`faq-panel-${i}`}
                              aria-hidden={!isOpen}
                              className={`grid transition-[grid-template-rows,opacity] duration-ds-fast ease-ds-out motion-reduce:transition-none ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                           >
                              <div className="overflow-hidden">
                                 <p className="pt-3 text-[16px] leading-[22px] text-content-tertiary">{item.a}</p>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </section>
         </div>
      </div>
   );
};

// Figma Group 18 / Group 17: 84px white bar, six items (24px sparkle + Inter 18/28 #868887), gap 72.
const SpecialtyRow: React.FC = () => (
   <div className="w-full overflow-hidden bg-white py-7">
      <div className="flex w-max animate-marquee motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
         {[...SPECIALTY_ROW, ...SPECIALTY_ROW].map((label, i) => {
            const isCopy = i >= SPECIALTY_ROW.length;
            return (
               <span
                  key={i}
                  aria-hidden={isCopy || undefined}
                  className={`flex shrink-0 items-center gap-4 whitespace-nowrap px-9 font-inter text-[18px] leading-7 text-[#868887] ${isCopy ? 'motion-reduce:hidden' : ''}`}
               >
                  <img src="/assets/figma/icon-sparkle.svg" alt="" className="h-6 w-6 shrink-0" />
                  {label}
               </span>
            );
         })}
      </div>
   </div>
);

// Design 80:1820 (803 x 642): centre photo + 3 floating "Years Experience" badges. Each badge combines a CSS float
// animation (outer wrapper) with a JS mouse-parallax offset (inner wrapper) so the two transforms compose instead
// of fighting over the same property. Positions are Figma's px coordinates as % of the 803 x 642 frame.
const BADGES = [
   { icon: '/assets/figma/landing-home/icon-people-queue-36.svg', iconSize: 'h-6 w-6 md:h-9 md:w-9', label: 'Live Queue Tracking', pos: 'left-[0.06%] top-[12.54%] w-[29.64%]', textW: 'md:max-w-[161px]', float: 'animate-float-1' },
   { icon: '/assets/figma/landing-home/icon-prescriptions-36.svg', iconSize: 'h-6 w-6 md:h-9 md:w-9', label: 'Digital Prescription', pos: 'left-[65.44%] top-[-3.35%] w-[32.5%]', textW: 'md:max-w-[165px]', float: 'animate-float-2' },
   { icon: '/assets/figma/landing-home/icon-bmdc-verified-badge-28.svg', iconSize: 'h-5 w-5 md:h-7 md:w-7', label: 'BMDC Verified', pos: 'left-[50%] top-[67.99%] w-[27.9%]', textW: 'md:max-w-[136px]', float: 'animate-float-3' },
];

const ParallaxBadgeField: React.FC = () => {
   const fieldRef = useRef<HTMLDivElement>(null);
   const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);

   useEffect(() => {
      const field = fieldRef.current;
      if (!field) return;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      const strengths = [14, 20, 10];
      const handleMove = (e: MouseEvent) => {
         if (reduceMotion?.matches) return;
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

   return (
      <div ref={fieldRef} className="relative mx-auto aspect-[803/642] w-full max-w-[803px]">
         {/* Rectangle 10: 341 x 446 at (219.75, 40), r34 */}
         <div className="absolute left-[27.37%] top-[6.23%] h-[69.47%] w-[42.47%] overflow-hidden rounded-[34px]">
            <img src="/assets/figma/badge-photo-2.png" alt="" className="h-full w-full object-cover" />
         </div>
         {BADGES.map((b, i) => (
            <div key={b.label} className={`absolute ${b.pos} ${b.float} motion-reduce:animate-none`}>
               <div
                  ref={(el) => { badgeRefs.current[i] = el; }}
                  // "Years Experiece" frame: pad 44/16, gap 16, r20, fill top-to-bottom #fefffa -> Accent-50, no shadow
                  className="flex flex-col items-center gap-2 rounded-[20px] bg-gradient-to-b from-[#fefffa] to-primary-50 px-2 py-5 transition-transform duration-150 ease-out motion-reduce:transition-none md:gap-4 md:px-4 md:py-11"
               >
                  <img src={b.icon} alt="" className={`${b.iconSize} shrink-0`} />
                  <p className={`text-center text-[13px] font-medium leading-tight text-content-primary md:text-[24px] md:leading-[normal] ${b.textW}`}>{b.label}</p>
               </div>
            </div>
         ))}
      </div>
   );
};

// Animates 0 -> target once the stat scrolls into view. Values 80:2143: number 70 Medium, label 16/22 tertiary, gap 12.
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
               if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
                  setValue(target);
                  return;
               }
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
         <span className="text-[48px] font-medium leading-[normal] tabular-nums text-ink-800 md:text-[70px]">{format(value)}{suffix}</span>
         <span className="text-[16px] leading-[22px] text-content-tertiary">{label}</span>
      </div>
   );
};

// Panel 0 is the real Figma visual (80:1877: hills photo + ghost card + Queue card, positions as % of the
// 577 x 552 frame). The other three panels are lightweight mockups built from the app's own tokens
// (Figma only ever defined one static image for this whole section).
const PanelMockup: React.FC<{ panel: number }> = ({ panel }) => {
   if (panel === 0) {
      return (
         <div className="absolute inset-0 animate-fade-in motion-reduce:animate-none">
            {/* fill = dashboard-mockup.png, CROP window x 50.5-94.3%, y 7.1-95.6% of the 1091 x 722 source */}
            <img
               src="/assets/figma/dashboard-mockup.png"
               alt="Doctor dashboard preview"
               className="absolute left-[-115.3%] top-[-8.02%] h-[113%] w-[228.3%] max-w-none"
            />
            {/* Rectangle 3864 (ghost card, #f4f4f4 @ 40%) and Rectangle 3865 (Queue card, #f9f9f9 + dashboard-mockup-2.png) */}
            <div className="absolute left-[16.98%] top-[18.2%] h-[63.22%] w-[70.19%] rounded-[24px] bg-[#f4f4f4] opacity-40 md:rounded-[36px]" />
            <div className="absolute left-[14.38%] top-[20.02%] h-[67.93%] w-[75.39%] overflow-hidden rounded-[24px] bg-[#f9f9f9] md:rounded-[36px]">
               <img src="/assets/figma/dashboard-mockup-2.png" alt="" className="absolute left-[-3.13%] top-[-3.19%] h-[106.3%] w-[107.9%] max-w-none" />
            </div>
         </div>
      );
   }

   if (panel === 1) {
      return (
         <div className="absolute inset-0 p-8 flex flex-col gap-4 animate-fade-in motion-reduce:animate-none">
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
               <button className="h-10 px-5 rounded-full bg-medical-500 text-white text-[13px] font-semibold hover:bg-medical-600 transition-colors">Track Live</button>
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
         <div className="absolute inset-0 p-8 flex flex-col gap-4 animate-fade-in motion-reduce:animate-none">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 animate-fade-in motion-reduce:animate-none">
         <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(rgb(var(--color-primary-500)) 0deg 300deg, rgb(var(--color-primary-100)) 300deg 360deg)' }}>
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
