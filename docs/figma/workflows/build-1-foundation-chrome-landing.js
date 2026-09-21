export const meta = {
  name: 'figma-build-1',
  description: 'Build foundation (tokens/theme) then shared chrome + landing page (doctor-card hover, buttons) with independent review and fix passes',
  phases: [
    { title: 'Foundation', detail: 'tailwind tokens, theme scale, fonts (D1-D9 from docs/figma/tokens.md)' },
    { title: 'Build', detail: 'chrome (navbar/tab bar/toasts) and landing page in parallel' },
    { title: 'Review', detail: 'independent no-behaviour-change audit + visual/interaction verification' },
    { title: 'Fix', detail: 'only if the reviewer found blocking issues' },
  ],
}

const MCP = 'mcp__266b791f-9c17-43fc-bfad-9beea37f1098__'
const TOOLS_SELECT = 'select:' + ['get_metadata','get_design_context','get_screenshot','get_motion_context','use_figma','get_variable_defs','download_assets'].map(t => MCP + t).join(',')

const CONTEXT = [
  'PROJECT: DocOClock web app (React 19 + Vite + Tailwind 3 + TypeScript; CLAUDE.md is already in your context - obey its theming rules). Goal: the running app must match the Figma file "DocOClock" (fileKey zJRyAML8hv0uEBOXtu5Hpn, page "Web Version V1") EXACTLY - layout, components, hover/prototype motion - while keeping ALL existing behaviour (auth, data, routing, queue logic, booking, prescriptions).',
  'PRIOR WORK (read what you need, do not redo it): FIGMA_SYNC_PLAN.md (node map), docs/figma/tokens.md (design tokens + decisions D1-D9 + verification recipe), docs/figma/flows.md (prototype flows -> app routes), docs/figma/specs/*.md (per-unit specs: landing-home sections 1-5, landing-components, landing-pages, dashboard-components), docs/figma/reference/** (2x reference PNGs - open them with the Read tool), public/assets/figma/** (already exported assets, including per-unit subfolders), dev-mocks/README.md (mock-data preview harness).',
  'DECISION OVERRIDE for tokens.md D1: do NOT flip the global body font (untouched admin/other views must not reflow). Instead give each restyled screen root the Instrument Sans family (Tailwind font-display) and use Inter (font-sans / font-inter) only where the specs say Figma uses Inter (navbar links, wordmark, dashboard button labels, pagination, table heads, chart axes). All other tokens.md recommendations (D2-D9) are accepted.',
].join('\n')

