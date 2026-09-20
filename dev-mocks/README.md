# dev-mocks — backend-free preview harness

Render **every doctor and patient screen** (plus the marketing pages and the four admin-tier roles) with realistic,
fictional data — no Supabase project, no `.env`, no network. Built for engineers and reviewers who need to look at a
screen, take screenshots, or check a design change without touching the real database.

It is **purely additive**: nothing under `dev-mocks/` or `vite.mock.config.ts` is imported by the normal app, and no
existing app file was modified. `npm run dev` / `npm run build` behave exactly as before.

## Run it

```bash
npx vite --config vite.mock.config.ts --port 3100
# then open  http://localhost:3100/?as=doctor      (or ?as=patient, ?as=guest, ...)
```

The tab title is prefixed with `[MOCK]` so preview tabs are unmistakable. Stop with Ctrl-C.

## URL cheat-sheet

`?as=` logs you in *before the app boots* by writing the same localStorage session `storage.ts` reads. The choice is
remembered in `sessionStorage`, so once set you can navigate / reload without repeating it. An in-app **Logout** flips
the remembered identity to `guest` (a reload will not silently log you back in). `?as=` always wins over the remembered value.

| `?as=` | Identity | Lands on |
|---|---|---|
| `doctor` | **Dr. Sarah Rahman** — Cardiologist, BMDC `DEMO-0001`, 2 chambers | `/doctor/dashboard` |
| `patient` | **Nadia Karim** — has a live serial (#9) in Sarah's queue today | `/patient/home` |
| `admin` (`superadmin`) | Demo Super Admin | dashboard (tabbed) |
| `hospital` | Demo Hospital Admin (owns *Demo Central Hospital*) | dashboard |
| `branch` | Demo Branch Manager (*Dhanmondi Main Campus*) | dashboard |
| `assistant` | Demo Assistant of Dr. Sarah Rahman | `/assistant/dashboard` |
| `guest` (`none`, `logout`) | logged out | marketing site |

The app does not use a URL router (it reads `location.pathname` once, then keeps state), so paths are deep-linkable
but in-app navigation only updates the address bar.

### Doctor (`?as=doctor`)

| Screen | URL | Notes |
|---|---|---|
| Dashboard | `/doctor/dashboard` | today's queue counts, earnings, chamber switcher |
| Serial Manager | `/doctor/serial-manager` | live queue: 3 completed, 1 consulting, waiting, late, cancelled, 2 reserved slots, 1 walk-in |
| Appointments | `/doctor/appointments` | ~500 of Sarah's rows (≈1,000 across all doctors): today, 60 days of history, next 5 days |
| Prescription editor | `/doctor/prescription` | Real path: Serial Manager → click a patient row → **Open Prescription** (pre-fills the patient). The URL alone opens a blank editor. Also in the nav (**RX**) |
| Analytics | `/doctor/analytics` | |
| Practice settings | `/doctor/practice-settings` | 2 chambers, 1 pending chamber request, 1 assistant |
| Manual booking | `/doctor/manual-booking` | walk-in registry (2 reserved serials) |
| Payment & subscription | `/doctor/payment` | earnings derived from completed appointment fees |
| Profile / editor | `/doctor/profile`, `/doctor/profile-editor` | |

### Patient (`?as=patient`)

| Screen | URL | Notes |
|---|---|---|
| Landing / home | `/` (redirects to `/patient/home`) | 10 approved doctors, testimonials |
| Find doctors | `/patient/doctors` | |
| Doctor profile | `/doctor/d0c70001-0001-4000-8000-000000000001` | Deep link (ids are `d0c7` + 4 hex digits, see `fixtures/people.ts`). In-app it opens from any doctor card. `/patient/profile` has no route of its own and renders Home unless reached through a card. Book flow works end to end |
| Appointments | `/patient/appointments` | 2 upcoming + 1 today, history, 1 cancelled, 1 family member |
| Live serial | `/live-serial` | serving #6, you #9 |
| Prescriptions | `/patient/prescriptions` | 5 records across 3 hospitals |
| Consultations | `/patient/consultations` | |
| Medicine tracker | `/patient/medicine-tracker` | from prescriptions + 2 self-tracked medicines |
| Rewards / More | `/patient/rewards`, `/patient/more` | |

### Logged out (`?as=guest`)
`/`, `/for-doctors` (doctor registration wizard — OTP: **any 6 digits**), `/hospitals`, `/lab-diagnostics`, `/blogs`, `/about-us`, `/contact-us`, `/doctor-login`, `/admin-login`.

### Real login forms also work
Every account's password is **`Demo@1234`** (bcrypt hash in `fixtures/people.ts`).
Doctor: BMDC `DEMO-0001`…`DEMO-0010` · Patient: `nadia.karim@example.test` · Super admin: `superadmin@example.test` ·
Hospital admin: `hospital.admin@example.test` · Branch manager: `branch.manager@example.test` · Assistant: phone `01000000904`.

### Extra query params
- `?mockLatency=200` — artificial latency per query in ms (default 25; `0` = next microtask). Handy for checking loading states.

### Debug handles (browser console)
```js
__MOCK_DB__.tables()               // row counts per table
__MOCK_DB__.dump('appointments')   // deep copy of a table
__MOCK_DB__.reset()                // re-seed the store without reloading
__DEVMOCK_ERRORS__                 // console.error / window.error / unhandledrejection since THIS page load
__DEVMOCK_BLOCKED__                // any attempted request to a *.supabase.* host (should always be [])
```
(`console.debug` lines prefixed `[dev-mocks]` — visible with "Verbose" enabled — tell you when a query touched a
column/relationship/RPC the fixtures don't know about.)

## How it works

| Piece | File | What it does |
|---|---|---|
| Config | `vite.mock.config.ts` | `mergeConfig`s onto `vite.config.ts`; adds the alias, the bootstrap plugin, isolation settings |
| Module swap | regex alias `^(\.{1,2}/)+supabase$` → `dev-mocks/supabase.mock.ts` | matches `./supabase`, `../supabase`, `../../supabase` (static **and** dynamic `import()`); the mock never imports `@supabase/supabase-js` |
| Client | `supabase.mock.ts` + `engine/*` | `from()` builder (select/insert/update/upsert/delete, eq/neq/gt/gte/lt/lte/in/is/like/ilike/or/and/not/contains/match/filter, order/limit/range/single/maybeSingle/count+head, embedded selects like `chambers!doctor_id(*)`, `hospital:hospital_id(...)`, `!inner`), `rpc`, `auth`, `storage`, `functions.invoke`, `channel`/`removeChannel` |
| Store | `engine/db.ts` | in-memory tables; primary/unique keys, foreign keys (drive embeds + cascade/set-null on delete), insert defaults |
| Session | `bootstrap.ts` (+ `identities.ts`) | inline script injected at the top of `<head>`: `?as=` → localStorage session, error log, request guard |
| Data | `fixtures/*` | people, facilities, clinical templates, visits, content |

Isolation guarantees: the mock config sets `envDir` to `dev-mocks/` (so `.env` / `.env.local` are **never read**),
defines `VITE_SUPABASE_URL` as a non-resolving host, uses its own optimizer cache (`node_modules/.vite-mock`), and the
bootstrap script rejects any fetch / XHR / WebSocket to `*.supabase.*`. The only external requests are Google Fonts.

## Adding or changing fixtures

Fixtures are generated in the browser **relative to today**, from a seeded RNG (stable within a day), so "today" always
has a live queue and history always covers the last 60 days.

1. **More rows in an existing table** — edit the module that owns it: `people.ts` (profiles), `facilities.ts`
   (hospitals/branches/sectors/chambers/schedules/requests), `visits.ts` (appointments, prescriptions, queue sessions,
   reviews, notifications, self-tracked medicines...), `content.ts` (medicines, banners, blogs, settings, theme).
2. **A new table** — return it from any module (`return { my_table: rows }`). If it has foreign keys (needed for
   `select('*, other(*)')` embeds and delete cascades) or insert defaults, add an entry to `TABLE_META` in `engine/db.ts`.
3. **A new module** — create `fixtures/foo.ts` exporting `buildFoo(): Seed` and append it to `MODULES` in `fixtures/index.ts`.
4. **An RPC / Edge Function** — `registerRpc('name', args => ({ data, error: null }))` /
   `registerFunction('name', body => ({ data, error: null }))` (exported from `supabase.mock.ts`, defaults live in `engine/clientStubs.ts`).
5. **A new persona for `?as=`** — add it to `IDENTITIES` (and `AS_ALIASES`) in `identities.ts`.

Conventions to keep the data faithful to `SETUP_DOCOCLOCK.sql` / `types.ts`:
- snake_case columns exactly as in Postgres; ids are UUID-shaped (`uuid(ns, n)` in `fixtures/util.ts`);
- `appointments.hospital_id` is a **chamber** id, not a hospital id (see CLAUDE.md);
- `schedules.start_time/end_time` are 24-hour `"HH:mm"`; `appointments.appointment_time` uses `"4:20 PM"` (that is what the analytics and queue-sorting helpers parse);
- statuses come from `AppointmentStatus`: `waiting | consulting | completed | cancelled | late`; queue sessions use `session_status NOT_STARTED | RUNNING` and `meta_status IDLE | DELAYED | BREAK | ACTIVE`;
- everything fictional: names, phones `01000-000NNN`, `@example.test` e-mails, BMDC `DEMO-NNNN`, manufacturer "Demo Pharma Ltd.".

Editing any file under `dev-mocks/fixtures/` or `dev-mocks/engine/` triggers a clean full-page reload (the mock module is the single HMR boundary). Editing `people.ts`, `identities.ts` or `bootstrap.ts` restarts the Vite server (they are read by the config) — refresh the tab afterwards.

## Screenshot recipe

Viewports: **1440×900** (desktop), **1024×768** (tablet), **390×844** (phone). With the Claude Browser pane tools:

```
1. tabs_create                                   -> your own tabId (pass it to every call below)
2. resize_window { width: 1440, height: 900, tabId }      (repeat with 1024x768 and 390x844)
3. navigate { url: "http://localhost:3100/doctor/serial-manager?as=doctor", tabId }
4. computer { action: "wait", duration: 2, tabId }        (first hit of a lazy route also compiles it: allow 3s)
5. javascript_tool  JSON.stringify(window.__DEVMOCK_ERRORS__)   -> expect []
6. computer { action: "screenshot", tabId }
7. resize_window { preset: "desktop", tabId }    when finished; tabs_close when done
```
Notes: screenshots are scaled to fit the pane (coordinates stay in the pane's frame). For below-the-fold sections use
`javascript_tool` with `el.scrollIntoView({behavior:'instant'})` (smooth scrolling can capture a mid-scroll frame).
Do not rely on the console buffer alone: it accumulates across navigations — use `__DEVMOCK_ERRORS__`, which resets on every page load.
The app calls `window.alert` after some actions (e.g. "Send Rx"); those dialogs block browser automation.

## Known limitations

- **Nothing persists.** Writes mutate the in-memory store for the life of the page; a reload re-seeds. Two tabs do not share state.
- **Not a database.** No column-type checks, RLS, or NOT NULL / FK validation on insert (e.g. the app's `app-manual-…` appointment ids would be rejected by Postgres' UUID column but are accepted here). Unique keys (pk, profiles email/phone/bmdc, blog slug) and delete cascades *are* enforced.
- **Lenient selects.** Selecting a column the fixtures lack returns `undefined` instead of a PostgREST error. Consequence worth knowing: `Home.tsx` selects `name, image` from `profiles`, columns that do not exist in `SETUP_DOCOCLOCK.sql`, so testimonials show "Verified Patient" — the same as production. Likewise `DoctorProfile` / search read `experienceYears` / `totalPatients` from the raw snake_case row, so they fall back to defaults (12 years / 2500+) in the mock and in production.
- **Query engine scope.** Filters on embedded columns (`schedules.day_of_week=...`), aggregates inside `select()`, `.csv()`, `.explain()`, full-text search semantics and ordering by embedded columns are not implemented (the last two are best-effort/no-ops).
- **Stubs.** Edge Functions (`send-otp`, `update-theme`, `update-location`, `generate-image`) return success without effect; `verify_email_otp` accepts any 6 digits; `get_nearest_doctors` returns fake deterministic distances; Supabase Auth is not used by the app so the auth stub is empty; realtime channels never fire; uploads become `blob:` URLs for the life of the page.
- **Not mocked:** the local email server (`http://localhost:3001`, Super Admin approve/reject e-mails) — that action will fail in the preview exactly as it does when the server is not running. Google Sign-In / Calendar show "not configured" because `.env` is not loaded.
- **Assets.** Only three doctor portraits, one torso crop (`hero-doctor.png`) and three avatars exist under `public/assets/figma`, so photos are reused and not gender-matched to names.
- **Time-relative data.** Because data is generated from "now", exact numbers (counts, "this month vs last month" percentages) change from day to day. Chamber 1 (Sarah, Demo Central) is open every day so the live queue always exists; her Lakeview chamber is Mon/Wed/Sat.
- Tables for payments / subscriptions / reward points are seeded but the current screens derive those numbers from appointments (payments) or hard-code them (rewards: 450 pts) — the rows are there for when the screens bind to real tables.
