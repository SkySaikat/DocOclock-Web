export const meta = {
  name: 'figma-extract',
  description: 'Read-only Figma extraction (tokens, specs, reference PNGs, assets, prototype interactions) + mock-Supabase preview harness',
  phases: [
    { title: 'Tokens', detail: 'global design tokens, type scale, prototype flow map' },
    { title: 'Harness', detail: 'additive dev-only mock-Supabase preview harness (runs alongside)' },
    { title: 'Extract', detail: 'one agent per Figma unit, 4 at a time (Figma rate limits)' },
    { title: 'Integrate', detail: 'consolidated index, shared components, file ownership matrix' },
  ],
}

const FILE_KEY = 'zJRyAML8hv0uEBOXtu5Hpn'
const MCP = 'mcp__266b791f-9c17-43fc-bfad-9beea37f1098__'
const TOOLS_SELECT = 'select:' + ['get_metadata','get_design_context','get_screenshot','get_motion_context','use_figma','get_variable_defs','download_assets'].map(t => MCP + t).join(',')

const RULES = [
  'CONTEXT: You are one member of a team re-implementing the DocOClock web app (React 19 + Vite + Tailwind 3; CLAUDE.md is already in your context) so that it matches the Figma file "DocOClock" EXACTLY (layout, components, hover/prototype motion). Figma fileKey = ' + FILE_KEY + ', page "Web Version V1" (id 5:2). An earlier pass wrote FIGMA_SYNC_PLAN.md (repo root) with a node map - read it first.',
  '',
  'HARD RULES',
  '1. Figma is READ-ONLY. Only call use_figma with pure-read scripts (never create*/set*/remove/appendChild/characters=...). Never call create_new_file, upload_assets, add_code_connect_map, generate_* or any writing tool.',
  '2. Figma MCP tools are deferred: load schemas first with ToolSearch query "' + TOOLS_SELECT + '". Before your first use_figma call invoke Skill "figma:figma-use"; before get_design_context invoke Skill "figma:figma-design-to-code"; before get_motion_context invoke Skill "figma:figma-implement-motion". Pass skillNames ("figma-use" / "figma-design-to-code") on those calls.',
  '3. use_figma results are truncated at ~20KB: return compact pipe-joined rows and short keys; page long lists over several calls. Page context resets on every call, so when reading nodes of page "Web Version V1" start the script with: await figma.setCurrentPageAsync(figma.root.children.find(p => p.name === "Web Version V1")) (once per call).',
  '4. Rate limits: if a Figma call fails with a rate-limit / limit-reached style error, do NOT retry in a tight loop. Do useful local work (read app code, write spec text) and retry later; back off (30s, 60s, 120s ...). If the error says a plan/monthly quota is exhausted, stop Figma calls, record it in openIssues and finish with what you have.',
  '5. You may write ONLY under docs/figma/** and public/assets/figma/**. Never edit app source, package files, SQL or config.',
  '6. Accuracy: every number in your spec must come from Figma (get_design_context / get_metadata / use_figma). Never estimate from a screenshot. If something cannot be read, say so in openIssues instead of guessing.',
  '7. Assets: get_design_context returns image/SVG URLs as consts (valid ~7 days). Download each one you need IMMEDIATELY with curl -L into public/assets/figma/<unit>/<descriptive-kebab-name>.<ext> and confirm with `file`. Before keeping a file compare its sha256 with existing files under public/assets/figma/** (36 exist from an earlier pass); if identical delete yours and reference the existing path. Never hand-write or inline SVG paths.',
  '8. Work incrementally: after finishing each frame append its section to the spec file, so nothing is lost if your context is compacted. Large repeated lists: fetch one representative item in full, then only the deltas.',
].join('\n')