const BUILD_RULES = [
  'BUILD RULES',
  '1. OWNERSHIP: edit ONLY the files listed under OWNED FILES, plus NEW files inside the listed NEW-FILE locations. Everything else is read-only for you - especially index.css, tailwind.config.js, index.html, utils/colorScale.ts, contexts/ThemeContext.tsx (owned by the foundation agent), storage.ts, AuthContext.tsx, App.tsx, types.ts, hooks/**, supabase.ts, SQL, server/**, pdf/**, dev-mocks/**. If you need something in a file you do not own, use a local workaround (Tailwind arbitrary values with a short comment, or a co-located .css file you create) and report it in sharedGaps.',
  '2. NO BEHAVIOUR CHANGES: keep every prop, state, effect, handler, route, query, condition and data flow. Restyle / restructure JSX and classes only. Do not rename or change the signature of exports/props. Do not touch data fetching. A Figma control with no existing feature: render it only if purely presentational, otherwise list it in notImplemented.',
  '3. SHARED COMPONENTS: many components are also used by OUT-OF-SCOPE views (admin, hospital admin, branch manager, assistant, marketing pages). Before changing an existing variant/default of a shared component, grep its usages; if any usage is out of scope, ADD a new variant/prop (default = old look) instead of altering the default.',
  '4. THEME: colours through Tailwind tokens (medical / primary / secondary / brand / background / ink / content / surface ...) - no new literal hex/rgba/inline colour except the fixed semantic colours tokens.md marks as fixed. Decorative gradients must derive from theme CSS variables. Never hand-write or inline SVG paths: use exported assets under /assets/figma/** (re-export from Figma with get_design_context/download_assets into public/assets/figma/<unit>/ when one is missing, checking sha256 against existing files first) or a lucide icon only when its glyph clearly matches.',
  '5. MOTION: implement prototype interactions as CSS transitions using the exact duration/easing/property deltas from the specs and tokens.md section 7 (Figma EASE_OUT = cubic-bezier(0,0,.58,1); 300ms standard). Always add motion-reduce handling. Hover-only reveals must also work on keyboard focus (focus-visible / focus-within) and not break touch devices.',
  '6. GIT: never run a git command that changes state (no commit / checkout / stash / reset / clean / restore / rebase). Read-only git (status, diff, log) is fine. Other agents edit other files in the same working tree at the same time - never touch files you do not own.',
  '7. VERIFICATION (mandatory, all of it): (a) Type check: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "^supabase/functions"` must print nothing about files you own (18 pre-existing errors live in supabase/functions/* and are unrelated). (b) Visual: start the mock harness with Bash run_in_background: `npx vite --config vite.mock.config.ts --port <YOUR PORT> --strictPort`; open YOUR OWN browser tab (tabs_create, then pass tabId on EVERY browser call - other agents share the browser); load routes with ?as=<role> (see dev-mocks/README.md); screenshot at 1440x900 and phone 390x844 (resize_window) and compare against the reference PNGs (Read them) - iterate until layout, spacing, type and colour are identical. (c) Interactions: for every hover/press/open/close behaviour verify by real hovering/clicking (computer tool) AND by reading getComputedStyle values before / mid / after the transition with javascript_tool against the numbers in the spec. (d) No console errors (read_console_messages). (e) At the very end run `npm run build` once (if it fails in files you do not own, wait and retry later - do not touch them). (f) Stop your dev server and close your tab.',
  '8. Keep your final answer compact: the structured summary only.',
].join('\n')

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    unit: { type: 'string' },
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    newFiles: { type: 'array', items: { type: 'string' } },
    verification: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, result: { type: 'string' } }, required: ['check', 'result'] } },
    notImplemented: { type: 'array', items: { type: 'string' } },
    sharedGaps: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['unit', 'summary', 'filesChanged', 'verification'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    unit: { type: 'string' },
    verdict: { type: 'string', enum: ['PASS', 'FIX'] },
    logicHunks: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'number' }, what: { type: 'string' }, safe: { type: 'boolean' } }, required: ['file', 'what', 'safe'] } },
    blocking: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'number' }, problem: { type: 'string' }, evidence: { type: 'string' }, suggestedFix: { type: 'string' } }, required: ['problem', 'evidence'] } },
    nonBlocking: { type: 'array', items: { type: 'string' } },
    checks: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, result: { type: 'string' } }, required: ['check', 'result'] } },
  },
  required: ['unit', 'verdict', 'blocking', 'checks'],
}

