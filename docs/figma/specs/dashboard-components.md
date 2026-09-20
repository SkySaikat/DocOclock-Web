# dashboard-components - Dashboard component library (navbar, header, typography, buttons, user card, bottom bar, icons)

Figma file `zJRyAML8hv0uEBOXtu5Hpn`, page `Web Version V1` (5:2), section **Components** `303:13210` (5855x982, 19 children). Every number below was read from Figma (`use_figma` read-only scripts, `get_design_context`, `get_variable_defs`, `download_assets`); nothing is estimated from a screenshot. Where something could not be read it is listed in section 8.

Read first: `docs/figma/tokens.md` (colour / type / shadow tokens, `content-*`, `ghost`, `steel`, `shadow-ds-*` proposals) and `docs/figma/flows.md` (prototype graph). This spec reuses their names.

Conventions: `EASE_OUT` = `cubic-bezier(0,0,.58,1)` = CSS keyword `ease-out`. Figma "px" = CSS px. `{var}` = colour bound to a Figma variable. "Instrument Sans" = `font-display`, "Inter" = `font-sans`. The section (dark `#444444` canvas) is only a showcase; the component *frames* have no fill unless stated.

Facts that shape the whole unit:
- **Only 3 things in this section animate**: Lead Icon Button hover (expand), overlay opens (DISSOLVE 0.3s), and page-to-page navigation (DISSOLVE 0.3s / SMART_ANIMATE 0.5s). `get_motion_context(recursive)` returned `{"nodes":[]}` - no keyframe animation anywhere.
- **No hover/press states exist** for Nav Link, Buttons - Dashboard, 3 Buttons, User Card, Search, Sort menu rows, Profile menu rows. Figma only defines active/inactive as *static variants*. Do not invent hover styling beyond a colour transition (see section 5).
- The Components section on page `App Version V1` (`569:15636`) is a byte-for-byte copy (same components, same sizes). Phone-specific chrome (bottom bar) lives in App Version V1 (section 3.14).
- Pages compose these components inside a `Body` frame: 1440 wide, vertical auto-layout, **padding 48/64/48/64, gap 24**, children `Navbar - Dashboard` (1312x49), `Dashboard Header` (1312x72), content. The navbar is **in-flow (not fixed/floating)**.

---

## 1. Frames

Reference PNGs are 2x (Figma export scale 2; exports include shadow bleed, so a shadowed frame is a few px larger than 2x its box). Section overview is the only 1x/capped one (4096 px wide cap).

| node id | name | size | role in the product | prototype flow membership | reference PNG |
|---|---|---|---|---|---|
| `303:13210` | Components (section) | 5855x982 | container of all shared dashboard chrome | - | `docs/figma/reference/dashboard-components/components-section-overview-303_13210.png` |
| `396:12116` | Navbar - Dashboard (set of 3) | 1424x227 | top bar of every doctor + patient dashboard page. Variants: `317:13545` Default (doctor, 1384x49), `396:12117` Patient (1384x49), `396:12774` Variant3 (back-link bar, 1384x49) | 13 reactions (6 doctor tabs + avatar, 4 patient tabs + avatar, 1 back link) - part of the doctor-console graph and the Patient flow (`flows.md` 3.2, 5) | `.../navbar-dashboard-396_12116.png` |
| `303:13043` | Dashboard Header (set of 2) | 1425x280 | page title row under the navbar. `303:13096` Queue (1385x72), `303:13070` Variant3 (1385x74, "Welcome" + Add Time) | 2 reactions (Lead Icon Button hover, 3 Buttons click) | `.../dashboard-header-303_13043.png` |
| `302:12624` | Typography - Dashboard (set of 8) | 481x445 | type scale of every dashboard text | none | `.../typography-dashboard-302_12624.png` |
| `303:13196` | Buttons - Dashboard (set of 4) | 161x295 | pill CTAs: Monochrome `303:13197`, Secondary `317:14585`, Primary `303:13199`, Gradient `303:13234` (all 121x48) | click reactions live on *instances* (Add Appointment, Add Prescription, ...) - see flows.md | `.../buttons-dashboard-303_13196.png` |
| `302:12556` | Icons (set of 17) | 72x838 | 32x32 icon slots used by every component | none | `.../icons-302_12556.png` |
| `303:13394` | Search Component | 538x41 | list-page search + filter/sort trigger | **FLOW START "Flow 5"** (filter -> Sort menu overlay) | `.../search-component-303_13394.png` |
| `317:13571` | Nav Link - Dashboard (set of 2) | 153x154 | navbar tab: `317:13572` Default (= active, 69x41), `317:13574` Inactive (68x41) | none of its own | `.../nav-link-dashboard-317_13571.png` |
| `317:15075` | 3 Buttons (set of 2) | 72x124 | list/grid view toggle: `317:15076` Active, `317:15078` Inactive (32x32) | click reaction only on the instance inside Dashboard Header | `.../three-buttons-317_15075.png` |
| `368:15036` | User Card (set of 3) | 447x553 | queue patient row: `368:15037` Default "Arrived" 320x154, `368:15058` Variant2 "Cancelled" 367x154, `368:15084` Variant3 "Late" 320x154 | 3 reactions (status Toggle -> Bottombar overlay) | `.../user-card-368_15036.png` |
| `368:16140` | Bottombar ("Update Status" sheet) | 346x287 | patient-status chooser opened from a User Card Toggle | overlay target; close button -> CLOSE | `.../bottombar-368_16140.png` |
| `368:17693` | Frame = **Profile menu** | 260x376 | avatar dropdown | overlay target of the avatar button; 2 reactions (My Account, Activity History) | `.../profile-menu-368_17693.png` |
| `368:16699` | Frame "4" = **Sort menu** | 136x117 | sort popover for the Search Component filter | overlay target of Flow 5 | `.../sort-menu-368_16699.png` |
| `302:12650` | Input Field - Dococlock | 278x65 | dashboard form field (label + input box) | none | `.../input-field-302_12650.png` |
| `302:12643` `302:12644` `302:12645` `303:13426` `302:12646` `303:13233` | Rectangle 5238-5243 | 146x139 each | colour swatches (not UI): `#393f48`, `#45474d`, `#7b87a4`, `#d0d8eb`, `#f6f8fb`, `#2e8cff` | none | (in overview PNG) |
| `570:20777` (page `App Version V1`) | Card 4 = phone **bottom tab bar** | 402x68 | doctor phone bottom navigation (used by "Bottombar (mobile)") | inside App flows 5-14 | `.../phone-bottom-bar-570_20777.png` |
| `572:20938` (App page) | Bottom Bar Tab (set of 2) | 110x186 | phone tab: `572:20937` Default = active 70x57, `572:20939` Variant2 = inactive | none | (covered by the bar PNG) |
| `368:16641` (Doctor Appointment) | Toaster | 287x800 | toast pill (mapped to `ToastProvider.tsx`) | overlay + AFTER_TIMEOUT | (not exported - trivial, data in 3.15) |

The task described the Bottombar as "mobile": in Figma the frame named **Bottombar** is *not* a bottom-anchored sheet or a tab bar - it is a 346x287 **centred modal card** ("Update Status") on a 25% black scrim, and it is opened the same way on web and phone (`flows.md` 3.3 and App Flow 7). The genuine phone bottom navigation is `Card 4` `570:20777` (section 3.14). Both are specified.

---

## 2. Design tokens used

Colours (hex read from Figma; variable names from `get_variable_defs(303:13210)`). "App token" follows `docs/figma/tokens.md`; NEW = does not exist in `tailwind.config.js` yet.

| Where used in this unit | Hex | Figma variable | App token |
|---|---|---|---|
| headings, values, title text | `#171c1a` | `Text/Primary` | NEW `content-primary` |
| secondary text, nav-menu labels, date text on pill, "Serial No." | `#4b5752` | `Text/secondary` | NEW `content-secondary` |
| default text of every Typography - Dashboard variant, placeholders, icon default, notification icon | `#707b76` | `Text/tertiary` | NEW `content-tertiary` |
| inactive nav link label, phone tab inactive | `#a8b0ac` | `Text/disabled` | NEW `content-disabled` |
| text on filled buttons/active nav link | `#ffffff` | `Text/inverse` | `white` |
| active Nav Link fill, Primary button, 3 Buttons active, tick badge, phone active tab | `#0ca768` | `Accent Color` / `Accent/Accent-500` | `primary-500` (themed) |
| Gradient button lower (fully covered) layer | `#3cbb8d -> #098d58` (also `#70d0ad -> #3cbb8d` in header instance) | `Accent/Accent-400/600`, `Accent-300` | `primary-400/600/300` - see 3.4: NOT visible |
| selected Bottombar option fill, selected Sort menu row fill | `#e6f7f0` | `Accent/Accent-50` | `primary-50` (themed; value differs, see tokens 1.3) |
| selected Sort menu row text | `#03402a` | `Accent/Accent-900` | `secondary-500` (exact on default theme) |
| Monochrome button fill, Search field fill, Input Box fill+stroke, User Card status toggle (Default/Variant2) | `#fbfbfb` | `Input Field` | `ink-50` |
| Late toggle fill (User Card Variant3), Sort menu border | `#f5f7f6` | `Fill Color` | `background` / `bg-surface` (themed) |
| Sort menu row divider | `#fbfbfb` | `Input Field` (stroke) | `ink-50` |
| Bottombar title / option title, Top card title | `#171717` (literal, unbound) | - | `ink-800` |
| Bottombar option sub-text | `#5e5e5e` (literal) | - | `ink-600` (tokens D2: Δ8) |
| Bottombar divider | `#f0f0f0` (literal) | - | NEW `ink-150`-ish; nearest `ink-200 #f2f2f2` (Δ2) - use `ink-200` |
| Bottombar radio dot ring / inner | `#f4f4f4` / `#a8a8a8` (literal) | - | ring = `ink-100 #f6f6f6` (Δ2), inner = `ink-400 #a3a3a3` (Δ5); or keep literal - the dot is an exported SVG asset |
| Bottombar close icon stroke, muted icons (Variant2 call/arrow, `Cancelled` label) | `#8a94a3` (literal) | - | tokens D2: `steel-400` alias or `content-tertiary` |
| Cancelled row card fill | `#f8f8f8` (literal) | - | `neutral-50`-ish (`#fafafa` Δ2); NEW if exact: `surface-muted` |
| Late row card fill | `#dde5e1` (literal) | - | NEW `sage-100 #dde5e1` (no token; nearest `primary-100` on default theme is `#cff0e3`, not equal) |
| User Card icon-button ring | `#eeeeee` (literal) | - | `ink-200` (Δ4) |
| User Card status dots | Arrived `#2e8cff`, Cancelled `#e35e5e`, Late `#4b5752` (the `Text/secondary` variable) | - | Arrived: `#2e8cff` is the **legacy blue** (tokens D8) - map to `primary-500`; Cancelled `#e35e5e` fixed status red; Late `content-secondary` |
| Profile menu Logout fill / text+icon | `#ffeaea` / `#ce4747` (literal) | - | fixed semantic danger (like status chips); NEW `danger-50 #ffeaea`, `danger-600 #ce4747` or arbitrary values |
| Mono icon default (baked into exported SVGs) | `#707b76` | `Text/tertiary` | see recolour recipe 5.12 |
| Gradient button glow ellipse | `#c8db9c` (literal) | - | decorative, brand-independent (tokens 1.2 pastel palette) - decision D-glow in section 8 |
| Navbar favicon strokes | `#0ea5e9 -> #14b8a6`, plus `#38bdf8` | - | `brand.sky/teal` exact, `sky-400`; fixed by design |
| Swatch rectangles | `#393f48` `#45474d` `#7b87a4` `#d0d8eb` `#f6f8fb` `#2e8cff` | - | `#7b87a4` = `steel`, `#d0d8eb` = `ghost`, `#2e8cff` legacy blue; `#393f48` `#45474d` `#f6f8fb` are showcase-only, unused elsewhere in the unit (no token needed) |
| Toast pill fill / text | `#ffffff` / `#707b76` | - / `Text/tertiary` | `white` / `content-tertiary` |