const SNIPPETS = [
  'REUSABLE use_figma READ-ONLY SNIPPETS (adapt IDs; keep them read-only)',
  '',
  '--- A) reactions dump for a subtree (prototype interactions) ---',
  'await figma.setCurrentPageAsync(figma.root.children.find(p => p.name === "Web Version V1"));',
  'const root = await figma.getNodeByIdAsync("ROOT_ID"); const rows = [];',
  'const nodes = [root].concat(root.findAll(n => "reactions" in n && n.reactions && n.reactions.length > 0)).filter(n => "reactions" in n && n.reactions && n.reactions.length > 0);',
  'for (const n of nodes) for (const r of n.reactions) { const acts = r.actions || (r.action ? [r.action] : []);',
  '  for (const a of acts) { const t = a.transition; rows.push([n.id, n.name.slice(0,30), n.type, r.trigger && r.trigger.type, r.trigger && (r.trigger.delay || r.trigger.timeout || ""), a.type, a.navigation || "", a.destinationId || "", t ? t.type : "", t && t.easing ? t.easing.type : "", t ? +(t.duration || 0).toFixed(3) : "", t && t.direction ? t.direction : "", a.overlayRelativePosition ? JSON.stringify(a.overlayRelativePosition) : "", a.overlayPositionType || ""].join("|")); } }',
  'return { count: nodes.length, rows: rows.slice(0, 120) };',
  '',
  '--- B) compact property diff between two nodes/variants (hover/active deltas) ---',
  'const KEYS = ["visible","opacity","x","y","w","h","layoutMode","pad","gap","pAlign","cAlign","fills","strokes","sw","r","fx","rot","text","fs","fw","name","type"];',
  'const r2 = x => typeof x === "number" ? +x.toFixed(2) : x; const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));',
  'function paint(p){ if(!p||p===figma.mixed) return null; return p.map(f => f.type==="SOLID" ? "#"+[f.color.r,f.color.g,f.color.b].map(c=>Math.round(c*255).toString(16).padStart(2,"0")).join("")+(f.opacity!==1?"@"+f.opacity:"")+(f.visible===false?"(hidden)":"") : f.type); }',
  'function snap(n,root){ const o={name:n.name,type:n.type,visible:n.visible,opacity:n.opacity,w:r2(n.width),h:r2(n.height)}; if(!root){o.x=r2(n.x);o.y=r2(n.y);} if("layoutMode" in n){o.layoutMode=n.layoutMode;o.pad=[n.paddingTop,n.paddingRight,n.paddingBottom,n.paddingLeft].join(",");o.gap=n.itemSpacing;o.pAlign=n.primaryAxisAlignItems;o.cAlign=n.counterAxisAlignItems;} if("fills" in n)o.fills=paint(n.fills); if("strokes" in n){o.strokes=paint(n.strokes);o.sw=n.strokeWeight;} if("cornerRadius" in n)o.r=clone(n.cornerRadius); if("effects" in n)o.fx=n.effects.map(e=>e.type+":"+(e.offset?e.offset.x+","+e.offset.y:"")+" r"+e.radius+" "+(e.color?"a"+r2(e.color.a):"")); if("rotation" in n)o.rot=r2(n.rotation); if(n.type==="TEXT"){o.text=n.characters.slice(0,40);o.fs=n.fontSize;o.fw=n.fontWeight;} if("children" in n)o.kids=n.children.map(c=>snap(c,false)); return o; }',
  'function diff(a,b,path,out){ if(!a||!b){out.push(path+"|ONLY_IN_"+(a?"A":"B"));return;} for(const k of KEYS){ const x=JSON.stringify(a[k]), y=JSON.stringify(b[k]); if(x!==y) out.push(path+"|"+k+"|"+(x||"").slice(0,70)+"|"+(y||"").slice(0,70)); } const ka=a.kids||[],kb=b.kids||[]; for(let i=0;i<Math.max(ka.length,kb.length);i++) diff(ka[i],kb[i],path+">"+((ka[i]||kb[i]).name.slice(0,18))+"#"+i,out); }',
  'const A=await figma.getNodeByIdAsync("ID_A"), B=await figma.getNodeByIdAsync("ID_B"); const out=[]; diff(snap(A,true),snap(B,true),"root",out); return {n:out.length, rows: out.slice(0,200)};',
  '',
  '--- C) component sets/variants used inside a subtree ---',
  'const root = await figma.getNodeByIdAsync("ROOT_ID"); const insts = root.findAllWithCriteria({types:["INSTANCE"]}).slice(0,600); const seen = new Map();',
  'for (const i of insts) { const m = await i.getMainComponentAsync(); if(!m) continue; const set = m.parent && m.parent.type==="COMPONENT_SET" ? m.parent : null; const key = set ? set.id : m.id; if(!seen.has(key)) seen.set(key,{set:set?set.name:m.name,id:key,variants:new Set(),uses:0}); const e=seen.get(key); e.uses++; e.variants.add(m.name+"#"+m.id); }',
  'return [...seen.values()].map(e => ({set:e.set,id:e.id,uses:e.uses,variants:[...e.variants].slice(0,12)}));',
  '',
  'KNOWN FACT (verified): in a component set, hover/press/active behaviour is usually a reaction on a variant (ON_HOVER -> CHANGE_TO another variant, SMART_ANIMATE). Instance-level reactions inherit from the main component. get_motion_context only returns keyframe animations, NOT these variant swaps - so variant diffs (snippet B) are the source of truth for hover motion. Figma easings: EASE_IN=cubic-bezier(.42,0,1,1), EASE_OUT=cubic-bezier(0,0,.58,1), EASE_IN_OUT=cubic-bezier(.42,0,.58,1), LINEAR; GENTLE/QUICK/BOUNCY/SLOW are spring curves (report their names verbatim).',
].join('\n')

