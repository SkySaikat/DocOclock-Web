import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Doctor, UserRole } from '../../types';
import { fetchDoctors } from '../../storage';
import { supabase } from '../../supabase';
import { SectionEyebrowHeader } from '../../components/ui/SectionEyebrowHeader';
import { Button } from '../../components/ui/Button';
import { DoctorCard } from '../../components/ui/DoctorCard';
import '../../components/landing/landing.css';
import { ArcGauge } from '../../components/ui/ArcGauge';
import { DepartmentPicker } from '../../components/patient/DepartmentPicker';
import { encodeFilter } from '../../utils/departments';
import { useCountUp, useInView } from '../../hooks/useInView';
import { CalendarDays, Check, ChevronRight, FileText, Radio, ShieldCheck, Clock } from 'lucide-react';

interface HomeProps {
   onNavigate: (path: string, appointmentId?: string, category?: string) => void;
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

const PANELS = [
   { label: 'Doctor Panel', desc: 'Run your queue, appointments and prescriptions from one dashboard.' },
   { label: 'Patient Panel', desc: 'Book, track your serial and keep every prescription in one place.' },
   { label: 'Appointment Management', desc: 'Schedules, slots and reminders, organised day by day.' },
   { label: 'Queue Tracker', desc: 'Your live serial and estimated wait, updated as the doctor works.' },
];

const WHY_POINTS = [
   { icon: ShieldCheck, tone: 'bg-primary-500', text: 'Book a BMDC-verified specialist in minutes. Pick a doctor, a chamber and a time slot from their live schedule.' },
   { icon: Radio, tone: 'bg-secondary-500', text: 'Track your serial live, so you arrive when it is your turn instead of waiting hours outside the chamber.' },
   { icon: FileText, tone: 'bg-primary-700', text: 'Every prescription is saved to your account as a digital record you can view or download anytime.' },
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
         {/* HERO — split layout: headline + CTAs left, static "what you see after booking" preview right. Pure markup, no images
             or fetches, so it paints immediately. Theme tokens only (primary-*), so Super Admin → Branding recolours it. */}
         <section className="w-full bg-white pt-28 pb-16 md:pt-36 md:pb-24">
            <div className={`mx-auto grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${SECTION}`}>
               <div className="flex flex-col items-start">
                  <div className="mb-6 flex flex-wrap gap-3">
                     <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-[14px] font-medium text-primary-700">
                        <span className="size-2 rounded-full bg-primary-500" /> Now live near you
                     </span>
                     <span className="inline-flex items-center rounded-full border border-ink-200 bg-ink-50 px-4 py-1.5 text-[14px] font-medium text-ink-700">
                        BMDC-verified doctors
                     </span>
                  </div>
                  <h1 className="font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink-900 sm:text-[56px] md:text-[72px]">
                     {isPatient ? 'Welcome back.' : 'End the queue.'}<br />
                     <span className="text-primary-500">Book smart.</span><br />
                     Walk right in.
                  </h1>
                  <p className="mt-6 max-w-[520px] text-[17px] leading-[1.7] text-ink-500 md:text-[19px]">
                     Dococlock connects you to doctors — book online, get a serial, and track your queue in real time. No more standing outside chambers for hours.
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3">
                     <button
                        onClick={() => onNavigate('/patient/doctors')}
                        className="btn-sheen inline-flex h-14 items-center gap-2 rounded-xl bg-primary-500 px-7 text-[17px] font-semibold text-white shadow-lg shadow-primary-500/25 transition-colors hover:bg-primary-600"
                     >
                        <CalendarDays size={18} /> Book Appointment
                     </button>
                     <button
                        onClick={() => (isPatient ? onNavigate('/patient/appointments') : onLoginClick?.())}
                        className="inline-flex h-14 items-center gap-2 rounded-xl border border-ink-200 bg-white px-7 text-[17px] font-semibold text-ink-900 transition-colors hover:border-primary-300 hover:text-primary-600"
                     >
                        <Radio size={18} /> Track My Serial
                     </button>
                  </div>
               </div>

               <div aria-label="Preview of what you see after booking" className="flex w-full flex-col gap-5">
                  <p className="text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-400">Preview · what you see after booking</p>
                  <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                     <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600"><Check size={22} /></span>
                     <div>
                        <p className="text-[18px] font-semibold text-ink-900">Booking Confirmed</p>
                        <p className="text-[15px] text-ink-500">Dr. Sarah Rahman · Cardiology Chamber</p>
                     </div>
                  </div>
                  <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                     <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-400">Serial number</p>
                     <p className="mt-1 font-display text-[64px] font-extrabold leading-none text-primary-500">07</p>
                     <p className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-primary-600">
                        <span className="size-2 animate-pulse rounded-full bg-primary-500" /> Serial 04 is in consultation now
                     </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-ink-100 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                     <div className="pr-6">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-400">Estimated wait</p>
                        <p className="mt-1 font-display text-[34px] font-extrabold text-ink-900">~18</p>
                        <p className="text-[15px] text-ink-500">minutes</p>
                     </div>
                     <div className="pl-6">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-400">People ahead</p>
                        <p className="mt-1 font-display text-[34px] font-extrabold text-ink-900">3</p>
                        <p className="text-[15px] text-ink-500">patients</p>
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
            <section id="how-it-works" className={`${SECTION} scroll-mt-24 flex flex-col gap-10 md:gap-16`}>
               <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <SectionEyebrowHeader variant="figma" eyebrow="How it works" title="Healthcare made simple with smarter appointment scheduling." titleClassName="max-w-[790px]" />
                  <div className="flex flex-col gap-9 lg:w-[387px] lg:shrink-0 lg:justify-end lg:self-stretch">
                     <p className="max-w-[380px] text-[16px] leading-[normal] tracking-[0.02em] text-content-tertiary">
                        Delve high-quality consultations to patients<br className="hidden lg:block" /> wherever they are.
                     </p>
                     <div>
                        <Button variant="figma-primary" onClick={handleHeroCta}>{isPatient ? 'Book Now' : 'Register'}</Button>
                     </div>
                  </div>
               </div>
               <HowItWorksFlow />
            </section>

            {/* FIND BY DEPARTMENT / SYMPTOM — same picker as Find Doctors; a pick opens the list pre-filtered. */}
            <section className={`${SECTION} flex flex-col gap-8`}>
               <DepartmentPicker
                  initialCount={10}
                  onSelect={(f) => onNavigate('/patient/doctors', undefined, encodeFilter(f))}
               />
               <div className="flex justify-center">
                  <Button variant="figma-primary" onClick={() => onNavigate('/patient/doctors')}>View all departments</Button>
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

            {/* WHY DOCOCLOCK */}
            <WhyDococlock onFindDoctor={() => onNavigate('/patient/doctors')} />

            {/* SPECIALTY ROW — Figma Group 17 (80:1839). Its hidden "Trusted by patients..." caption is visible=false, not rendered. */}
            <SpecialtyRow />

            {/* SIMPLIFYING HEALTHCARE — Frame 1000012147 80:1866. A clickable vertical tab list; each tab opens its own animated panel UI. */}
            <section className={`${SECTION} flex flex-col gap-10 md:gap-20`}>
               <SectionEyebrowHeader variant="figma" eyebrow="How it works" title="Simplifying healthcare appointments from booking to consultation." titleClassName="max-w-[792px]" />
               <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-14">
                  <div className="flex w-full flex-col gap-6 py-4 lg:w-[570px] lg:shrink-0 lg:py-8" role="tablist" aria-label="Dococlock panels" aria-orientation="vertical">
                     {PANELS.map(({ label, desc }, i) => {
                        const active = activePanel === i;
                        return (
                           <button
                              key={label}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setActivePanel(i)}
                              className="group flex flex-col gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-4"
                           >
                              <div className="flex items-center px-2">
                                 {/* bullet grows in from nothing; the label slides to make room for it */}
                                 <span className={`h-4 shrink-0 bg-primary-500 transition-all duration-500 ease-out motion-reduce:transition-none ${active ? 'mr-4 w-4 rotate-0 opacity-100' : 'mr-0 w-0 -rotate-90 opacity-0'}`} />
                                 <span
                                    className={`text-[24px] leading-[normal] transition-all duration-300 ease-out motion-reduce:transition-none ${
                                       active ? 'translate-x-0 text-ink-800' : 'text-content-tertiary group-hover:translate-x-1.5 group-hover:text-content-primary'
                                    }`}
                                 >
                                    {label}
                                 </span>
                                 <ChevronRight size={20} className={`ml-auto text-primary-500 transition-all duration-300 motion-reduce:transition-none ${active ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'}`} />
                              </div>
                              {/* description unfolds under the active tab */}
                              <div className={`grid px-2 transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${active ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                 <p className="overflow-hidden text-[16px] leading-[22px] text-content-tertiary">{desc}</p>
                              </div>
                              {/* rule under each tab; the active one fills with the brand colour each time it opens */}
                              {i < PANELS.length - 1 && (
                                 <div className="relative h-px w-full bg-ink-300">
                                    <span className={`absolute inset-y-0 left-0 h-[2px] -translate-y-px bg-primary-500 transition-[width] ease-out motion-reduce:transition-none ${active ? 'w-full duration-[900ms]' : 'w-0 duration-300'}`} />
                                 </div>
                              )}
                           </button>
                        );
                     })}
                  </div>
                  {/* Frame 80:1877: 577 x 552, r24, fill #efefef (Figma literal photo backdrop). Keyed so every panel replays its entrance. */}
                  <div className="relative min-h-[520px] w-full overflow-hidden rounded-[24px] bg-[#efefef] lg:h-[552px] lg:min-h-0 lg:w-[577px] lg:shrink-0">
                     <PanelMockup key={activePanel} panel={activePanel} />
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


// "How it works" as a flow: three numbered steps joined by a light line that draws itself left -> right on desktop
// and top -> bottom on phones once the section scrolls into view (reduced-motion users get the finished line).
const STEP_MS = 650;

const HowItWorksFlow: React.FC = () => {
   const { ref, inView } = useInView<HTMLOListElement>(0.2);
   const delay = (i: number, extra = 0) => ({ animationDelay: `${i * STEP_MS + extra}ms` });

   return (
      <ol ref={ref} className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
         {PROCESS_CARDS.map((card, i) => {
            const last = i === PROCESS_CARDS.length - 1;
            return (
               <li key={card.title} className="relative flex pl-[76px] md:flex-col md:pl-0 md:pt-[84px]">
                  {/* step badge: left rail on phones, centred above the card on desktop */}
                  <div className="absolute left-0 top-0 md:left-1/2 md:-translate-x-1/2">
                     <span
                        style={delay(i)}
                        className={`grid size-14 place-items-center rounded-full bg-primary-500 font-display text-[22px] font-bold text-white shadow-lg shadow-primary-500/30 ring-[6px] ring-page ${inView ? 'dc-pop' : 'opacity-0'}`}
                     >
                        {i + 1}
                     </span>
                  </div>

                  {/* connector to the next step */}
                  {!last && (
                     <>
                        {/* desktop: horizontal, runs from this badge to the next one */}
                        <span aria-hidden="true" className="absolute left-[calc(50%+34px)] top-[26px] hidden h-[3px] w-[calc(100%-44px)] overflow-hidden rounded-full bg-primary-100 md:block">
                           <span style={delay(i, 350)} className={`relative block h-full w-full rounded-full bg-gradient-to-r from-primary-300 to-primary-500 ${inView ? 'dc-grow-x' : 'scale-x-0'}`}>
                              {inView && <span className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/90 to-transparent animate-[dcFlow_2.6s_linear_infinite] motion-reduce:hidden" style={{ animationDelay: `${(i + 1) * STEP_MS + 600}ms` }} />}
                           </span>
                        </span>
                        <span aria-hidden="true" style={delay(i, 900)} className={`absolute left-[calc(100%+12px-22px)] top-[17px] hidden size-[22px] -translate-x-1/2 place-items-center rounded-full border border-primary-200 bg-white text-primary-600 md:grid ${inView ? 'dc-pop' : 'opacity-0'}`}>
                           <ChevronRight size={13} />
                        </span>
                        {/* phones: vertical, down the left rail */}
                        <span aria-hidden="true" className="absolute bottom-[-26px] left-[26px] top-[62px] w-[3px] overflow-hidden rounded-full bg-primary-100 md:hidden">
                           <span style={delay(i, 350)} className={`relative block h-full w-full rounded-full bg-gradient-to-b from-primary-300 to-primary-500 ${inView ? 'dc-grow-y' : 'scale-y-0'}`}>
                              {inView && <span className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-white/90 to-transparent animate-[dcFlowY_2.6s_linear_infinite] motion-reduce:hidden" style={{ animationDelay: `${(i + 1) * STEP_MS + 600}ms` }} />}
                           </span>
                        </span>
                     </>
                  )}

                  <div
                     style={delay(i, 250)}
                     className={`group relative flex w-full flex-col justify-between md:flex-1 rounded-[24px] bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-500/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:min-h-[307.78px] md:p-8 ${card.gap} ${card.gradient} ${inView ? 'dc-rise' : 'opacity-0'}`}
                  >
                     <div className="mb-6 flex flex-col gap-3 md:mb-0">
                        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-primary-600">Step {i + 1}</span>
                        <h3 className={`text-[24px] font-medium leading-[normal] text-ink-800 ${card.titleWidth}`}>{card.title}</h3>
                        <p className={`text-[16px] leading-[22px] text-content-tertiary ${card.descWidth}`}>{card.desc}</p>
                     </div>
                     {card.image ? (
                        <div className="relative aspect-[520/193] w-full overflow-hidden">
                           {card.image.crop ? (
                              <img src={card.image.src} alt="" className="absolute left-[-0.01%] top-[-15.49%] h-[156.46%] w-[100.03%] max-w-none transition-transform duration-500 group-hover:scale-[1.03]" />
                           ) : (
                              <img src={card.image.src} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                           )}
                        </div>
                     ) : (
                        <div className="flex items-center gap-5">
                           {/* Group 52: three 38px circles at x = 0 / 11 / 28 */}
                           <div className="relative h-[38px] w-[66px] shrink-0">
                              {['avatar-stack-1', 'avatar-stack-2', 'avatar-stack-3'].map((img, k) => (
                                 <img
                                    key={img}
                                    src={`/assets/figma/${img}.png`}
                                    alt=""
                                    className="absolute top-0 h-[38px] w-[38px] rounded-full object-cover ring-2 ring-white transition-transform duration-300 group-hover:-translate-y-1"
                                    style={{ left: [0, 11, 28][k], transitionDelay: `${k * 60}ms` }}
                                 />
                              ))}
                           </div>
                           <span className="flex-1 font-inter text-[16px] leading-[normal] text-ink-800">&lt;15 Min Average Wait Time</span>
                        </div>
                     )}
                  </div>
               </li>
            );
         })}
      </ol>
   );
};

// "Why Dococlock" — photo collage on the left, three reasons on the right. Everything eases in on scroll.
const WhyDococlock: React.FC<{ onFindDoctor: () => void }> = ({ onFindDoctor }) => {
   const { ref, inView } = useInView<HTMLDivElement>(0.2);
   const show = (i: number, kind = 'dc-rise') => ({ className: inView ? kind : 'opacity-0', style: { '--i': i } as React.CSSProperties });

   return (
      <section ref={ref} className={`${SECTION} grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16`} aria-labelledby="why-dococlock-title">
         <div className="relative mx-auto aspect-[6/5] w-full max-w-[560px]">
            <div aria-hidden="true" className="absolute inset-x-[6%] inset-y-[4%] rounded-[36px] bg-gradient-to-br from-primary-50 to-white shadow-sm shadow-primary-500/10" />
            <div aria-hidden="true" className="absolute -left-2 top-[2%] size-24 rounded-full border-[10px] border-primary-100" />
            <img
               src="/assets/figma/badge-photo-1.png"
               alt="Dococlock doctor"
               {...show(0)}
               className={`${show(0).className} absolute left-[8%] top-[10%] h-[62%] w-[42%] rounded-[22px] object-cover object-top shadow-xl shadow-ink-900/10`}
               style={show(0).style}
            />
            <img
               src="/assets/figma/doctor-card-2.png"
               alt="Dococlock specialist"
               className={`${show(2).className} absolute right-[6%] top-[4%] h-[58%] w-[40%] rounded-[22px] object-cover object-top shadow-xl shadow-ink-900/10`}
               style={show(2).style}
            />
            <div className={`absolute bottom-[6%] left-[22%] w-[62%] ${show(4).className}`} style={show(4).style}>
               <div className="animate-float-2 motion-reduce:animate-none flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-xl shadow-ink-900/10">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600"><Clock size={22} /></span>
                  <div className="min-w-0 flex-1">
                     <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-400">Your serial</p>
                     <p className="font-display text-[26px] font-extrabold leading-none text-ink-900">24</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-3 py-1.5 text-[12px] font-semibold text-white"><span className="size-1.5 animate-pulse rounded-full bg-white" />Live</span>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-6">
            <p {...show(0)} className={`${show(0).className} text-[16px] font-medium text-primary-600`}>Why Dococlock?</p>
            <h2 id="why-dococlock-title" className={`${show(1).className} font-display text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink-900 md:text-[44px]`} style={show(1).style}>
               A smarter way to see your doctor, without the waiting room.
            </h2>
            <ul className="flex flex-col gap-5">
               {WHY_POINTS.map(({ icon: Icon, tone, text }, i) => (
                  <li key={text} className={`${show(i + 2).className} flex items-start gap-4`} style={show(i + 2).style}>
                     <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-white shadow-md ${tone}`}><Icon size={18} /></span>
                     <p className="text-[17px] leading-[1.6] text-ink-700 md:text-[18px]">{text}</p>
                  </li>
               ))}
            </ul>
            <div className={show(5).className} style={show(5).style}>
               <Button variant="figma-primary" onClick={onFindDoctor}>Find a Doctor</Button>
            </div>
         </div>
      </section>
   );
};