Typography (all measured on component masters):

| Style | Family / weight | Size / line-height / tracking | Colour default | Where |
|---|---|---|---|---|
| Header | Instrument Sans Regular 400 | 36 / normal / 0 | `#707b76` (instances override to `#171c1a`) | page title ("Queue", "Welcome, Dr. John") |
| Title - 24 | Instrument Sans Regular | 24 / normal / 0 | `#707b76` | serial number, Bottombar title, toast |
| Title - 20 | Instrument Sans Regular | 20 / normal / 0 | `#707b76` | patient name in User Card |
| Subtitle - 16 | Instrument Sans Regular | 16 / **22px** / 0 | `#707b76` | date text, subtitle under header, option titles, toast text |
| Paragraph - 16 | Instrument Sans Regular | 16 / normal / **+2 % (0.32px)** | `#707b76` | header description line |
| Button Text - 16 | Instrument Sans Regular | 16 / normal / 0; container `justify-start` (others centre) | `#707b76` | Lead/Trail hover label |
| Value - 14 | Instrument Sans Regular | 14 / normal / 0 | `#707b76` | nav link label (inactive), input label, search text |
| Small - 12 | Instrument Sans Regular | 12 / normal / 0 | `#707b76` | sort menu rows, status label, hints, option sub-text |
| Nav link (active) | Instrument Sans **SemiBold 600** | 14 / normal / 0 | `#ffffff` | active `Nav Link - Dashboard` |
| Buttons - Dashboard label | **Inter** Regular | 16 / normal / **-2 % (-0.32px)** | per variant | 121x48 pills |
| Lead Icon Button collapsed label | **Inter** Regular | 12 / normal / **-2 % (-0.24px)** | `#4b5752` (instance override; master `#8a94a3`) | header |
| Logo wordmark | **Inter** Regular | 16 / normal / 0 | `#171717` | "Dococlock" |
| Phone tab label | Instrument Sans Regular 10 (active: Medium 500 10) | 10 / normal / 0 | `#a8b0ac` / active `#0ca768` | phone bar |

All Instrument Sans text carries `font-variation-settings: "wdth" 100` (default) - no width axis needed; static 400/500/600 suffice (already loaded in `index.html`).

Note: the dashboard `Typography - Dashboard` set is **Regular/`Text/tertiary` for every variant** (instances override weight/colour). The marketing `Typography` set `80:4747` (Medium, `Text/Primary`) is a different set; the Profile menu still uses an old `Typography` main (`96:4208`, id from the legacy set) but its text is overridden to Regular 14 `#4b5752`.

Radii used: 8 (Input Box, misc icon slots, Logout row), 12 (nav link, profile menu), 16 (Navlinks/Misc containers, search + filter, sort menu, selected option), 21 (42x42 icon-button circles), 24 (date pill, Bottombar, phone bar top corners, toast), 32 (User Card), 64 (Toggle chips), 500 (pill buttons, avatar). -> `rounded-ds-sm`, `rounded-xl`, `rounded-2xl`, `rounded-full`, `rounded-3xl`(=24), `rounded-ds-xl`(=32), `rounded-full`.

Shadows: Lead/Trail icon button rest `0 0 7px rgba(0,0,0,.05)` (= `shadow-ds-pill`, exists); Lead hover `0 0 4px rgba(0,0,0,.25)` (NEW `shadow-ds-lead-hover`, or `shadow-[0_0_4px_rgba(0,0,0,.25)]`); date pill `0 0 7px .05` (`shadow-ds-pill`); User Card `12px 9px 20px 0 rgba(0,0,0,.04)` (NEW `shadow-ds-row`); Sort menu `0 -4px 12px 0 rgba(0,0,0,.04)` (NEW `shadow-ds-rise-lg`); Profile menu `7px 5px 13.7px 0 rgba(0,0,0,.04)` (NEW `shadow-ds-menu`; tokens listed it as "misc"); Toast `0 -4px 12px 0 rgba(0,0,0,.08)` (NEW `shadow-ds-toast`); phone bar `0 0 12px 0 rgba(0,0,0,.06)` (NEW `shadow-ds-queue`); Bottombar: **no shadow** (flat on the 25% scrim); Gradient glow: layer blur 44.7 -> CSS `filter: blur(22.35px)` (confirmed by the exported SVG `stdDeviation="22.35"`).

Motion tokens: `--ds-ease-out: cubic-bezier(0,0,.58,1)` (= CSS `ease-out`), `--ds-dur-fast: 300ms`, `--ds-dur-slow: 500ms` (profile-area navigations). No springs in this unit.

---

## 3. Per-frame layout spec

Class strings are Tailwind-arbitrary and use proposed token names (`content-*`, `shadow-ds-*`); if a token does not exist yet use the hex in the table above. "L/H" = auto-layout horizontal, "L/V" vertical; "SB" = space-between, "hug" = fit content.

### 3.1 Navbar - Dashboard (`396:12116`)

Set frame 1424x227, three variants stacked at x20, y20 / y89 / y158; each variant 1384x49, **transparent** (no fill), L/H, primary axis SPACE_BETWEEN, counter axis CENTER, padding 0, gap 415 (only meaningful as the SB gap). In a page the instance is resized to **1312x49** (page `Body` is 1440 with 64 side padding).

**Default (doctor) `317:13545`** - children left to right:
1. `Logo` `317:13546` (128x40, L/H gap 8): `Favicon` 40x40 (asset `navbar-logo-favicon.svg`, section 6) + text "Dococlock" - Inter Regular 16, `#171717`, no tracking, 80x19.
   `flex items-center gap-2 shrink-0` / `font-sans text-[16px] text-ink-800`
2. `Navlinks` `317:13559` (686x49): white fill, radius 16, padding 4, gap 8, L/H; `bg-white rounded-2xl p-1 flex items-center gap-2 cursor-pointer`. Six `Nav Link - Dashboard` instances (each 41 tall): **Overview** (`317:13560`, 101x41), **Queue** (`368:18571`, 84x41), **Appointments** (`317:13561`, 134x41), **Prescriptions** (`317:13562`, 126x41), **Analytics** (`317:13563`, 100x41), **Manage** (`317:13564`, 93x41). In the master every link is the *Inactive* variant; a page instance overrides the current tab to variant `Default` (= active). Verified on Overview page `339:17421`: link `I339:17424;317:13560` = `Property 1=Default`, the rest `Inactive`.
   Each link: `flex items-center justify-center px-5 py-3 rounded-xl` (12,20 padding, r12) - see 3.7.
3. `Misc. Icons` `317:13565` (96x49): white, radius 16, L/H gap 8, fixed 96 wide; two equal 44x49 children (`flex-1`):
   - `Frame 1000012210` `317:13566` - bell button: padding 12, r8, centred; icon `notification-3-line` 20x20 (asset `navbar-icon-notification.svg`, `#707b76`, vector 16.67x17.5 inside).
   - `Frame 1000012212` `317:13569` - avatar button: padding 4, r8; image `Rectangle 4754` 36x36 at (4,6.5), radius 500, `object-cover` (sample photo asset `navbar-avatar-sample.png` is placeholder content; the app must show `profile.image`). **This frame carries the avatar click reaction** (opens the Profile menu).
   `bg-white rounded-2xl flex items-center gap-2 w-24 h-full` / bell `flex-1 h-full flex items-center justify-center p-3 rounded-lg` / avatar `flex-1 h-full flex items-center justify-center p-1 rounded-lg` (+ `size-9 rounded-full object-cover`).

Horizontal geometry in the 1384 master: Logo x0-128, Navlinks x365-1051, Misc x1288-1384 -> the two SB gaps are both 237 (centred in the *remaining* space, not on the page centre).

**Patient `396:12117`** - identical shell; Navlinks 483x49 at x466.5 (gaps 338.5). Links: **Queue** (`396:12133`, 84x41) / **Appointments** (`396:12134`, 134x41) / **Medicines** (`396:12160`, 107x41 - the layer is misnamed "Appointments" but its text is "Medicines") / **Prescriptions** (`396:12135`, 126x41). Bell + avatar same as Default. Patient `Queue` = `/live-serial` (flows.md 5).

**Variant3 `396:12774`** - "back" bar for full-page sub-views inside the dashboard: no Logo. `Navlinks` 184x49 at x0 containing one link `396:12789`, 176x41, text "← Back to Dashboard" (rendered with the arrow glyph in the text); Misc. Icons (96x49) on the right *without* a click reaction on its avatar frame (`396:12797`). **No instance of Variant3 exists in the Web page** (scan of every `INSTANCE` whose main component is `396:12774`: none), so its usage is undocumented; the patient List Page sub-views (`396:12430`, `601:13524`) draw their own "← Appointments" header instead.