const SPEC_FORMAT = [
  'SPEC FILE docs/figma/specs/<unit>.md must contain, in this order:',
  '# <unit> - <title>',
  '## 1. Frames  (table: node id | name | size | role in the product | prototype flow membership | reference PNG path)',
  '## 2. Design tokens used  (colors with hex + Figma variable name; type styles font/size/weight/line-height/letter-spacing; radii; shadows) and the mapping to the app\'s existing tokens (tailwind.config.js, index.css). Mark anything without an existing token as NEW TOKEN NEEDED. Read docs/figma/tokens.md first (written by the tokens agent before you started).',
  '## 3. Per-frame layout spec  (for each frame: region tree with exact px width/height/padding/gap/radius/position, auto-layout direction + alignment, text styles, colors, icon/image asset paths). Compact Tailwind arbitrary-value class strings taken from design context are welcome.',
  '## 4. Components & variants used  (component set name/id, variant used, property values)',
  '## 5. Interactions  (every prototype reaction: trigger | source layer id+name | action | destination | transition type, easing, duration ms | what visually changes, from the variant DIFF: property from -> to). Then an IMPLEMENTATION RECIPE per interaction: concrete CSS/React (which properties transition, cubic-bezier, duration, which layers morph / fade in / fade out because SMART_ANIMATE matches layers by name) and how it maps onto the existing app state/handlers. Keyframe motion from get_motion_context goes here too ("none" if empty).',
  '## 6. Assets manifest  (local path | source node | format | notes)',
  '## 7. App mapping & gap analysis  (read the mapped app files. For each frame/region: current implementation file:line -> Figma value -> class STYLE-DIFF | STRUCTURE-DIFF | MISSING | NEW-INTERACTION | MATCH). Include FUNCTIONAL CONSTRAINTS: which existing handlers / data / routes each interactive element must keep.',
  '## 8. Open issues / uncertainties',
  '',
  'Also save every 2x reference PNG: get_screenshot(fileKey, nodeId, maxDimension 2880) returns a short-lived URL -> curl -L -o docs/figma/reference/<unit>/<frame-slug>-<nodeId with : replaced by _>.png ; verify with `file` that it is a PNG. Save the raw interaction rows to docs/figma/interactions/<unit>.json.',
].join('\n')

const UNIT_SCHEMA = {
  type: 'object',
  properties: {
    unit: { type: 'string' },
    specPath: { type: 'string' },
    frames: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' }, referencePng: { type: 'string' } }, required: ['id', 'name'] } },
    interactions: { type: 'array', items: { type: 'string' } },
    assets: { type: 'array', items: { type: 'string' } },
    newTokensNeeded: { type: 'array', items: { type: 'string' } },
    gaps: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
    figmaCalls: { type: 'number' },
  },
  required: ['unit', 'specPath', 'frames', 'openIssues'],
}