// ---------------- Foundation ----------------
const foundationPrompt = [
  CONTEXT, '', BUILD_RULES, '',
  'YOUR TASK: FOUNDATION (unit key: foundation). PORT 3101.',
  'OWNED FILES: tailwind.config.js, index.css, index.html, utils/colorScale.ts, contexts/ThemeContext.tsx. NEW files: none (except screenshots under docs/figma/verify/foundation/).',
  'Implement docs/figma/tokens.md sections 8-10 (mapping, NEW tokens, decisions D1-D9 with the D1 override above):',
  '- tailwind.config.js: add content-* neutrals, ghost/steel/page colours, the ds-* box shadows, radius, font sizes, ds-out easing + durations, primary-950 alias, font-inter alias - exactly as proposed in section 9 (check every value against section 1-7 before typing it). Do not remove or change any existing token.',
  '- index.css :root defaults: --color-primary-950 (and secondary if the generator gains it), --ds-ease-out, and the two themable page-gradient utility classes (.bg-ds-page-overview / .bg-ds-page-patient) built from theme CSS variables. Keep .btn-sheen for now (a later agent reworks it with the Figma button spec) - do not delete existing classes.',
  '- utils/colorScale.ts: decision D3-C (exact tint table for the default primary #0ca768 + constants-based tint model for custom colours + step 950) and D4 (Accent-950 -> primary-950). generateColorScale must still return a valid scale for ANY hex, must remain a pure function with the same exported name/signature (extend the returned object type only in a backwards-compatible way), and the default theme must reproduce the exact values in tokens.md section 11 (write a throwaway node/tsx or vitest-free script under the scratchpad, NOT in the repo, that imports the function and asserts them; also assert 20 random custom hexes give monotonic lightness 50->950).',
  '- contexts/ThemeContext.tsx applyToDocument: also write --color-primary-950 (and any new scale var) and keep cached-theme behaviour + the synchronous pre-paint application intact.',
  '- index.html: apply D5 only where safe: remove Manrope from the Google Fonts URL ONLY if `grep -rn "font-manrope\\|Manrope" --include=*.tsx --include=*.ts --include=*.css --include=*.js .` (excluding node_modules/dist/docs) shows no real use; leave Ubuntu (font-stat) in place until screens are restyled.',
  'VERIFY specifically: BEFORE editing anything, start the mock harness and save BEFORE screenshots (1440x900) of /?as=guest, /?as=doctor (dashboard) and /?as=patient (home) to docs/figma/verify/foundation/before-*.png; after your edits save AFTER screenshots and confirm the only visible differences are the intended tint shifts on soft tints; read getComputedStyle(document.documentElement) for every --color-primary-* and --color-secondary-* variable against tokens.md section 11; simulate an admin theme change by calling the ThemeContext apply path (or setting the CSS vars) with a non-default primary (e.g. #2563eb) and confirm the UI recolours; npm run build passes. Report the exact before/after CSS-variable tables in verification.',
].join('\n')

