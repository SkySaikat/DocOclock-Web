// DocOClock Figma build workflow (repo copy - self-contained, re-runnable).
// Run with the Workflow tool:  Workflow({ scriptPath: '<abs path to this file>', args: { only: ['patient-live-appts', 'patient-rx-meds'] } })
// Units (see UNITS below): doctor-queue, doctor-overview, patient-live-appts, patient-rx-meds, doctor-appointments, doctor-prescription,
// doctor-analytics, doctor-manage, doctor-account, patient-doctors, marketing-pages.  Run TWO units at a time (usage-limit friendly).
// Each unit = build -> independent review -> fix (if blocking) -> commit (only that unit's files, on main).
// Options: args.only=[keys]; args.skipBuild=true (WIP already on disk -> straight to review/fix/commit); args.baseline='<commit>' (git ref of the last reviewed state, used by reviewer/fixer for diffs).
// Progress + resume guide: docs/figma/PROGRESS.md
export const meta = {
  name: 'figma-build-2',
  description: 'Build Doctor Queue, Doctor Overview and the patient dashboard (live queue/appointments, prescriptions/medicines) from Figma with independent review + fix passes',
  phases: [
    { title: 'Build', detail: '4 units in parallel: extract from Figma + implement, disjoint file ownership' },
    { title: 'Review', detail: 'independent no-behaviour-change audit + pixel/interaction verification' },
    { title: 'Fix', detail: 'only if the reviewer found blocking issues' },
    { title: 'Commit', detail: 'commit only this unit\'s files so progress survives interruptions' },
  ],
}

const BASE = [
  'PROJECT: DocOClock web app (React 19 + Vite + Tailwind 3 + TypeScript; CLAUDE.md is in your context - obey its theming rules). Goal: match the Figma file "DocOClock" (fileKey zJRyAML8hv0uEBOXtu5Hpn, page "Web Version V1") EXACTLY - layout, components, hover/prototype motion - while keeping ALL existing behaviour.',
  'FIRST read docs/figma/BUILD_RULES.md completely (ownership, no-behaviour-change, shared components, theme, motion, verification incl. the headless-Chrome driver because the browser pane cannot hover). Then read docs/figma/tokens.md (sections 1-11), the parts of docs/figma/flows.md relevant to your frames, docs/figma/specs/dashboard-components.md (component library: typography, buttons, chips, cards, toasts, pickers) and components/dashboard/index.ts plus the primitives you use. Foundation tokens and the shared chrome (navbar, avatar menu, bottom bar, toasts, page backgrounds/gutters) are DONE - reuse them, never rebuild them.',
  'NOTE about "Flow 1": in this Figma file Flow 1 is a LEGACY flow (old doctor list -> doctor detail). The current patient-dashboard prototype is the flow named "Patient" (start node 339:15916, 14 frames) and the doctor console is one connected graph (flows Prescription / Queue / Appointments / Phone View) - see docs/figma/flows.md.',
].join('\n')

const SCHEMAS = {
  build: {
    type: 'object',
    properties: {
      unit: { type: 'string' }, summary: { type: 'string' },
      filesChanged: { type: 'array', items: { type: 'string' } },
      newFiles: { type: 'array', items: { type: 'string' } },
      framesImplemented: { type: 'array', items: { type: 'string' } },
      interactions: { type: 'array', items: { type: 'string' } },
      verification: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, result: { type: 'string' } }, required: ['check', 'result'] } },
      notImplemented: { type: 'array', items: { type: 'string' } },
      sharedGaps: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } },
    },
    required: ['unit', 'summary', 'filesChanged', 'verification'],
  },
  review: {
    type: 'object',
    properties: {
      unit: { type: 'string' }, verdict: { type: 'string', enum: ['PASS', 'FIX'] },
      logicHunks: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'number' }, what: { type: 'string' }, safe: { type: 'boolean' } }, required: ['file', 'what', 'safe'] } },
      blocking: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'number' }, problem: { type: 'string' }, evidence: { type: 'string' }, suggestedFix: { type: 'string' } }, required: ['problem', 'evidence'] } },
      nonBlocking: { type: 'array', items: { type: 'string' } },
      checks: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, result: { type: 'string' } }, required: ['check', 'result'] } },
    },
    required: ['unit', 'verdict', 'blocking', 'checks'],
  },
}