**Which tab is active where** (every `Navbar - Dashboard` instance on the Web page, read from the instance's Nav Link variants; `*` = variant `Default`):

| page frame | navbar variant | links present (in order) | active |
|---|---|---|---|
| Overview `339:17421` | Default | Overview*, Queue, Appointments, Prescriptions, Analytics (**Manage link missing in this instance**) | Overview |
| Queue `368:14306`, `328:13919`, `255:8163` | Default | all 6 | Queue (`328:13919`, `255:8163`: none marked) |
| Queue paused `328:14902` | Default | first link's label reads "Queue*", then "Queue", Appointments, Prescriptions, Analytics, Manage | first link (label is "Queue", not "Overview") |
| Appointments `255:11674` | Default | all 6 | Appointments |
| Appointments alt `255:12102` | Default | "Queue", Queue, Appointments*, … (first label "Queue") | Appointments |
| Prescriptions `307:13617` | Default | all 6 | Prescriptions |
| Prescription wizard `257:13781`, `317:15542` | Default | all 6 | **none** |
| Analytics `257:10189` | Default | all 6 | Analytics |
| Manage `257:10013`, Doctor Profile `276:12374` | Default | all 6 | Manage |
| Patient Queue `339:15916` | Patient | Queue*, Appointments, Medicines, Prescriptions | Queue |
| Patient Appointments `191:5570` | Patient | all 4 | Appointments |
| Patient Medicines `339:16108` | Patient | all 4 | Medicines |
| Patient Prescriptions `297:12584` | Patient | all 4 | Prescriptions |
| Patient `297:12283`, `191:5104` (unlinked copies) | Patient | 3 links (Queue missing) | none |

All Web instances sit at (64,48), 1312x49. Two 402-wide *phone drafts* in Patient Dashboard (`357:19153`, `357:19210`) squeeze the Default navbar to the bottom (instance 370x65 at y799/802, `Navlinks` padding 12/37, labels truncated "Overview, Queue, A, P, A") - an early draft superseded by the App Version V1 bar (3.14).

Page placement (verified from `339:17421` and `339:15916`): `Body` `LV p48/64/48/64 g24`; navbar instance at (64,48) 1312x49; Dashboard Header at (64,121) 1312x72 (= 48 + 49 + 24); content from y217.
`w-full max-w-[1312px] mx-auto px-16 pt-12 pb-12 flex flex-col gap-6` at >=1440; navbar `h-[49px]`.

### 3.2 Dashboard Header (`303:13043`)

Set frame 1425x280 (padding 20). Variants are 1385 wide (page instance 1312), L/H, primary SB, counter CENTER, gap 258 (SB).

**Queue `303:13096`** (1385x72):
- Left `Frame 1000012843` (420x72, L/V gap 8, centre-aligned vertically): `Header` "Queue" (Header 36, colour `#171c1a`, 112x44) + `Paragraph - 16` (420x20, **"Manage all your queues and get ready for the next ones "** with a trailing space, 16 / +2 % tracking, `#707b76`).
  `flex flex-col gap-2 justify-center` / `font-display text-[36px] text-content-primary` / `font-display text-[16px] tracking-[0.32px] text-content-tertiary`
- Right `Frame 1000012264` (223x40, L/H gap 4, at right edge, y16): 
  - `Lead Icon Button` `303:13101` (instance of set `303:13034`, Default 40x40): fill `#fff`, r500, padding 4, shadow `0 0 7px rgba(0,0,0,.05)`, clip; icon slot `Icons/Add` 32x32 at (4,4) with `+` glyph 11.25 in `#707b76`; collapsed label `Frame 1000012703` (0x15, pad 0/12, clip) with "Add Time" Inter Regular 12 -2 % `#4b5752`. **Hover -> expands** (5.2).
  - `Frame 1000012215` (179x38, at x44,y1): date pill, fill `#fff`, r24, padding 8/12, gap 8, shadow `0 0 7px .05`: `3 Buttons` (Inactive, 16x16 slot; the nested `Icon Set/Calendar` is 32x32 at -8,-8 and is visually a 16px calendar glyph) + date text `Subtitle - 16` "25-13 Feb 2025" (111x22, `#4b5752`, lh 22) + `arrow-down-s-line` 12x12 (asset `header-icon-arrow-down-12.svg`, `#4b5752`).
  `bg-white rounded-3xl py-2 px-3 flex items-center gap-2 shadow-ds-pill` (the calendar/date pill).

**Variant3 `303:13070`** (1385x74):
- Left `Texts` (403x74, L/V gap 8): `Header` "Welcome, Dr. John" (309x44, `#171c1a`) + `Subtitle - 16` "Manage all your queues and get ready for the next ones " (403x22, lh 22, `#707b76`).
- Right `Right` (312x48, L/H gap 4): `Action` `303:13090` (187x48, fill `#fff`, r24, padding 8/12, gap 8, no shadow; children: `Icons/Calendar` 16x16, `Subtitle - 16` "25-13 Feb 2025" `#707b76`, `Icons/DropDown` 20x20 = arrow-up flipped vertically). This `Action` frame is the **date pill trigger** in every page (reaction: OVERLAY date picker `317:14984` at offset (-210,52), DISSOLVE 0.3 - see flows.md). Then `Buttons - Dashboard/Gradient` 121x48 "Add Time" (instance `303:13243`).

### 3.3 Typography - Dashboard (`302:12624`)

Frame 481x445 (no fill, padding 20); eight variants stacked at x20 (y 20/69/113/155/195/232/272/307). Each variant is an auto-layout **HORIZONTAL, centred both axes (Button Text - 16: primary axis MIN)**, text auto-resize WIDTH_AND_HEIGHT, left aligned, `Instrument Sans Regular`, fill `#707b76` bound to `Text/tertiary`:

| variant | id | box | size / line-height / tracking |
|---|---|---|---|
| Title - 24 | `302:12627` | 48x29 | 24 / auto / 0 |
| Title -  20 (two spaces in the name) | `302:12635` | 40x24 | 20 / auto / 0 |
| Subtitle - 16 | `302:12633` | 32x22 | 16 / 22px / 0 |
| Button Text - 16 | `302:12631` | 32x20 | 16 / auto / 0 |
| Value - 14 | `302:12629` | 28x17 | 14 / auto / 0 |
| Paragraph - 16 | `302:12625` | 33x20 | 16 / auto / +2 % |
| Small - 12 | `302:12637` | 24x15 | 12 / auto / 0 |
| Header | `302:12639` | 72x44 | 36 / auto / 0 |

Tailwind: `font-display text-[Npx] leading-[normal] text-content-tertiary` (+ `leading-[22px]` for Subtitle, `tracking-[0.32px]` for Paragraph). The instances in this section override colour to `content-primary #171c1a` (Header, Title-20 name, Title-24 number), `content-secondary #4b5752` (Subtitle date, Small-12 sub-lines, Value-14 nav label in menus), or literal `#171717` / `#5e5e5e` (Bottombar).

### 3.4 Buttons - Dashboard (`303:13196`)

Set 161x295 (padding 20), four 121x48 variants at y 20 (Monochrome), 89 (Primary), 158 (Gradient), 227 (Secondary). **No hover/press variant exists.** Every variant wraps one `Button Effect` frame (121x48): L/H, padding 8/4/8/4 (top-bottom 8, left-right 4), **gap -14**, centred both axes, radius 500, hug/hug. Content: `Icons` instance 32x32 (glyph `+` 11.25 at (10.375,10.375)) then label frame (95x19, padding 0/12, clip) with "Add Time" - Inter Regular 16, letter-spacing -2 % (-0.32px). Width = 4 + 32 - 14 + 95 + 4 = 121; height 8+32+8 = 48.

| variant | fill | icon colour | label colour |
|---|---|---|---|
| Monochrome `303:13197` | `#fbfbfb` (`Input Field`) | `#707b76` | `#707b76` (`Text/tertiary`) |
| Secondary `317:14585` | none (transparent) | `#4b5752` | `#4b5752` (`Text/secondary`) |
| Primary `303:13199` | `#0ca768` (`Accent/Accent-500`) | `#fff` | `#fff` (`Text/inverse`) |
| Gradient `303:13234` | two stacked linear gradients, vertical (180deg): top layer `#0ca768 -> #08925a` (opaque, on top), lower layer `#3cbb8d -> #098d58` (Accent-400 -> 600; in the header instance `#70d0ad -> #3cbb8d`). **The top layer is fully opaque, so the lower layer is never visible** (verified by sampling the 2x render: top pixel `rgb(12,166,103)`, bottom `rgb(8,150,92)`). + `Ellipse 75` glow (below) | `#fff` | `#fff` |

Gradient extra layer: `Ellipse 75` `357:19538` - ABSOLUTE, 55x55 at (73,26) inside the 121x48 clip, fill `#c8db9c`, layer blur 44.7 (exported as `button-glow-ellipse.svg`: 144.4x144.4 canvas, `circle r=27.5`, `feGaussianBlur stdDeviation=22.35`). It tints the lower-right of the pill lime; the pill is `overflow: clip`.

```html
<!-- Primary -->  <button class="inline-flex items-center justify-center rounded-full bg-primary-500 pl-1 pr-1 py-2 h-12 font-sans text-[16px] tracking-[-0.32px] text-white">
                    <span class="size-8 -mr-[14px] shrink-0 grid place-items-center">+</span><span class="px-3">Add Time</span></button>
<!-- Gradient --> same shell + `relative overflow-hidden bg-[linear-gradient(180deg,rgb(var(--color-primary-500)),#08925a)]` and
                  `<i class="absolute left-[73px] top-[26px] size-[55px] rounded-full bg-[#c8db9c] blur-[22.35px]"/>` (or the exported SVG at inset -81.27%)
```
`#08925a` has no token (primary-600 default is `#0a8e58`, Δ(1,4,2)); use `to-primary-600` if a theme-following end stop is preferred. Note `.btn-sheen` (index.css) is **not** documented on this set - see 5.13.

### 3.5 Icons (`302:12556`)

Frame 72x838, padding 20; 17 variants, each a 32x32 component (Y positions 20, 61, 102, 143, 184, 225, 274, 326, 378, 430, 482, 534, 586, 630, 682, 734, 786). Glyph sizes and wrappers (from design context; SVGs exported to `public/assets/figma/dashboard-components/icon-*.svg`, section 6):

| variant | node | slot | glyph box | notes (svg intrinsic size incl. stroke bleed) |
|---|---|---|---|---|
| Tick | `302:12557` | 32x32 flex-col centred | 12.718x9.746 | svg 12.7179x9.74558 |
| Add | `302:12559` | 32x32, r500 | 11.25x11.25 | svg 11.25x11.25 |
| Day | `302:12561` | 32x32 | 14x14 (svg 15x15, inset -3.57 %) | sun, stroke glyph |
| Pill | `302:12563` | 32x32, pad 1, clip | 13x13 | |
| Morning | `302:12565` | 32x32, pad 3/4, clip | 12x14 (svg 13x15, inset -3.57 %/-4.17 %) | |
| Night | `302:12567` | 32x32, pad 2, clip | 14x14 | moon |
| filter | `302:12569` | 32x32 flex-col, pad 3, clip | 13x12 (svg 14x13, inset -4.17 %/-3.85 %) | funnel |
| Clock | `302:12571` | 32x32 | 16x16 | mingcute:time-line |
| Edit | `302:12574` | 32x32 | 12x12 | pencil |
| Change | `302:12576` | 32x32 flex-col | 13.906x16 | two arrows (status toggle chevrons) |
| Close | `302:12580` | 32x32 | 10x10 (svg 11.5x11.5, inset -7.5 %), stroke 1.5 round | |
| Delete | `302:12582` | 32x32 | 24x24 | material-symbols-light trash |
| DropDown | `302:12586` | 32x32 | 20x20 arrow-up **flipped vertically (scale-y -1)** | export is the arrow-*up* `icon-dropdown-arrow-up.svg`; `transform: scaleY(-1)` = down |
| List | `302:12591` | 48x48-aspect, h32, pad 16, r24 | 14x14 | hugeicons:list-view |
| Grid | `302:12594` | same wrapper | 20x20 | bitcoin-icons:grid-outline |
| Calendar | `302:12597` | same wrapper | 16x16 | mynaui:calendar |
| Upload | `303:13898` | 32x32 | 13.333x13.333 | |

All exported SVGs bake the master colour `#707b76` (Close/Filter/Calendar are stroke-based). Instances override the colour (`#8a94a3`, `#4b5752`, `#fff`, `#0ca768`) - implement recolouring with the mask recipe in 5.12, never by editing the SVG.

### 3.6 Search Component (`303:13394`)

L/H, gap 10, 538x41, primary/counter MIN-centre. Two children:
- `search-line` `303:13387` (481x41, fill/grow): fill `#fbfbfb` (`Input Field`), radius 16, padding 12/16, gap 8, clip. Magnifier `Vector` 16.928x16.928 (asset `search-icon-magnifier.svg`, `#707b76`) + `Typography - Dashboard/Value - 14` "Search Anything" `#707b76` (108x17).
- `iconoir:filter` `303:13390` (47x41, hug x fill): fill `#fff`, radius 16, padding 8/16, centred, clip; funnel `Vector` 15x14.766 (asset `search-icon-filter.svg`, stroke `#707b76` 1, inset -3.39 %/-3.33 %). **Carries the click reaction.**

`flex items-stretch gap-[10px] w-[538px]` / field `flex-1 flex items-center gap-2 h-[41px] px-4 py-3 rounded-2xl bg-ink-50` / button `flex items-center justify-center px-4 py-2 rounded-2xl bg-white`.

### 3.7 Nav Link - Dashboard (`317:13571`)

Set 153x154 (padding 20). Both: L/H, padding 12/20/12/20, gap 10, centred, radius 12, hug; inner `Typography - Dashboard/Value - 14`.
- **Default = ACTIVE** `317:13572` (69x41): fill `#0ca768` (bound `Accent Color`), label Instrument Sans **SemiBold 14** `#fff`.
- **Inactive** `317:13574` (68x41): no fill, label **Regular 14** `#a8b0ac` (`Text/disabled`).
`px-5 py-3 rounded-xl font-display text-[14px]` + active `bg-primary-500 text-white font-semibold` / inactive `text-content-disabled font-normal`. No hover variant. (Width changes 28px "Text" ± only because SemiBold is slightly wider.)

### 3.8 3 Buttons (`317:15075`)

Set 72x124 (padding 20). Two 32x32 variants, L/H, padding 16, gap 8, centred, radius 24; child `Icons/List` (32x32, glyph 14x14 at (9,9), stroke 1).
- **Active** `317:15076`: fill `#0ca768`, glyph stroke `#fff`.
- **Inactive** `317:15078`: no fill, glyph stroke `#707b76`.
`size-8 grid place-items-center rounded-3xl` + active `bg-primary-500 text-white` / inactive `text-content-tertiary`. (A view-mode toggle; in Appointments the two buttons swap list/grid - flows.md.)

### 3.9 User Card (`368:15036`)

Set 447x553 (padding 28,31); three cards at y31 / 198 / 368. Shell (all): L/V, padding 20, gap 24, primary CENTER, radius 32, shadow `12,9 blur 20 rgba(0,0,0,.04)`, hug height = 154 (20 + 48 + 24 + 42 + 20).

| variant | id | size | fill | status |
|---|---|---|---|---|
| Default | `368:15037` | 320x154 | `#fff` | "Arrived" (dot `#2e8cff`) |
| Variant2 | `368:15058` | 367x154 | `#f8f8f8` | "Cancelled" (dot `#e35e5e`, label `#8a94a3`), has call + arrow buttons |
| Variant3 | `368:15084` | 320x154 | `#dde5e1` | "Late" (dot `#4b5752`), status toggle fill `#f5f7f6` |

Structure (Default, positions inside the 320x154 card):
1. `Bottom` row `368:15038` (280x48, L/H SB, fill-width): 
   - `Left` `368:15039` (228x48, L/H gap 8): avatar `Ellipse 44` 48x48 (image fill; asset `user-card-avatar-sample.png` 96x96 = @2x; stroke hidden) + text column (172x43, L/V gap 4): name `Title - 20` "John Doe" `#171c1a` (180-wide text box) and `Small - 12` "45 Mins Session" `#4b5752`.
   - `Toggle` `368:15045` (52x48, L/V gap 4, right-aligned, r64): "Serial No." `Small 12` `#4b5752` + number `Title - 24` "37" `#171c1a`.
2. `Top` row `368:15048` (280x42, L/H SB, fill-width), y92:
   - status chip `Toggle` `368:15049` (90.9x32, **click reaction**): fill `#fbfbfb`, r64, padding 8, gap 0; inside `Frame 2147224332` (L/H gap 4): dot 8x8 (`Ellipse 68`) + label `Small 12` "Arrived" `#4b5752` with padding 0/4; then `Icons/Change` 13.906x16 (strokes `#4b5752`) - i.e. `[dot] Arrived ⇅`.
   - `Icons` `368:15054` (42x42): ring button `Frame 1000012551` - **border 1px `#eee` (inside), radius 21, padding 13, 42x42** - with `arrow-right-up-line` 16x16 (`#4b5752`, asset `user-card-icon-arrow-up-right.svg`).
   Variant2: `Icons` group is 88x42, gap 4: `Frame 1000012550` call ring (`fluent:call-20-regular` 16x16 `#8a94a3`; mail-line 16x16 `#909090` exists but HIDDEN) + `Frame 1000012551` arrow ring (`#8a94a3`). Variant3: same 88x42 group but glyph colours `#4b5752`; all rings 1px `#eee`.
   Variant2/3 rows are wider/narrower only because the top row has two ring buttons (gap 113 SB in Variant2 = 327 wide).

```html
<div class="w-[320px] min-w-[280px] rounded-ds-xl bg-white p-5 flex flex-col justify-center gap-6 shadow-[12px_9px_20px_0_rgba(0,0,0,.04)]">
  <div class="flex items-center justify-between w-full">
    <div class="flex-1 flex items-center gap-2 min-w-0"><img class="size-12 rounded-full object-cover"/><div class="min-w-0 flex flex-col gap-1">
      <p class="font-display text-[20px] text-content-primary">John Doe</p><p class="font-display text-[12px] text-content-secondary">45 Mins Session</p></div></div>
    <div class="flex flex-col items-end gap-1 rounded-full"><span class="font-display text-[12px] text-content-secondary">Serial No.</span><span class="font-display text-[24px] text-content-primary">37</span></div></div>
  <div class="flex items-center justify-between w-full">
    <button class="flex items-center rounded-full bg-ink-50 p-2"><span class="flex items-center gap-1"><i class="size-2 rounded-full bg-primary-500"/><span class="px-1 font-display text-[12px] text-content-secondary">Arrived</span></span><!-- Change icon 13.9x16 --></button>
    <span class="grid place-items-center size-[42px] rounded-full border border-ink-200 p-[13px]"><!-- arrow-up-right 16 --></span></div></div>
```

### 3.10 Bottombar - "Update Status" (`368:16140`)

346x287, fill `#fff`, radius 24, padding 16, gap 12, L/V, clip, **no shadow, no stroke**. Overlay: CENTER, scrim `rgba(0,0,0,.25)`, close on click outside.
1. `Top` `368:16141` (314x40, instance of component `Top` `255:8156`, L/H SB gap 24): title `Title - 24` "Update Status" `#171717` (157x29); right `Icons` group (40x40) holding `Trail Icon Button` (40x40, white, r500, shadow `0 0 7 .05`) with `Icons/Close` (stroke `#8a94a3` 1.5, glyph 10x10). **Close click -> CLOSE.**
2. `Vector` `368:16142` divider: 314 wide, 0 tall, stroke `#f0f0f0` 1 (asset `bottombar-divider.svg`, 314x1).
3. `Options` `368:16143` (314x191, L/V, gap 4) - three `Option` rows, each 314x61, L/H, padding 10, gap 12, centred:
   - **Late** (`368:16144`, not selected): `Dot` 18x18 (asset `bottombar-radio-dot.svg`: ring `#f4f4f4` + inner 8px `#a8a8a8`) + text column (264x41, L/V gap 4): `Subtitle 16` "Late" `#171717` (lh 22) + `Small 12` "Patient hasn't arrived " `#5e5e5e`.
   - **Arrived** (`368:16151`, **selected**): fill `#e6f7f0` (Accent-50), radius 16; tick badge `Icons/Tick` 29x29 (asset `bottombar-tick-badge.svg`: circle `#0ca768` + white check) + text column 253x41: "Arrived" `#0ca768` 16/22 and "Patient has arrived " `#0ca768` 12.
   - **Cancelled** (`368:16156`, not selected): as Late with "Cancelled" / "Patient has cancelled".
Height check: 16 + 40 + 12 + 0 + 12 + 191 + 16 = 287.

```html
<div role="dialog" class="w-[346px] rounded-3xl bg-white p-4 flex flex-col gap-3 overflow-hidden">
  <div class="flex items-center justify-between gap-6"><h2 class="font-display text-[24px] text-ink-800">Update Status</h2><button class="size-10 rounded-full bg-white shadow-ds-pill grid place-items-center">…close…</button></div>
  <hr class="border-0 h-px bg-[#f0f0f0]"/>
  <ul class="flex flex-col gap-1">
    <li class="flex items-center gap-3 p-[10px]">…dot 18…<div class="flex flex-col gap-1"><b class="font-display font-normal text-[16px] leading-[22px] text-ink-800">Late</b><span class="text-[12px] text-ink-600">Patient hasn't arrived </span></div></li>
    <li class="flex items-center gap-3 p-[10px] rounded-2xl bg-primary-50 text-primary-500">…tick 29…</li>
```

### 3.11 Profile menu = "Frame" (`368:17693`)

260x376, fill `#fff`, radius 12, padding 12, gap 16, L/V, shadow `7px 5px 13.7px 0 rgba(0,0,0,.04)`. Overlay: MANUAL, no scrim, close on click outside.
- Group `Frame 2147207300` `368:17694` (169x284 hugged, L/V, padding 12, **gap 28**): six rows `flex items-center gap-2` (20 tall): 20x20 line icon + `Typography` label **Instrument Sans Regular 14 `#4b5752`** (Instrument Sans, not Medium):
  1. `sticky-note-2-line` **My Account** (`368:17695`, click -> Account, SMART_ANIMATE 0.5)
  2. `gift-line` **Activity History** (`368:17699`, click -> Activity Log, SMART_ANIMATE 0.5)
  3. `bank-card-line` **Payment History** (`368:17703`, no reaction; flows.md maps to `/doctor/payment`)
  4. `question-line` **Help & FAQ** (`368:17707`)
  5. `shield-line` **Privacy & Security** (`368:17711`)
  6. `calendar-line` **Google Calender** (sic) (`368:17715`)
  Icons (`#4b5752`, 20x20) exported as `profile-menu-icon-{account,activity,payment,help,privacy,calendar}.svg`.
- `Frame 1000012876` `368:17719` (236x52, fill-width, L/H gap 16, padding 16): fill `#ffeaea`, radius 8; `logout-box-r-line` 20x20 (`#ce4747`, asset `profile-menu-icon-logout.svg`) + text **"Logout "** (trailing space) Regular 16 `#ce4747`. No reaction in Figma.
Height: 12 + 284 (12+120+140+12) + 16 + 52 + 12 = 376. `w-[260px] rounded-xl bg-white p-3 flex flex-col gap-4 shadow-ds-menu`.

Overlay placement (relative offset = overlay top-left minus trigger top-left): doctor navbar `(-181,+55)`, patient `(0,0)`. With the 44x49 avatar button that means the menu's right edge overshoots the button's right edge by 35px and sits 6px under the navbar: CSS `absolute top-[calc(100%+6px)] right-[-35px]` relative to the avatar button. The patient `(0,0)` looks like an un-adjusted default - use the doctor placement for both (section 8).

### 3.12 Sort menu = "4" (`368:16699`)

136x117, fill `#fff` (bound to a library colour variable, resolved value `#ffffff`), **stroke inside 1px `#f5f7f6`** (`Fill Color`), radius 16, L/V gap 0, shadow `0 -4px 12px 0 rgba(0,0,0,.04)`. Three rows (`Frame 1000012731` / `…730` / `…733`, each 136x39, L/H, padding 12/16): text Regular **12** - "Date Ascending" (89x15), "Date Descending" (96x15), "Letter" (34x15), `#171c1a`. Dividers `Line 18/20` 1px `#fbfbfb`. **"Date Descending" is drawn selected**: row fill `#e6f7f0`, text `#03402a`. Overlay: MANUAL at (-5,+47) from the filter button (= 6px below its 41px height, 5px left of its left edge), no scrim, close on click outside.
`w-[136px] rounded-2xl bg-white border border-background shadow-ds-rise-lg overflow-hidden` / row `h-[39px] px-4 flex items-center text-[12px] text-content-primary` / selected `bg-primary-50 text-secondary-500` / divider `border-t border-ink-50`.

### 3.13 Input Field - Dococlock (`302:12650`)

Single COMPONENT 278x65, L/V gap 8. `Top` label row (39x17, gap 4): optional `Label Icon` 14x14 (HIDDEN) + `Value - 14` "Name" `#4b5752`. `Input Box` `302:12604` (278x40, fill-width): fill `#fbfbfb` + inside stroke 1 `#fbfbfb` (invisible), radius 8, padding 12, gap 8; `Leading` (230x16, gap 4): 16x16 calendar icon + `Small - 12` hint "Enter your Name" `#707b76`; hidden `Value` slot; `Trailing Icon` 16x16 calendar (`#707b76`). No error/focus/disabled variants exist. `Label`: `font-display text-[14px] text-content-secondary`, box: `h-10 rounded-ds-sm bg-ink-50 border border-ink-50 px-3 flex items-center gap-2`.

### 3.14 Phone bottom tab bar (App Version V1) - `Card 4` `570:20777`

402x68, fill `#fff`, **radii 24/24/0/0**, shadow `0 0 12px 0 rgba(0,0,0,.06)`, L/H SB, padding 0/36/0/36 (gap 24 between fixed-width tabs), clip. Four `Bottom Bar Tab`s: **Overview** (grid icon `Icons/Grid` 15x15 slot / glyph 20, label 10), **Queue** (`572:20943`, *active*: glyph `Vector` 16x16 fill `#0ca768` (asset `phone-bottom-bar-icon-queue.svg`), label Instrument Sans **Medium 10** `#0ca768`, top border **2px `#0ca768`**, no radius), **Appointments** (calendar 16), **Prescriptions** (`hugeicons:prescriptions` 15x15, asset `phone-bottom-bar-icon-prescriptions.svg`, stroke `#8a94a3`). Each tab L/V, padding 16/0, gap 8, centred; inactive label Regular 10 `#a8b0ac` (`Text/disabled`), inactive radius 12; component set `Bottom Bar Tab` (`572:20938`): Default (active, 70x57, padding 8/16, gap 10, vector `#0ca768`, label `#0ca768`) / Variant2 (inactive, vector+label `#a8b0ac`). Only **four** tabs (no Analytics/Manage).
`fixed bottom-0 inset-x-0 h-[68px] bg-white rounded-t-3xl shadow-ds-queue px-9 flex items-center justify-between` / tab `flex flex-col items-center justify-center gap-2 py-4 text-content-disabled text-[10px]` / active `border-t-2 border-primary-500 text-primary-500 font-medium`. Phone status-bar mock (`Navbar` `569:19817`, black 404x70 with an image) is a device mock, not a component.
Phone `Body` (`572:21086`, 2 variants): 368 wide, `Queue Card` r24 shadow `0 0 12 .06` p15 gap 24 - card layout, not chrome.

### 3.15 Toaster (Doctor Appointment section, mapped to `ToastProvider.tsx`)

Frame 287x800, L/V padding 90/10/90/10; child `Action` `341:17908` (267x48 hug): fill `#fff`, radius 24, padding 8/12, gap 4, shadow `0 -4px 12px 0 rgba(0,0,0,.08)`; `Icons/Tick` 28x28 (padding 8, glyph 12x9.2 fill `#0ca768` bound var; asset `icon-tick.svg`) + `Subtitle - 16` text `#707b76` ("Booking Succesfully Created" / "Marked As Taken", 126-211 wide). Only a **success** variant exists. Overlay CENTER (`TOP_CENTER` for the Doctor Profile toasts), scrim none (or `rgba(0,0,0,.25)` on `399:12826`, `619:13780`), the pill sits **90px below the top of the 800px frame**.
`flex items-center gap-1 h-12 rounded-3xl bg-white pl-3 pr-3 shadow-ds-toast` / `text-[16px] leading-[22px] text-content-tertiary`.

---

## 4. Components & variants used

| component set (id) | variants (id) | property used | used by |
|---|---|---|---|
| Navbar - Dashboard (`396:12116`) | Default `317:13545`, Patient `396:12117`, Variant3 `396:12774` | `Property 1` | every doctor page (Default, 15 instances), every patient dashboard page (Patient, 6 instances), Variant3 = no instance found |
| Nav Link - Dashboard (`317:13571`) | Default `317:13572` (active), Inactive `317:13574` | `Property 1` | Navlinks of all navbar variants (instance override picks the active tab) |
| Dashboard Header (`303:13043`) | Queue `303:13096`, Variant3 `303:13070`; nested `Property 1` of children | - | page headers; Manage `Welcome, Dr. John` etc. |
| Lead Icon Button (`303:13034`, off-section) | Default `303:13035`, Variant2 `303:13039` | `Property 1` | Dashboard Header/Queue right cluster |
| Trail Icon Button (`255:6656`, off-section) | Default `255:6657`, Variant2 `255:6661` | `Property 1` | Bottombar close; Manage "Add" buttons; Queue prescription button |
| Buttons - Dashboard (`303:13196`) | Monochrome, Secondary, Primary, Gradient | `Property 1` | Add Time / Add Appointment / Add Prescription / range button / Cancel |
| Typography - Dashboard (`302:12624`) | 8 variants | `Property 1` | everywhere |
| Icons (`302:12556`) | 17 variants | `Property 1` | everywhere |
| 3 Buttons (`317:15075`) | Active, Inactive | `Property 1` | list/grid toggle |
| Search Component (`303:13394`) | (single) | - | list headers |
| User Card (`368:15036`) | Default, Variant2, Variant3 | `Property 1`; nested booleans `callIcon` (true), `mailIcon` (false) | queue patient rows |
| Top (`255:8156`) | (single) | - | header of "Queue Status" card and of the Bottombar |
| Icon Set (`106:5218`, legacy) | Calendar | `Property 1` | inside `3 Buttons` |
| Typography (`96:4208` legacy master) | Value - 14 / Title - 20 (text overridden) | - | Profile menu labels |

---

## 5. Interactions

### 5.1 Interaction table

| # | trigger | source layer (id + name) | action | destination | transition | what visually changes |
|---|---|---|---|---|---|---|
| I1 | ON_HOVER | `303:13101` Lead Icon Button (Dashboard Header/Queue) | CHANGE_TO | `303:13039` Lead Icon Button/Variant2 | SMART_ANIMATE EASE_OUT 0.3 s | width 40 -> 122; shadow `0 0 7 .05` -> `0 0 4 .25`; label revealed (width 0 -> 96, Inter 12 -> Instrument Sans 16, `#8a94a3`); icon fixed at x4 |
| I2 | ON_CLICK | `303:13103` 3 Buttons (date pill) | NAVIGATE | none (blank) | SMART_ANIMATE EASE_OUT 0.3 s | placeholder view toggle: Active <-> Inactive fill (`#0ca768` <-> none) + icon stroke (`#fff` <-> `#707b76`) |
| I3 | ON_CLICK | `303:13390` iconoir:filter (Search Component) | OVERLAY | `368:16699` Sort menu, offset (-5,+47) | DISSOLVE EASE_OUT 0.3 s | menu fades in under the button; no scrim; closes on outside click |
| I4 | ON_CLICK | `368:15049` / `368:15070` / `368:15096` User Card status Toggle | OVERLAY | `368:16140` Bottombar, CENTER | DISSOLVE EASE_OUT 0.3 s | card fades in over a `rgba(0,0,0,.25)` scrim; closes on outside click |
| I5 | ON_CLICK | `I368:16141;1790:13221` Trail Icon Button (Bottombar) | CLOSE | - | none (instant) | overlay disappears |
| I6 | ON_CLICK | `317:13560`, `368:18571`, `317:13561`, `317:13562`, `317:13563`, `317:13564` doctor Nav Links | NAVIGATE | Overview `339:17421` / Queue `368:14306` / Appointments `255:11674` / Prescriptions `307:13617` / Analytics `257:10189` / Manage `257:10013` | DISSOLVE EASE_OUT 0.3 s | page cross-fade; active pill moves (each destination frame has the new tab as variant Default) |
| I7 | ON_CLICK | `396:12133`, `396:12134`, `396:12160`, `396:12135` patient Nav Links | NAVIGATE | Queue `339:15916` / Appointments `191:5570` / Medicines `339:16108` / Prescriptions `297:12584` | DISSOLVE EASE_OUT 0.3 s | as I6 |
| I8 | ON_CLICK | `396:12789` "← Back to Dashboard" (Variant3) | NAVIGATE | Patient Queue `339:15916` | DISSOLVE EASE_OUT 0.3 s | leave the sub-view |
| I9 | ON_CLICK | `317:13569` avatar button (doctor navbar) | OVERLAY | `368:17693` Profile menu, offset (-181,+55) | **none (instant)** | menu appears with no fade |
| I10 | ON_CLICK | `396:12142` avatar button (patient navbar) | OVERLAY | `368:17693`, offset (0,0) | DISSOLVE EASE_OUT 0.3 s | menu fades in |
| I11 | ON_CLICK | `368:17695` My Account | NAVIGATE | Account `276:13531` | SMART_ANIMATE EASE_OUT **0.5 s** | profile-area transition; menu closes |
| I12 | ON_CLICK | `368:17699` Activity History | NAVIGATE | Activity Log `276:13827` | SMART_ANIMATE EASE_OUT 0.5 s | as I11 |
| I13 | ON_HOVER (component) | Trail Icon Button `255:6657` | CHANGE_TO | `255:6661` Variant2 | SMART_ANIMATE EASE_OUT 0.3 s | width 40 -> 122; shadow removed; label revealed on the left; icon moves x4 -> x86 |
| I14 | AFTER_TIMEOUT (adjacent) | Toaster frames | NAVIGATE | previous page | DISSOLVE EASE_OUT 0.3 s after 0.5 s | toast disappears (`flows.md`); overlay open uses DISSOLVE 0.3 or MOVE_IN BOTTOM 0.5 |

Nothing in this section has keyframe motion (`get_motion_context` recursive: none). Full raw rows: `docs/figma/interactions/dashboard-components.json`.

### 5.2 Recipe - Lead Icon Button hover expand (I1)  [Button Featured Hover pattern, dashboard flavour]

Figma tweens `width` 40 -> 122 with the box shadow swapped; the label is a *different layer* in each variant, so it cross-fades while the pill widens. CSS (works with the repo's existing pattern in `Layout.tsx` Register button, `max-width` 300 ms):

```css
.lead-icon-btn { display:inline-flex; align-items:center; height:40px; padding:4px; border-radius:500px;
  background:#fff; box-shadow:0 0 7px rgba(0,0,0,.05); overflow:hidden;
  transition: box-shadow .3s cubic-bezier(0,0,.58,1); }
.lead-icon-btn__icon { flex:none; width:32px; height:32px; }               /* Add glyph, #707b76 */
.lead-icon-btn__label { max-width:0; opacity:0; padding:0; white-space:nowrap;
  font:400 16px "Instrument Sans"; color:#8a94a3;
  transition: max-width .3s cubic-bezier(0,0,.58,1), opacity .3s cubic-bezier(0,0,.58,1), padding .3s cubic-bezier(0,0,.58,1); }
.lead-icon-btn:hover, .lead-icon-btn:focus-visible { box-shadow:0 0 4px rgba(0,0,0,.25); }
.lead-icon-btn:hover .lead-icon-btn__label, .lead-icon-btn:focus-visible .lead-icon-btn__label { max-width:96px; opacity:1; padding:0 12px; margin-left:-14px; }
@media (prefers-reduced-motion: reduce){ .lead-icon-btn, .lead-icon-btn__label { transition:none; } }
```
Order in the DOM: icon first, label second (Variant2 order: `Icons` at x4, `Text` frame at x22 = 4 + 32 - 14). Use `hover:` + `focus-visible:` so keyboard users get the same expansion. Tailwind form: `group/lead ... overflow-hidden` + label `max-w-0 group-hover/lead:max-w-[96px] group-hover/lead:px-3 group-hover/lead:-ml-[14px] transition-[max-width,opacity,padding] duration-300 ease-out`.
Maps onto the app: this control is the "Add Time" quick action next to the date range in the Queue header (`SerialManager` header, other unit) - its `onClick` must remain the existing add-time/late handler; only styling changes. Colour note: in the header instance the collapsed label is Inter 12 `#4b5752` but the revealed label (Variant2 master) is Instrument Sans 16 `#8a94a3` - use the revealed style.

### 5.3 Recipe - Trail Icon Button hover expand (I13)

Same mechanism, mirrored: label on the **left**, icon fixed at the **right** end (x = 122 - 4 - 32 = 86), shadow removed:
```css
.trail-icon-btn { display:inline-flex; flex-direction:row-reverse; align-items:center; height:40px; padding:4px; border-radius:500px; background:#fff; overflow:hidden;
  box-shadow:0 0 7px rgba(0,0,0,.05); transition: box-shadow .3s cubic-bezier(0,0,.58,1); }
.trail-icon-btn:hover { box-shadow:0 0 0 rgba(0,0,0,0); }
.trail-icon-btn__label { max-width:0; opacity:0; padding:0; white-space:nowrap; font:400 16px "Instrument Sans"; color:#8a94a3; transition:max-width .3s cubic-bezier(0,0,.58,1), opacity .3s cubic-bezier(0,0,.58,1), padding .3s cubic-bezier(0,0,.58,1); }
.trail-icon-btn:hover .trail-icon-btn__label { max-width:96px; opacity:1; padding:0 12px; margin-right:-14px; }
```
Apply **only when the button has a real label** (Manage "Add" hospital/assistant, Add-experience). The Bottombar close button inherits this hover in the Figma instance but its label is the unchanged placeholder "Add Time" - do not expand it (section 8).

### 5.4 Recipe - overlay open/close (I3, I4, I5, I9, I10)

Figma overlay = destination frame drawn above the page at a computed position; DISSOLVE = opacity 0 -> 1 in 300 ms `ease-out`; CLOSE_ON_CLICK_OUTSIDE = a click anywhere outside the overlay closes it; the Bottombar also draws a `rgba(0,0,0,.25)` scrim (fades in with it).
```css
.ds-overlay { animation: dsFadeIn .3s cubic-bezier(0,0,.58,1) both; }   /* = existing .animate-fade-in (0.3s ease-out) */
.ds-scrim   { background:rgba(0,0,0,.25); animation: dsFadeIn .3s cubic-bezier(0,0,.58,1) both; }
@media (prefers-reduced-motion: reduce){ .ds-overlay, .ds-scrim { animation:none; } }
```
- **Sort menu**: `position:absolute; top:calc(100% + 6px); left:-5px;` relative to the filter button (button 41 tall -> +47 from its top). Open on click; `mousedown` outside closes (same pattern as `Layout.tsx:65-73`). Rows: selected state is `bg-primary-50 text-secondary-500`. Wire the rows to the existing sort state of the list (Date Ascending / Date Descending / Letter) - only the Appointments and Prescriptions headers use them.
- **Bottombar ("Update Status")**: centred modal, `w-[346px]`, scrim 25 %. Options = a radio group (one selected). Wire to the existing per-patient status action in `SerialManager` (status values Late / Arrived / Cancelled ↔ the app's appointment statuses); selecting an option = the status update handler, then close.
- **Profile menu**: `absolute top-[calc(100%+6px)] right-[-35px]` under the avatar button; doctor variant opens **instantly** (transition none), patient variant fades 0.3 s. Recommended: use the 0.3 s fade for both (harmless, and `animate-in fade-in` in `Layout.tsx:207` currently does nothing because `tailwindcss-animate` is not installed - see section 7).
- Overlays must set `role="menu"`/`"dialog"`, focus management and `Esc` to close (not in Figma; needed for a11y, no visual impact).

### 5.5 Recipe - page navigation transitions (I6, I7, I8, I11, I12)

Figma: page swap is a **DISSOLVE 0.3 s ease-out** (cross-fade of the whole 1440x800 frame); profile-area screens (Account, Activity Log, Edit Profile, Doctor Profile) use **SMART_ANIMATE 0.5 s ease-out**. In React (no router animation lib in the repo): key the rendered view on `currentPath` and give the wrapper `animate-fade-in` (index.css `.animate-fade-in` = `fadeIn .3s ease-out` - already Figma-exact). For 0.5 s variants use a modifier `animate-fade-in-slow { animation-duration:.5s }`. Do **not** re-mount `Layout`/navbar between pages - only the content region cross-fades (in Figma the navbar is part of each frame, so the active pill jumps; a colour transition on the pill is optional polish).
Maps onto the app: `Layout` receives `children` from `App.tsx renderView()`; add the key/animation class at the `<main>` child (`Layout.tsx:417-420`) - no change to `navigate()`.

### 5.6 Recipe - active/inactive nav link (no reaction of its own)

Static variant swap decided by the current route: `isActive = currentPath === tab.path`. Add `transition-colors duration-300 ease-out` on background + text so the highlight fades when the route changes (matches the 0.3 s DISSOLVE). No hover style exists in Figma; if an accessibility hover cue is desired use only `hover:text-content-tertiary` (one step darker, no bg) and flag it as an addition.

### 5.7 Recipe - 3 Buttons toggle (I2)

`aria-pressed` toggle; `transition: background-color .3s ease-out, color .3s ease-out`. Active `bg-primary-500 text-white`, inactive `text-content-tertiary`. Icon recolour via `currentColor` (mask recipe 5.12).

### 5.8 Recipe - User Card

No hover. Only the status chip is interactive (opens the Bottombar). Keep the row's existing patient/serial data; the chip label = current status; call/arrow ring buttons keep their current handlers (call = `tel:` link if present, arrow = open the patient/prescription action).

### 5.9 Recipe - Buttons - Dashboard states

No hover/press/disabled variants in Figma. Use the app's existing focus ring and `disabled:opacity-50`. Whether to add `.btn-sheen` on Primary/Gradient: CLAUDE.md documents it as Figma's hover for `Buttons` (80:4641) and Doctor Card; **this dashboard set does not define it**, so treat as optional consistency, not fidelity (section 8).

### 5.10 Recipe - Toast enter/leave

Figma: overlay open DISSOLVE 0.3 s (Booking/Marked-as-taken) or MOVE_IN BOTTOM 0.5 s ease-out (hospital/assistant success); auto-dismiss modelled as `AFTER_TIMEOUT 0.5 s` (prototype shortcut - keep the app's 4000 ms). Enter: `translateY(16px) + opacity 0 -> 0`,  `.5s ease-out`; exit: `opacity .3s ease-out`. Keep `showToast(message,type,duration)`.

### 5.11 Recipe - phone bottom bar

Active tab is a static variant; tab tap = navigate (no reaction in the Components section). Use `transition-colors .3s ease-out`. Provide `padding-bottom: env(safe-area-inset-bottom)` (Capacitor) - the Figma 68 px bar has no safe-area handling.

### 5.12 Recipe - recolouring the exported icons without inline SVG

The exported SVGs have baked colours; Figma instances override them. Use CSS mask so one asset serves all colours and stays themeable:
```css
.ds-icon { display:inline-block; width:var(--s,16px); height:var(--s,16px); background:currentColor;
  -webkit-mask: var(--icon) center / contain no-repeat; mask: var(--icon) center / contain no-repeat; }
/* usage */ <span class="ds-icon" style="--icon:url(/assets/figma/dashboard-components/icon-calendar.svg);--s:16px" />
```
Do this for Icons (17), Search (2), Profile menu (7), Bottombar close/tick, User Card icons. Exceptions that must render as an `<img>` (multi-colour): `bottombar-radio-dot.svg`, `bottombar-tick-badge.svg`, `navbar-logo-favicon.svg`, user-card status dots (or recolour via `bg-*` circle).

### 5.13 Note on `.btn-sheen`

`index.css:126-145` implements a soft-light radial sheen. In Figma it exists on `Button Usual Hover`/Featured/Doctor Card. In this unit the only decorative treatment on a filled pill is the **static** blurred `#c8db9c` glow on `Buttons - Dashboard/Gradient` (3.4). The app can keep `.btn-sheen` on dashboard Primary/Gradient as house style, but the pixel-exact Gradient button needs the glow ellipse + vertical gradient.

---

## 6. Assets manifest

All under `public/assets/figma/dashboard-components/` (51 files, ~400 KB). No file is a duplicate of the earlier 36 (`sha256` compared); files that were byte-identical to another new file were dropped (e.g. header "add" icons = `button-icon-add-*`, header arrow-up = `icon-dropdown-arrow-up`, header glow = `button-glow-ellipse` modulo filter id, phone grid icon = `icon-grid`). Colours below are the baked colour of each export.

| local path (`public/assets/figma/dashboard-components/`) | source node | fmt | notes |
|---|---|---|---|
| `icon-tick.svg` | `302:12558` | svg 12.72x9.75 | `#707b76` |
| `icon-add.svg` | `302:12560` | svg 11.25x11.25 | `#707b76` |
| `icon-day.svg` | `302:12562` | svg 15x15 | stroke `#707b76` (bleed) |
| `icon-pill.svg` | `302:12564` | svg 13x13 | |
| `icon-morning.svg` | `302:12566` | svg 13x15 | |
| `icon-night.svg` | `302:12568` | svg 14x14 | |
| `icon-filter.svg` | `302:12570` | svg 14x13 | |
| `icon-clock.svg` | `302:12572` | svg 16x16 | |
| `icon-edit.svg` | `302:12575` | svg 12x12 | |
| `icon-change.svg` | `302:12577` | svg 13.906x16 | |
| `icon-close.svg` | `302:12581` | svg 11.5x11.5 | stroke 1.5 round |
| `icon-delete.svg` | `302:12583` | svg 24x24 | |
| `icon-dropdown-arrow-up.svg` | `302:12588` | svg 20x20 | flip for "down" |
| `icon-list-view.svg` | `302:12592` | svg 14x14 | 3 Buttons glyph |
| `icon-grid.svg` | `302:12595` | svg 20x20 | also phone tab "Overview" |
| `icon-calendar.svg` | `302:12598` | svg 16x16 | stroke `#707b76`; phone tab uses same geometry in `#a8b0ac` |
| `icon-upload.svg` | `303:13902` | svg 13.333 | |
| `navbar-logo-favicon.svg` | `317:13547` | svg 40x40 | sky->teal gradient logo (fixed); differs from earlier `logo-mark.svg` |
| `navbar-icon-notification.svg` | `317:13567` | svg 20x20 | `#707b76` |
| `navbar-avatar-sample.png` | `317:13570` | png 365x547 | placeholder photo (app uses `profile.image`) |
| `button-icon-add-mono.svg` / `-secondary.svg` / `-white.svg` | `317:13491` / `317:14587` / `317:13486` | svg 32x32 | Add glyph in `#707b76` / `#4b5752` / `#fff` |
| `button-glow-ellipse.svg` | `357:19538` | svg 144.4x144.4 | `#c8db9c` circle r27.5, blur 22.35; rendered 55x55 with inset -81.27 % |
| `header-icon-arrow-down-12.svg` | `303:13105` | svg 12x12 | `#4b5752` |
| `search-icon-magnifier.svg` | `303:13388` | svg 16.93 | `#707b76` |
| `search-icon-filter.svg` | `303:13391` | svg 16x15.77 | stroke `#707b76`, rendered 15x14.766 with inset -3.39 %/-3.33 % |
| `user-card-avatar-sample.png` | `368:15040` | png 96x96 | placeholder avatar |
| `user-card-dot-arrived-blue.svg` / `-cancelled-red.svg` / `-late-grey.svg` | `368:15051` / `368:15072` / `368:15098` | svg 8x8 | `#2e8cff` (legacy blue) / `#e35e5e` / `#4b5752` |
| `user-card-icon-change.svg` / `-change-muted.svg` | `368:15053` / Variant2 | svg 13.9x16 | `#4b5752` / `#8a94a3` |
| `user-card-icon-arrow-up-right.svg` / `-muted.svg` | `368:15056` / `368:15082` | svg 16x16 | `#4b5752` / `#8a94a3` |
| `user-card-icon-call.svg` / `-call-muted.svg` | `368:15103` / `368:15077` | svg 16x16 | `#4b5752` / `#8a94a3` |
| `user-card-icon-mail.svg` | `368:15079` | svg 16x16 | `#909090` (hidden in Figma) |
| `bottombar-close-button-icon.svg` | `I368:16141;1790:13221;1865:16071` | svg 32x32 | X stroke `#8a94a3` |
| `bottombar-divider.svg` | `368:16142` | svg 314x1 | `#f0f0f0` |
| `bottombar-radio-dot.svg` | `368:16145` | svg 18x18 | ring `#f4f4f4`, inner `#a8a8a8` |
| `bottombar-tick-badge.svg` | `368:16152` | svg 29x29 | `#0ca768` circle + white check |
| `profile-menu-icon-account.svg` / `-activity.svg` / `-payment.svg` / `-help.svg` / `-privacy.svg` / `-calendar.svg` | `368:17696` / `17700` / `17704` / `17708` / `17712` / `17716` | svg 20x20 | `#4b5752` |
| `profile-menu-icon-logout.svg` | `368:17720` | svg 20x20 | `#ce4747` |
| `phone-bottom-bar-icon-queue.svg` | `I572:20943;572:20934` (App page) | svg 16x16 | `#0ca768` |
| `phone-bottom-bar-icon-prescriptions.svg` | `572:20985` (App page) | svg 15x15 | stroke `#8a94a3` |

Reference PNGs: `docs/figma/reference/dashboard-components/` - `navbar-dashboard-396_12116.png`, `dashboard-header-303_13043.png`, `typography-dashboard-302_12624.png`, `buttons-dashboard-303_13196.png`, `icons-302_12556.png`, `search-component-303_13394.png`, `nav-link-dashboard-317_13571.png`, `three-buttons-317_15075.png`, `user-card-368_15036.png`, `bottombar-368_16140.png`, `profile-menu-368_17693.png`, `sort-menu-368_16699.png`, `input-field-302_12650.png`, `phone-bottom-bar-570_20777.png`, `components-section-overview-303_13210.png` (capped 4096 wide).

---

## 7. App mapping & gap analysis

Legend: STYLE-DIFF (same structure, different look) / STRUCTURE-DIFF (different DOM/layout) / MISSING / NEW-INTERACTION / MATCH.

### 7.1 `components/Layout.tsx` (496 lines) - navbar shell

| region | current (file:line) | Figma value | class |
|---|---|---|---|
| Container | `fixed top-0 … max-w-7xl mx-auto px-6 rounded-full h-14 (h-11 compact) glass-panel/bg-white shadow-ds-pill` (`:106-107`) with scroll-shrink (`:75-86`) | in-flow bar, no container fill, 1312x49 inside `Body p48/64 g24`; content = logo left / white `Navlinks` pill (r16) / white `Misc` pill (r16 96x49) right | STRUCTURE-DIFF (floating glass pill vs three separate elements); the scroll-shrink has no Figma basis |
| Logo | inline SVG, gradient from theme `--color-primary-300/500`, hands `#171717` (`:36-56`); wordmark "DocOclock" `font-display font-bold text-2xl` (`:113`) | `navbar-logo-favicon.svg` (fixed sky-teal gradient) + "Dococlock" Inter Regular 16 `#171717`; 40x40, gap 8 | STYLE-DIFF - design decision D-logo: keep the themeable logo (CLAUDE.md) vs exact asset; size 40 ✓, wordmark weight/size/casing differ |
| Marketing links (public) | `font-normal text-[16px] text-ink-800 hover:text-medical-600`, gap 44 (`:119-129`) | `Navbar/Default` marketing navbar belongs to the landing unit | out of scope here |
| Patient links | icon + bold text (Home / Meds / Appointments / Rx / Profile) (`:152-171`) | text-only `Navbar - Dashboard/Patient`: Queue / Appointments / Medicines / Prescriptions in a white `Navlinks` pill; active = `bg-primary-500 text-white font-semibold` | STRUCTURE-DIFF (labels, count, icons, container). Route map: Queue -> `/live-serial`, Appointments -> `/patient/appointments`, Medicines -> `/patient/medicine-tracker`, Prescriptions -> `/patient/prescriptions`; "Home" `/patient/home` and Profile `/patient/more` have no navbar slot in Figma (Profile = avatar menu) |
| Doctor links | 3 links Dashboard / Queue / RX with icons (`:173-189`) | 6 text tabs Overview / Queue / Appointments / Prescriptions / Analytics / Manage; routes = `DoctorTabBar.tsx:4-11` | STRUCTURE-DIFF + MISSING (3 tabs absent). The in-page `DoctorTabBar` currently duplicates this (see 7.2) |
| Bell | `NotificationBell` rendered inline (`:169,188`) | 44x49 `flex-1` button in `Misc. Icons` white pill; 20x20 bell `#707b76` | STYLE-DIFF (trigger), MATCH functionally |
| Profile dropdown | doctor only (`:191-287`): pill button with avatar + name + chevron; panel `w-64 rounded-3xl` with Authenticated As / My Profile / Earnings & Payments / Chamber Settings / View Website / Exit Portal | avatar-only 44x49 button (36x36 circle); panel 260x376, `rounded-xl p-3 gap-4`, six 14px rows (My Account / Activity History / Payment History / Help & FAQ / Privacy & Security / Google Calender) + red Logout row | STRUCTURE-DIFF: labels and content differ from Figma; **keep the app's actions** (see constraints) and restyle to Figma's panel; no patient dropdown exists in the app (patient avatar goes to `/patient/more`, `:298-307`) - Figma has the same menu for patients |
| Mobile controls | bell + round menu button (`:298-308`) | (phone top area not in this unit) | open issue |
| Doctor phone dock | dark `bg-slate-900/90` floating dock, 5 items Dash/Queue/Enroll/Rx/Analytics (`:439-460`) | white full-width bar 402x68 `rounded-t-3xl`, 4 tabs Overview/Queue/Appointments/Prescriptions, active = 2px top border `#0ca768` + Medium 10 label (3.14) | STRUCTURE-DIFF + STYLE-DIFF; "Enroll" (`/doctor/manual-booking`) and "Analytics" tabs have no Figma slot -> keep them reachable another way (More/Manage) |
| Patient phone dock | floating white dock 4 items Home/Apps/Meds/Rx, `max-w-[340px]` (`:463-494`) | same Card 4 bar, but the Patient App flow frames read were 1440 wide (`flows.md`); the patient phone tabs are not in this section | STYLE-DIFF (assumed same bar); tab set unverified |
| Main padding | `main` gets `pt-[calc(6.5rem+…)]` + global `padding 1.5rem/2.5rem !important` (`:417`, `index.css:86-101`) | page `Body` padding 48/64/48/64, gap 24 | STYLE-DIFF - the global `!important` main padding fights `px-16`; scope it before adopting the Figma shell |

Functional constraints for the navbar/bars (must survive the rewrite):
- Props: `onNavigate(path)`, `currentPath` (active tab), `userRole`, `onLogout`, `onLoginClick`, `onRegisterClick`, `hideMobileBottomNav` (App sets it on `/patient/profile`), `browseMode`/`onBrowsePublicSite`/`onReturnToDashboard` (banner `:426-437`), `profile` from `useAuth()` (`name`, `image`, `bmdcNumber`).
- Doctor menu actions that exist today and have no Figma equivalent: **View Website** (`onBrowsePublicSite`), **Exit Portal** (`onLogout`), profile (`/doctor/profile`), earnings (`/doctor/analytics`), chamber settings (`/doctor/practice-settings`). Figma rows map: My Account -> `/doctor/profile`; Payment History -> `/doctor/payment`; Logout -> `onLogout`; Activity History / Help & FAQ / Privacy & Security / Google Calender -> no route (flows.md G4) - render as non-navigating rows or omit until routes exist; do not remove "View Website".
- `index.css:75-84` hides `nav`, `header`, `.fixed.top-0`, `.fixed.bottom-6`, `.fixed.bottom-0` when `body[data-modal-open="true"]` - the new navbar must remain a `<nav>` and any new fixed bottom bar must keep matching one of these selectors (`fixed bottom-0`), or modals will render under the bars.
- Safe-area insets (`env(safe-area-inset-top/bottom)`) for Capacitor; avoid `window.alert`.
- `AdminLayout` (`components/layout/AdminLayout.tsx:200`) also uses `NotificationBell`; do not change its props.
- `tailwindcss-animate` is **not installed** (`package.json`), so `animate-in fade-in zoom-in-95 slide-in-from-*` (`Layout.tsx:207,318,323`, `NotificationBell.tsx:71`, `ToastProvider.tsx:62`) generate no CSS - those open/close animations currently do not run. Figma-exact motion needs real keyframes (`index.css` already has `fadeIn`); do not "fix" by adding a dependency without approval.
- No `prefers-reduced-motion` handling exists anywhere (`grep`), add it with every new animation.

### 7.2 `components/doctor/DoctorTabBar.tsx` (31 lines)

| aspect | current | Figma | class |
|---|---|---|---|
| tabs | 6 (Overview…Manage) with routes `/doctor/dashboard`, `/doctor/serial-manager`, `/doctor/appointments`, `/doctor/prescription`, `/doctor/analytics`, `/doctor/practice-settings` (`:4-11`) | identical labels/order (Default navbar) | MATCH |
| container | `flex gap-2 mb-8 overflow-x-auto hide-scrollbar` (`:15`), rendered *inside each page* (Dashboard.tsx:162, SerialManager.tsx:440, DoctorAppointments.tsx:50, DoctorPracticeSettings.tsx:264, PaymentSubscription.tsx:49, Analytics.tsx) | tabs live in the navbar's white `Navlinks` pill (`bg-white rounded-2xl p-1 gap-2`), one instance per page, not a second bar under it | STRUCTURE-DIFF: it is the natural home for the Figma Navlinks - **move it into the navbar for doctors** and delete the per-page copies only after the navbar shows the same links, or restyle in place and stop showing it on desktop |
| tab | `h-11 px-5 rounded-full text-[15px] font-medium` (`:22`) active `bg-medical-500 text-white font-semibold`, inactive `text-ink-500 hover:bg-ink-50` | `px-5 py-3 rounded-xl text-[14px]` (41 tall, r12) active `bg-primary-500 text-white font-semibold`; inactive `text-content-disabled #a8b0ac` regular, **no hover fill** | STYLE-DIFF: height 44->41, radius full->12, text 15->14 and colour `ink-500 #909090` -> `#a8b0ac`, remove hover fill |
| constraints | `onNavigate(tab.path)` from each view; `currentPath` prop decides active; `/doctor/payment` has no tab (highlights none) | same | keep signature; consumers pass `currentPath` themselves |

### 7.3 `components/ui/Button.tsx` (53 lines)

Current: `rounded-full font-display font-medium transition-all duration-200 …`, variants `primary` (`bg-medical-500 hover:bg-medical-600 shadow-md shadow-medical-200 btn-sheen`), `secondary` (`bg-sky-100 text-medical-700`), `accent` (teal), `outline`, `danger`, `gradient` (`from-medical-500 to-medical-600`), sizes sm/md/lg (`:17-38`).
Figma `Buttons - Dashboard`: 121x48 pill, Inter Regular 16 -2 %, 32px icon slot, no shadow, four variants. **Do not retro-fit `Button`** (it is used across public + patient screens). Add a separate `DashboardButton` (or `variant="dash-*"`) - STYLE-DIFF/MISSING: `monochrome` (`#fbfbfb`/`#707b76`) and `gradient` with glow + vertical `#0ca768 -> #08925a` are missing; current `secondary` (sky) has no counterpart, Figma secondary is transparent `#4b5752`; drop `shadow-md shadow-*` (none in Figma); font must be `font-sans` (Inter), weight 400, tracking -0.32px. `disabled:opacity-50` and focus ring stay (functional).

### 7.4 `components/ui/NotificationBell.tsx` (141 lines)

Trigger (`:57-68`): `w-10 h-10 rounded-xl hover:bg-slate-100` with lucide `Bell` 20 `text-slate-500`, red count badge (`absolute top-1 right-1`, `animate-pulse`). Figma: 44x49 `flex-1` cell in a white pill, `notification-3-line` 20x20 `#707b76`, padding 12, r8; **no badge in Figma** -> keep the badge (functional, `unreadCount`) positioned at the icon's top-right. Panel (`:70-138`, `w-80 rounded-ds-lg`, list, mark-all-read) - **no Figma design** (not in this section): keep unchanged. STYLE-DIFF (trigger only). Constraints: `useNotifications(recipientId)`, `markAsRead`, `markAllAsRead`, outside-click close, `onNavigate(n.link)`.

### 7.5 `components/ToastProvider.tsx` (97 lines)

Current: stacked toasts fixed top-right (`top-[calc(5rem+…)] right-4`, `:90`), coloured by type (`STYLES`/`ICON_STYLES`, `:34-46`), lucide icon + message + dismiss X, `rounded-ds-md border shadow-ds-soft backdrop-blur`, auto-dismiss 4000 ms, exit `opacity-0 translate-x-8` 300 ms, max 5.
Figma: single white pill, `h-12 rounded-3xl`, padding 8/12, 28x28 green tick badge + `Subtitle 16` `#707b76`, shadow `0 -4px 12px .08`, positioned 90px from the top and horizontally centred (overlay CENTER / TOP_CENTER); enter DISSOLVE 0.3 s or MOVE_IN BOTTOM 0.5 s. Class: STYLE-DIFF + STRUCTURE-DIFF (position top-right -> top-centre) + NEW-INTERACTION (bottom/dissolve enter). Only **success** exists in Figma: error/warning/info must keep their semantic tinting (fixed status colours) but adopt the pill geometry. Constraints: `useToast().showToast(message, type='success', duration=4000)` API (8 call sites), max 5, dismiss X, timers; `z-[9999]`.

### 7.6 `index.css` / `tailwind.config.js`

| item | current | needed |
|---|---|---|
| colours | `ink-*`, `primary/secondary/medical/brand/navy/surface` only (`tailwind.config.js:21-105`) | NEW `content-{primary,secondary,tertiary,disabled}`, `ghost`, `steel` (tokens.md); optional NEW `danger-50/600`, `sage-100` (Late card), `surface-muted #f8f8f8` |
| shadows | `ds-input/card/pill/soft` (`:112-115`) | NEW `ds-row`, `ds-rise-lg`, `ds-menu (7 5 13.7 .04)`, `ds-toast`, `ds-queue`, `ds-lead-hover (0 0 4px .25)` |
| radius | `ds-sm 8 / ds-md 13 / ds-lg 24 / ds-xl 32 / ds-pill 500` (`:118-126`) | covered (`rounded-xl` 12, `rounded-2xl` 16, r21 -> `rounded-full` on a 42px box) |
| easing | `.animate-fade-in` `0.3s ease-out` (`index.css:175-177`) | already Figma-exact for DISSOLVE; add `--ds-ease-out` var + `.animate-fade-in-slow` (0.5 s) + `prefers-reduced-motion` block |
| `.btn-sheen` | `:126-145` | unchanged; not required by this unit (5.13) |
| fonts | Inter body, Instrument Sans `font-display` (`tailwind.config.js:14-19`) | dashboard text is Instrument Sans (`font-display`), chrome bits (logo text, dashboard button labels) Inter (`font-sans`) - opposite of the app default; put `font-display` on the dashboard shell |

### 7.7 Other mapped files (no direct component in this section)

| file | Figma counterpart | class / note |
|---|---|---|
| `components/ui/StatCard.tsx` | none in Components section (stat cards are in Queue Manage Row / Overview - other units). **No importer in the repo** (`components/admin/AnalyticsOverview.tsx:24` defines its own local `StatCard`) | dead code; nothing to map here |
| `components/ui/AppointmentCard.tsx` | none: Figma patient Appointments is a *table* (Doctor/Date/Serial/Status/Action, patient unit); nearest visual language = `User Card` (r32, shadow-ds-row, 48px avatar, status chip). Used by `views/patient/Appointments.tsx:270` | STRUCTURE-DIFF vs `User Card`, decision belongs to the patient-appointments unit; constraints: `onTrack/onAction/onReview`, ICS/Google-Calendar buttons |
| `components/ui/DoctorDashboardProfile.tsx` | Manage page profile card (other unit); used by `views/doctor/Dashboard.tsx:167` | not covered here |
| `components/ui/ArcGauge.tsx` | Queue Status arc (Queue Manage Row, other unit); the `Top` header component `255:8156` in this section supplies its card title row ("Queue Status" 24 + "Today" chip + icon buttons) | not covered here; used by `Dashboard.tsx:261` |
| `components/ui/GlassCard.tsx` | dashboard cards are **solid white**, r24/r32, shadow `ds-row`/`ds-queue`, no blur (`User Card`, phone `Queue Card`) whereas `GlassCard` = `glass-panel rounded-3xl p-8` with backdrop blur (`:14-24`) | STYLE-DIFF; 20 importers - add a `variant="solid"` rather than repaint globally |

### 7.8 Summary by Figma frame

| Figma frame | App location today | status |
|---|---|---|
| Navbar - Dashboard (Default/Patient/Variant3) | `Layout.tsx:106-311` + `DoctorTabBar.tsx` | STRUCTURE-DIFF |
| Nav Link - Dashboard | `DoctorTabBar.tsx:19-25` (doctor only) | STYLE-DIFF |
| Profile menu | `Layout.tsx:191-287` (doctor only) | STRUCTURE-DIFF |
| Dashboard Header (Queue / Variant3) | per-view ad-hoc headers (`SerialManager.tsx`, `Dashboard.tsx`, `DoctorPracticeSettings.tsx`) | MISSING as a shared component |
| Lead / Trail Icon Button hover | Register CTA pattern only (`Layout.tsx:138-148`) | NEW-INTERACTION |
| Buttons - Dashboard | `Button.tsx` (different spec) | MISSING (4 variants) |
| Typography - Dashboard | ad-hoc `text-*` classes | MISSING scale utilities (`text-ds-*` from tokens.md) |
| Icons (17) | lucide icons | STYLE-DIFF: use exported assets (5.12) - lucide glyphs differ from Figma's (mynaui/hugeicons/mingcute/bitcoin-icons sets) |
| Search Component | per-view search inputs | MISSING shared component |
| Sort menu | none (no sort popover) | MISSING (new UI; sort state must be added by the consuming view) |
| 3 Buttons | none | MISSING |
| User Card | `SerialManager` row markup, `AppointmentCard` | STRUCTURE-DIFF (other unit owns the row) |
| Bottombar "Update Status" | inline status controls in `SerialManager` | MISSING as modal |
| Input Field - Dococlock | per-form inputs | STYLE-DIFF (h-10, r8, `#fbfbfb`) |
| Phone bottom bar | `Layout.tsx:439-494` | STRUCTURE-DIFF |
| Toaster | `ToastProvider.tsx` | STYLE/STRUCTURE-DIFF |

---

## 8. Open issues / uncertainties

1. **Active nav link in the master**: `Navbar - Dashboard` masters show every tab as `Inactive`; the active tab is an instance override per page (table in 3.1, read from all 21 Web instances). Design inconsistencies to *not* copy: the Overview instance has no Manage link; the paused Queue and Appointments-alt instances label the first link "Queue" instead of "Overview"; the Prescription wizard pages have no active tab (arguably Prescriptions should stay active); some patient frames (`297:12283`, `191:5104`) omit Queue. Recommendation: one shared link list per role, active = route match (wizard routes keep "Prescriptions" active).
2. **Hover on the Bottombar close button**: it is a `Trail Icon Button` Default instance; inheriting the set's hover would reveal the placeholder label "Add Time" and move the icon - almost certainly a design artefact. Recommendation: no expansion for the Bottombar close; expansion only where a real label exists.
3. **Patient profile-menu offset `(0,0)`** vs doctor `(-181,+55)`; patient transition DISSOLVE vs doctor instant. Looks like an unadjusted patient copy - recommendation in 3.11 uses the doctor placement + 0.3 s fade for both.
4. **Lead Icon Button collapsed label style** (Inter 12 `#4b5752` instance override) differs from the revealed label (Instrument Sans 16 `#8a94a3` master). Both read from Figma; the recommendation is to use the revealed style only when expanded.
5. **Gradient button**: the visible gradient is the top layer `#0ca768 -> #08925a`; the stack's lower layer (Accent-400 -> 600, or Accent-300 -> 400 in the header instance) is fully covered. `#08925a` and the glow colour `#c8db9c` have no theme token. Decision D-glow: keep glow as fixed decorative (CLAUDE.md allows commented brand-independent accents) vs derive from `primary-200` (themeable but not pixel-exact on the default theme).
6. **Logo**: Figma logo = fixed gradient asset (`#0ea5e9 -> #14b8a6`, `#38bdf8` plus, `#171c1a`/`#171717` hands); the app deliberately themes the mark (`Layout.tsx:33-56`). Product decision D-logo. Wordmark casing "Dococlock" (Figma) vs "DocOclock" (app/brand) also needs a call.
7. **User Card "Arrived" dot `#2e8cff`** is the legacy blue (tokens D8) whereas the Bottombar's Arrived option is green `#0ca768`; the Late card fill `#dde5e1` and Cancelled fill `#f8f8f8` are literals with no token. Recommendation: Arrived dot = `primary-500`.
8. **Bottombar semantics**: three statuses only (Late / Arrived / Cancelled) - the app has more states (waiting, consulting, completed, absent…); mapping to `SerialManager` statuses is the queue unit's decision. Selected state is drawn for "Arrived" only as an example.
9. **Phone chrome**: only the bottom bar (`Card 4`) and the two `Bottom Bar Tab` variants were read. The phone *top* area (the `Navbar` frame `569:19817` is a black status-bar image mock) and the patient phone tab set (the Patient App flow frames are 1440 wide) are not in this unit's data; the phone doctor bar has just 4 tabs (Analytics and Manage absent) - how those stay reachable is undecided.
10. **No responsive rules**: Figma defines 1440 (navbar 1312) and 402 (phone) only; nothing for 768-1279. Suggest: show the Navlinks pill at `lg` (>=1024), hide it below and use the phone bar; not derivable from Figma.
11. **Icons library mismatch**: Figma icons come from mynaui / hugeicons / mingcute / bitcoin-icons / iconoir / Remix sets - lucide-react glyphs are not identical; use the exported assets. Dropdown icon is exported as arrow-*up* and flipped in Figma.
12. **Sort menu selected row** ("Date Descending") is a static example, not a distinct variant; row hover is undefined.
13. **`Input Field - Dococlock`** has no error/focus/disabled/filled states (only a "Value" slot that is hidden); form states must be designed or borrowed from the Input Field set `80:4937` (other unit).
14. **Toasts**: only success exists; overlay AFTER_TIMEOUT 0.5 s is a prototype shortcut, not the real duration. Slide direction differs between toasts (DISSOLVE vs MOVE_IN BOTTOM).
15. **Reduced motion / a11y** are not represented in Figma; all recipes add `prefers-reduced-motion`, keyboard focus parity (`focus-visible`) and `Esc`/outside-click close by convention.
16. **Rate limits / quota**: no rate-limit or quota error occurred during this unit's ~45 Figma calls.
17. Reference PNGs: exports are 2x of the *node box plus its shadow bleed*; the section overview PNG is capped at 4096 px wide (1x).