const UNITS = [
  { key: 'landing-home', title: 'Main landing page (Hero to Footer) incl. Meet Our Medical Experts',
    nodes: [['80:1754', 'Landing Page 1460x8223 - PROTOTYPE FLOW START "PreLogin 1"; children include Hero, After Hero (80:1794, already outlined in FIGMA_SYNC_PLAN.md section 4), Footer'], ['80:7429', 'Navbar component 1264x197'], ['80:1747', 'Text 1460x105'], ['80:1730', 'frame "3" 251x237']],
    app: ['views/patient/Home.tsx', 'components/Layout.tsx', 'components/Footer.tsx', 'components/ui/DoctorCard.tsx', 'components/ui/Button.tsx', 'components/ui/SpecialtyCard.tsx', 'components/ui/SectionEyebrowHeader.tsx', 'components/ui/RecommendedDoctorsSection.tsx', 'components/ui/BrowseSpecialtySection.tsx', 'components/patient/HeroSlider.tsx', 'index.css', 'tailwind.config.js'],
    focus: 'TOP PRIORITY = "Meet Our Medical Experts" (node 80:1803): 3 x "Doctor Card - Final" (80:1814/1815/1816) whose ON_HOVER reaction does CHANGE_TO variant "Property 1=Default" (80:4686) with SMART_ANIMATE, EASE_OUT, 0.3s. A first pass found the deltas Variant2(resting, 384x502) -> Default(hover, 384x481.73): card padding 4->0, image 376x405 -> 384x405, chip white -> #eff6ff with blue uppercase text, the Info block (name 24/500, qualification 16 #707b76, rating star + 4.5) moves from below the image INTO the image bottom over a linear-gradient overlay (Rectangle 3510), two stat panels appear (10+ Experience / 2.5K+ Patients, 172x113, bg #fbfbfb, radius 24), a green "Get an Appointment" Button Usual Hover (352x44.73, #0ca768, contains white Ellipse 51 sheen) appears in a 76.73px-high Button row, drop shadow 0 -8 20 rgba(0,0,0,.05). RE-DERIVE every one of these yourself (incl. the gradient stops/direction and every text/colour), verify in the design context, and specify the exact CSS for a smooth 300ms ease-out hover morph. Also cover the 6 Tab pills above the cards, "Button Featured Hover" (80:1817) and every other hover/press/scroll interaction on the landing page, and compare with the CURRENT components/ui/DoctorCard.tsx and Home.tsx.' },
  { key: 'landing-components', title: 'Landing component library (variants, hover states, interaction recipes)',
    nodes: [['5:2401', 'Section "Components" 2589x4513 with 14 component sets: Information Component 80:2149, Header 80:4667, Tab 80:4680, Process Cards 80:4731, Typography 80:4747, Eyebbrow 80:4634, Buttons 80:4641, Button Featured Hover 80:4763, Button Usual Hover 80:4768, Doctor Card - Final 80:4685, Values 80:2143, Featured Tabs 80:4670, Input Field 80:4937, User Card 80:2891']],
    app: ['components/ui/Button.tsx', 'components/ui/DoctorCard.tsx', 'components/ui/SectionEyebrowHeader.tsx', 'components/ui/StatCard.tsx', 'components/ui/SpecialtyCard.tsx', 'components/Layout.tsx', 'index.css'],
    focus: 'For EVERY component set: list all variants + variant properties, run snippet B between each pair of interaction-linked variants, dump reactions (snippet A) and give a ready-to-implement "behaviour card" (CSS/React). Special attention: Button Usual Hover and Button Featured Hover (the sheen ellipse motion, the compact-CTA collapse/expand, arrow icon movement, colours in each state), Tab / Featured Tabs (active vs hover vs default), Doctor Card - Final (already known, re-derive), Input Field states (focus/error/filled), Process Cards. Explain how the app\'s existing .btn-sheen (index.css) and Button.tsx compare.' },
  { key: 'landing-pages', title: 'Other pre-login pages (list page, main pages, modals)',
    nodes: [['80:1482', 'List Page 1460x3962 (11 reactions)'], ['326:13058', 'List Page 1460x3962 (11 reactions)'], ['80:2652', 'Main 1440x1980'], ['80:2778', 'Main 1440x2045'], ['80:2896', 'Main 1440x2045'], ['303:14598', 'Main 1440x1550'], ['303:14768', 'Main 1440x1550'], ['303:14940', 'Main 1440x1550'], ['303:15866', 'Main 1440x1550'], ['303:15350', 'Modal 617x451'], ['303:15363', 'Modal 619x216']],
    app: ['views/patient/DoctorSearchView.tsx', 'views/patient/DoctorSearch.tsx', 'views/marketing/HospitalsPage.tsx', 'views/marketing/LabDiagnosticsPage.tsx', 'views/marketing/BlogsPage.tsx', 'views/marketing/AboutUsPage.tsx', 'views/marketing/ContactUsPage.tsx', 'views/doctor/DoctorLanding.tsx', 'App.tsx', 'components/Layout.tsx'],
    focus: 'First IDENTIFY which app page/route each Figma frame is (Doctors list, Hospitals, Lab & Diagnostics, Blogs, About, Contact, For-Doctors landing, login/register modals ...). Then spec them. Interactions matter (filters, dropdowns, modals).' },
  { key: 'dashboard-components', title: 'Dashboard component library (navbar, header, typography, buttons, user card, bottom bar, icons)',
    nodes: [['303:13210', 'Section "Components" 5855x982 with 19 children: Input Field - Dococlock 302:12650, Typography - Dashboard 302:12624, Icons 302:12556, Buttons - Dashboard 303:13196, Dashboard Header 303:13043 (2 reactions), Search Component 303:13394 (FLOW START "Flow 5"), Nav Link - Dashboard 317:13571, 3 Buttons 317:15075, User Card 368:15036 (3 reactions), Bottombar 368:16140, Frame 368:17693, Navbar - Dashboard 396:12116 (13 reactions), colour swatches']],
    app: ['components/Layout.tsx', 'components/doctor/DoctorTabBar.tsx', 'components/ui/StatCard.tsx', 'components/ui/AppointmentCard.tsx', 'components/ui/NotificationBell.tsx', 'components/ui/DoctorDashboardProfile.tsx', 'components/ui/ArcGauge.tsx', 'components/ui/GlassCard.tsx', 'components/ui/Button.tsx', 'components/ToastProvider.tsx', 'index.css', 'tailwind.config.js'],
    focus: 'These components are the shared chrome of EVERY doctor and patient screen, so be exhaustive: full variant matrix (Navbar - Dashboard has 13 reactions: nav-link states, dropdowns, profile menu?), the exact type scale of "Typography - Dashboard" (all variants with size/weight/line-height/colour), Buttons - Dashboard states, Bottombar (mobile) behaviour, Dashboard Header, Search Component, Icons set (export each icon SVG asset). Provide behaviour cards ready to implement.' },
  { key: 'doctor-overview', title: 'Doctor Overview (doctor dashboard home)',
    nodes: [['368:18645', 'Section "Doctor Overview" 2126x1914'], ['339:17421', 'frame "Queue" 1440x800 - the overview screen (7 reactions)'], ['368:18696', 'frame "7" 179x117']],
    app: ['views/doctor/Dashboard.tsx', 'components/doctor/DoctorTabBar.tsx', 'components/ui/StatCard.tsx', 'components/ui/ArcGauge.tsx', 'components/ui/DoctorDashboardProfile.tsx', 'components/ui/ChamberCard.tsx', 'components/ui/AppointmentCard.tsx', 'App.tsx'],
    focus: 'The user calls this "Doctor Overview (the doctor profile page)". Confirm what the screen contains (welcome/hospital switcher header, Appointments / Queue Status / Earning row, lists...). Map every widget to what Dashboard.tsx renders today.' },
  { key: 'doctor-queue', title: 'Doctor Queue ("Doctor Q") incl. modals and phone view',
    nodes: [['255:6533', 'Section "Doctor - Queue" 3369x2423 (31 reactions): Queue Card 255:9358, Queue 368:14306 (17 reactions), Queue 328:14902 (8), Modal 368:14285, Card 3 368:15791'], ['328:13919', 'top-level frame Queue 1440x800 - PROTOTYPE FLOW START "Queue" (13 reactions)'], ['255:8163', 'top-level frame Queue 1440x800 (7 reactions)'], ['306:13608', 'top-level frame Queue Card 418x358'], ['341:18476', 'phone-size frame Queue 400x917 - PROTOTYPE FLOW START "Phone View"'], ['368:17738', 'phone-size frame Queue 400x873'], ['339:17446', 'frame 210x174'], ['357:25075', 'frame 319x319'], ['368:18792', 'frame 319x319'], ['368:18723', 'frame 419x419'], ['368:18727', 'frame 419x419']],
    app: ['views/doctor/SerialManager.tsx', 'components/doctor/DoctorTabBar.tsx', 'components/ui/ArcGauge.tsx', 'components/ui/AppointmentCard.tsx', 'App.tsx'],
    focus: 'The user\'s "Doctor Q" = the doctor Queue. Cover live/paused states, Up Next list, Queue Card gauge (Rectangles = segmented progress bar), Card 3 (queue settings modal with time pickers 24:30 style, tabs, number chips), Modal (confirm), phone layouts, and every interaction (start/pause, modal open/close, tabs). SerialManager.tsx is ~1157 lines and the most complex file - in the gap analysis map Figma regions to concrete JSX regions/lines and list which state/handlers each control must keep.' },
  { key: 'doctor-appointments', title: 'Doctor Appointment (list, filters, booking modals, date/time pickers, toaster)',
    nodes: [['255:11599', 'Section "Doctor Appointment" 4154x2423 (35 reactions)'], ['255:11674', 'Appointments 1440x800 - PROTOTYPE FLOW START "Appointments" (18 reactions)'], ['255:12102', 'Appointments 1440x800 (8)'], ['317:14984', 'Date and time - Pickers 396x356'], ['255:12870', 'Modal 612x414'], ['255:13068', 'Modal 612x580'], ['255:14107', 'Modal 612x422'], ['368:16641', 'Toaster 287x800']],
    app: ['views/doctor/DoctorAppointments.tsx', 'components/ui/AppointmentCard.tsx', 'views/doctor/PatientManualRegistry.tsx', 'components/ToastProvider.tsx', 'components/doctor/DoctorTabBar.tsx'],
    focus: 'Identify each modal (book/reschedule/cancel/manual booking?) and map to existing features; pickers and toaster included.' },
  { key: 'doctor-prescription', title: 'Doctor Prescription (editor, list, toaster)',
    nodes: [['255:14768', 'Section "Prescription" 4702x3408 (30 reactions)'], ['257:13749', 'Prescription 1440x800'], ['257:13781', 'Prescription 1440x800 (9)'], ['317:15542', 'Prescription 1440x985 (9)'], ['307:13617', 'Prescriptions 1440x800 - PROTOTYPE FLOW START "Prescription" (10)'], ['328:15460', 'frame "3" 136x119'], ['619:13780', 'Toaster 287x800']],
    app: ['views/doctor/PrescriptionEditor.tsx', 'components/prescriptions', 'components/ToastProvider.tsx', 'App.tsx'],
    focus: 'UI only - PDF generation (pdf/prescriptions/*) is out of scope. Map form sections/medicine rows/templates to PrescriptionEditor.tsx (811 lines).' },
  { key: 'doctor-analytics', title: 'Doctor Analytics',
    nodes: [['255:14766', 'Section "Analytics" 2154x3002'], ['257:10189', 'Analytics 1440x1008 (6 reactions)'], ['341:17922', 'frame "3" 136x117']],
    app: ['views/doctor/Analytics.tsx', 'components/ui/StatCard.tsx', 'utils/colorScale.ts', 'contexts/ThemeContext.tsx'],
    focus: 'Chart types, series colours (must come from useTheme() in code - note which Figma colours are theme colours vs fixed), stat cards, filters/tabs, hover tooltips.' },
  { key: 'doctor-manage', title: 'Doctor Manage (practice settings, assistants, manual registry, panels)',
    nodes: [['255:14767', 'Section "Manage" 3522x3353 (18 reactions)'], ['257:10013', 'Manage 1440x800 (9)'], ['368:16746', 'frame "1" 696x636 (2)'], ['368:17322', 'frame "6" 644x636 (2)'], ['368:16869', 'frame "5" 696x693 (3)'], ['368:17311', 'Toaster 287x800'], ['368:17538', 'Toaster 287x800']],
    app: ['views/doctor/DoctorMore.tsx', 'views/doctor/DoctorPracticeSettings.tsx', 'views/doctor/PatientManualRegistry.tsx', 'components/doctor/AssistantManager.tsx', 'components/ui/ChamberCard.tsx'],
    focus: 'Identify which Manage sub-panels exist (chambers/schedules, assistants, manual registry ...) and map them to the app files.' },
  { key: 'doctor-account-profile-payment', title: 'Doctor Account, Activity Log, Doctor Profile section, Payment & Subscription',
    nodes: [['276:13530', 'Section "Account" 1784x2584: Account 276:13531, Activity Log 276:13827'], ['254:8267', 'Section "Doctor Profile" 2297x2862: Queue 257:14343 & 257:14975 (0 reactions), Manage 276:12338 & 276:12374, Toasters 368:17551/368:17561, Modal 368:17567'], ['341:18165', 'Section "Payment & Subscription" 3918x4062 - reported 0 children: verify whether it is really empty (and check top-level frames around it)']],
    app: ['views/doctor/DoctorProfileEditor.tsx', 'views/doctor/DoctorMore.tsx', 'views/doctor/PaymentSubscription.tsx', 'components/ui/DoctorDashboardProfile.tsx'],
    focus: 'The user said "Doctor Overview (meaning the doctor profile page)". The Figma section "Doctor Profile" contains frames named Queue/Manage - find out what these really are (doctor\'s own profile pages? patient-facing?) and map them. If Payment & Subscription is truly empty, say so and list what (if anything) in the file designs the payment screen.' },
  { key: 'patient-dashboard-a', title: 'Patient Dashboard part 1 (queue, appointments, prescriptions, phone views, modals)',
    nodes: [['5:2400', 'Section "Patient Dashboard" 24001x14401 (70 reactions), 17 children'], ['339:15916', 'Queue 1440x800 - PROTOTYPE FLOW START "Patient" (5)'], ['297:12283', 'Queue 1440x800 (4)'], ['191:5570', 'Appointments 1440x800 (9)'], ['297:12584', 'Prescriptions 1440x800 (8)'], ['339:15402', 'Modal 565x549'], ['357:19153', 'Queue 402x877 phone (5)'], ['357:19210', 'Queue 402x880 phone (6)'], ['396:12025', 'Date and time - Pickers 396x356'], ['399:12818', 'Toaster 298x800'], ['399:12826', 'Toaster 203x800']],
    app: ['views/patient/LiveSerial.tsx', 'views/patient/Appointments.tsx', 'views/patient/Prescriptions.tsx', 'views/patient/Consultations.tsx', 'views/patient/Home.tsx', 'components/Layout.tsx', 'components/ui/AppointmentCard.tsx', 'App.tsx'],
    focus: 'The user calls the patient-dashboard prototype "Flow 1". The flow list contains "Flow 1" (start node 32:1183) and "Patient" (339:15916): find which frames each flow contains (walk reactions from the start node) and document the click-through chain. Map every frame to the patient route/view it should become.' },
  { key: 'patient-dashboard-b', title: 'Patient Dashboard part 2 (medicines, list pages, main pages)',
    nodes: [['191:5104', 'Medicines 1440x869 (6)'], ['339:16108', 'Medicines 1440x869 (9)'], ['396:12430', 'List Page 1304x870 (10)'], ['601:13524', 'List Page 1304x870 (1)'], ['601:12927', 'Main 1440x894 (1)'], ['601:13040', 'Main 1440x959 (1)'], ['601:13140', 'Main 1440x959 (1)']],
    app: ['views/patient/MedicineTracker.tsx', 'views/patient/DoctorSearchView.tsx', 'views/patient/DoctorProfile.tsx', 'views/patient/Rewards.tsx', 'views/patient/More.tsx', 'components/Layout.tsx'],
    focus: 'Identify what the "List Page" (1304 wide) and "Main" (1440 wide) frames are - e.g. logged-in doctor search/list, the PATIENT-FACING DOCTOR PROFILE page (views/patient/DoctorProfile.tsx, 822 lines incl. the 4-step booking wizard), rewards, more/settings - and spec them.' },
]