const UNITS = [
  {
    key: 'doctor-queue', title: 'Doctor Queue ("Doctor Q")', port: 3111, cdp: 9341, rport: 3121, rcdp: 9351,
    owned: ['views/doctor/SerialManager.tsx'],
    newFiles: 'components/doctor/queue/** (presentational sub-components extracted from SerialManager; no state/effects moved) + docs/figma/specs/doctor-queue.md + docs/figma/reference/doctor-queue/**',
    routes: 'as doctor: /doctor/serial-manager (mock data has appointments today in several statuses; exercise start / pause / resume / next / skip / complete / settings modal / confirm modal); phone width 390x844 too',
    frames: [
      '368:14306 Queue - LIVE state 1440x800 (Dashboard Header, Queue Manage Row: current-patient card with Live tag / avatar / info columns / Serial No. toggle / Trail Icon Button / Verified chip; Card 4 with stethoscope; Queue Card with segmented "Rate" bar (25 rounded rects) + 4 legend counts; Queue Row "Up Next" cards 320x154 + "View All (10)") - 17 reactions',
      '328:14902 Queue - PAUSED state 1440x800 ("Paused", "Available in 20 Mins", Buttons - Dashboard, Card 4) - 8 reactions',
      '368:14285 Modal (confirm, 411x142) and 368:15791 Card 3 (queue settings modal 447x420: text, tab buttons, serial boxes "24 : 30", number chips 4/3/5/6/7, buttons)',
      '255:9358 Queue Card (363x801 patient list card) and 306:13608 Queue Card (418x358)',
      'top-level flow frames 328:13919 (PROTOTYPE FLOW START "Queue", 13 reactions) and 255:8163 (7 reactions); phone frames 341:18476 (400x917, flow "Phone View") and 368:17738 (400x873); small frames 339:17446, 357:25075, 368:18792, 368:18723, 368:18727 (identify them)',
    ],
    task: [
      'Map the Figma regions to the JSX regions of views/doctor/SerialManager.tsx (1157 lines, the most complex file - read ALL of it first and write down every state variable, effect, handler and storage call; none may change). Because the file is huge, extract purely presentational chunks into components/doctor/queue/** (props in, JSX out) so that logic stays in SerialManager and the JSX shrinks; do this only where it is behaviour-neutral.',
      'Implement every state the Figma shows: live (with current patient), paused/available-in, empty, up-next cards, queue-status legend, settings modal (Card 3), confirm modal, toasts (use the existing toast API), phone layouts. Wire Figma interactions to the EXISTING actions (e.g. Figma "Start"/"Pause" buttons -> the existing start/pause handlers; modals open/close from the existing triggers).',
      'FUNCTIONAL CONSTRAINTS: session start/pause/resume/end, call next / skip / complete / absent, serial numbers and ordering, per-chamber selection, session meta (average time per patient, breaks), countdown/timers, realtime/polling refreshes, prescription hand-off (onStartPrescription), manual booking links, notifications to patients, keyboard access, loading/empty/error states. Data comes from the same hooks/storage calls as today.',
    ],
  },
  {
    key: 'doctor-overview', title: 'Doctor Overview (doctor dashboard home)', port: 3112, cdp: 9342, rport: 3122, rcdp: 9352,
    owned: ['views/doctor/Dashboard.tsx', 'components/ui/ArcGauge.tsx', 'components/ui/StatCard.tsx', 'components/ui/DoctorDashboardProfile.tsx', 'components/ui/ChamberCard.tsx'],
    newFiles: 'components/doctor/overview/** + docs/figma/specs/doctor-overview.md + docs/figma/reference/doctor-overview/** (2 PNGs already exist)',
    routes: 'as doctor: /doctor/dashboard (both chambers via the hospital switcher; empty-data states via ?as=doctor variants if the harness has them); phone width 390x844',
    frames: [
      '339:17421 Overview page 1440x800 (7 reactions): "Welcome" header + subtitle + hospital switcher pill with icon button (top right); left profile card (large photo, name + arrow icon button, Designation / Active hospital rows); Appointments card (Today / This Month / Progression, big numbers); Queue Status card (arc gauge + legend Completed / In consultation / Waiting + "Today" chip); Earning card (Earning / Total rows + "Today" chip)',
      '368:18696 frame "7" 179x117 = hospital-switcher popover (ON_CLICK overlay)',
      'components used: see dashboard-components spec (Typography - Dashboard, User Card, buttons) and the reference PNGs docs/figma/reference/doctor-overview/*.png',
    ],
    task: [
      'The user calls this screen "Doctor Overview (the doctor profile page)". Build it EXACTLY like Figma (the current layout - a banner profile card with CARDIOLOGIST/VERIFIED tags, BMDC and stat tiles - is different from Figma; follow Figma, keep the data hooks, and list anything Figma drops under notImplemented).',
      'ArcGauge: Figma\'s Queue Status is a rounded semicircle/arc with three segment colours (Completed / In consultation / Waiting) - keep the component API (real data-driven SVG path, not a static image) and restyle to the Figma geometry; grep its usages first and add a variant if any usage is outside the doctor dashboard.',
      'FUNCTIONAL CONSTRAINTS: hospital/chamber switcher (select active chamber -> data refresh), today / month appointment counts and progression, queue-status counts, earning numbers, navigation to profile (arrow button -> the existing profile route), loading / empty / error states, the same data hooks as today. Numbers/formatting must come from real data (no hardcoded Figma numbers).',
    ],
  },
  {
    key: 'patient-live-appts', title: 'Patient dashboard: Live Queue + Appointments', port: 3113, cdp: 9343, rport: 3123, rcdp: 9353,
    owned: ['views/patient/LiveSerial.tsx', 'views/patient/Appointments.tsx', 'components/ui/AppointmentCard.tsx'],
    newFiles: 'components/patient/live/** + docs/figma/specs/patient-live-appts.md + docs/figma/reference/patient-live-appts/**',
    routes: 'as patient: /live-serial (mock patient has serial #9 in Dr. Sarah\'s queue today), /patient/appointments; phone width 390x844 (Figma phone frames 357:19153 / 357:19210)',
    frames: [
      '339:15916 Queue = "Live Queue" (PROTOTYPE FLOW START "Patient"; gradient background; Track Your Queue and arrive on time, People Ahead, Reporting Time, Session, Address, Ongoing, Consulting) 1440x800; 297:12283 Queue variant 1440x800; phone frames 357:19153 (402x877) and 357:19210 (402x880)',
      '191:5570 Appointments 1440x800 (table: Doctor / Date / Serial / Status / Action, Add Appointment button, filter icon -> Sort menu overlay 368:16699, date pill -> Date and time - Pickers overlay 396:12025, "3 Buttons")',
      'related overlays/components: Sort menu 368:16699, Date and time - Pickers 396:12025 (also 317:14984), Toaster frames; the profile menu is chrome (done)',
    ],
    task: [
      'LiveSerial.tsx (411 lines) and Appointments.tsx (337 lines): read fully first; keep all live-serial logic (subscription/polling, position calculation, notifications) and appointment logic (cancel, reschedule, review via ReviewModal, navigation to booking). components/ui/AppointmentCard.tsx is ALSO used by doctor screens: grep usages and add a variant/prop instead of changing the default look.',
      'Implement the Figma table/cards, status chips, action buttons, date-pill + picker overlay and sort menu using the existing dashboard primitives (SortMenu, SearchField, DashboardButton...). The date picker/sort/filter must operate on the real appointment data the page already has (Figma shows them as prototype overlays; wire them to the page\'s existing filtering if it exists, otherwise implement client-side filtering/sorting purely in the view without changing data fetching, and mention it in the summary).',
      'FUNCTIONAL CONSTRAINTS: real-time serial updates, cancel/reschedule flows, review prompts, deep links into the booking wizard (DoctorProfile), empty states, session-expiry behaviour, mobile layouts.',
    ],
  },
  {
    key: 'patient-rx-meds', title: 'Patient dashboard: Prescriptions + Medicines', port: 3114, cdp: 9344, rport: 3124, rcdp: 9354,
    owned: ['views/patient/Prescriptions.tsx', 'views/patient/MedicineTracker.tsx'],
    newFiles: 'components/patient/meds/** + docs/figma/specs/patient-rx-meds.md + docs/figma/reference/patient-rx-meds/**',
    routes: 'as patient: /patient/prescriptions (mock patient has prescriptions), /patient/medicine-tracker (add medicine, mark as taken, missed states); phone width 390x844',
    frames: [
      '297:12584 Prescriptions 1440x800 (table: Doctor / Date / Time / Status / Action, date pill -> picker overlay, "3 Buttons" inactive)',
      '339:16108 Medicines 1440x869 (medicine cards e.g. "Napa 2 Pills Now", Mark As Taken chip with hover variant, Missed, "Add Medicine" button) and 191:5104 Medicines variant 1440x869',
      '339:15402 Modal "Add Medicines" 565x549 (Search Medicine, Morning/Noon/Night dosage, Duration, Instruction; Cancel / Confirm) and Toasters 399:12826 (203x800) / 399:12818 (298x800)',
    ],
    task: [
      'Prescriptions.tsx (405 lines) and MedicineTracker.tsx (291 lines): read fully first. Keep prescription list/detail, PDF download (pdf/prescriptions/* is out of scope - keep the existing calls untouched), medicine tracking (localStorage map `dococlock_medicine_taken_map` via storage.ts), add/remove medicine logic and toasts.',
      'Implement: the Figma tables/cards, status chips, the "Mark As Taken" chip hover variant (ON_HOVER CHANGE_TO variant, SMART_ANIMATE 0.3s) and its click -> toaster, the Add Medicines modal (open on Add Medicine, Cancel closes, Confirm saves via the EXISTING add handler and shows the existing toast), date pill + picker overlay.',
      'FUNCTIONAL CONSTRAINTS: prescription viewing/downloading, medicine schedule generation and taken/missed state, notifications/toasts, empty states, mobile layouts.',
    ],
  },,
  {
    key: 'doctor-appointments', title: 'Doctor Appointments (list, filters, booking modals, date/time pickers, toaster)', port: 3115, cdp: 9345, rport: 3125, rcdp: 9355,
    owned: ['views/doctor/DoctorAppointments.tsx'],
    newFiles: 'components/doctor/appointments/** + docs/figma/specs/doctor-appointments.md + docs/figma/reference/doctor-appointments/** (do NOT edit components/ui/AppointmentCard.tsx - owned by unit patient-live-appts; build local components instead)',
    routes: 'as doctor: /doctor/appointments (list, filters, open/close every modal); phone width 390x844',
    frames: [
      '255:11674 Appointments 1440x800 (PROTOTYPE FLOW START "Appointments", 18 reactions) and 255:12102 Appointments 1440x800 (8 reactions)',
      '317:14984 Date and time - Pickers 396x356; Modals 255:12870 (612x414), 255:13068 (612x580), 255:14107 (612x422) - identify each (book / reschedule / cancel / manual booking ...); Toaster 368:16641',
    ],
    task: [
      'Read views/doctor/DoctorAppointments.tsx (161 lines) fully first. Map each Figma modal to an EXISTING feature (do not invent flows); anything Figma shows with no existing feature goes under notImplemented. Keep the status chart/history, filters, status changes and the toast API.',
      'FUNCTIONAL CONSTRAINTS: appointment list/filters, status transitions (accept/complete/cancel/reschedule as they exist today), navigation to the queue/prescription, manual-booking entry, loading/empty states, mobile layout.',
    ],
  },
  {
    key: 'doctor-prescription', title: 'Doctor Prescription (editor, list, toaster)', port: 3116, cdp: 9346, rport: 3126, rcdp: 9356,
    owned: ['views/doctor/PrescriptionEditor.tsx'],
    newFiles: 'components/doctor/prescription/** + docs/figma/specs/doctor-prescription.md + docs/figma/reference/doctor-prescription/** (components/prescriptions/** may be edited only if used solely by PrescriptionEditor - grep first)',
    routes: 'as doctor: /doctor/prescription (find how the editor is reached - probably from the queue via onStartPrescription - and exercise templates, medicine rows, save); phone width 390x844',
    frames: [
      '307:13617 Prescriptions 1440x800 (PROTOTYPE FLOW START "Prescription", 10 reactions), 257:13749 Prescription 1440x800, 257:13781 Prescription 1440x800 (9), 317:15542 Prescription 1440x985 (9), 328:15460 frame "3" 136x119, Toaster 619:13780',
    ],
    task: [
      'UI only: PDF generation (pdf/prescriptions/*) is out of scope and untouched. Read PrescriptionEditor.tsx (811 lines) fully first and list every state/handler; map form sections, medicine rows, template picker and history to the Figma frames.',
      'FUNCTIONAL CONSTRAINTS: prescription create/save (prescriptions + prescription_medicines), template choice, patient context, autosave/draft behaviour if any, validation, toasts, navigation back to the queue.',
    ],
  },
  {
    key: 'doctor-analytics', title: 'Doctor Analytics', port: 3117, cdp: 9347, rport: 3127, rcdp: 9357,
    owned: ['views/doctor/Analytics.tsx'],
    newFiles: 'components/doctor/analytics/** + docs/figma/specs/doctor-analytics.md + docs/figma/reference/doctor-analytics/**',
    routes: 'as doctor: /doctor/analytics (all charts, filters/tabs, tooltips on hover); phone width 390x844',
    frames: ['257:10189 Analytics 1440x1008 (6 reactions), 341:17922 frame "3" 136x117 (probably a sort/filter popover)'],
    task: [
      'Read Analytics.tsx (376 lines) first. Chart series colours must come from useTheme() (recharts props take literal colours) - map Figma chart colours to theme colours vs fixed semantic colours and say which is which.',
      'FUNCTIONAL CONSTRAINTS: real aggregate data, period filters, chart types, tooltips, empty states.',
    ],
  },
  {
    key: 'doctor-manage', title: 'Doctor Manage (practice settings, assistants, manual registry, panels)', port: 3118, cdp: 9348, rport: 3128, rcdp: 9358,
    owned: ['views/doctor/DoctorMore.tsx', 'views/doctor/DoctorPracticeSettings.tsx', 'views/doctor/PatientManualRegistry.tsx', 'components/doctor/AssistantManager.tsx'],
    newFiles: 'components/doctor/manage/** + docs/figma/specs/doctor-manage.md + docs/figma/reference/doctor-manage/** (components/ui/ChamberCard.tsx is owned by unit doctor-overview - do not edit it)',
    routes: 'as doctor: /doctor/practice-settings, /doctor/manual-booking, /doctor/profile; phone width 390x844',
    frames: [
      '257:10013 Manage 1440x800 (9 reactions); panels 368:16746 (frame "1" 696x636), 368:17322 (frame "6" 644x636), 368:16869 (frame "5" 696x693); Toasters 368:17311, 368:17538',
    ],
    task: [
      'Identify which Manage sub-panels the Figma frames are (chambers/schedules, assistants, manual registry, ...) and map them to the four owned files (614 + 423 + 190 + 185 lines: read them first). Keep every settings form, schedule editor, assistant permission toggle and manual-registration flow working exactly as today.',
      'FUNCTIONAL CONSTRAINTS: chamber/schedule CRUD, assistant creation/permissions, manual patient registration + booking, validations, toasts.',
    ],
  },
  {
    key: 'doctor-account', title: 'Doctor Account / Profile editor / Payment', port: 3119, cdp: 9349, rport: 3129, rcdp: 9359,
    owned: ['views/doctor/DoctorProfileEditor.tsx', 'views/doctor/PaymentSubscription.tsx'],
    newFiles: 'components/doctor/account/** + docs/figma/specs/doctor-account.md + docs/figma/reference/doctor-account/**',
    routes: 'as doctor: /doctor/profile-editor, /doctor/payment; phone width 390x844',
    frames: [
      '276:13531 Account 1440x800 (1 reaction) and 276:13827 Activity Log 1440x800 (1 reaction) - section 276:13530',
      'section "Doctor Profile" 254:8267: Queue 257:14343 and 257:14975 (0 reactions), Manage 276:12338 and 276:12374, Toasters 368:17551 / 368:17561, Modal 368:17567 - find out what these are (doctor own-profile pages?)',
      'section "Payment & Subscription" 341:18165 has 0 children (no design) - keep PaymentSubscription.tsx visually consistent with the chrome only',
    ],
    task: [
      'The profile menu (chrome) already omits Activity History / Help & FAQ / Privacy & Security / Google Calendar because the app has no routes for them. Decide per Figma frame: map Account -> DoctorProfileEditor (existing feature); Activity Log has no data source - list under notImplemented unless an existing table clearly supports it.',
      'FUNCTIONAL CONSTRAINTS: profile edit + image upload, verification status display, password/phone changes as they exist, payment/subscription views as they exist.',
    ],
  },
  {
    key: 'patient-doctors', title: 'Patient: doctor list + doctor profile / booking wizard', port: 3120, cdp: 9350, rport: 3130, rcdp: 9360,
    owned: ['views/patient/DoctorSearchView.tsx', 'views/patient/DoctorSearch.tsx', 'views/patient/DoctorProfile.tsx'],
    newFiles: 'components/patient/doctors/** + docs/figma/specs/patient-doctors.md + docs/figma/reference/patient-doctors/** (reuse components/ui/DoctorCard.tsx reveal mode from the landing work; do not edit it). NOTE: another session is fixing camelCase/snake_case field mapping (experienceYears/totalPatients, profiles.name/image) in patient views - do NOT touch data mapping.',
    routes: 'as patient: /patient/doctors, /patient/profile (doctor profile + 4-step booking wizard); as guest: /patient/doctors; phone width 390x844',
    frames: [
      '396:12430 List Page 1304x870 (patient dashboard "Appointments" overlay: Filter & Sort, Type, Experience, doctor grid; 8 Doctor Cards with the hover morph) and 601:13524 List Page 1304x870 (doctor detail: back arrow, Personal Information, BMDC, Consultation Fee, Follow-Up Fee)',
      '601:12927 Main 1440x894, 601:13040 Main 1440x959, 601:13140 Main 1440x959 (booking wizard visuals) and the public list pages 80:1482 / 326:13058 (1460x3962, filter popovers; see docs/figma/specs/landing-pages.md which is already extracted)',
    ],
    task: [
      'Read DoctorProfile.tsx (822 lines, includes the 4-step booking wizard Hospital / Appointment / Patient Details / Review) and DoctorSearchView.tsx / DoctorSearch.tsx fully first. Reuse the existing Figma-exact doctor-card hover (DoctorCard reveal / landing components) for the grid.',
      'FUNCTIONAL CONSTRAINTS: search + type/experience filters, pagination/infinite scroll as today, the whole booking wizard (chamber selection, date/slot selection, patient details, confirmation, payment/fee display, login gate via pendingAction BOOKING), reviews, deep links from the landing page.',
    ],
  },
  {
    key: 'marketing-pages', title: 'Other pre-login pages (hospitals, labs, blogs, about, contact, for-doctors)', port: 3121, cdp: 9351, rport: 3131, rcdp: 9361,
    owned: ['views/marketing/HospitalsPage.tsx', 'views/marketing/LabDiagnosticsPage.tsx', 'views/marketing/BlogsPage.tsx', 'views/marketing/AboutUsPage.tsx', 'views/marketing/ContactUsPage.tsx', 'views/doctor/DoctorLanding.tsx'],
    newFiles: 'components/marketing/** + docs/figma/specs/marketing-pages.md (the extraction spec docs/figma/specs/landing-pages.md and its reference PNGs ALREADY exist - use them; do not re-extract everything)',
    routes: 'as guest: /hospitals, /lab-diagnostics, /blogs, /about-us, /contact-us, /for-doctors; phone width 390x844',
    frames: ['see docs/figma/specs/landing-pages.md section 0 (which Figma frame is which product page) and docs/figma/reference/landing-pages/*.png'],
    task: [
      'Lowest priority unit. Follow landing-pages.md section 0 for the frame -> page mapping; only build pages whose Figma frames exist. Keep forms (contact), blog data, hospital lists as they work today.',
    ],
  }
]

