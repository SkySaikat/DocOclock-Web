# DocOClock — Figma prototype flow map (unit: tokens)

Figma file `zJRyAML8hv0uEBOXtu5Hpn`. All data read with read-only `use_figma` scripts (`flowStartingPoints`, every node `reactions`, breadth-first walk from each start frame, node ids resolved to frame name / size / section). Nothing here is guessed.

## 0. Conventions and how to read this

- **Trigger**: `ON_CLICK`, `ON_HOVER` (Figma "While hovering" = CHANGE_TO another variant; returns to the previous state on mouse-leave), `AFTER_TIMEOUT tN` (N seconds).
- **Action**: `NAVIGATE` (replace screen), `OVERLAY` (open frame on top; `oX,Y` = overlay offset relative to the trigger node, px; absent offset = centred modal), `SWAP` (replace the current overlay with another), `CLOSE`, `BACK`, `CHANGE_TO` (variant swap on a component set).
- **Transition**: `TYPE/EASING/duration[/direction]`. `EASE_OUT` = `cubic-bezier(0,0,.58,1)`; `DISSOLVE` = cross-fade; `SMART_ANIMATE` = tween matching layers; `MOVE_IN dir` = slide in from that edge. Missing transition = instant.
- Ids are `node id`; a frame's **section** is the enclosing Figma SECTION (`(page)` = loose frame directly on the page).
- The 8 requested flows are `flowStartingPoints` of page `Web Version V1`. Page `App Version V1` has **11 more** (section 6); they are documented too because they cover the phone versions.
- Three of the eight flows (Prescription, Queue, Appointments) plus Phone View are **one connected prototype graph** (the doctor console, 38 frames). It is documented once in section 3 and each flow only adds its entry point.
- Frame → app route mapping uses `App.tsx` (`renderView`) and `components/doctor/DoctorTabBar.tsx` (doctor nav: Overview `/doctor/dashboard`, Queue `/doctor/serial-manager`, Appointments `/doctor/appointments`, Prescriptions `/doctor/prescription`, Analytics `/doctor/analytics`, Manage `/doctor/practice-settings`).

## 1. Flow index

| Flow (page) | Start node | Start frame | Section | Size | Frames reached | Nature |
|---|---|---|---|---|---|---|
| **Flow 1** (Web) | `32:1183` | List Page | Old Pre Login Pages | 1460×3864 | 2 | LEGACY doctor list → doctor detail |
| **PreLogin 1** (Web) | `80:1754` | Landing Page | Pre Login Pages | 1460×8223 | 2 | current marketing: Landing → List Page |
| **Prescription** (Web) | `307:13617` | Prescriptions | Prescription | 1440×800 | 38 (doctor console graph) | doctor console |
| **Queue** (Web) | `328:13919` | Queue (loose frame) | (page) | 1440×800 | 39 (same graph) | doctor console |
| **Appointments** (Web) | `255:11674` | Appointments | Doctor Appointment | 1440×800 | 38 (same graph) | doctor console |
| **Flow 5** (Web) | `303:13394` | Search Component (a COMPONENT, not a frame) | Components | 538×41 | 1 overlay | component prototype: filter menu |
| **Phone View** (Web) | `341:18476` | Queue (phone) | (page) | 400×917 | 39 (doctor graph via a modal) | phone Queue |
| **Patient** (Web) | `339:15916` | Queue | Patient Dashboard | 1440×800 | 14 | patient console |

App Version V1 flows: `Flow 5` 569:15748 · `Flow 6` 569:15131 · `Flow 7` 572:21642 · `Flow 8` 572:24334 · `Flow 9` 586:15417 · `Flow 10` 572:25253 · `Flow 11` 586:15623 · `Flow 12` 586:16245 · `Flow 13` 569:19676 · `Flow 14` 572:25777 · `Patient 1` 590:15546 (section 6).

Global motion facts across the whole file are in `tokens.md` §7 (hover = `SMART_ANIMATE EASE_OUT 0.3s`; screen change = `DISSOLVE EASE_OUT 0.3s`; profile-area changes 0.5s; landing "View All" `SMART_ANIMATE GENTLE 1.022s`).

---

## 2. Marketing flows

### 2.1 PreLogin 1 — `80:1754` Landing Page (current)

