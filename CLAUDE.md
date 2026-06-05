# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev        # Vite dev server on port 3000
npm run email      # Email server on port 3001 (required for OTP and doctor status emails)
npm run dev:all    # Run both Vite + email server concurrently
npm run build      # Production build → dist/
```

For Android: `npm run build && npx cap sync android`

## Architecture Overview

### Auth & Session (NOT Supabase JWT)
The app uses **custom bcrypt auth** — `auth.uid()` is always `null`. All RLS policies must be open (`USING (true) WITH CHECK (true)`). Sessions are stored in localStorage via three storage classes in `storage.ts`: `PatientStorage`, `DoctorStorage`, `AdminStorage`. Each has a 24-hour TTL with auto-logout via `session-expired` event dispatch.

Login is role-branched: patients use **email + password**, doctors use BMDC number + password, admins use email + password.

### Role Routing (App.tsx)
Five roles render entirely separate route trees — `PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`, `BRANCH_MANAGER`. `AuthContext.tsx` provides `userRole`; `App.tsx` switches the entire view tree based on it. No shared layout between roles.

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
Runs separately as `server/emailServer.cjs` (Express, port 3001). Uses Hostinger SMTP port 465 with `tls: { rejectUnauthorized: false }`. Endpoints: `POST /api/send-otp`, `POST /api/send-doctor-status`.

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
| `hooks/useHospitalAdminData.ts` | Hospital admin roster and analytics |
| `SETUP_DOCOCLOCK.sql` | Full database schema + seed data |