// ---------- prompts ----------
const tokensPrompt = [
  RULES, '', SNIPPETS, '',
  'YOUR UNIT: tokens - global design tokens + prototype flow map. Other agents will start only after you finish and will read your output, so be precise and complete.',
  'Sources: page "Design System" (0:1) - enumerate whatever it holds; get_variable_defs on representative nodes (80:4685 Doctor Card - Final, 303:13043 Dashboard Header, 396:12116 Navbar - Dashboard, 302:12624 Typography - Dashboard, 80:4747 Typography, 80:4641 Buttons, 303:13196 Buttons - Dashboard, 368:15036 User Card, 5:2401 and 303:13210 component sections); use_figma read-only scripts for local variable collections (await figma.variables.getLocalVariableCollectionsAsync() - names, modes, values, aliases), local paint / text / effect styles (getLocalPaintStylesAsync, getLocalTextStylesAsync, getLocalEffectStylesAsync), and page Web Version V1 flowStartingPoints. The 8 known flows: Flow 1 (32:1183), PreLogin 1 (80:1754), Prescription (307:13617), Queue (328:13919), Appointments (255:11674), Flow 5 (303:13394), Phone View (341:18476), Patient (339:15916). For each flow walk the reactions from the start node (NAVIGATE / OPEN_OVERLAY / CHANGE_TO / BACK ...) to build the chain of frames with trigger + transition per hop; resolve node ids to frame names and to the section they live in (use getNodeByIdAsync and walk parents).',
  'DELIVER:',
  '1) docs/figma/tokens.md - colours table (hex + Figma variable name + where used), typography scale (verify the family - the design context so far shows "Instrument Sans" with fontVariationSettings wdth 100 - plus every size/weight/line-height/letter-spacing incl. the "Typography" and "Typography - Dashboard" component variants), radius scale, shadows/effects, spacing/gap scale, page widths implied by frames (1440/1460 desktop, ~400 phone). Then a MAPPING TABLE Figma token -> existing app token (read tailwind.config.js, index.css, contexts/ThemeContext.tsx, utils/colorScale.ts), a list of NEW TOKENS proposed, and DECISIONS to make (e.g. base body font Inter vs Instrument Sans; Figma neutral text colours such as #171c1a / #707b76 vs the app\'s current neutrals). Only primary / secondary / background are admin-themed (see CLAUDE.md): Figma colours equal to the default theme (#0ca768 etc.) must map to theme tokens, never literal hex.',
  '2) docs/figma/flows.md - each flow: start frame, chain of frames (name + id + section), trigger/action/transition per hop, and which app route/view each frame corresponds to (routes are in App.tsx).',
  'Return the structured summary (frames = the flows you documented, id = start node id).',
].join('\n')

