# Figma sync — PROGRESS & RESUME GUIDE

> Single source of truth for "where did we stop". Update the status board (§3) and the commit log (§8) after every unit.
> Last updated: 2026-09-21 ~12:35 (+06) — **run stopped by the user; see §3b for the exact stop state.** Baseline commit before any Figma work: `2dd66ce v4 main`.

## 0. Resume in 60 seconds

1. `git log --oneline -12` and `git status --short` (in-progress agent files show up as modified / untracked).
2. Read, in order: this file → `docs/figma/BUILD_RULES.md` (ownership, no-behaviour-change, verification) → `docs/figma/tokens.md` → `docs/figma/flows.md`.
3. Pick the next unit(s) from §3 (status **PENDING** or **IN PROGRESS**). Run **two units at a time** (usage-limit friendly):
   ```
   Workflow({ scriptPath: "<abs path>/docs/figma/workflows/build-screens.js", args: { only: ["patient-live-appts", "patient-rx-meds"] } })
   ```
   Each unit = build → independent review → fix (only if blocking) → **commit of only that unit's files**. A unit interrupted by a usage-limit pause simply re-runs: agents are told to continue from the partial files / notes already on disk (`docs/figma/specs/<unit>.md`, `docs/figma/reference/<unit>/`, `git diff` of owned files).
