# DocOClock — Figma-Exact Sync Plan

> **STATUS (2026-09-21): superseded by [`docs/figma/PROGRESS.md`](docs/figma/PROGRESS.md)** — that file is the live status board, resume guide and commit log. The data-access blocker described in §0/§1 below was **resolved on 2026-09-20** (Figma plan upgraded; the Figma MCP works). Foundation, shared chrome and the landing page are done; the doctor/patient screens are in progress. Section 3 (node map) and §4 (landing structure) below are still accurate; per-unit build rules live in `docs/figma/BUILD_RULES.md`.

Goal: make the running app match the Figma file **DocOClock** exactly (layout, components, hover/prototype motion) for the doctor side, the patient dashboard and the landing page — **without changing behaviour**.

- Figma file key: `zJRyAML8hv0uEBOXtu5Hpn` (pages: *Design System*, **Web Version V1**, *App Version V1*)
- Plan written: 2026-09-20 · Status legend: ✅ verified · ⚠️ needs re-validation · ⛔ blocked

---

## 0. Status right now

| Item | State |
|---|---|
| Figma structure (sections, names, node IDs) | ✅ read from the live file |
| Landing "After Hero" node tree (`80:1794`) | ✅ read via MCP `get_metadata` before quota ran out |
| Exact values (spacing, type, colors, radii, shadows) | ⛔ needs Figma data access (see §1) |
| Prototype interactions + motion (hover, smart-animate, easing, duration) | ⛔ needs Figma data access |
| Asset export (SVG/PNG of components) | ⛔ needs Figma data access |
| Code audit (which file renders which Figma screen) | ✅ §3 |

## 1. Blocker and unblock path (Phase 0 depends on this)

The Figma MCP returned *"tool call limit on the Starter plan"* after 5 calls. Anonymous viewing in the in-app browser works for visuals, but Inspect / Dev Mode data is not available without signing in — so it can't give exact numbers or easing curves.

Options, best first:
1. **Personal access token → Figma REST API (recommended, free).** Gives the full node JSON (exact styles, auto-layout, `reactions` = prototype interactions with trigger/transition/duration/easing, `flowStartingPoints` = flow names) and PNG/SVG exports. Token stored in gitignored `.env.local` as `FIGMA_TOKEN` (`.env.local` is already in `.gitignore`); read with a shell variable, never printed or committed.
2. Upgrade the Figma plan → MCP `get_design_context`, `get_motion_context`, `download_assets` work again.
3. Wait for the monthly MCP quota reset.
4. Proceed from screenshots only → visually close, **not** "exact"; motion timings would be estimates.

## 2. Non-negotiables

1. **Behaviour unchanged.** UI-only diffs. No edits to `storage.ts`, `AuthContext.tsx`, hooks' data logic, RLS/SQL, Edge Functions. `appointments.hospital_id → chambers.id` quirk untouched.
2. **Theming stays live.** Only Tailwind tokens (`primary`/`secondary`/`medical`/`brand`/`navy`/`surface`/`background`) or `useTheme()`; a new literal hex/rgba is a bug unless it is a fixed semantic (status) color. PDFs in `pdf/prescriptions/*` stay out of scope.
3. **Interaction language.** Filled pill CTAs use `.btn-sheen`; compact nav CTA keeps the "Button Featured Hover" collapse/expand. All new motion respects `prefers-reduced-motion`.
4. **Real assets only.** Icons/images come from Figma exports into `public/assets/figma/` (36 already exist — reuse before adding). No hand-drawn SVGs.
5. **One task = one commit**, each with `npm run build` green and the §6 smoke checks passed.

## 3. Figma ↔ code map

Section node IDs were read from the URL after selecting each layer. First-pass IDs are ✅; the ones marked ⚠️ came from a second pass and must be re-checked against the hierarchy in Phase 0.