// ---------------- Units ----------------
const UNITS = [
  {
    key: 'chrome', port: 3102, reviewPort: 3104,
    owned: ['components/Layout.tsx', 'components/doctor/DoctorTabBar.tsx', 'components/ToastProvider.tsx', 'components/ui/NotificationBell.tsx'],
    newFiles: 'components/dashboard/** (new shared dashboard primitives: typography helpers, nav link, buttons, chips, toast, bottom bar ... only what you need)',
    routes: 'as doctor: /doctor/dashboard, /doctor/serial-manager, /doctor/appointments, /doctor/profile (tab bar + navbar + profile menu + notification bell + toasts); as patient: /patient/home, /patient/appointments, /patient/more (navbar / bottom bar); as guest: / (public navbar, login/register entry points, mobile menu)',
    task: [
      'YOUR TASK: SHARED CHROME - the navigation shell used by every screen. Figma sources: docs/figma/specs/dashboard-components.md (Navbar - Dashboard 396:12116 with its 13 reactions, Nav Link - Dashboard 317:13571, Dashboard Header 303:13043, User Card 368:15036, Profile menu 368:17693, Sort menu 368:16699, Bottombar 368:16140 / phone bottom bar 570:20777, Search Component 303:13394, Toaster frames, Typography - Dashboard 302:12624, Buttons - Dashboard 303:13196), docs/figma/specs/landing-components.md + landing-home.md (PUBLIC navbar component set 80:7429 / default 80:7430 and its variants, "Button Featured Hover" collapse/expand register CTA), plus docs/figma/reference/dashboard-components/** and docs/figma/reference/landing-home/navbar-*.png. Re-fetch Figma directly (get_design_context / use_figma read-only reactions + variant diffs) whenever the spec is ambiguous.',
      'Make components/Layout.tsx (public navbar, patient + doctor dashboard navbar, mobile menu / bottom bar, profile menu, notification entry, footer wiring - whatever it renders today), components/doctor/DoctorTabBar.tsx, components/ToastProvider.tsx (toast look + enter/exit motion per the Figma Toaster frames - keep the existing toast API: same hooks/functions, same durations of visibility) and components/ui/NotificationBell.tsx match Figma exactly, including every hover / active / open state and the exact transitions.',
      'FUNCTIONAL CONSTRAINTS (must keep working exactly as today): role-branched navigation for PATIENT / DOCTOR / admin tiers (admin tiers render no chrome from Layout - see the isAdminTier check), onNavigate/currentPath handling, login / register / logout triggers, session-expired handling, mobile hamburger + bottom nav behaviour (hideMobileBottomNav prop), notification bell data + unread count, toast API used across the app (grep useToast usages first), keyboard access.',
      'New shared primitives you create under components/dashboard/** should be reusable by later screen agents (document their props at the top of each file in 3-5 lines). Export a short index so screens can import them.',
    ].join('\n'),
  },
  {
    key: 'landing', port: 3103, reviewPort: 3105,
    owned: ['views/patient/Home.tsx', 'components/ui/Button.tsx', 'components/ui/DoctorCard.tsx', 'components/ui/SectionEyebrowHeader.tsx', 'components/ui/SpecialtyCard.tsx', 'components/ui/RecommendedDoctorsSection.tsx', 'components/ui/BrowseSpecialtySection.tsx', 'components/Footer.tsx', 'components/patient/HeroSlider.tsx', 'components/patient/FindDoctorsNearMe.tsx (only if Home.tsx renders it)'],
    newFiles: 'components/landing/** and co-located component .css files (imported from the component) for hover morph CSS that Tailwind cannot express',
    routes: 'as guest: / (whole landing page top to bottom, hover every doctor card, tabs, buttons), and as patient: /patient/home (same page)',
    task: [
      'YOUR TASK: MAIN LANDING PAGE. Sources: docs/figma/specs/landing-home.md (sections 1-5: frames, tokens, per-frame layout, components, interactions), docs/figma/specs/landing-components.md (behaviour cards for Button Usual Hover / Button Featured Hover / Tab / Featured Tabs / Doctor Card - Final / Process Cards ...), docs/figma/reference/landing-home/*.png (Hero 80:1755, How it works 80:1795, Meet Our Medical Experts 80:1803, Transparency 80:1818, Trusted specialty row 80:1839, Simplifying / Featured tabs 80:1866, Testimonials 80:1881, FAQ 80:1907, Footer 80:1932, full page 80:1754), FIGMA_SYNC_PLAN.md section 4. The code was originally built from an OLDER Figma version (node ids 87:*) - so re-diff EVERY landing section against the current design (80:1754) and fix all differences, not only the hover work.',
      'TOP PRIORITY (the user explicitly asked for these): (1) "Meet Our Medical Experts": the 3 x "Doctor Card - Final" hover. Prototype: ON_HOVER -> CHANGE_TO variant "Default" (80:4686), SMART_ANIMATE, EASE_OUT, 0.3s. Resting = Variant2 (80:4718, 384x502): card padding 4, image 376x405 radius 24 with a white chip top-right, info block below the image. Hover = Default (384x481.73): padding 0, image 384x405, chip turns #eff6ff/blue uppercase, the info block (name 24/500, qualification 16 #707b76, rating star + 4.5) moves UP INTO the bottom of the image over a linear-gradient overlay (Rectangle 3510), the two stat panels (10+ Experience / 2.5K+ Patients, 172x113, bg #fbfbfb radius 24) appear, and the green "Get an Appointment" Button Usual Hover (352x44.73 pill, white sheen ellipse) appears in a 76.73px row under the image; drop shadow 0 -8px 20px rgba(0,0,0,.05). RE-DERIVE every number/gradient stop from Figma yourself and build ONE card element whose layers morph smoothly over 300ms cubic-bezier(0,0,.58,1) (matching layers animate between the two states; layers that exist in only one state fade/slide in per SMART_ANIMATE semantics). Height change 502 -> 481.73 must not make the carousel jump (reserve the taller height). Works with the existing horizontal snap carousel, tab filter, "See more doctors" arrow and the existing onClick -> onSelectDoctor handler (the revealed Get an Appointment button must trigger the same navigation to the doctor profile/booking flow the card already triggers; do not create new flows). Also focus-visible/focus-within reveals the hover state for keyboard users; on touch devices tapping still navigates. Use real doctor data fields already used by the card (name, specialty, degrees, rating, image); experience / patients numbers come from the data when present (the current code has doc fields - check types/hooks) else fall back to the same placeholders the non-compact card uses today.',
      '(2) The "Get an Appointment / Go to Appointment" button animation: the Button Usual Hover sheen (the white Ellipse 51 rising/fading over the pill on hover, arrow icon behaviour) and "Button Featured Hover" (compact CTA that expands) exactly per landing-components.md - implement as reusable Button.tsx variants (keep existing variants visually intact for out-of-scope views; add new variants) and use them wherever the landing design uses them.',
      '(3) The 6 tab pills above the cards (active / hover / default per Figma, keep the filter logic), and every other landing hover/press state found in the specs (process cards, values, featured tabs list, FAQ accordion rows expand/collapse, footer links, hero CTAs).',
      'FUNCTIONAL CONSTRAINTS: keep specialty filtering, doctor scroll/arrow, count-up stats, parallax/floating badges behaviour only if Figma still has them (if Figma removed or changed an element, follow Figma but keep the underlying data hooks), real approved reviews only in the testimonials (never hardcode fake reviews), FAQ content source, all onNavigate / onLoginClick / onRegisterClick / onSelectDoctor callbacks, role-dependent rendering (userRole), loading/empty states, and mobile (<768px) layouts (derive from the Figma phone frames / existing responsive behaviour; the desktop frames are 1440/1460 wide).',
    ].join('\n'),
  },
]