4. Preview without a backend: `npx vite --config vite.mock.config.ts --port 3100 --strictPort` → `http://localhost:3100/?as=doctor` (`patient`, `guest`, `admin`, …; see `dev-mocks/README.md`).
5. Real hover / click / keyboard checks: the in-app browser pane **cannot hover** — use `dev-mocks/tools/cdp.mjs` (example: `dev-mocks/tools/hover-example.mjs`).
6. Type check: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "^supabase/functions"` must print nothing (18 unrelated Deno errors live in `supabase/functions/*`). Build: `npm run build`.

## 1. The brief (condensed) and clarifications

- Make the doctor side ("Doctor Q" = **Doctor Queue**), **Doctor Overview**, the **patient dashboard** and the **landing page** (Meet Our Medical Experts hover animation, "Get an Appointment" button animation, tabs, etc.) match the Figma file **exactly** — layout, components, hover/prototype motion — and keep every existing behaviour working. Do everything task by task; plan in an MD file (`FIGMA_SYNC_PLAN.md`, this file).
- Figma file key `zJRyAML8hv0uEBOXtu5Hpn`, page **Web Version V1** (id `5:2`; pages: Design System `0:1` (empty), Web Version V1, App Version V1 `5:3`).
- **"Flow 1" in Figma is a LEGACY flow** (old doctor list → doctor detail, start `32:1183`). The real patient-dashboard prototype is the flow named **"Patient"** (start `339:15916`, 14 frames). Doctor console = one connected graph (flows Prescription `307:13617` / Queue `328:13919` / Appointments `255:11674` / Phone View `341:18476`). Landing = flow "PreLogin 1" (`80:1754`). See `docs/figma/flows.md`.
- User's wording "Doctor Overview (the doctor profile page)": Figma frame **Doctor Overview** `368:18645` (page `339:17421`) is the **doctor's own dashboard home**; the section "Doctor Profile" `254:8267` holds doctor own-profile/manage frames; the patient-facing profile/booking is `List Page 601:13524` + `Main` frames under Patient Dashboard.

## 2. Environment facts / pitfalls

- **Figma MCP works** (team upgraded 2026-09-20; `whoami` tier "student"). `get_motion_context` returns keyframe animations only; **hover/press motion = prototype variant swaps** → read `node.reactions` and diff the two variants with read-only `use_figma` (snippets in `docs/figma/BUILD_RULES.md`). Figma EASE_OUT = `cubic-bezier(0,0,.58,1)`, hover = SMART_ANIMATE 0.3s, screen change = DISSOLVE 0.3s.
- **Usage limit**: heavy multi-agent runs burn the 5-hour window in ~1 hour. Run 2 units per Workflow; only *completed* agents are cached, so keep units small and commit after each.
- **Dev server / ports**: `vite.config.ts` default port 3000 (Google Calendar OAuth origin is `http://localhost:3000`), now honours `PORT` (strictPort when set); `.claude/launch.json` has `autoPort: true`. Port 3000 was occupied by an unrelated Next.js server (`AllSafe-Electric`, PID 45786) — never kill it. Harness/agent ports: builders 3111–3121, reviewers 3121–3131, CDP 9341–9361.
- **Local backend is unreachable**: `.env.local` (overrides `.env`) has host `placeholde.supabase.co`; `.env` has a truncated-looking host (18-char project ref; Supabase refs are 20). The real-data preview therefore shows no data. Not touched (secrets). Use the mock harness for UI work.
- Another Claude session (task "Fix profile column mapping in patient views") works in `.claude/worktrees/mystifying-elgamal-2d1b46` and may touch `views/patient/Home.tsx` / `DoctorProfile.tsx`; ignore `.claude/worktrees/**` in greps/tsc; expect a merge check later. Known pre-existing app bugs flagged by the harness: Home.tsx selects non-existent `profiles.name/image`; DoctorProfile/search read camelCase `experienceYears/totalPatients` never mapped from snake_case.
- `git`: user commits snapshots themselves (`v6` = `a8e1b0a`, `bd9c392`). Agents never commit **except** the per-unit Commit stage (explicitly authorised by the user on 2026-09-21: "cache, commit and report everything").

## 3. Status board

Legend: ✅ done & committed · 🔄 in progress · ⏳ pending

| Unit (`args.only` key) | Figma nodes | App files | Status |
|---|---|---|---|
| foundation (tokens/theme/fonts) | tokens.md | `tailwind.config.js`, `index.css`, `index.html`, `utils/colorScale.ts`, `contexts/ThemeContext.tsx` | ✅ `bd9c392` |
| chrome (navbar, avatar menu, bottom bar, toasts, tab bar) | Navbar - Dashboard `396:12116`, Navbar `80:7429`, Bottombar `368:16140`, Profile menu `368:17693`, Toaster | `components/Layout.tsx`, `components/dashboard/**`, `components/doctor/DoctorTabBar.tsx`, `components/ToastProvider.tsx`, `components/ui/NotificationBell.tsx` | ✅ `bd9c392` (+ sticky-navbar fix by hand) |
| landing (doctor-card hover morph, Button Usual/Featured Hover, tabs, all sections) | `80:1754`, After Hero `80:1794` | `views/patient/Home.tsx`, `components/landing/**`, `components/ui/{Button,DoctorCard,SectionEyebrowHeader}.tsx`, `components/Footer.tsx` | ✅ `bd9c392` |
| `doctor-queue` ("Doctor Q") | Section `255:6533` (Queue `368:14306`, `328:14902`, Modal `368:14285`, Card 3 `368:15791`, Queue Card `255:9358`), flow frames `328:13919`, `255:8163`, phone `341:18476`, `368:17738` | `views/doctor/SerialManager.tsx`, `components/doctor/queue/**` | ⏸ **STOPPED mid-build (WIP, unreviewed)** — see §3b |
| `doctor-overview` | `368:18645` / page `339:17421`, popover `368:18696` | `views/doctor/Dashboard.tsx`, `components/ui/{ArcGauge,StatCard,DoctorDashboardProfile,ChamberCard}.tsx`, `components/doctor/overview/**` | ⏸ **STOPPED mid-build (WIP, unreviewed)** — see §3b |
| `patient-live-appts` | Live Queue `339:15916`, `297:12283`, phone `357:19153`/`357:19210`, Appointments `191:5570`, Sort menu `368:16699`, Pickers `396:12025` | `views/patient/{LiveSerial,Appointments}.tsx`, `components/ui/AppointmentCard.tsx` | ⏳ |
| `patient-rx-meds` | Prescriptions `297:12584`, Medicines `339:16108`/`191:5104`, Modal `339:15402`, Toasters `399:12826`/`399:12818` | `views/patient/{Prescriptions,MedicineTracker}.tsx` | ⏳ |
| `doctor-appointments` | `255:11599` (Appointments `255:11674`, `255:12102`, modals, pickers) | `views/doctor/DoctorAppointments.tsx` | ⏳ |
| `doctor-prescription` | `255:14768` | `views/doctor/PrescriptionEditor.tsx` | ⏳ |
| `doctor-analytics` | `255:14766` | `views/doctor/Analytics.tsx` | ⏳ |
| `doctor-manage` | `255:14767` | `views/doctor/{DoctorMore,DoctorPracticeSettings,PatientManualRegistry}.tsx`, `components/doctor/AssistantManager.tsx` | ⏳ |
| `doctor-account` | Account `276:13531`, Activity Log `276:13827`, Doctor Profile `254:8267`, Payment `341:18165` (empty) | `views/doctor/{DoctorProfileEditor,PaymentSubscription}.tsx` | ⏳ |
| `patient-doctors` | List Page `396:12430`, doctor detail `601:13524`, Main `601:12927`/`601:13040`/`601:13140`, public lists `80:1482`/`326:13058` | `views/patient/{DoctorSearchView,DoctorSearch,DoctorProfile}.tsx` | ⏳ |
| `marketing-pages` (lowest priority) | frames in `docs/figma/specs/landing-pages.md` §0 | `views/marketing/*`, `views/doctor/DoctorLanding.tsx` | ⏳ |
| route DISSOLVE transition (screen change = DISSOLVE 0.3s) | tokens.md §7 | `components/Layout.tsx` main wrapper | ⏳ small polish |
| final regression QA (all roles, mock harness, build, theme change, reduced motion) | — | whole app | ⏳ |

Extraction artefacts already on disk (do not redo): `docs/figma/specs/{landing-home (§1-5 only), landing-components, landing-pages, dashboard-components}.md`, `docs/figma/tokens.md`, `docs/figma/flows.md`, `docs/figma/reference/**` (2x PNGs), `docs/figma/interactions/*.json`, `public/assets/figma/**` (≈128 unit assets + 36 originals).

## 3b. STOPPED here — exact state of the two in-progress units (user stopped the run on 2026-09-21 ~12:28 +06)

Legend for this section: **the code is in the working tree (uncommitted, NOT on `main`) and mirrored in the private snapshot ref `refs/checkpoints/figma-*-stopped`** (see §8). At the stop moment `npx tsc --noEmit … | grep -v supabase/functions` printed **nothing** (WIP compiles). Not yet done for either unit: independent review, `npm run build`, visual comparison against the reference PNGs, hover/interaction verification, mobile check, commit. The workflow journal shows the build agents were relaunched once and never returned a result, so treat both units as "builder ~partially done".

**doctor-queue ("Doctor Q")** — `views/doctor/SerialManager.tsx` rewritten (JSX restyled, ≈ −927/+ lines; logic must be audited by the reviewer); new presentational components in `components/doctor/queue/`: `ConfirmCompleteModal`, `PatientAvatar`, `QueueClock`, `QueueHeader`, `QueueListPanel`, `QueuePatientCard`, `QueueProgress`, `QueueStatusCards`, `QueueStatusModal`, `UpNextRow`, `queueUtils.ts`. Notes: `docs/figma/specs/doctor-queue.md` (frames, layout facts, interactions with exact values, decisions, deviations). Extracted: 10 reference PNGs (`docs/figma/reference/doctor-queue/`), 3 assets (`public/assets/figma/doctor-queue/`).

**doctor-overview** — `views/doctor/Dashboard.tsx` restyled (≈ −183 lines), `components/ui/ArcGauge.tsx` and `components/ui/DoctorDashboardProfile.tsx` modified (not yet checked for out-of-scope usages); new components in `components/doctor/overview/`: `AppointmentsCard`, `CardHeader`, `EarningCard`, `HospitalSwitcher`, `QueueStatusCard`, `assets.ts`, `overview.css`. **Not touched yet:** `components/ui/StatCard.tsx`, `components/ui/ChamberCard.tsx`. Notes: `docs/figma/specs/doctor-overview.md` (no ON_HOVER/CHANGE_TO on this frame — only click reactions; hospital switcher popover `368:18696`). Extracted: 4 reference PNGs (`docs/figma/reference/doctor-overview/`), 9 assets.

**How to continue (pick one):**
1. `git checkout refs/checkpoints/<latest-stopped> -- .` is NOT needed — the files are already in the working tree. First run `git status`, `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v "^supabase/functions"`, `npm run build`.
2. Re-run the two units (agents continue from the files/notes on disk, then review → fix → commit):
   `Workflow({ scriptPath: "<abs path>/docs/figma/workflows/build-screens.js", args: { only: ["doctor-queue", "doctor-overview"] } })`
3. If the working tree was lost or reset: `git checkout refs/checkpoints/<latest-stopped> -- views components docs public` restores the WIP files.
4. If you would rather review by hand: start `npx vite --config vite.mock.config.ts --port 3100` → `/?as=doctor` → Overview tab and Queue tab; compare with `docs/figma/reference/doctor-overview/queue-overview-339_17421.png` and `docs/figma/reference/doctor-queue/*.png`.

## 4. Decisions taken (and deliberate deviations)

- tokens.md D1–D9 accepted, **except D1**: no global body-font flip — each restyled screen root uses Instrument Sans (`font-display`); Inter (`font-inter`) only where the specs say so. D3-C: exact Figma tint table for default primary `#0ca768` + constants model for custom colours + step 950 (`primary-950`). Manrope dropped from the Google Fonts URL; Ubuntu (`font-stat`) kept until screens are restyled.
- Signed-in navbar is **sticky** (`top:-36px` at md+) — the static Figma frame cannot express scrolling and the old app kept navigation reachable.
- Logo is Figma's fixed sky-blue clock mark (both Figma navbar components use it) — it no longer recolours with Super Admin brand colours.
- Landing: real approved reviews only (Figma's fake reviewer photos/masonry not rendered), Figma placeholder copy replaced by on-brand copy, revealed card shows real doctor stats (placeholders `10+`/`2.5K+` only when data is 0/null, as the old card did), "See more doctors" arrow visible below 1280px so cards stay reachable.
- Profile menu omits rows without routes (Activity History, Help & FAQ, Privacy & Security, Google Calendar). Account `276:13531` / Activity Log `276:13827` have no routes → handled in `doctor-account`.
- Shared components: new variants instead of altering defaults used by out-of-scope views (`Button` figma-* variants, `DoctorCard reveal`, `SectionEyebrowHeader variant="figma"`, `NotificationBell variant="dashboard"`).

## 5. Known gaps / follow-ups (from reviewers, non-blocking)

Chrome: profile menu 3 rows on desktop vs Figma 6; phone bar inactive-icon tints uniform `#a8b0ac`; `steel` token used for literal `#8a94a3`; UserCard "late" bg translucent; Navlinks pill 683.5 vs 686px; patient site pages show the dashboard navbar above the full-bleed hero. Landing: testimonials section 482px vs Figma 1014px (by design); hero blurb wraps 4 lines vs 3; process card 3 wrap; tab pill widths ±7px (Figma typo "Dermatplpgost"); FAQ open answer 1 line vs 2; footer CTA band 352.7 vs 371.7; patient landing hero CTA below fold at 1440×900; legacy `.btn-sheen` still differs from the Figma ellipse sheen (only `figma-*` Button variants use the exact one). `Layout.tsx`: `index.css` forces `main` padding with `!important` (workaround `main:has(.dc-landing)` in landing.css); `tailwindcss-animate` not installed (old `animate-in` classes do nothing; `dashboard.css` provides `.ds-fade-in`, `.ds-toast-*`).

## 6. Open questions for the user

1. Real Supabase URL for `.env.local` (so the real-data preview works) — do not paste keys in chat.
2. Should the logo follow the brand theme (old behaviour) or stay Figma's fixed mark (current)?
3. Activity Log page (no data source): skip, or design an empty state?

## 7. Workflow scripts & run IDs

| Script (repo copy) | Purpose | Runs |
|---|---|---|
| `docs/figma/workflows/extract.js` | read-only Figma extraction + mock harness | `wf_b6a5df17-117` — tokens ✅, harness ✅ (31/31 routes), landing-components ✅, landing-pages ✅, dashboard-components ✅, landing-home §1-5 ✅; interrupted by the usage limit before doctor-overview and the 8 later units (superseded: the build script now extracts per unit) |
| `docs/figma/workflows/build-1-foundation-chrome-landing.js` | foundation → chrome + landing (build/review/fix) | `wf_fe0dcab1-fec` ✅ complete |
| `docs/figma/workflows/build-screens.js` | **the one to use**: 11 units, args `{only:[...]}`, build → review → fix → commit | `wf_3f4d3173-571` (interrupted at launch by the usage limit), `wf_347a89f1-721` (doctor-queue + doctor-overview; **stopped by the user ~12:28 on 2026-09-21** mid-build, no builder result recorded) |

Session-only cache (same session can `resumeFromRunId`; otherwise just re-run the unit — files on disk are the real cache): `~/.claude/projects/-Users-saikatchowdhury444gmail-com-Desktop-DocOclock-Web/<session>/subagents/workflows/<run>/journal.jsonl`.

## 8. Commit log (newest first — append as you go)

- **STOP CHECKPOINT** `refs/checkpoints/figma-20260921-1236-stopped` (`62dfe91`, 45 files vs HEAD) — full snapshot at the moment the user stopped the run (doctor-queue + doctor-overview WIP, tsc clean, unreviewed). Older snapshot: `refs/checkpoints/figma-20260921-1214` (`537f35e`).
- `b7e4e86` chore(figma) — this resume guide, BUILD_RULES, re-runnable workflow scripts, port-safe dev preview (`vite.config.ts` PORT + `autoPort`)
- **WIP checkpoint ref** `refs/checkpoints/figma-20260921-1214` (`537f35e`) — private snapshot (not on `main`) of the working tree *including the doctor-queue / doctor-overview agents' unfinished edits* (44 files). List: `git for-each-ref refs/checkpoints`; restore a file: `git checkout <ref> -- <path>`. Create a new one any time without touching HEAD/index: temp `GIT_INDEX_FILE` → `git read-tree HEAD; git add -A; git write-tree; git commit-tree … -p HEAD; git update-ref refs/checkpoints/<name> <commit>`.
- `bd9c392` v6 (user) — foundation + chrome + landing + sticky navbar + build rules groundwork
- `a8e1b0a` v6 (user) — extraction specs, reference PNGs, assets, mock-Supabase harness, partial chrome
- `2dd66ce` v4 main — baseline before Figma work