| Figma section | Node ID | App target | Lines / notes |
|---|---|---|---|
| **Doctor - Queue** ("Doctor Q") | `255:6533` ✅ | `views/doctor/SerialManager.tsx`, `components/ui/ArcGauge.tsx`, `components/doctor/DoctorTabBar.tsx` | 1157 lines — most complex file. Contains frames *Queue* ×2 (`368:17738`, `341:18476` ✅), *Modal*, *Card 3*, *Queue Card* |
| **Doctor Overview** | `368:18645` ✅ | `views/doctor/Dashboard.tsx` | 305 lines; header/queue row already loosely modelled on it |
| Doctor Appointment | `255:11599` ⚠️ | `views/doctor/DoctorAppointments.tsx`, `components/ui/AppointmentCard.tsx` | Has an in-section *Modal* ("Book an appointment") |
| Prescription | `255:14768` ⚠️ | `views/doctor/PrescriptionEditor.tsx` | 811 lines |
| Analytics | `255:14766` ⚠️ | `views/doctor/Analytics.tsx` | recharts colors must come from `useTheme()` |
| Manage | `255:14767` ⚠️ | `views/doctor/DoctorMore.tsx`, `DoctorPracticeSettings.tsx`, `PatientManualRegistry.tsx` | |
| Payment & Subscription | `341:18165` ✅ | `views/doctor/PaymentSubscription.tsx` | |
| Account | `276:13530` ✅ | `views/doctor/DoctorProfileEditor.tsx` | |
| **Patient Dashboard** | `5:2400` ⚠️ | `views/patient/*` (`Home`, `Appointments`, `LiveSerial`, `Prescriptions`, `MedicineTracker`, `Consultations`, `Rewards`, `More`) | "Flow 1" prototype — name to be confirmed from `flowStartingPoints` |
| **Doctor Profile** | `254:8267` ⚠️ | `views/patient/DoctorProfile.tsx` (822 lines, incl. 4-step booking wizard) | |
| **Pre Login Pages** (landing) | `80:1481` ⚠️ | `views/patient/Home.tsx`, `components/Layout.tsx`, `components/Footer.tsx`, `components/ui/DoctorCard.tsx`, `components/ui/Button.tsx` | |
| ↳ **After Hero** | `80:1794` ✅ | `Home.tsx` sections below hero | see §4 |
| Old Pre Login Pages, Authentication Page, Components, Design System | — | Reference only unless a task needs them | |

> **Important finding:** the comments in `Home.tsx` cite Figma nodes `87:3801 … 87:3953`, but the current design lives under `80:*`. The landing page was most likely built from an earlier version of the design ("Old Pre Login Pages"?), so **every landing section needs a fresh diff against `80:1794`**, not just the hover work.

### Open naming questions (confirm in Phase 0, no user input needed if REST works)
- "Doctor Overview (the doctor profile page)": the Figma frame `Doctor Overview` is the **doctor's own dashboard home**; a separate `Doctor Profile` section is the **patient-facing** profile. Both are covered (Phase 2 and Phase 6).
- "Flow 1": confirm which frame it starts from and its full frame list.

## 4. Landing "After Hero" — verified structure (node `80:1794`, 1460 wide)

| Node | Content | Current code |
|---|---|---|
| `80:1795` 2nd Section | Header + Information Component; 3 *Process Cards* (507 / 349 / 296 wide × 307.8) | Home.tsx "How it works" |
| `80:1803` Frame 1000012208 | **Meet Our Medical Experts**: Header, 6 *Tab* pills (h 43; widths 63/139/161/102/135/134), 3 × *Doctor Card - Final* (384×502, gap 24), *Button Featured Hover* (110.8×44.7) | Home.tsx experts + `DoctorCard.tsx` |
| `80:1818` Frame 1000012728 | Header + "Design" composition (803×642): centre card 341×446 and 3 floating *Years Experience* badges (queue / prescription / group icons) + *Values* row ×3 | Home.tsx transparency + floating badges |
| `80:1839` Group 17 | Specialty row 1440×84, 6 items with sparkle icon | Home.tsx marquee |
| `80:1866` Frame 1000012147 | Header + 4 *Featured Tabs* (570×50) left, visual 577×552 right | Home.tsx "Simplifying healthcare" |
| `80:1881` Frame 1000008959 | Testimonials masonry, 3 columns (389/351/389), 56px avatars, top fade rectangle | Home.tsx reviews (real approved reviews only — keep) |
| `80:1907` Frame 1000012112 | FAQ: 5 rows (first expanded 120px, others 64px) + chevron | Home.tsx FAQ |

## 5. Task list

Every task: **Source** (Figma node) → **Target** (file) → **Done when**.

### Phase 0 — Data extraction (blocked on §1)
- [ ] 0.1 Get access (token / upgrade / reset).
- [ ] 0.2 Pull page hierarchy to depth 3 for pages *Web Version V1* and *App Version V1*; re-validate every ⚠️ ID in §3.
- [ ] 0.3 Read `flowStartingPoints` + every `reactions` entry (trigger, action, transition, duration, easing) → write `docs/figma/prototype-interactions.md`.
- [ ] 0.4 Export 2× reference PNGs of every in-scope frame → `docs/figma/reference/` (used for side-by-side checks).
- [ ] 0.5 Read Figma variables/styles (colors, type scale, radii, shadows); map to existing Tailwind tokens; list any *new* tokens needed.
- [ ] 0.6 Export needed icons/images into `public/assets/figma/` (reuse existing files where identical).
- [ ] 0.7 Capture "before" screenshots of the running app (1440 / 1024 / 390) for every in-scope screen → regression baseline.