function buildPrompt(u) {
  return [
    CONTEXT, '', BUILD_RULES, '',
    'UNIT KEY: ' + u.key + '. YOUR PORT: ' + u.port + '.',
    'OWNED FILES: ' + u.owned.join(', '),
    'NEW-FILE LOCATIONS: ' + u.newFiles,
    'ROUTES TO VERIFY: ' + u.routes,
    'The FOUNDATION agent has already finished: new tokens (content-*, ds-* shadows/sizes, easing, primary-950, font-inter) exist in tailwind.config.js / index.css - use them (read the files).',
    '', u.task,
  ].join('\n')
}

function reviewPrompt(u, built) {
  return [
    CONTEXT, '',
    'YOU ARE THE INDEPENDENT REVIEWER for unit "' + u.key + '" (you did NOT write the code; be skeptical, assume mistakes). PORT ' + u.reviewPort + '. Use the same verification method as BUILD RULES item 7 (own tab, tabId on every call, mock harness, stop server at the end).',
    'You may NOT edit any file. Write nothing except screenshots under docs/figma/verify/' + u.key + '/ .',
    'OWNED FILES of the unit: ' + u.owned.join(', ') + ' (+ new files: ' + u.newFiles + ').',
    'BUILDER SUMMARY (claims - verify them, do not trust them): ' + JSON.stringify(built),
    'CHECKS',
    'A. NO-BEHAVIOUR-CHANGE AUDIT: read the full `git diff` of the owned files and every new file. Classify every hunk PURE-STYLE (classes / JSX structure only) or LOGIC (props, state, effects, handlers, queries, conditions, data sources, routes, text sources, exported signatures). Report every LOGIC hunk (file:line) with safe true/false. Confirm each original handler/effect/prop is still wired to an equivalent element and every export/prop signature is unchanged. Anything that could change runtime behaviour = blocking.',
    'B. VISUAL FIDELITY: compare the running screens with the Figma reference PNGs in docs/figma/reference/** (open both) at 1440x900 and 390x844. Measure with getComputedStyle / getBoundingClientRect against the numbers in the specs and re-verify a sample of the spec numbers directly in Figma (get_design_context / use_figma read-only). List EVERY discrepancy (spacing, size, radius, colour, font family/size/weight/line-height, shadow, icon, alignment) with measured-vs-expected values. Minor sub-pixel differences are non-blocking; anything a designer would notice is blocking.',
    'C. INTERACTIONS: exercise every hover / press / open / close / focus-visible behaviour of the unit with the computer tool; read computed styles at t=0, t~150ms, t~350ms and confirm the transition property, duration 300ms and easing cubic-bezier(0,0,.58,1) from the spec; confirm hover reveals also work with keyboard focus and that reduced-motion disables them; confirm no layout shift / carousel jump.',
    'D. THEME / TOKENS: grep the diff for new literal hex / rgb / rgba / inline colours and hand-written SVG; classify each (allowed fixed semantic / decorative from theme vars / violation). Change the theme primary (set --color-primary-* variables via javascript_tool to a non-default colour) and confirm the unit recolours.',
    'E. BUILD + CONSOLE: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "^supabase/functions"` clean, `npm run build` passes (retry later if other agents are mid-edit in files that are not owned by this unit), console has no errors/warnings introduced by the unit.',
    'F. SHARED-COMPONENT SAFETY: for every shared component the unit touched (Button, DoctorCard, Layout ...) grep its usages and load at least the out-of-scope screens that use it (e.g. ?as=admin dashboard, /hospitals, /about-us, /contact-us, /blogs, /lab-diagnostics, ?as=assistant, ?as=branch, ?as=hospital) to confirm they still look and behave as before (compare with git stash-free evidence: read the diff to reason about what changed for them and screenshot them).',
    'Return verdict FIX if there is ANY blocking item, else PASS.',
  ].join('\n')
}