Section `Pre Login Pages` (80:1481). Landing children: `Hero` 1460×915, `Group 18` (specialty row, 1440×84 @10,915 — likely the plan's `Group 17` row), `After Hero` 1460×6327 @0,999, `Footer` 1460×898 @0,7326, `Navbar/Default` 1224×69 @118,26 (absolute).

| # | From (frame → node) | Trigger | Action | To | Transition |
|---|---|---|---|---|---|
| 1 | Landing `80:1754` → **`View All`** = `Buttons` (Primary) inside `Button Featured Hover` `80:1817` (Frame 1000012208 "Meet Our Medical Experts" in After Hero; node id `I80:1817;80:4765`) | ON_CLICK | NAVIGATE | List Page `80:1482` (1460×3962, Pre Login Pages) | **SMART_ANIMATE GENTLE 1.022 s** (the only spring in the file) |
| 2 | Landing → 3× `Doctor Card - Final` (`80:1814`…, in Doctor Cards) | ON_HOVER | CHANGE_TO `Property 1=Default` (`80:4686`, set `80:4685`) | (same frame) | SMART_ANIMATE EASE_OUT 0.3 — the card is instanced in state `Variant2` (384×502) and hover swaps to `Default` (384×482 + shadow `0,-8,20,.05`) |
| 3 | Landing → 5× `Button Usual Hover` "Register" (in `Information Component`) | ON_HOVER | CHANGE_TO `Property 1=Hovered` (`80:4772`, set `80:4768`) | (same frame) | SMART_ANIMATE EASE_OUT 0.3 |
| 4 | List Page `80:1482` → 9× Doctor Card (`80:1524`…, in `How it works`) | ON_HOVER | CHANGE_TO Default (`80:4686`) | (same) | SMART_ANIMATE EASE_OUT 0.3 |
| 5 | List Page → 2× `Button Usual Hover` "Register" | ON_HOVER | CHANGE_TO Hovered | (same) | SMART_ANIMATE EASE_OUT 0.3 |

No click on a Doctor Card navigates anywhere in this flow (see gap G1).
List Page children: Navbar 1460×92, Header 1460×107, Filtration 1460×56, Result Show 1460×48, `How it works` 1440×1554 @10 (doctor grid), Pagination 96, Frame 1000010275 775, Footer 898; vertical auto-layout, gap 48.

**App mapping**: Landing `80:1754` → `/` (`Home`, `views/patient/Home.tsx`); List Page `80:1482` → `/patient/doctors` (`DoctorSearchView`); the `View All` CTA in the experts section → `onNavigate('/patient/doctors')`. Navbar links (Doctor, Hospital, Lab & Diagnostic, Blogs, About us, Contact us, Login, Register) → `Layout.tsx` nav; `/hospitals`, `/lab-diagnostics`, `/blogs`, `/about-us`, `/contact-us` exist.

Unlinked frames in `Pre Login Pages` (present in the design, no reactions reach them): second List Page `326:13058`, five `Main` pages (`80:2652` 1440×1980, `80:2778` 1440×2045, `80:2896` 1440×2045, `303:14598`/`303:14768`/`303:14940`/`303:15866` 1440×1550 — patient-facing doctor detail / booking steps), Modals `303:15350` 617×451 and `303:15363` 619×216, `Navbar` component `80:7429`, `Text` `80:1747`, `3` `80:1730` (251×237 popover).

### 2.2 Flow 1 — `32:1183` List Page (legacy)

Section `Old Pre Login Pages` (5:2398). Legacy: nav shows Home / Doctors / Pricing / Resources / Docs, not the current nav.

| From | Trigger | Action | To | Transition |
|---|---|---|---|---|
| List Page `32:1183` → first Doctor Card (`32:1225`) | ON_CLICK | NAVIGATE | `Main` `59:3964` (1440×1870, Old Pre Login Pages — doctor detail: breadcrumb Home/Specialists/Ahmed Irtiza, Experience 12+, Sessions) | SMART_ANIMATE EASE_OUT 0.3 |
| List Page → 9× Doctor Card (`32:1223`…) | ON_HOVER | CHANGE_TO `Property 1=Default` (`32:1000`, old set `32:999`) | (same) | SMART_ANIMATE EASE_OUT 0.3 |
| List Page → 2× Button Usual Hover | ON_HOVER | CHANGE_TO Hovered (`32:991`, old set `32:987`) | (same) | SMART_ANIMATE EASE_OUT 0.3 |
| Main `59:3964` → 2× Button Usual Hover, 1× `Buttons` (`59:4077`) | ON_HOVER | CHANGE_TO Hovered (`32:991`) / (blank destination) | (same) | SMART_ANIMATE EASE_OUT 0.3 |

**App mapping**: `/patient/doctors` → click card → `/doctor/:id` (`DoctorProfile`). This is the only place the click-through to a doctor's page is prototyped; the current design (2.1) has no click link, but the `Main` frames in `Pre Login Pages` (2.1, unlinked) are the current-design doctor detail pages.

---

## 3. Doctor console — one connected graph (Prescription / Queue / Appointments / Phone View)

### 3.1 Frames

38 frames reachable from the Prescription / Appointments starts (plus the loose Queue copy `328:13919` = 39 rows; all 1440×… unless noted). Kind: page / sub-page / modal / popover / sheet / panel / toaster.

| Node id | Frame name | Size | Section | Kind | App route / view |
|---|---|---|---|---|---|
| `339:17421` | Queue (= **Overview**; nav label "Overview") | 1440×800 | Doctor Overview | page (gradient bg) | `/doctor/dashboard` → `views/doctor/Dashboard.tsx` |
| `368:14306` | Queue (Live: "Manage all your queues", Update Queue Status, patient rows, status "Live") | 1440×800 | Doctor - Queue | page | `/doctor/serial-manager` → `SerialManager.tsx` |
| `328:14902` | Queue (Paused: "Doctor hasn't arrived") | 1440×800 | Doctor - Queue | page state | same |
| `328:13919` | Queue (loose copy, flow start; nav + Toggle rows only) | 1440×800 | (page) | page | same |
| `255:11674` | Appointments (list) | 1440×800 | Doctor Appointment | page | `/doctor/appointments` → `DoctorAppointments.tsx` |
| `255:12102` | Appointments (second view, `3 Buttons` toggled) | 1440×800 | Doctor Appointment | page state | same |
| `307:13617` | Prescriptions (list: "Add Prescription", Patient Name/Date/Serial) | 1440×800 | Prescription | page | `/doctor/prescription` → `PrescriptionEditor.tsx` (**no list view exists in the app**, gap G3) |
| `257:13749` | Prescription wizard step 1 "Paitient Overview" (no navbar) | 1440×800 | Prescription | page | `PrescriptionEditor` step 1 |
| `257:13781` | Prescription wizard step 2 "Diagnosis" | 1440×800 | Prescription | page | step 2 |
| `317:15542` | Prescription wizard step 3 "Test & Medicines" | 1440×985 | Prescription | page | step 3 |
| `257:10189` | Analytics | 1440×1008 | Analytics | page | `/doctor/analytics` → `Analytics.tsx` |
| `257:10013` | Manage ("Welcome, Dr. John", Hospitals, Add Hospital, assistants) | 1440×800 | Manage | page | `/doctor/practice-settings` → `DoctorPracticeSettings.tsx` |
| `276:12374` | Manage → **Doctor Profile** view (Back / Edit Profile / Personal Information) | 1440×800 | Doctor Profile | page | ≈ `/doctor/profile` (`DoctorMore.tsx`) — the app has no read-only profile page (gap G4) |
| `276:12338` | Manage → **Edit Doctor Profile** (Cancel / Save Changes) | 1440×800 | Doctor Profile | page | `/doctor/profile-editor` → `DoctorProfileEditor.tsx` |
| `276:13531` | Account ("Account Management": user name, type, password, email, phone) | 1440×800 | Account | page | no route (gap G4) |
| `276:13827` | Activity Log (History, date list) | 1440×800 | Account | page | no route (gap G4) |
| `368:17693` | Profile menu "Frame" (My Account, Activity History, Payment History, Help & FAQ, Privacy & Security, Google Calender, Logout) | 260×376 | Components | popover | header user menu; Payment History → `/doctor/payment` (`PaymentSubscription.tsx`) |
| `368:16699` | Sort menu `4` (Date Ascending / Date Descending / Letter) | 136×117 | Components | popover | list sort menu |
| `328:15460` | Row menu `3` (View / Download / Delete) | 136×119 | Prescription | popover | prescription row actions |
| `341:17922` | Range menu `3` (Weekly / Monthly / Today) | 136×117 | Analytics | popover | analytics range |
| `368:18696` | Hospital switcher `7` (Apollo 4 / Square 1 / Parkview 12) | 179×117 | Doctor Overview | popover | Dashboard hospital switcher |
| `317:14984` | Date and time - Pickers (April 2025 calendar) | 396×356 | Doctor Appointment | popover | date picker |
| `368:15791` | Card 3 — Queue Status modal (Set Availability, Set Arrival Delay 24:30, Go Back / Yes, Update, 4/15/30/45/90 mins) | 447×420 | Doctor - Queue | modal | SerialManager status/delay modal |
| `368:14285` | Modal — "Do you want to complete…" (No / Yes, Complete) | 411×142 | Doctor - Queue | modal | SerialManager complete-confirm |
| `255:9358` | Queue Card — "Queue List" side panel | 363×801 | Doctor - Queue | panel (slides from left) | SerialManager queue list |
| `368:16140` | Bottombar — "Update Status" (Late / Arrived / Cancelled) | 346×287 | Components | sheet | patient-row status sheet |
| `255:12870` | Modal — Book an appointment step 1 (Choose Hospital / Date / Session Type → Next) | 612×414 | Doctor Appointment | modal | `DoctorAppointments` add-appointment (manual booking `/doctor/manual-booking` `PatientManualRegistry` is the closest existing flow) |
| `255:13068` | Modal step 2 — Patient Details (Name, Age, Gender, Blood Group, Phone, Description) | 612×580 | Doctor Appointment | modal | same |
| `255:14107` | Modal step 3 — Reserved Slot / Slot No / Confirm | 612×422 | Doctor Appointment | modal | same |
| `368:16746` | Modal `1` — Add Hospital step 1 (Image, Name, Address, fees) | 696×636 | Manage | modal | `DoctorPracticeSettings` add-hospital |
| `368:16869` | Modal `5` — Add Hospital step 2 (weekly Start/End/Limit) | 696×693 | Manage | modal | same |
| `368:17322` | Modal `6` — Add Assistant (Name, Phone, Password, Assigned to, Role: Finance / Queue Manager / Appointment Manager) | 644×636 | Manage | modal | assistant management |
| `368:17567` | Modal — Add Experience (Institution, Designation, Start, End) | 565×515 | Doctor Profile | modal | `DoctorProfileEditor` |
| `368:16641` | Toaster (Booking Success) | 287×800 | Doctor Appointment | toaster | toast (`ToastProvider`) |
| `619:13780` | Toaster (Booking Success) | 287×800 | Prescription | toaster | toast |
| `368:17311` | Toaster (Hospital Success) | 287×800 | Manage | toaster | toast |
| `368:17538` | Toaster (Assistant Success) | 287×800 | Manage | toaster | toast |
| `368:17551` | Toaster (Hospital Success) | 287×800 | Doctor Profile | toaster | toast |
| `368:17561` | Toaster (Experience Added) | 287×800 | Doctor Profile | toaster | toast |

Extra loose frames near the doctor sections that the graph does **not** reach (orphans): `257:14343`/`257:14975` "Queue" 1440×800 in section Doctor Profile, `341:18476` phone Queue (its own flow start), `368:17738` phone Queue 400×873, `255:8163` Queue 1440×800, `306:13608` Queue Card 418×358.

### 3.2 Global rules (apply to every page frame that has the Navbar)

| Rule | Trigger | Action | Destination | Transition |
|---|---|---|---|---|
| Navbar tab click | ON_CLICK | NAVIGATE | Overview `339:17421` · Queue `368:14306` · Appointments `255:11674` · Prescriptions `307:13617` · Analytics `257:10189` · Manage `257:10013` | **DISSOLVE EASE_OUT 0.3** |
| Avatar / profile button (`Frame 1000012212`) | ON_CLICK | OVERLAY | Profile menu `368:17693` offset **(−181, 55)** | none |
| Profile menu → My Account | ON_CLICK | NAVIGATE | Account `276:13531` | SMART_ANIMATE EASE_OUT **0.5** |
| Profile menu → Activity History | ON_CLICK | NAVIGATE | Activity Log `276:13827` | SMART_ANIMATE EASE_OUT 0.5 |
| Account / Activity Log back button (`1`) | ON_CLICK | BACK | previous screen | – |

(In the paused Queue `328:14902` the "Queue" tab points at `368:14306`; the Overview tab exists only in the non-paused frames.)

### 3.3 Page-specific edges

**Overview `339:17421`**: `Frame 1000012551` (icon, `339:17434`) → NAVIGATE Doctor Profile `276:12374` (DISSOLVE 0.3); `Frame 1000012551` (`341:18169`, hospital chip) → OVERLAY hospital switcher `368:18696` offset (−145, 56) (DISSOLVE 0.3).

**Queue `368:14306`**:
| Node | Trigger | Action | To | Transition |
|---|---|---|---|---|
| "Update Queue Status" `Button Effect` (`I368:14309`) | ON_CLICK | OVERLAY | Card 3 `368:15791` | DISSOLVE 0.3 |
| `Trail Icon Button` Variant2 (`368:14345`, prescription icon) | ON_CLICK | NAVIGATE | Prescription wizard `257:13749` | none |
| `Verified` (`368:14346`, Complete) | ON_CLICK | OVERLAY | Modal `368:14285` | DISSOLVE 0.3 |
| "View All (10)" text (`368:15607`) | ON_CLICK | OVERLAY | Queue Card panel `255:9358` | **MOVE_IN LEFT EASE_OUT 0.3** |
| 6× row `Toggle` (`368:15049`) | ON_CLICK | OVERLAY | Bottombar `368:16140` | DISSOLVE 0.3 |

**Card 3 `368:15791`**: `Tab Buttons` (`368:15962`) → NAVIGATE Queue `368:14306` (DISSOLVE 0.3); "Go Back" (`Button Effect` Variant2, `1474:4345`) → CLOSE; "Yes, Update" (`1474:4369`) → NAVIGATE paused Queue `328:14902` (**SMART_ANIMATE EASE_OUT 0.3**).
**Modal `368:14285`**: "No" → CLOSE; "Yes, Complete" → NAVIGATE `328:14902` (SMART_ANIMATE 0.3).
**Queue Card `255:9358`**: back icon (`Icons`, `1790:13220`) → NAVIGATE `368:14306` (MOVE_IN LEFT 0.3).
**Bottombar `368:16140`**: `Trail Icon Button` → CLOSE.
**Paused Queue `328:14902`**: "Update Queue Status" → OVERLAY Card 3 `368:15791` (DISSOLVE 0.3).

**Appointments `255:11674`** (and alt view `255:12102`, same set of edges):
| Node | Trigger | Action | To | Transition |
|---|---|---|---|---|
| `Action` (date pill, `303:13090`) | ON_CLICK | OVERLAY | Date picker `317:14984` offset (−210, 52) (alt view: (−198, 60)) | DISSOLVE 0.3 |
| "Add Appointment" `Buttons - Dashboard` Gradient | ON_CLICK | OVERLAY | Modal step 1 `255:12870` | DISSOLVE 0.3 |
| `iconoir:filter` (`303:13390`) | ON_CLICK | OVERLAY | Sort menu `368:16699` offset (−5, 47) | DISSOLVE 0.3 |
| `3 Buttons` Inactive → other view | ON_CLICK | NAVIGATE | `255:12102` (from 255:11674) / `255:11674` (from 255:12102, SMART_ANIMATE 0.3) | DISSOLVE 0.3 / SMART_ANIMATE 0.3 |
| 8× row `Toggle` | ON_CLICK | OVERLAY | Bottombar `368:16140` | DISSOLVE 0.3 |

**Booking wizard (modals)**: `255:12870` Close → CLOSE; **Next** → SWAP `255:13068` (DISSOLVE 0.3) → Close → NAVIGATE `255:11674`, Back → BACK, **Next** → SWAP `255:14107` (DISSOLVE 0.3) → Close → NAVIGATE `255:11674`, Back → BACK, **Confirm** → SWAP Toaster `368:16641` (DISSOLVE 0.3) → AFTER_TIMEOUT **t0.5** → NAVIGATE `255:11674` (DISSOLVE 0.3).

**Prescriptions `307:13617`**: "Add Prescription" (`Button Effect`, `I307:13620`) → NAVIGATE `257:13749` (no transition); filter → OVERLAY Sort menu `368:16699` (−5, 47) DISSOLVE 0.3; `3 Buttons` toggle → NAVIGATE (blank destination, SMART_ANIMATE 0.3); row menu vectors (`317:15360`, `317:15372`) → OVERLAY row menu `328:15460` offsets (−98, 15) / (−101, 20) DISSOLVE 0.3.
**Prescription wizard**: `257:13749` Next → NAVIGATE `257:13781` (DISSOLVE 0.3) → Back → `257:13749`; Next → NAVIGATE `317:15542` (DISSOLVE 0.3) → Cancel → NAVIGATE `257:13781`; **Confirm** → OVERLAY Toaster `619:13780` (DISSOLVE 0.3) → AFTER_TIMEOUT t0.5 → NAVIGATE Prescriptions `307:13617` (DISSOLVE 0.3).

**Analytics `257:10189`**: range button (`Buttons - Dashboard` Monochrome, `I257:10192`) → OVERLAY range menu `341:17922` offset (−13, 56) DISSOLVE 0.3.

**Manage `257:10013`**:
| Node | Trigger | Action | To | Transition |
|---|---|---|---|---|
| "View Profile" `Button Effect` (`I338:13162`) | ON_CLICK | NAVIGATE | Doctor Profile `276:12374` | SMART_ANIMATE EASE_OUT **0.5** |
| Hospitals "Add" `Trail Icon Button` Variant2 (`I257:10020`) | ON_CLICK | OVERLAY | Add Hospital step 1 `368:16746` | DISSOLVE 0.3 |
| Assistants "Add" `Trail Icon Button` Variant2 (`I257:10037`) | ON_CLICK | OVERLAY | Add Assistant `368:17322` | DISSOLVE 0.3 |
Add Hospital: step 1 Close → CLOSE, **Next** → SWAP `368:16869` (DISSOLVE 0.3); step 2 Close → NAVIGATE `257:10013`, Back → SWAP `368:16746`, **Save & Add** → SWAP Toaster `368:17311` (**MOVE_IN BOTTOM EASE_OUT 0.5**) → AFTER_TIMEOUT t0.5 → NAVIGATE `257:10013` (DISSOLVE 0.3). Add Assistant `368:17322`: Close → CLOSE, add → SWAP Toaster `368:17538` (MOVE_IN BOTTOM 0.5) → t0.5 → NAVIGATE `257:10013`.

**Doctor Profile `276:12374`**: Back (`Button Effect` `317:13490`) → NAVIGATE Manage `257:10013` (SMART_ANIMATE 0.3); **Edit Profile** (`317:13485`) → NAVIGATE `276:12338` (SMART_ANIMATE **0.5**).
**Edit Doctor Profile `276:12338`**: Cancel (`Buttons - Dashboard` Monochrome) → NAVIGATE `276:12374` (SMART_ANIMATE 0.5); **Save Changes** → OVERLAY Toaster `368:17551` (MOVE_IN BOTTOM 0.5) → t0.5 → NAVIGATE `276:12374` (DISSOLVE 0.3); Add-experience `Trail Icon Button` (Default) → ON_HOVER CHANGE_TO Variant2 (`255:6661`, set `255:6656`, SMART_ANIMATE 0.3, x2) + ON_CLICK OVERLAY Modal `368:17567` (**DISSOLVE 0.5**); modal Cancel → CLOSE, **Confirm** → SWAP Toaster `368:17561` (DISSOLVE 0.5) → t0.5 → NAVIGATE `276:12338` (DISSOLVE 0.3).

### 3.4 The four flow entry points into this graph

| Flow | Entry | Intended journey (following the reactions) |
|---|---|---|
| **Prescription** `307:13617` | Prescriptions list | list → Add Prescription → `257:13749` → `257:13781` → `317:15542` → Confirm → Toaster `619:13780` → back to `307:13617`; plus nav to all tabs, filter/sort popover, row menu |
| **Queue** `328:13919` | loose Queue copy (nav + Toggle only) | tab Queue → `368:14306` → Update Queue Status → Card 3 → Yes, Update → paused `328:14902`; Complete → Modal → Yes; View All → Queue Card panel; Toggle → status Bottombar |
| **Appointments** `255:11674` | Appointments list | Add Appointment → 3-step modal → Toaster → back; date picker, sort popover, view toggle to `255:12102` |
| **Phone View** `341:18476` | phone Queue (400×917, loose) | phone `Verified` → OVERLAY Modal `368:14285` (DISSOLVE 0.3) — a **desktop-size (411×142) modal** — whose "Yes, Complete" navigates to desktop `328:14902`, joining the graph; phone `Toggle` (`2015:13471`) → CHANGE_TO `Property 1=Card 5` (`341:18356`, set `341:18235`) SMART_ANIMATE EASE_OUT 0.3 (card expand/collapse) |

The `Frame → App route` column in 3.1 is the mapping; no doctor route exists for `276:13531` Account, `276:13827` Activity Log, or a read-only Doctor Profile (gap G4).

---

## 4. Flow 5 (Web) — `303:13394` Search Component

A COMPONENT in section Components (`303:13210`), 538×41 (`search-line` + filter icon).

| Node | Trigger | Action | To | Transition |
|---|---|---|---|---|
| `iconoir:filter` (`303:13390`) | ON_CLICK | OVERLAY | Sort menu `368:16699` (136×117, Components) offset (−5, 47) | DISSOLVE EASE_OUT 0.3 |

Same reaction appears on every list header that embeds the component (Appointments, Prescriptions, Patient Appointments). **App mapping**: search/sort header of `DoctorAppointments`, `PrescriptionEditor` (list), patient `Appointments`.

---

## 5. Patient flow — `339:15916` Queue (Patient Dashboard, section `5:2400`)

14 frames. Patient nav (Figma): **Queue · Appointments · Medicines · Prescriptions** + profile menu. App today: top nav Home / Meds / Apps / Rx / More (`Layout.tsx`), bottom nav Home / Apps / Meds / Rx (see gap G5).

| Node id | Frame | Size | Kind | App route / view |
|---|---|---|---|---|
| `339:15916` | Queue ("Live Queue": Track Your Queue and arrive on time, People Ahead, Reporting Time, Session, Address, Ongoing, Consulting) | 1440×800 (gradient bg) | page | `/live-serial` → `LiveSerial.tsx` |
| `191:5570` | Appointments (Doctor / Date / Serial / Status / Action) | 1440×800 | page | `/patient/appointments` → `Appointments.tsx` |
| `339:16108` | Medicines (Napa, 2 Pills Now, Mark As Taken, Missed) | 1440×869 | page | `/patient/medicine-tracker` → `MedicineTracker.tsx` |
| `297:12584` | Prescriptions (Doctor / Date / Time / Status / Action) | 1440×800 | page | `/patient/prescriptions` → `Prescriptions.tsx` |
| `368:17693` | Profile menu | 260×376 | popover | user menu (`Layout.tsx`) → `/patient/more` |
| `396:12025` | Date and time - Pickers | 396×356 | popover | date picker |
| `368:16699` | Sort menu | 136×117 | popover | sort |
| `396:12430` | List Page "Appointments" (Filter & Sort, Type, Experience, doctor grid) | 1304×870 | overlay page (in dashboard) | `/patient/doctors` → `DoctorSearchView` |
| `601:13524` | List Page "← Appointments" doctor detail (Ahmed Irtiza, Personal Information, BMDC, Consultation Fee, Follow-Up Fee) | 1304×870 | overlay page | `/doctor/:id` → `DoctorProfile.tsx` |
| `339:15402` | Modal "Add Medicines" (Search Medicine, Morning/Noon/Night dosage, Duration, Instruction) | 565×549 | modal | `MedicineTracker` add-medicine |
| `399:12826` | Toaster | 203×800 | toaster | toast |
| `399:12818` | Toaster | 298×800 | toaster | toast |
| `276:13531` | Account | 1440×800 | page | no route (G4) |
| `276:13827` | Activity Log | 1440×800 | page | no route (G4) |

Edges:

| From | Node | Trigger | Action | To | Transition |
|---|---|---|---|---|---|
| all four pages | navbar Queue / Appointments / Medicines / Prescriptions | ON_CLICK | NAVIGATE | `339:15916` / `191:5570` / `339:16108` / `297:12584` | DISSOLVE EASE_OUT 0.3 |
| all four pages | profile `Frame 1000012212` | ON_CLICK | OVERLAY | `368:17693` offset **(0, 0)** | DISSOLVE EASE_OUT 0.3 |
| Profile menu | My Account / Activity History | ON_CLICK | NAVIGATE | `276:13531` / `276:13827` | SMART_ANIMATE EASE_OUT 0.5 |
| Appointments `191:5570` | `Action` date pill | ON_CLICK | OVERLAY | `396:12025` offset (0, 0) | DISSOLVE 0.3 |
| Appointments | "Add Appointment" `Button Effect` | ON_CLICK | OVERLAY | List Page `396:12430` | DISSOLVE 0.3 |
| Appointments | `iconoir:filter` | ON_CLICK | OVERLAY | Sort menu `368:16699` (−5, 47) | DISSOLVE 0.3 |
| Appointments | `3 Buttons` Inactive | ON_CLICK | NAVIGATE (blank) | – | SMART_ANIMATE 0.3 |
| List Page `396:12430` | 8× Doctor Card | ON_HOVER | CHANGE_TO Default (`80:4686`) | (same) | SMART_ANIMATE 0.3 |
| List Page | "Register" `Button Usual Hover` | ON_HOVER | CHANGE_TO Hovered (`80:4772`) | (same) | SMART_ANIMATE 0.3 |
| List Page | `Buttons` Primary (`80:4770`, in `Button Usual Hover`) | ON_CLICK | **SWAP** | List Page `601:13524` | SMART_ANIMATE 0.3 |
| `601:13524` | `Buttons` Primary | ON_HOVER | CHANGE_TO Hovered (`80:4764`, Button Featured Hover set) | (same) | SMART_ANIMATE 0.3 |
| Medicines `339:16108` | `Action` date pill | ON_CLICK | OVERLAY | `396:12025` offset (−198, 58) | DISSOLVE 0.3 |
| Medicines | "Add Medicine" `Button Effect` | ON_CLICK | OVERLAY | Modal `339:15402` | DISSOLVE 0.3 |
| Medicines | `Verified` (Mark As Taken chip, `339:16128`) | ON_HOVER | CHANGE_TO Variant2 (`191:5033`, set `191:5028`) | (same) | SMART_ANIMATE 0.3 |
| Medicines | `Button Effect` Variant2 (`1474:4369`) | ON_CLICK | OVERLAY | Toaster `399:12826` | DISSOLVE 0.3 |
| Modal `339:15402` | Cancel (`Buttons - Dashboard` Secondary) | ON_CLICK | CLOSE | – | – |
| Modal | Confirm (`Button Effect`) | ON_CLICK | SWAP | Toaster `399:12818` | DISSOLVE 0.3 |
| Toasters `399:12826`, `399:12818` | (frame) | AFTER_TIMEOUT **t0.5** | NAVIGATE | Medicines `339:16108` | DISSOLVE 0.3 |
| Prescriptions `297:12584` | `Action` date pill | ON_CLICK | OVERLAY | `396:12025` offset (−191, 50) | DISSOLVE 0.3 |
| Prescriptions | `3 Buttons` Inactive ×2 | ON_CLICK | NAVIGATE (blank) | – | SMART_ANIMATE 0.3 |
| Account / Activity Log | back | ON_CLICK | BACK | – | – |

`Patient Dashboard` also contains unlinked variants: Medicines `191:5104` (1440×869), Queue `297:12283` (1440×800), phone Queues `357:19153` (402×877) and `357:19210` (402×880), `Main` frames `601:12927` (1440×894), `601:13040`/`601:13140` (1440×959).

Patient booking wizard: **not prototyped in the Web patient flow** (only visual `Main` frames). See App `Patient 1` below.

---

## 6. App Version V1 flows (phone versions)

Page `App Version V1` (5:3). Its sections mirror the web ones at phone width (frames 400/402 wide): Doctor Profile `569:12924`, Doctor - Queue `569:13409`, Doctor Appointment `569:13643`, Analytics `569:14028`, Prescription `569:14831`, Manage `569:15292` and `586:15566`, Account `569:15552`, Components `569:15636`, Doctor Overview `569:15957`, Patient Dashboard `590:15146` (24001×14401 canvas), loose `Queue` section `590:17268` (empty). Component sets `Bottom Bar Tab` (`572:20938`, 110×186) and `Body` (`572:21086`, 408×328) are the phone bottom navigation. Phone transitions differ from web: sheets **slide from the top** (`MOVE_IN TOP 0.3` ×18, `0.5`), toasts from the bottom.

| Flow | Start (id : frame : size : section) | Frames (new in this flow) | Journey / notable reactions |
|---|---|---|---|
| **Flow 5** `569:15748` | Search Component (INSTANCE) 538×41, Components | `368:16699` sort menu | filter → OVERLAY sort menu (−5, 47), DISSOLVE 0.3 |
| **Flow 6** `569:15131` | Prescriptions 402×873, Prescription | `569:13732` Date picker 396×356, `572:23010`, `572:24085`, `572:23582`, `572:23808` (Prescriptions wizard steps, 402×836), `586:15178` Toaster 329×800 | Date pill → OVERLAY picker **MOVE_IN TOP 0.3**; Add → NAVIGATE `572:23010` (SMART_ANIMATE 0.3); in-flow edges (all `Button Effect` clicks, SMART_ANIMATE EASE_OUT 0.3): `572:23010`→`572:24085`,`572:23582`; `572:24085`→`572:23010`; `572:23582`→`572:24085`,`572:23010`,`572:23808`; `572:23808`→`572:24085`,`572:23582` (the four are the wizard steps/states of the phone Prescriptions page; which is Next vs Back was not read); final confirm → OVERLAY Toaster `586:15178` **MOVE_IN BOTTOM 0.3** → t0.8 → NAVIGATE `569:15131` (MOVE_IN TOP 0.3) |
| **Flow 7** `572:21642` | Appointments 400×867, Doctor Appointment | `569:13787`/`569:13818`/`569:13858` booking modals 376×414/580/422, `572:22286` Appointments alt 400×856, `368:16140` Bottombar, `569:13854` Toaster 287×800 | Add → OVERLAY modal step 1 (**MOVE_IN TOP 0.3**) → SWAP step 2 → SWAP step 3 (DISSOLVE 0.3) → Confirm SWAP Toaster → click → NAVIGATE `572:21642` (MOVE_IN TOP 0.3); `3 Buttons` toggles `572:21642` ↔ `572:22286`; Toggle → Bottombar (DISSOLVE 0.3) |
| **Flow 8** `572:24334` | Prescriptions 402×837, Analytics | `586:15417` Overview 400×868 (Manage), `569:14822` range menu, `572:25253` Prescriptions 402×872 (Manage), `569:15399` modal 1 402×636, `569:15436` modal 6 404×589, `569:15464` modal 5 402×693, Toasters `569:15548`, `569:15544` | avatar → NAVIGATE Overview (SMART_ANIMATE 0.3); range → OVERLAY `569:14822` (−56, 50); Manage: Trail Icon Variant2 hover CHANGE_TO (`255:6661`) + click OVERLAY modal 1 `569:15399` / modal 6 `569:15436` (**MOVE_IN TOP 0.3**); modal 1 → SWAP modal 5 `569:15464` (DISSOLVE 0.3), modal 5 Back → SWAP modal 1; modal 6 confirm and modal 5 confirm → SWAP Toaster (`569:15548` / `569:15544`, **MOVE_IN BOTTOM 0.5**); toast click → NAVIGATE `572:25253` (SMART_ANIMATE 0.3) |
| **Flow 9** `586:15417` | Overview 400×868, Manage | – (in Flow 8's set) | Frame 1000012551 → BACK; `Frame 2147207295` → NAVIGATE `572:25253` (SMART_ANIMATE 0.3) |
| **Flow 10** `572:25253` | Prescriptions 402×872, Manage | – (in Flow 8's set) | as Flow 8 Manage frame |
| **Flow 11** `586:15623` | Prescriptions 402×872, Doctor Profile | `586:15933` Prescriptions 402×872, Modal `569:13393` 402×515, Toasters `569:13385`, `569:13389` | Edit → NAVIGATE `586:15933` (SMART_ANIMATE **0.5**); add-experience Trail Icon hover CHANGE_TO + click OVERLAY Modal (**MOVE_IN TOP 0.5**); Confirm → SWAP Toaster (DISSOLVE 0.5) → t0.5 → NAVIGATE `586:15933` (DISSOLVE 0.3); save → OVERLAY Toaster `569:13385` (MOVE_IN BOTTOM 0.5) |
| **Flow 12** `586:16245` | Prescriptions 402×872, Account | – | no reactions (static account screen) |
| **Flow 13** `569:19676` | Queue 400×872, Doctor - Queue | `569:13616` Card 3 400×420, `569:13606` Modal 347×166, `569:13410` Queue Card 400×801, `572:21229` Queue 400×837 | "Update Queue Status" → OVERLAY Card 3 (**MOVE_IN TOP 0.3**); Trail Icon → CHANGE_TO (`572:21087`, SMART_ANIMATE 0.3); Verified → OVERLAY Modal (DISSOLVE 0.3); View All → OVERLAY Queue Card (MOVE_IN TOP 0.3); Card 3 Go Back → CLOSE, Yes, Update → NAVIGATE `572:21229` (SMART_ANIMATE 0.3); Modal Yes → NAVIGATE `569:19676`; `572:21229` → OVERLAY Card 3 |
| **Flow 14** `572:25777` | Overview 400×868, Doctor Overview | `572:26261` hospital popover 387×219 | hospital chip `3` → OVERLAY `572:26261` (**MOVE_IN TOP 0.3**) |
| **Patient 1** `590:15546` | Queue 1440×800, Patient Dashboard | `590:15232` Appointments, `339:16108`, `297:12584`, `368:17693`, `339:15916`, `590:15716` Date picker, `601:17726` List Page 402×870, `276:13531`, `276:13827`, `601:17776` List Page 402×870 | same nav/overlay pattern as Web Patient flow (nav DISSOLVE 0.3; profile menu at (0,0); Add Appointment → OVERLAY List Page `601:17726`; card hover CHANGE_TO Default ×8; Primary → SWAP `601:17776` SMART_ANIMATE 0.3) — the frame is 1440-wide despite living in the App page |

App phone → app routes are the same routes as web (the app is responsive); phone bottom bars map to `DoctorTabBar` (doctor) and the patient bottom nav in `Layout.tsx`.

---

## 7. Component-level (variant) reactions

Read from the two Components sections. Instance reactions in the flows above inherit these.

| Component set (id) | Variant | Trigger → action → destination | Transition |
|---|---|---|---|
| Button Usual Hover (`80:4768`) | Default | ON_HOVER → CHANGE_TO Hovered (`80:4772`) | SMART_ANIMATE EASE_OUT 0.3 |
| Button Featured Hover (`80:4763`) | Default (44×45 icon only) | ON_HOVER → CHANGE_TO Hovered (`80:4764`, 114×45 icon + label) | SMART_ANIMATE EASE_OUT 0.3 |
| Doctor Card - Final (`80:4685`) | Variant2 (resting) | ON_HOVER → CHANGE_TO Default (`80:4686`) | SMART_ANIMATE EASE_OUT 0.3 |
| Doctor Card - Final | Default | ON_HOVER → CHANGE_TO `Hovered` (`80:4772`) — **wrong-set destination (Button Usual Hover)**, stale link; ignore | SMART_ANIMATE EASE_OUT 0.3 |
| Information Component (`80:2149`) | – | ON_HOVER → CHANGE_TO Hovered (`80:4772`) ×2 | SMART_ANIMATE EASE_OUT 0.3 |
| Dashboard Header (`303:13043`) | Queue | ON_HOVER → CHANGE_TO Variant2 (`303:13039`); ON_CLICK → NAVIGATE (no destination) | SMART_ANIMATE EASE_OUT 0.3 |
| Search Component (`303:13394`) | – | ON_CLICK → OVERLAY sort menu `368:16699` | DISSOLVE EASE_OUT 0.3 |
| User Card (`368:15036`) | Default / Variant2 / Variant3 | ON_CLICK → OVERLAY Bottombar `368:16140` | DISSOLVE EASE_OUT 0.3 |
| Bottombar (`368:16140`) | – | close `Trail Icon Button` → CLOSE | – |
| Profile menu (`368:17693`) | – | My Account → NAVIGATE `276:13531`; Activity History → NAVIGATE `276:13827` | SMART_ANIMATE EASE_OUT 0.5 |
| Navbar - Dashboard (`396:12116`) | Default (doctor) | 6 tab NAVIGATEs (Overview/Queue/Appointments/Prescriptions/Analytics/Manage) + avatar OVERLAY | DISSOLVE EASE_OUT 0.3 |
| Navbar - Dashboard | Patient | Queue → NAVIGATE `339:15916` … | DISSOLVE EASE_OUT 0.3 |

Tab (`80:4680`), Featured Tabs (`80:4670`), Nav Link - Dashboard (`317:13571`) and 3 Buttons (`317:15075`) have **no reactions of their own**: active/inactive is a static variant, switched by frame navigation (Nav Link) or not prototyped at all (Tab pills, Featured Tabs). The app must invent the transition — use 0.3s `EASE_OUT` colour/background transition to stay consistent.

---

## 8. Gaps, discrepancies and things the orchestrator should know

- **G1** The current landing/list prototype (`PreLogin 1`) has **no Doctor Card click** navigation; the only card-click link is in the legacy Flow 1 (`32:1225` → `59:3964`). Doctor detail pages exist as unlinked `Main` frames in `Pre Login Pages`.
- **G2** `Phone View` (`341:18476`) opens a *desktop-sized* modal (`368:14285`, 411×142) and navigates into a *desktop* frame (`328:14902`), so the "phone" flow is not self-contained. Use App-page Flow 13 (`569:19676`) for phone Queue behaviour.
- **G3** Doctor `Prescriptions` list (`307:13617`) has no app counterpart today: `/doctor/prescription` is the editor wizard only.
- **G4** No app route/view for: Doctor Profile read-only page (`276:12374`), Account Management (`276:13531`), Activity Log (`276:13827`) (both roles), Help & FAQ / Privacy & Security entries of the profile menu.
- **G5** Figma patient nav = Queue · Appointments · Medicines · Prescriptions; app patient nav = Home · Meds · Apps · Rx (+ More).
- **G6** Plan correction: FIGMA_SYNC_PLAN.md §3 calls section `Doctor Profile` (`254:8267`) the *patient-facing* profile. It is the **doctor's own profile** (frames: view `276:12374`, edit `276:12338`, add-experience modal `368:17567`, toasters). The patient-facing doctor detail pages are the `Main` frames in `Pre Login Pages` (`80:2652` …), the legacy `Main` `59:3964`, and Patient Dashboard `601:13524`.
- **G7** Plan correction: "Flow 1" starts from the **legacy** `List Page` `32:1183` in `Old Pre Login Pages`, not from the Patient Dashboard.
- **G8** Section `Payment & Subscription` (`341:18165`) is empty; `Old Pre Login Pages` contains 420-wide mobile-web landing/list frames (`84:3301`, `283:12170`, `95:3074`…) that are legacy.
- **G9** Hover semantics: Figma "hover" swaps to another variant (`Variant2 → Default` for cards). Resting state = `Variant2` (384×502), hovered = `Default` (384×482 + shadow). Implementation must invert the naming.