### Phase 1 — Landing motion (most visible)
- [ ] 1.1 **Meet Our Medical Experts – doctor card hover** (`Doctor Card - Final`, children of `80:1813`) → `components/ui/DoctorCard.tsx`. Done when hover states match the prototype frame-for-frame (transform, overlay, image, text, easing, duration).
- [ ] 1.2 **"Get an Appointment / Go to Appointment" button animation** → `components/ui/DoctorCard.tsx` + `Button.tsx`. Keep `.btn-sheen`.
- [ ] 1.3 **Tabs** row (6 pills) — active/hover/transition behaviour, filtering still works.
- [ ] 1.4 **"Button Featured Hover"** (`80:1817`) — re-verify the existing navbar/section implementation against Figma's variants.
- [ ] 1.5 Diff and fix the rest of §4 (process cards, floating badges, values, specialty row, featured tabs, testimonials, FAQ) — including any scroll/hover reactions found in 0.3.

### Phase 2 — Doctor Overview (`368:18645` → `Dashboard.tsx`)
- [ ] 2.1 Header + hospital switcher, welcome block.
- [ ] 2.2 Queue-manage row (Appointments / Queue status / Earning) and `ArcGauge` fidelity.
- [ ] 2.3 Remaining cards/lists; tab bar (`DoctorTabBar`) exact styling.
- [ ] 2.4 Hover/press states from prototype.

### Phase 3 — Doctor Queue (`255:6533` → `SerialManager.tsx`) — highest risk
- [ ] 3.1 Slice the file into presentational pieces **without touching state/effects** (extract only JSX + styling), then restyle: Queue page (both states `368:17738`, `341:18476`), *Queue Card*, *Card 3* (queue-status modal), *Modal*.
- [ ] 3.2 Time tracker / arc gauge components.
- [ ] 3.3 Prototype interactions (open modal, start/pause, next).
- [ ] 3.4 Verify: start queue, next, skip, complete, prescription hand-off, live patient serial still update.

### Phase 4 — Other doctor pages
- [ ] 4.1 Doctor Appointment (+ booking modal) → `DoctorAppointments.tsx`
- [ ] 4.2 Prescription → `PrescriptionEditor.tsx` (UI only; PDF generation untouched)
- [ ] 4.3 Analytics → `Analytics.tsx` (theme via `useTheme()`)
- [ ] 4.4 Manage → `DoctorMore.tsx` / `DoctorPracticeSettings.tsx` / `PatientManualRegistry.tsx`
- [ ] 4.5 Payment & Subscription; 4.6 Account

### Phase 5 — Patient Dashboard ("Flow 1", `5:2400`)
- [ ] 5.1 Walk every frame in the flow; produce a frame → component checklist.
- [ ] 5.2 Implement per frame in `views/patient/*` (Home dashboard, Appointments, Live Serial, Prescriptions, Medicine Tracker, Consultations, Rewards, More).
- [ ] 5.3 Prototype transitions between frames (only where the prototype defines them).
- [ ] 5.4 Mobile layouts sourced from *App Version V1*.

### Phase 6 — Doctor Profile (`254:8267` → `DoctorProfile.tsx`)
- [ ] 6.1 Page layout + hover states. 6.2 Booking wizard steps and modal. 6.3 Reviews, chamber cards.

### Phase 7 — QA
- [ ] 7.1 Side-by-side (Figma reference vs app) at 1440 / 1024 / 390 for every screen.
- [ ] 7.2 Theme test: change Branding colors in Super Admin → new UI recolors.
- [ ] 7.3 `prefers-reduced-motion` test. 7.4 `npm run build` + `npx cap sync android` sanity.

## 6. Smoke checklist (run after every task)
Patient login (email+password) · Doctor login (BMDC+password) · Admin login · Book appointment (4-step wizard) · Live serial view · Doctor queue start/next/complete · Write + save prescription · PDF download · Manual booking · Analytics loads · Session-expiry logout · Mobile bottom nav · no console errors.

## 7. Risks
- **No exact data yet** → mitigated by §1 option 1.
- **Prototype motion ≠ CSS.** Smart Animate between variants must be translated to CSS transitions/keyframes; spring easings may need `motion` (not currently a dependency — decide in Phase 0 based on what the prototype uses; prefer pure CSS).
- **Design drift.** The file has an "Old" and a current landing; the code targets old node IDs (§3 finding).
- **SerialManager size.** Restyle in slices, never mix logic changes with UI changes.
- **Desktop-only web frames.** Figma web frames are 1440-wide; responsive behaviour is inferred from *App Version V1* and existing breakpoints.
- **Fonts.** Confirm typeface(s) from Figma styles before touching Tailwind `fontFamily`.