// Staggered entrance helper for the panel mock-ups: each block rises in `--i` steps.
const rise = (i: number) => ({ className: 'dc-rise', style: { '--i': i } as React.CSSProperties });
const PANEL_SHELL = 'absolute inset-0 flex flex-col gap-3 overflow-hidden p-4 sm:p-6 lg:p-8';

// Four animated panel UIs (the first used to be a screenshot). Keyed by the parent so each replays when its tab opens.
const PanelMockup: React.FC<{ panel: number }> = ({ panel }) => {
   if (panel === 0) return <DoctorPanelMock />;
   if (panel === 1) return <PatientPanelMock />;
   if (panel === 2) return <AppointmentPanelMock />;
   return <QueuePanelMock />;
};

const DoctorPanelMock: React.FC = () => {
   const today = useCountUp(24, 'doctor', 1100);
   const month = useCountUp(412, 'doctor', 1500);
   const done = useCountUp(14 / 24, 'doctor', 1500);
   const consulting = useCountUp(1 / 24, 'doctor', 1500);

   return (
      <div className={PANEL_SHELL}>
         <div {...rise(0)} className="flex w-fit gap-1 rounded-full bg-white p-1 shadow-sm">
            {['Overview', 'Queue', 'Appointments'].map((t, i) => (
               <span key={t} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold sm:px-4 sm:text-[12px] ${i === 0 ? 'bg-primary-500 text-white' : 'text-ink-400'}`}>{t}</span>
            ))}
         </div>
         <div {...rise(1)}>
            <p className="font-display text-[20px] font-bold leading-tight text-ink-900 sm:text-[24px]">Welcome, Dr. Rahman</p>
            <p className="text-[12px] text-ink-500 sm:text-[13px]">Track your queue and arrive on time</p>
         </div>

         <div {...rise(2)} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-[13px] font-semibold text-ink-700">Appointments</p>
            <div className="grid grid-cols-3 divide-x divide-ink-100">
               <div className="pr-2"><p className="font-stat text-[28px] font-medium leading-none tabular-nums text-primary-600 sm:text-[34px]">{Math.round(today)}</p><p className="mt-1 text-[11px] text-ink-500">Today</p></div>
               <div className="px-3"><p className="font-stat text-[28px] font-medium leading-none tabular-nums text-primary-600 sm:text-[34px]">{Math.round(month)}</p><p className="mt-1 text-[11px] text-ink-500">This month</p></div>
               <div className="pl-3"><p className="font-stat text-[28px] font-medium leading-none text-primary-600 sm:text-[34px]">+12%</p><p className="mt-1 text-[11px] text-ink-500">Progression</p></div>
            </div>
         </div>

         <div {...rise(3)} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="shrink-0 pr-1">
               <ArcGauge progress={done} inConsultation={consulting} size={112} label="14 completed, 1 in consultation, 9 waiting" />
            </div>
            <div className="min-w-0 flex-1">
               <p className="mb-2 text-[13px] font-semibold text-ink-700">Queue status</p>
               {[
                  { label: 'Completed', n: 14, dot: 'bg-primary-700' },
                  { label: 'In consultation', n: 1, dot: 'bg-primary-400' },
                  { label: 'Waiting', n: 9, dot: 'bg-primary-100 ring-1 ring-primary-200' },
               ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2 py-0.5 text-[12px] text-ink-600 sm:text-[13px]">
                     <span className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${row.dot}`} />{row.label}</span>
                     <span className="font-semibold text-ink-800">{row.n}</span>
                  </div>
               ))}
            </div>
         </div>

         <div {...rise(4)} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary-100 text-[13px] font-bold text-primary-700">
               AK
               <span className="absolute -right-0.5 -top-0.5 size-3 animate-pulse rounded-full border-2 border-white bg-primary-500" />
            </span>
            <div className="min-w-0 flex-1">
               <p className="truncate text-[14px] font-semibold text-ink-900">Ayesha K.</p>
               <p className="text-[12px] text-ink-500">Serial #15 · Now consulting</p>
            </div>
            <span className="btn-sheen inline-flex h-9 items-center rounded-full bg-primary-500 px-4 text-[12px] font-semibold text-white">Consult Next</span>
         </div>
      </div>
   );
};

