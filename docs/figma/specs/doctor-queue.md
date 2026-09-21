# doctor-queue - Doctor Queue ("Doctor Q") build notes

Figma `zJRyAML8hv0uEBOXtu5Hpn`, page `Web Version V1`. Data read with `get_design_context`, `get_metadata`, `download_assets` and read-only `use_figma`
(reactions, overlay settings, variant diff). `get_motion_context(recursive)` on 368:14306 / 328:14902 / 341:18476 = `{"nodes":[]}` (no keyframe motion).
Reference PNGs (2x) in `docs/figma/reference/doctor-queue/`. Owned file `views/doctor/SerialManager.tsx`; sub-components in `components/doctor/queue/**`.

## 1. Frames

| id | name | size | what it is | app mapping |
|---|---|---|---|---|
| `368:14306` | Queue - LIVE | 1440x800 | Dashboard Header + Queue Manage Row (live card 524x341, clock, Queue Progress) + Queue Row (Up Next strip) | `/doctor/serial-manager`, session running |
| `328:14902` | Queue - PAUSED | 1440x800 | Paused card 384x238 ("Available in 20 Mins"), clock 36px, "Doctor hasn't arrived yet"; hidden `Buttons - Dashboard` 336x48 under the card | `sessionMeta.status` DELAYED / BREAK |
| `368:15791` | Card 3 (Queue Status modal) | 447x420 | Set Availability (Arrived / Inactive tabs), Set Arrival Delay (24 : 30 boxes), chips 4/15/30/45/90 mins, Go Back / Yes, Update | opened from "Update Queue Status" |
| `368:14285` | Modal (confirm) | 411x142 | "Do you want to complete this session?" No / Yes, Complete | opened from "End session" |
| `255:9358` | Queue Card ("Queue List" panel) | 363x801 | right-docked side panel, rows avatar/name/"45 Mins Session"/Serial No. | opened from "View All (N)" |
| `368:16140` | Bottombar "Update Status" | 346x287 | status sheet (shared `StatusUpdateModal`) | opened from the status chip of a card |
| `328:13919` | Queue (flow start, 13 reactions) | 1440x800 | earlier composition of LIVE with an "Availability" ring card (In Hospital, Arrived/Inactive tabs, Set Delay chip) and "Live" top right | reference only (see 5) |
| `255:8163` | Queue (7 reactions, nav only) | 1440x800 | oldest composition: "Ongoing" + ring "18 Minutes Remaining", "Queue Status" bar, "Availability" ring + Active/Inactive/Break | reference only |
| `306:13608` | Queue Card (legacy arc gauge) | 418x358 | blue arc "Queue Status" (legacy colours) | not used |
| `341:18476` | Queue (phone, "Phone View" flow) | 400x917 | header pill (logo + "Queue"), clock, live card 368 wide, Up Next strip, bottom dock card "Currently / Consulting" | 390px layout |
| `368:17738` | Queue (phone variant) | 400x873 | top icon tabs, "Queue" + Live, clock, "Ongoing" card with green shader blob | 390px layout (blob not built) |
| `339:17446` | Frame 1000012507 | 210x174 | Designation / Cardiologist, Active / Parkview Hospital, Address / Chittagong text block (doctor info popover, not queue) | not used |
| `357:25075` `368:18792` `368:18723` `368:18727` | Frame 21472244xx | 319/419 sq | vector art for the green "shader" blob behind Serial No. in 328:13919 (Ellipse 77 + "D" arcs, Group 1000009033) | not built (final LIVE uses plain accent number) |

## 2. Layout facts (LIVE, px)