const harnessPrompt = [
  'You are building a DEV-ONLY, ADDITIVE preview harness for the DocOClock app (Vite + React + Tailwind; CLAUDE.md is in your context). Purpose: let engineers and reviewers render EVERY doctor and patient screen with realistic mock data WITHOUT touching the real Supabase database and WITHOUT modifying any existing app source file.',
  'CONSTRAINTS',
  '- Create only NEW files: dev-mocks/** and vite.mock.config.ts (extend the existing vite.config.ts via mergeConfig). Do NOT edit package.json, vite.config.ts, tsconfig, storage.ts, supabase.ts or any app file. Never send a request to the real Supabase URL (the mock must intercept everything; do not print .env values).',
  '- Replace the app\'s `supabase` module through a Vite resolve.alias with a regex that matches every relative import of the supabase client module used in the app (./supabase, ../supabase, ../../supabase ...) -> dev-mocks/supabase.mock.ts (which must export the same names the real supabase.ts exports - read it).',
  '- The mock client must implement: from(table) query builder with select/insert/update/upsert/delete + eq/neq/gt/gte/lt/lte/in/is/like/ilike/or/not/contains/order/limit/range/single/maybeSingle/count options, thenable results {data, error:null, count}; writes mutate an in-memory store only (so UI flows work in the preview, nothing persisted); rpc(name,args) with sensible fixtures (e.g. verify_email_otp, record_login_attempt); auth stub; storage.from().upload/getPublicUrl stubs; functions.invoke stub; channel().on().subscribe()/removeChannel realtime no-ops that never throw.',
  '- Fixtures: derive tables/columns from types.ts, SETUP_DOCOCLOCK.sql and EVERY query in storage.ts, hooks/*, views/**, components/** (grep .from(\'...\'), .rpc(). Provide: one approved doctor "Dr. Sarah Rahman" (Cardiology, BMDC no.), 8+ other doctors across specialties (use photos from public/assets/figma/doctor-card-*.png and hero-doctor.png), 2 chambers with schedules, 12 patients, appointments in every status the app knows (waiting / in progress / completed / cancelled / paused ... check the enums) for today and the last 60 days, prescriptions + medicines, reviews, hospitals, notifications, subscription/payment rows, medicine-tracker data, rewards. Obviously fake names/phones; no real personal data.',
  '- Session bootstrap: a Vite plugin (transformIndexHtml) in vite.mock.config.ts injects a small inline script BEFORE the app that reads ?as=doctor|patient|admin (persist in sessionStorage so navigation keeps it) and writes the matching localStorage session (keys used by storage.ts: demo_doctor_session, demo_patient_session, demo_admin_session ...; sessionExpiresAt far in the future; profile fields matching the fixtures).',
  '- Run command must be: npx vite --config vite.mock.config.ts --port 3100',
  'VERIFY: start that server with Bash run_in_background, then use the Browser MCP tools (already loaded; open YOUR OWN tab with tabs_create and pass tabId on every call) to load every route below and confirm there are no console errors and the content is populated: as doctor - /doctor/dashboard, /doctor/serial-manager, /doctor/appointments, /doctor/prescription (find how it is reached), /doctor/analytics, /doctor/practice-settings, /doctor/manual-booking, /doctor/payment, /doctor/profile, /doctor/profile-editor; as patient - /, /patient/home, /patient/doctors, /patient/profile (doctor profile), /patient/appointments, /live-serial, /patient/prescriptions, /patient/consultations, /patient/medicine-tracker, /patient/rewards, /patient/more; logged out - / , /for-doctors, /hospitals, /lab-diagnostics, /blogs, /about-us, /contact-us. Fix the mock until every route renders sensibly. When finished STOP the dev server and close your tab.',
  'DELIVER dev-mocks/README.md: how to run, URL cheat-sheet (?as=doctor etc.), how to add fixtures, screenshot recipe (viewports 1440x900, 1024x768, 390x844 via resize_window), known limitations. Return the structured summary.',
].join('\n')