const PatientPanelMock: React.FC = () => {
   const serial = useCountUp(24, 'patient', 900);
   return (
      <div className={PANEL_SHELL}>
         <div {...rise(0)} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-100 font-display font-bold text-primary-600 sm:size-14">DR</div>
            <div className="min-w-0 flex-1">
               <p className="truncate font-display font-bold text-ink-800">Dr. Sarah Rahman</p>
               <p className="text-[12px] text-ink-500">Cardiology &middot; Today, 4:30 PM</p>
            </div>
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700">Confirmed</span>
         </div>
         <div {...rise(1)} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div>
               <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Your Serial</p>
               <p className="font-display text-3xl font-bold tabular-nums text-ink-800">{Math.round(serial)}</p>
            </div>
            <span className="btn-sheen relative inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-[13px] font-semibold text-white">
               <span aria-hidden="true" className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary-500/40 motion-reduce:hidden" />
               Track Live
            </span>
         </div>
         <div {...rise(2)} className="flex-1 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">Recent Prescriptions</p>
            {['Amoxicillin 500mg', 'Paracetamol 500mg'].map((rx, i) => (
               <div key={rx} {...rise(3 + i)} className="flex items-center gap-3 border-b border-ink-50 py-2.5 last:border-0">
                  <span className="dc-pop size-2 shrink-0 rounded-full bg-primary-500" style={{ '--i': 4 + i } as React.CSSProperties} />
                  <span className="text-[13px] text-ink-700">{rx}</span>
               </div>
            ))}
         </div>
      </div>
   );
};