Body (page `Body` p48/64 g24): header 1312x74 @ y121; `Queue Manage Row` 1312x341 @ y219 (gap 24 between children: card 524 | column 412); `Queue Row` 1312x190 @ y584 (gap 16).
- Header: "Queue" 36/normal `content-primary`; subtitle 16/22 `content-tertiary` "Manage all your queues and get ready for the next ones "; right = `Buttons - Dashboard` Gradient (Inter 16 -2%, glow `#c8db9c` @73,26, icon slot = Icons "Change" glyph in white).
- Live card `368:14312`: 524w, p24, r32, `shadow-[0_0_12px_rgba(0,0,0,.06)]`, bg `linear-gradient(218.36deg, #eefff8 2.25%, #fff 54.4%)` (stop is a literal in Figma; built from `primary-50`). Top row: Current (col gap 36) + Toggle. Tag row gap 4: 17px ring-dot + "Live" 20 accent-500. Patient row 43px avatar, name 20 / sub 12 tertiary (col 99), ring button 42 (border #eee, r21, p13, arrow-up-right 16), gap 8. Info row gap 24: label 14 `#5e5e5e`, value 20 `content-primary` (Started / Elapsed / Session), gap 8. Toggle: "Serial No." 12 accent-500 + number 64 accent-500, items-end. Bottom row gap 8: "Prescribe & End" (`Trail Icon Button` instance, flex-1, h40, fill `#fbfbfb`, r500, label 16 accent-500) + `Verified` "End session" (154x40, px12 py4, `linear-gradient(180deg,#0ca768,#08925a)`, glow `#e6dc9e` 55x55 @120,-15 blur 27.6px, label 16 white mr-14, tick 32).
- Column 412 (py8, between): `Card 4` px8: "It's" 14 tertiary + "09:00 PM" 64 `content-primary` (col gap 4) | stethoscope button 40 (white, `drop-shadow(0 0 3.5px .05)`, glyph 32 `#0ca768`). `Queue Card` p15 r24 gap24 (no fill, no visible shadow in LIVE): "Queue Progress" 24 + chip "Today" (border #f9f9f9, px12 py4, r100, 12 secondary); `Rate` 25 bars `flex-1 h36 r8` gap 4; legend 4 cols justify-between: number 14 `content-primary`, swatch 10 r5 + label 12 tertiary (Completed accent-500 / Remaining accent-200 / Cancelled Fill `#f5f7f6` / No Show 1px `#8d8d8d` outline).
- Up Next: title 16 `#5e5e5e` +0.16 tracking, chevron 20 rotated -90; "View All (10)" 14 `#909090`; strip gap 8, h154, overflow-x auto, r24 clip; cards = `User Card` (320, min 280, p20 r32, shadow 12/9/20/.04): Arrived white, Late `#dde5e1` (chip fill `#f5f7f6`), Cancelled white (chip label `#8a94a3`, call + arrow rings).
- PAUSED: card 384x238 p24 r32 gradient `217deg #fff8ee 2.25% -> #fff 54.4%` (orange tint), tag "Paused" 20 `#e66d2b` + orange ring-dot; inner white box r30 py16 (col centre): "Available in" 12 tertiary, "20" 64 `content-primary`, "Mins" 14 tertiary. Column 412: clock 36px `content-primary` ("It's" 14 `#5e5e5e`), stethoscope 40, text "Doctor hasn't arrived yet" 16 `content-primary` (gap 24).
- Card 3: 447x420 p24 r24 gap24, `drop-shadow(0 0 6px .06)`, bg `linear-gradient(180deg,#fff 71.19%,#eefff8 100.07%)`; title 20 + sub 12 tertiary; row "Set Availability" 16/22 + tab group (fill `#f9f9f9`, px8 py4, r20; tab px16 py12 r64, Inter 12: active accent-500 SemiBold white, inactive `#5e5e5e` Regular); "Set Arrival Delay" 16/22; two 72x72 boxes (`#f8f8f8`, r24, 36px `#171717`) with ":" 36; chips (gap 8, border 1 Fill `#f5f7f6`, px12 py8, r24, 14 secondary; selected border accent-500 + text accent-500); buttons row gap 10: "Go Back" 121 wide white pill (Inter 16 -2% `#8a94a3`) + "Yes, Update" flex-1 `#0ca768` pill white. Overlay: CENTER, scrim rgba(0,0,0,.25), close on outside click.
- Confirm modal: 411x142 p12 r12 white, `shadow 0 0 18.1px .15`; Q&A card p12 centred: title 20 `content-primary`, sub 12 tertiary; buttons gap 10: "No" 121 white (`#8a94a3`) + "Yes, Complete" flex-1 `#0ca768`. Overlay CENTER, scrim rgba(0,0,0,.30).
- Queue List panel: 363x801 p16 r24 gap24 `linear-gradient(180deg,#fff,#f2f2f2)`, shadow `-4px 0 12px .04`; title 24 `#171717` + close (40 white circle, X `#8a94a3`); rows gap 24: avatar 48, name 16 `#171717`, sub 12 `#8a94a3`, "Serial No." 12 `#8a94a3` + number 24 `#171717`. Overlay TOP_RIGHT, scrim rgba(0,0,0,.25).
- Phone (368 content): live card p24 (Current 246 + Toggle 74), tag "Live Queue", info row clips "30 mins (approx." (design overflow), buttons 158 + 154; Queue Progress bars 9.68 wide gap 4 (338px), sits under the live card in the layer stack (hidden in the PNG).

## 3. Interactions (exact values, all `cubic-bezier(0,0,.58,1)` = EASE_OUT)

| # | source (frame) | trigger | action -> destination | transition | app wiring (existing handler) |
|---|---|---|---|---|---|
| Q1 | "Update Queue Status" (368:14309, 328:14902) | click | OVERLAY Card 3 | DISSOLVE 0.3s | opens the status modal (state only) |
| Q2 | Trail Icon Button "Prescribe & End" (368:14345) | click | NAVIGATE prescription wizard 257:13749 | none | `onStartPrescription({...})` + `onNavigate('/doctor/prescription')` (as "Open Prescription") |
| Q3 | Verified "End session" (368:14346, phone 368:18326) | click | OVERLAY Modal 368:14285 | DISSOLVE 0.3s | opens confirm |
| Q4 | Modal "No" / "Yes, Complete" | click | CLOSE / NAVIGATE paused 328:14902 (SMART_ANIMATE 0.3s) | - | close / `updateAppStatus(currentApp.id,'completed')` then close |
| Q5 | "View All (10)" (368:15607) | click | OVERLAY Queue Card panel, TOP_RIGHT, MOVE_IN LEFT | 0.3s | opens panel (slides in from the right edge, `ds-drawer-in`) |
| Q6 | panel close icon (1790:13220) | click | NAVIGATE back to 368:14306, MOVE_IN LEFT | 0.3s | closes panel |
| Q7 | 6x User Card status Toggle | click | OVERLAY Bottombar 368:16140 | DISSOLVE 0.3s | opens `StatusUpdateModal` for that row |
| Q8 | Card 3 "Arrived" tab (368:15962) | click | NAVIGATE LIVE 368:14306 | DISSOLVE 0.3s | existing Arrived handler (commits immediately), modal closes |
| Q9 | Card 3 "Go Back" | click | CLOSE | - | close modal |
| Q10 | Card 3 "Yes, Update" | click | NAVIGATE paused 328:14902 | SMART_ANIMATE 0.3s | `handleSaveDelay` (only when delay > 0) then close; page shows Paused |
| Q11 | phone Lead Icon Button (368:17745) | hover | CHANGE_TO 303:13039 | SMART_ANIMATE 0.3s | shared `LeadIconButton` (not used on this page) |
| Q12 | phone Toggle (2015:13471) | click | CHANGE_TO 341:18356 ("Card 5", 368x433 expanded "Currently" dock) | SMART_ANIMATE 0.3s | not built (phone dock is chrome) |
Nav tabs (6x DISSOLVE 0.3s) and avatar menu (OVERLAY (-181,55)) are shared chrome. Raw rows in the run log; no ON_HOVER states exist on this page (Figma defines none for cards/chips/buttons).

## 4. Decisions

- Tokens: text `content-*`, `ink-50` chips, `shadow-ds-row` cards, `ds-fade-in` overlays, `ds-drawer-in` panel; card gradients from `rgb(var(--color-primary-50))` (Figma `#eefff8` stop is a literal, delta 8/255); paused orange and its ring-dot are fixed status colours (asset `status-dot-paused.svg`); Verified / header glows are decorative and brand-independent (`#e6dc9e`, `#c8db9c`).
- Avatars: appointments carry no photo, so patient avatars are initials circles (no stock face). Sub-line "45 Mins Session" -> patient phone (existing data). "Session ... (approx.)" = average of today's completed consultation durations, "-" when none.
- Queue Progress legend: Completed = completed, Remaining = waiting + consulting, Cancelled = cancelled, No Show = late; 25 segments allocated by largest remainder (min 1 per non-zero group).
- Paused = `sessionMeta.status` DELAYED or BREAK ("Available in {delayMinutes} Mins", static like the old banner). The Figma hidden button slot (368:16081) holds "End Break" (BREAK) / "Mark Arrived" (DELAYED) using the existing handlers.
- The storage layer forbids `late -> waiting`, so the status sheet only offers transitions `waiting|late -> consulting|late|cancelled`, `consulting -> completed`, plus reserved-slot actions (Assign / Push to Late / Release to Public).

## 5. Deviations / not implemented

- Not built: Availability ring card + "Set Delay" chip + "Live" corner tag of 328:13919, "Ongoing"/ring compositions of 255:8163 and 368:17738, green shader blob (`357:25075` family), phone "Currently / Consulting" dock card (chrome), hidden `Lead Icon Button` hover on this page.
- Added to fit existing behaviour: "Consult Next" pill (complete current + call next, `handleNextPatient`) in the live card, filter tabs + Export Queue List inside the Queue List panel, extra status-sheet rows (Consulting, reserved actions).
- Figma copy typo "011:00 PM" (paused clock) is rendered with a real clock; chip "4 mins" kept as the app's presets 15/30/45/60/90/120.