function buildPrompt(u) {
  return [
    BASE, '',
    'UNIT KEY: ' + u.key + ' (' + u.title + '). YOUR DEV-SERVER PORT: ' + u.port + '. YOUR CDP PORT (headless Chrome driver): ' + u.cdp + '.',
    'OWNED FILES: ' + u.owned.join(', '),
    'NEW-FILE LOCATIONS: ' + u.newFiles,
    'ROUTES TO VERIFY: ' + u.routes,
    'FIGMA FRAMES (page Web Version V1):', u.frames.map(f => '  - ' + f).join('\n'),
    '',
    'STEPS',
    '1. EXTRACT from Figma yourself (no spec exists for these frames): for every frame get_design_context (exact px / classes / assets), save a 2x reference PNG to docs/figma/reference/' + u.key + '/<slug>-<id with : as _>.png (get_screenshot maxDimension 2880 -> curl -L), download every asset you need into public/assets/figma/' + u.key + '/ (sha256-dedupe against existing files), run the reactions snippet on each frame and the variant-diff snippet for every ON_HOVER/CHANGE_TO pair, and get_motion_context(recursive) once per screen. Write compact build notes to docs/figma/specs/' + u.key + '.md (<= 150 lines: frame table, interactions table with exact trigger/action/transition values, token decisions, deviations, not implemented).',
    '2. Read the current implementation fully, then implement per the task below.',
    ...u.task.map((t, i) => (i + 3) + '. ' + t),
    (u.task.length + 3) + '. VERIFY everything in docs/figma/BUILD_RULES.md (types, visual vs reference PNGs at 1440x900 and 390x844, interactions with the CDP driver, console, npm run build at the very end, stop server + close browser tab/Chrome).',
    'Keep your final answer compact: the structured summary only (framesImplemented = Figma frame ids you matched; interactions = one line each, with exact values).',
  ].join('\n')
}

