# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev        # Vite dev server on port 3000
npm run email      # Email server on port 3001 (doctor approval/rejection emails only — OTP is a Supabase Edge Function now)
npm run dev:all    # Run both Vite + email server concurrently
npm run build      # Production build → dist/
```

For Android: `npm run build && npx cap sync android`

## Architecture Overview

### Auth & Session (NOT Supabase JWT)
The app uses **custom bcrypt auth** — `auth.uid()` is always `null`. All RLS policies must be open (`USING (true) WITH CHECK (true)`). Sessions are stored in localStorage via three storage classes in `storage.ts`: `PatientStorage`, `DoctorStorage`, `AdminStorage`. Each has a 24-hour TTL with auto-logout via `session-expired` event dispatch.

Login is role-branched: patients use **email + password**, doctors use BMDC number + password, admins use email + password.

### Role Routing (App.tsx)
Six roles render entirely separate route trees — `PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`, `BRANCH_MANAGER`, `ASSISTANT`. `AuthContext.tsx` provides `userRole`; `App.tsx` switches the entire view tree based on it. Patient/Doctor get `components/Layout.tsx`'s nav; all four admin-tier roles (`SUPER_ADMIN`/`HOSPITAL_ADMIN`/`BRANCH_MANAGER`/`ASSISTANT`) share one chrome instead — see **Admin Layout** below.

### Admin Layout (components/layout/AdminLayout.tsx)
One shared shell for all four admin-tier roles — desktop sidebar + top header, mobile hamburger drawer + bottom dock (top 4 nav items + a "More" sheet for the rest). Replaces what used to be four independently hand-built header+sidebar shells. `Layout.tsx` renders no chrome at all for these roles (see its `isAdminTier` check) so `AdminLayout` is the single source of nav for them.

It's deliberately not URL-route-shaped: `navItems`/`activeId`/`onSelect` just need string ids. `SuperAdminDashboard`/`HospitalAdminDashboard`/`BranchManagerDashboard` drive it with internal tab state (`id` = tab key); the Assistant role drives it with `currentPath`/`navigate` (`id` = the actual route) since that dashboard is path-based. Each dashboard file now only renders its tab *content* — the header/sidebar JSX it used to build internally is gone.

### Theming (contexts/ThemeContext.tsx)
All brand colors are admin-configurable from Super Admin → Branding, not hardcoded. Three roles only — `primary` (default `#0ca768`), `secondary` (default `#03402a`), `background` (default `#f5f7f6`) — status/text colors stay fixed for contrast safety. Mechanism:
- `index.css` `:root` defines RGB-triplet CSS vars (`--color-primary-500: 12 167 104`, etc.), one full 50-900 scale each for primary/secondary, plus `--color-background`.
- `tailwind.config.js`'s existing `medical`/`brand`/`navy`/`surface`/`container` keys (and new `primary`/`secondary` aliases for new code) resolve through `rgb(var(--x) / <alpha-value>)` instead of literal hex — this is why ~55 pre-existing files needed zero changes to become themeable; only the two config files did.
- `utils/colorScale.ts`'s `generateColorScale(hex)` derives a full 50-900 scale from one hex (white/black RGB mixing), so an admin only ever picks 3 colors.
- `ThemeProvider` applies the cached (or default) theme synchronously before paint via `document.documentElement.style.setProperty(...)`, then background-refreshes from the `theme_settings` table (public read).
- Writes go through the `update-theme` Edge Function (service-role key) — `theme_settings` has **no** client write policy at all, by design (see `MIGRATION_THEME_SETTINGS.sql`).
- A handful of files that pass colors directly into `recharts` props as literal hex strings (not Tailwind classes) — e.g. `views/doctor/Analytics.tsx` — read `useTheme().colors` at render time instead, since Tailwind classes can't reach those.