function fixPrompt(u, r) {
  return [
    CONTEXT, '', BUILD_RULES, '',
    'UNIT KEY: ' + u.key + '. YOUR PORT: ' + u.port + '. You are the FIX agent: an independent reviewer found blocking problems in the work of the previous builder. Fix ALL of them (and only them) in the OWNED FILES: ' + u.owned.join(', ') + ' / NEW-FILE LOCATIONS: ' + u.newFiles + '.',
    'REVIEW FINDINGS (JSON): ' + JSON.stringify(r.rv),
    'For every blocking finding: reproduce it first, fix it, then prove the fix with the same measurement the reviewer used. Re-run the full VERIFICATION of BUILD RULES item 7 for the affected screens. If you believe a finding is wrong, prove it with a measurement and say so in the summary.',
  ].join('\n')
}

// ---------------- run ----------------
phase('Foundation')
const foundation = await agent(foundationPrompt, { label: 'foundation: tokens + theme', phase: 'Foundation', schema: BUILD_SCHEMA })
if (!foundation) { log('FOUNDATION FAILED - stopping'); return { error: 'foundation failed' } }
log('foundation done: ' + foundation.summary.slice(0, 300))

phase('Build')
const results = await pipeline(
  UNITS,
  (u) => agent(buildPrompt(u), { label: 'build: ' + u.key, phase: 'Build', schema: BUILD_SCHEMA }),
  (built, u) => built ? agent(reviewPrompt(u, built), { label: 'review: ' + u.key, phase: 'Review', schema: REVIEW_SCHEMA }).then(rv => ({ built, rv })) : null,
  (r, u) => (r && r.rv && r.rv.blocking && r.rv.blocking.length > 0)
    ? agent(fixPrompt(u, r), { label: 'fix: ' + u.key, phase: 'Fix', schema: BUILD_SCHEMA }).then(fx => Object.assign({}, r, { fx }))
    : r,
)

return { foundation, results }