function reviewPrompt(u, built) {
  return [
    BASE, '',
    'YOU ARE THE INDEPENDENT REVIEWER for unit "' + u.key + '" (you did NOT write the code; be skeptical, assume mistakes). YOUR DEV-SERVER PORT: ' + u.rport + '. YOUR CDP PORT: ' + u.rcdp + '. You may NOT edit any file; write only screenshots under docs/figma/verify/' + u.key + '/.',
    'OWNED FILES of the unit: ' + u.owned.join(', ') + '. NEW files: ' + u.newFiles + '. Routes: ' + u.routes + '.',
    'BUILDER SUMMARY (claims - verify, do not trust): ' + JSON.stringify(built),
    'CHECKS',
    'A. NO-BEHAVIOUR-CHANGE AUDIT: read the full `git diff` of the owned files (note: the repo HEAD already contains earlier foundation/chrome work; diff only shows this unit\'s changes plus anything uncommitted) and every new file. Classify every hunk PURE-STYLE (classes / JSX structure only) or LOGIC (props, state, effects, handlers, queries, conditions, data sources, routes, exported signatures, text/number formatting sources). Report every LOGIC hunk with file:line and safe true/false. Verify each original state variable, effect, handler and storage call still exists and is still wired to an equivalent control (build a checklist from the ORIGINAL file via `git show HEAD:<file>`). Anything that could change runtime behaviour = blocking.',
    'B. VISUAL FIDELITY: compare the running screens against the Figma reference PNGs (open both) at 1440x900 and 390x844; measure with getComputedStyle/getBoundingClientRect against the numbers in the notes and re-verify a sample directly in Figma (get_design_context / read-only use_figma). List EVERY discrepancy (spacing, size, radius, colour, font family/size/weight/line-height, shadow, icon, alignment, missing element) with measured vs expected. Sub-pixel differences are non-blocking; anything a designer would notice is blocking. Data-driven differences (mock numbers/names) are not discrepancies.',
    'C. INTERACTIONS: exercise every hover / press / open / close / focus-visible behaviour with the CDP driver (real mouse events); sample computed styles at t=0/90/210/350ms and confirm property, duration (0.3s unless the Figma reaction says otherwise), easing cubic-bezier(0,0,.58,1); confirm keyboard focus parity, reduced-motion (c.media prefers-reduced-motion reduce) and touch fallback; confirm no layout shift.',
    'D. THEME / TOKENS: grep the diff for new literal hex/rgb/rgba/inline colours and hand-written SVG; classify each (allowed fixed semantic / decorative from theme vars / violation). Change the theme primary via CSS variables and confirm the unit recolours.',
    'E. BUILD + CONSOLE: tsc clean (excluding supabase/functions), `npm run build` passes (retry if other agents are mid-edit in files this unit does not own), console has no errors introduced by the unit.',
    'F. SHARED-COMPONENT SAFETY: for every shared component the unit touched grep usages and load the out-of-scope screens that use it (e.g. ?as=admin, ?as=hospital, ?as=branch, ?as=assistant, /hospitals, /about-us) to confirm they are unchanged.',
    'Return verdict FIX if there is ANY blocking item, else PASS.',
  ].join('\n')
}