### Super Admin / Hospital Admin Analytics
`components/admin/AnalyticsOverview.tsx` (platform-wide, via `hooks/useSuperAdminAnalytics.ts`) and `components/hospital-admin/HospitalAnalytics.tsx` (per-hospital, computed in `hooks/useHospitalAdminData.ts`'s `computeHospitalAnalytics`) are real aggregate queries over `profiles`/`appointments` now — they used to be `Math.random()`-generated on every render. Shared chart primitives live in `components/admin/charts/` (`TrendAreaChart`, `DonutStatusChart`, `LeaderboardBar`). "Estimated Revenue" is exactly that — `SUM(appointments.fee)` for completed appointments — since there's no payment gateway integrated.

### Interaction / hover language
Figma's design system documents exactly one deliberate hover treatment, applied consistently to every filled/solid pill CTA: a soft radial highlight (`mix-blend-mode: soft-light`) that fades in on hover, confirmed on both the generic Buttons component and the Doctor Card's "Get an Appointment" button. This is the `.btn-sheen` utility class in `index.css` — apply it to any new filled CTA pill (it's already on `Button.tsx`'s `primary`/`accent`/`gradient` variants and on the other hand-rolled filled buttons across the app; it's a no-op on non-pill/outline/secondary buttons, matching Figma's own scoping). Separately, the navbar's "Register" button implements Figma's other documented pattern — "Button Featured Hover" — where a compact CTA collapses to an icon-only circle by default and expands to show its label on hover (pure CSS `max-width` transition, see `components/Layout.tsx`); that pattern is specific to space-constrained nav slots, not applied to full-width marketing CTAs.

### Theming coverage — a note on scope
When adding any new UI, remember the live theme only reaches code that goes through Tailwind's `medical`/`brand`/`navy`/`surface`/`primary`/`secondary`/`background` classes (or reads `useTheme()` directly for non-Tailwind contexts like inline SVG/canvas/recharts props) — a literal hex value or an inline `style={{ background: '#...' }}` will not recolor when Super Admin changes the brand colors. A full-codebase sweep found and fixed several of these (the `<body>` background itself was hardcoded, several marketing CTAs used inline gradient styles, and a handful of `shadow-[...rgba(...)]` glow effects referenced fixed decimal RGB) — but this is exactly the kind of regression that's easy to reintroduce by pasting a literal hex value instead of a token, so treat any new literal hex/rgba color as a bug unless it's a genuinely fixed semantic color (status chips, toasts) or an intentionally brand-independent decorative accent (already commented where that's the case, e.g. SerialManager's pastel queue-ring motif).

**Known, deliberate exception:** `pdf/prescriptions/{classic,modern,minimal}PDF.ts` (the downloadable prescription PDF, via jsPDF draw calls, not React/Tailwind) are NOT wired to the live theme. Each of the 3 templates is a fixed, distinct visual identity a doctor picks between (classic=grayscale/formal, minimal=dark/mono, modern=blue-accented) rather than one template that reflects whatever the platform's current brand color is — the "modern" template's own docstring in `pdf/prescriptions/index.ts` literally describes it as "blue accent color". If a future request wants prescription PDFs to follow the live brand color instead, that means passing a theme color into these generator functions as a real parameter (they currently take only `PrescriptionData`) and deciding whether that should apply to all 3 templates or just "modern" — treat it as a deliberate design decision to make, not a bug to silently fix.

### Security notes for future work
- OTP generation is server-side only now (`supabase/functions/send-otp`, called via `supabase.functions.invoke('send-otp', ...)` in `hooks/useEmailOTP.ts`) — never generate or insert an OTP from client code again; that was the exact vulnerability that got fixed. This also happens to be the first time OTP email delivery can work in production at all — the old path called `http://localhost:3001` directly from the patient's own browser, which only ever worked when testing on the same machine as the email server. **Operational requirement:** the Edge Function sends via Resend, not the Hostinger SMTP server — set `RESEND_API_KEY` as a Supabase Edge Function secret (`supabase secrets set RESEND_API_KEY=...`) or OTP emails silently only get logged server-side instead of delivered.
- `server/emailServer.cjs` reads `SMTP_USER`/`SMTP_PASS` from `server/.env` (gitignored, see `server/.env.example`) — never hardcode credentials back into that file.
- Any third-party API key (Gemini, Resend, etc.) must be a Supabase Edge Function secret, never a `VITE_*` env var or a Vite `define` — this is a static SPA with no server context, so anything client-visible is public. See `supabase/functions/generate-image` for the pattern.
- New tables that don't need the app's existing open-RLS posture (like `theme_settings`) should ship locked down from day one — public read only, service-role-only writes via an Edge Function — rather than inheriting the blanket `"open" FOR ALL` policy most existing tables use.
- The RLS-is-open / auth-happens-in-TypeScript model is a known, accepted architectural limitation of this app (not something to "fix" opportunistically) — a real fix means migrating to Supabase Auth with JWT-backed RLS across every table, which is a dedicated project, not a drive-by change.

### Database Layer (storage.ts + supabase.ts)
`storage.ts` is the single data-access layer — all Supabase queries go through functions here, not in components. The Supabase client comes from `supabase.ts` (env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

**Critical naming quirk:** `appointments.hospital_id` references `chambers.id`, not `hospitals.id`. A "chamber" is a doctor's practice location; `hospitals` is a separate entity for the Hospital Admin feature.

### Key Data Flow
1. Doctor creates a chamber (`chambers`) with schedules (`schedules`)
2. Patient books — `appointments.hospital_id = chambers.id`
3. Doctor manages live queue in `SerialManager.tsx` (most complex file, ~60KB)
4. Doctor writes prescription in `PrescriptionEditor.tsx` → saved to `prescriptions` + `prescription_medicines`
5. Patient downloads prescription via local jsPDF in `pdf/prescriptions/` (3 templates: classic, modern, minimal) — not a Supabase Edge Function

### Email Server
Runs separately as `server/emailServer.cjs` (Express, port 3001). Uses Hostinger SMTP port 465 with `tls: { rejectUnauthorized: false }`. Credentials come from `server/.env` (gitignored — copy `server/.env.example`), not hardcoded. Only endpoint left: `POST /api/send-doctor-status` (approval/rejection emails). OTP delivery no longer goes through this server at all — see below.

**Important, pre-existing limitation this doesn't fully solve:** this server is a plain local Node process, reachable only at `http://localhost:3001` — meaning `/api/send-doctor-status` only ever works when a Super Admin's own browser and this server run on the same machine (e.g. local dev). It is not reachable by anyone once the SPA is deployed (Netlify). Wiring approval emails through a real Edge Function (like OTP now is) is a good follow-up, not done in this pass.

### Database Schema
`SETUP_DOCOCLOCK.sql` is the single source of truth for schema + seed data. Table FK order matters: `profiles → hospitals → chambers → schedules → appointments → prescriptions → …`. The `verify_email_otp` RPC function is defined here.

### Mobile
Capacitor wraps the production build for Android. Avoid `window.alert` and browser-only APIs.

## Key Files for Orientation

| File | Purpose |
|------|---------|
| `types.ts` | All TypeScript interfaces — start here to understand data shapes |
| `storage.ts` | All Supabase queries + localStorage persistence |
| `AuthContext.tsx` | Login, signup, session restore, logout |
| `App.tsx` | Role-based route tree |
| `views/doctor/SerialManager.tsx` | Most complex logic — live queue management |
| `hooks/useSuperAdminData.ts` | Super admin data + doctor approvals |
| `hooks/useSuperAdminAnalytics.ts` | Real platform-wide analytics aggregates |
| `hooks/useHospitalAdminData.ts` | Hospital admin roster and analytics |
| `components/layout/AdminLayout.tsx` | Shared chrome for all four admin-tier roles |
| `contexts/ThemeContext.tsx` | Live, admin-configurable brand colors |
| `utils/colorScale.ts` | Generates a 50-900 color scale from one hex |
| `SETUP_DOCOCLOCK.sql` | Full database schema + seed data |
| `MIGRATION_THEME_SETTINGS.sql`, `MIGRATION_EMAIL_OTP_HARDENING.sql`, `MIGRATION_ILLUSTRATIONS_BUCKET.sql` | Incremental migrations for this pass — run once each in the Supabase SQL editor |