const HARNESS_SCHEMA = { type: 'object', properties: { command: { type: 'string' }, routes: { type: 'array', items: { type: 'object', properties: { role: { type: 'string' }, path: { type: 'string' }, ok: { type: 'boolean' }, notes: { type: 'string' } }, required: ['role', 'path', 'ok'] } }, filesCreated: { type: 'array', items: { type: 'string' } }, knownLimitations: { type: 'array', items: { type: 'string' } } }, required: ['command', 'routes'] }

function unitPrompt(u) {
  return [
    RULES, '', SNIPPETS, '', SPEC_FORMAT, '',
    'YOUR UNIT: ' + u.key + ' - ' + u.title,
    'FIGMA NODES (page Web Version V1, fileKey ' + FILE_KEY + '):',
    u.nodes.map(n => '  - ' + n[0] + ' : ' + n[1]).join('\n'),
    'APP FILES THIS MAPS TO (read them for the gap analysis; do not edit): ' + u.app.join(', '),
    'FOCUS / PRIORITIES: ' + u.focus,
    '',
    'STEPS',
    '0. Read docs/figma/tokens.md and docs/figma/flows.md (written just before you started) and FIGMA_SYNC_PLAN.md. Read the mapped app files.',
    '1. Load tools + skills (see rules). get_metadata on each node to list the real screens/frames; ignore purely decorative images.',
    '2. For EACH screen frame: (a) get_design_context (clientFrameworks "react,tailwind", clientLanguages "typescript,html,css", skillNames "figma-design-to-code") - if it returns only metadata because the frame is too large, drill into child nodes region by region instead of skipping; (b) save the 2x reference PNG; (c) download every needed image/SVG asset (rule 7); (d) run snippet A on the frame and, for each CHANGE_TO destination / hover-variant pair, snippet B (also snippet C to learn which component sets are used); (e) get_motion_context recursive=true on the frame (record keyframe animations, or "none"); (f) append the frame\'s section to the spec file.',
    '3. Finish the spec (all 8 sections), write docs/figma/interactions/' + u.key + '.json, then return the structured summary. figmaCalls = your approximate number of Figma tool calls.',
    'QUALITY BAR: an engineer who has NOT seen Figma must be able to rebuild each screen pixel-exactly from your spec + reference PNGs + assets, and to implement every hover/press/open/close interaction with the exact durations, easings and property deltas - without changing any data/logic behaviour of the app.',
  ].join('\n')
}