const AppointmentPanelMock: React.FC = () => {
   const appts = [{ t: '10:00 AM', n: 'John Doe' }, { t: '11:30 AM', n: 'Fatima Akter' }, { t: '2:00 PM', n: 'Rahim Uddin' }];
   return (
      <div className={PANEL_SHELL}>
         <div {...rise(0)} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="mb-3 font-display font-bold text-ink-800">Pick a day</p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-center text-[10px] font-semibold text-ink-400">{d}</span>)}
               {Array.from({ length: 14 }).map((_, i) => (
                  <div
                     key={i}
                     style={{ '--i': 2 + i * 0.4 } as React.CSSProperties}
                     className={`dc-pop relative flex aspect-square items-center justify-center rounded-lg text-[12px] ${i === 9 ? 'bg-primary-500 font-bold text-white shadow-md shadow-primary-500/30' : 'bg-ink-50 text-ink-500'}`}
                  >
                     {i === 9 && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-lg bg-primary-500/30 motion-reduce:hidden" />}
                     <span className="relative">{i + 1}</span>
                  </div>
               ))}
            </div>
         </div>
         <div {...rise(2)} className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Today&apos;s Appointments</p>
            {appts.map((a, i) => (
               <div key={a.t} {...rise(4 + i)} className="flex items-center gap-3 rounded-xl bg-ink-50/70 px-3 py-2.5">
                  <span className="w-[68px] shrink-0 text-[12px] font-bold text-primary-600">{a.t}</span>
                  <span className="flex-1 text-[13px] text-ink-700">{a.n}</span>
                  <Check size={14} className="text-primary-500" />
               </div>
            ))}
         </div>
      </div>
   );
};

const QueuePanelMock: React.FC = () => {
   const [serving, setServing] = useState(24);
   // The queue ticks forward every few seconds so the panel feels live.
   useEffect(() => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const id = setInterval(() => setServing((n) => (n >= 26 ? 24 : n + 1)), 2600);
      return () => clearInterval(id);
   }, []);
   const minutes = useCountUp(18, 'queue', 1100);
   const angle = useCountUp(300, 'queue', 1400);
   const upcoming = [serving + 1, serving + 2, serving + 3];

   return (
      <div className={`${PANEL_SHELL} items-center justify-center gap-6`}>
         <div {...rise(0)} className="relative grid size-40 place-items-center rounded-full" style={{ ...rise(0).style, background: `conic-gradient(rgb(var(--color-primary-500)) 0deg ${angle}deg, rgb(var(--color-primary-100)) ${angle}deg 360deg)` }}>
            <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white">
               <span className="font-display text-3xl font-bold tabular-nums text-ink-800">{Math.round(minutes)}</span>
               <span className="text-[11px] text-ink-400">Minutes Left</span>
            </div>
         </div>
         <div {...rise(1)} className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm">
            <span key={serving} className="dc-pop grid size-10 place-items-center rounded-full bg-primary-500 text-sm font-bold tabular-nums text-white">{serving}</span>
            <div>
               <p className="text-[13px] font-bold text-ink-800">John Doe</p>
               <p className="flex items-center gap-1.5 text-[11px] text-ink-400"><span className="size-1.5 animate-pulse rounded-full bg-primary-500" />Now Serving</p>
            </div>
         </div>
         <div {...rise(2)} className="flex gap-2">
            {upcoming.map((n, i) => (
               <span key={n} className={`rounded-full bg-white px-3.5 py-1.5 text-[12px] font-semibold tabular-nums shadow-sm ${i === 2 ? 'text-primary-600 ring-1 ring-primary-200' : 'text-ink-500'}`}>#{n}</span>
            ))}
         </div>
      </div>
   );
};