function fixPrompt(u, r) {
  return [
    BASE, '',
    'UNIT KEY: ' + u.key + '. YOUR DEV-SERVER PORT: ' + u.port + '. YOUR CDP PORT: ' + (u.cdp + 20) + '. You are the FIX agent: an independent reviewer found blocking problems in the previous builder\'s work. Fix ALL of them (and only them) inside OWNED FILES: ' + u.owned.join(', ') + ' / NEW-FILE LOCATIONS: ' + u.newFiles + '.',
    'REVIEW FINDINGS (JSON): ' + JSON.stringify(r.rv),
    'For every blocking finding: reproduce it first, fix it, prove the fix with the same measurement the reviewer used, then re-run the full verification in docs/figma/BUILD_RULES.md for the affected screens. If you believe a finding is wrong, prove it with a measurement and say so.',
  ].join('\n')
}

const COMMIT_SCHEMA = { type: 'object', properties: { committed: { type: 'boolean' }, hash: { type: 'string' }, files: { type: 'number' }, note: { type: 'string' } }, required: ['committed'] }
function commitPrompt(u, r) {
  const b = r.built || {}, f = r.fx || {}
  const paths = Array.from(new Set([].concat(b.filesChanged || [], b.newFiles || [], f.filesChanged || [], f.newFiles || [], u.owned, [
    'docs/figma/specs/' + u.key + '.md', 'docs/figma/reference/' + u.key, 'docs/figma/verify/' + u.key, 'public/assets/figma/' + u.key,
  ])))
  const verdict = r.rv ? r.rv.verdict : 'n/a'
  return [
    'You are the COMMIT agent for unit "' + u.key + '" of the DocOClock Figma build. The unit has finished (reviewer verdict: ' + verdict + (r.fx ? '; a fix pass was applied but NOT re-reviewed' : '') + ').',
    'Do exactly this with Bash, nothing else:',
    '1. cd to the repo root. Run `git status --short` and look at it.',
    '2. Stage ONLY this unit\'s paths that exist (skip missing ones; paths may be relative or absolute inside the repo): ' + JSON.stringify(paths) + '. Use `git add -- <path>` per path (directories are fine). NEVER use `git add -A` / `git add .` / `git commit -a` - other units are being built at the same time and their half-finished files must not be committed.',
    '3. If nothing is staged, stop and report committed=false. Otherwise run `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "^supabase/functions"` - if it reports errors in the staged files, do NOT commit; report committed=false with the errors in note.',
    '4. Commit with a HEREDOC message: first line `feat(figma): ' + u.title + ' - match Figma (review ' + verdict + ')`, a short body listing the frames implemented and any notImplemented items from this summary: ' + JSON.stringify({ frames: b.framesImplemented, notImplemented: b.notImplemented }).slice(0, 1500) + ', and end with the trailer line `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Do not push. Do not amend other commits. No other git state changes.',
    '5. Report the short hash, number of files, and any note.',
  ].join('\n')
}