const integratorPrompt = [
  'You are the integrator for a Figma-to-code effort on the DocOClock app (CLAUDE.md in context). Extraction agents have written specs under docs/figma/specs/*.md, raw interactions under docs/figma/interactions/*.json, reference PNGs under docs/figma/reference/**, assets under public/assets/figma/**, plus docs/figma/tokens.md and docs/figma/flows.md. You may write ONLY docs/figma/INDEX.md (and fix broken references inside docs/figma/**). Do not touch app source. You do not need Figma access (but may use it read-only if a spec is ambiguous).',
  'TASKS',
  '1. Read every spec + tokens + flows. Verify integrity: every reference PNG / asset path mentioned exists and is a valid image (use `file`); list missing/duplicate assets (sha256) and fix references where an identical file already exists.',
  '2. Write docs/figma/INDEX.md: (a) unit table with links to spec, frame count, interaction count, asset count, open issues; (b) SHARED COMPONENTS needed by 2+ units with the unit that defines the canonical spec, and the app file that should own them; (c) TOKEN decisions (new tokens / fonts) consolidated and conflicts between units flagged; (d) INTERACTION CATALOGUE (all distinct hover/press/open/close behaviours with exact timing/easing, deduplicated); (e) the APP FILE OWNERSHIP MATRIX: for every app file that will change list the unit(s) whose spec drives it; files driven by 2+ units must be marked FOUNDATION (to be changed once, first, by one owner); (f) recommended implementation BATCHES (foundation first, then batches whose file sets are disjoint so they can run in parallel) with rationale; (g) RISKS + open questions (things that need the user\'s decision).',
  'Return the structured summary.',
].join('\n')

const INTEGRATOR_SCHEMA = { type: 'object', properties: { indexPath: { type: 'string' }, batches: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, units: { type: 'array', items: { type: 'string' } }, files: { type: 'array', items: { type: 'string' } } }, required: ['name', 'units', 'files'] } }, foundation: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, changes: { type: 'array', items: { type: 'string' } } }, required: ['file', 'changes'] } }, decisionsForUser: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } }, brokenAssets: { type: 'array', items: { type: 'string' } } }, required: ['indexPath', 'batches', 'foundation', 'risks'] }

async function pool(items, n, fn) {
  const out = new Array(items.length).fill(null)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      try { out[i] = await fn(items[i], i) } catch (e) { log('unit failed: ' + items[i].key + ' - ' + String(e).slice(0, 200)); out[i] = null }
    }
  }))
  return out
}

// ---------- run ----------
phase('Harness')
const harnessP = agent(harnessPrompt, { label: 'harness: mock-Supabase preview', phase: 'Harness', schema: HARNESS_SCHEMA }).catch(e => { log('harness failed: ' + String(e).slice(0, 200)); return null })

phase('Tokens')
const tokens = await agent(tokensPrompt, { label: 'tokens + flows', phase: 'Tokens', schema: UNIT_SCHEMA })
log('tokens done: ' + (tokens ? tokens.specPath : 'FAILED'))

phase('Extract')
const results = await pool(UNITS, 4, (u) => agent(unitPrompt(u), { label: 'extract: ' + u.key, phase: 'Extract', schema: UNIT_SCHEMA }))
const failed = UNITS.filter((u, i) => !results[i]).map(u => u.key)
if (failed.length) log('EXTRACTION FAILED for: ' + failed.join(', '))

phase('Integrate')
const integ = await agent(integratorPrompt, { label: 'integrator', phase: 'Integrate', schema: INTEGRATOR_SCHEMA })
const harness = await harnessP

return {
  tokens,
  failed,
  units: results.filter(Boolean).map(r => ({ unit: r.unit, specPath: r.specPath, frames: (r.frames || []).length, interactions: (r.interactions || []).length, assets: (r.assets || []).length, newTokensNeeded: r.newTokensNeeded || [], gaps: (r.gaps || []).length, openIssues: r.openIssues || [], figmaCalls: r.figmaCalls })),
  integrator: integ,
  harness,
}