const ONLY = (args && args.only) ? args.only : null
const RUN = ONLY ? UNITS.filter(u => ONLY.includes(u.key)) : UNITS
const EXTRA = [
  '',
  'RESILIENCE + HYGIENE (read carefully):',
  '(1) An earlier run of this unit may have been INTERRUPTED by a usage-limit pause. Before starting, check `git status` / `git diff` for your owned files, docs/figma/specs/<unit>.md and docs/figma/reference/<unit>/ - if partial work already exists, CONTINUE from it instead of restarting, and never redo Figma extraction that already exists on disk.',
  '(2) Write progress notes to docs/figma/specs/<unit>.md incrementally (after each frame extracted and after each region implemented) so an interruption loses little.',
  '(3) Ignore .claude/worktrees/** in every grep / find / tsc scan (another session\'s copy of the repo lives there) and never edit anything under it.',
  '(4) Be economical: do not re-read large files repeatedly, do not paste full design-context outputs into notes, keep tool outputs small.',
].join('\n')
const withExtra = (p) => p + '\n' + EXTRA
const BASELINE_NOTE = (args && args.baseline) ? ('\nDIFF BASELINE: the unit\'s work-in-progress is already committed, so `git diff HEAD` shows nothing. Audit against the last reviewed state instead: `git diff ' + args.baseline + ' -- <owned files>` and `git diff --stat ' + args.baseline + ' -- <new-file locations>`; read the ORIGINAL logic with `git show ' + args.baseline + ':<file>`.') : ''
phase('Build')
const results = await pipeline(
  RUN,
  (u) => (args && args.skipBuild)
    ? Promise.resolve({ unit: u.key, summary: 'The builder was interrupted; its work-in-progress is already on main (see docs/figma/PROGRESS.md section 3b and docs/figma/specs/' + u.key + '.md). NOTHING is verified yet - treat every claim as unverified and audit everything, including completeness against ALL Figma frames listed for the unit.', filesChanged: u.owned, newFiles: [], framesImplemented: [], verification: [], notImplemented: [], sharedGaps: [], risks: ['unreviewed WIP'] })
    : agent(withExtra(buildPrompt(u)), { label: 'build: ' + u.key, phase: 'Build', schema: SCHEMAS.build }),
  (built, u) => built ? agent(withExtra(reviewPrompt(u, built)) + BASELINE_NOTE, { label: 'review: ' + u.key, phase: 'Review', schema: SCHEMAS.review }).then(rv => ({ built, rv })) : null,
  (r, u) => (r && r.rv && r.rv.blocking && r.rv.blocking.length > 0)
    ? agent(withExtra(fixPrompt(u, r)) + BASELINE_NOTE, { label: 'fix: ' + u.key, phase: 'Fix', schema: SCHEMAS.build }).then(fx => Object.assign({}, r, { fx }))
    : r,
  (r, u) => r ? agent(commitPrompt(u, r), { label: 'commit: ' + u.key, phase: 'Commit', schema: COMMIT_SCHEMA }).then(commit => Object.assign({}, r, { commit })) : null,
)
const failed = RUN.filter((u, i) => !results[i]).map(u => u.key)
if (failed.length) log('UNITS THAT FAILED: ' + failed.join(', '))
return { failed, results }