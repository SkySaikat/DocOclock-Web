# landing-pages - Other pre-login pages (Doctors list, public doctor detail, booking-wizard modals)

Figma file `zJRyAML8hv0uEBOXtu5Hpn`, page `Web Version V1` (5:2), section `Pre Login Pages` (80:1481). Every number in this file was read from Figma (`get_design_context`, `get_metadata`, read-only `use_figma` scripts). Where a value could not be read it is listed in section 8. Companion docs: `docs/figma/tokens.md` (token catalogue), `docs/figma/flows.md` (prototype flow map), reference PNGs in `docs/figma/reference/landing-pages/`, assets in `public/assets/figma/landing-pages/`, raw reactions in `docs/figma/interactions/landing-pages.json`.

## 0. IDENTIFICATION - which product page is each frame (read this first)

| Figma frame | It is | App route / file today |
|---|---|---|
| `80:1482` **List Page** | The **public Doctors list** ("Find The Right Doctor": filters, search, 3x3 card grid, pagination, "Our Services", footer) | `/patient/doctors` -> `views/patient/DoctorSearchView.tsx` (`DoctorSearch` lazy import, `App.tsx:17`, route `App.tsx:328`). The navbar link "Doctor" points here (`Layout.tsx:25`) and it is the target of the landing "View All" click (flows.md 2.1). |
| `326:13058` **List Page (filters open)** | Same page with the **Type** and **Experience** dropdown menus drawn open (two popover frames `326:13379`, `326:13367` sitting on top of the page) | Same route; the two menus are the `isTypeOpen` / `isExpOpen` panels in `DoctorSearchView.tsx:77-96` |
| `80:2652` **Main (About)** | The **public Doctor detail page**, tab **About** ("Personal Information") - profile card + "Get an Appoinment" side card | `/doctor/:id` -> `views/patient/DoctorProfile.tsx` (`App.tsx:295-320`) |
| `80:2778` **Main (Experience)** | Same page, tab **Experience** ("Experiences" list with hospital/designation cards) | same, `activeTab === 'Experience'` (`DoctorProfile.tsx:436`) |
| `80:2896` **Main (Education)** | Same page, tab **Education** frame (a copy of the Experience frame with the education icon and Sessions "12+"; heading still reads "Experiences" - unfinished) | same, `activeTab === 'Education'` (`DoctorProfile.tsx:454`) |
| `303:14598` / `303:14768` / `303:14940` / `303:15866` **Main** | **Legacy-styled** doctor detail page (blue accents, "Home/Features/Pricing/Resources/Docs" placeholder navbar, video poster, stat tiles, hospital cards) **with the 4-step "Get an Appointment" booking wizard modal open**: step 1 Hospital, step 2 Appointment, step 3 Patient Details, step 4 success "Appointment Created Successfully #23". The page underneath is legacy; **the modal stack is the current design** (green accent, current tokens) | wizard = the `isBookingModalOpen` modal in `DoctorProfile.tsx:578-815` (`bookingStep` 1-4, `confirmedApp` success view at `DoctorProfile.tsx:583-599`) |
| `303:15350` **Modal 617x451** | **Add Hospital** modal, step-1 form (Image / Name / Address / 3 fees, Cancel + Next). This is a **doctor-console** piece (Manage -> Add Hospital, flows.md 3.3 `368:16746`) parked in the Pre Login page; not a pre-login screen | `views/doctor/DoctorPracticeSettings.tsx` add-hospital modal (out of this unit's app files) |
| `303:15363` **Modal 619x216** | **Add Hospital** modal header: title + 2-segment step bars + "Appointment / Schedule" step labels + progress line (the header card only, no body) | same |

Not covered by any frame in this unit (no Figma design exists for them; only their **navbar link label** is in the Navbar): Hospitals (`/hospitals`), Lab & Diagnostic (`/lab-diagnostics`), Blogs (`/blogs`), About us (`/about-us`), Contact us (`/contact-us`), For-Doctors landing (`/for-doctors`), login/register modals. `views/marketing/*.tsx` and `views/doctor/DoctorLanding.tsx` therefore have **no Figma target** in this unit (see 7.9).

Prototype membership: only `80:1482` is reached by a flow (`PreLogin 1`, `Landing Page 80:1754` -> `View All` -> `80:1482`, SMART_ANIMATE GENTLE 1.022 s, flows.md 2.1). `326:13058`, all `Main` frames and both `Modal`s are **unlinked** (no navigation reaches them, none of them navigates anywhere); the only reactions inside them are hover variant swaps (section 5).

## 1. Frames

Reference PNG notes: `get_screenshot(maxDimension 2880)` never up-scales, so frames <= 1440 px wide were returned at 1x and the two 1460x3962 list frames at 0.727x (1062x2880). Sizes below are Figma px. If a true 2x is needed use `download_assets(defaultFormat png, defaultScale 2)` on the node (not done - see 8).

| Node id | Name | Size (w x h) | Role in the product | Prototype flow membership | Reference PNG |
|---|---|---|---|---|---|
| `80:1482` | List Page | 1460 x 3961.73 | Public Doctors list | Destination of `PreLogin 1` (`80:1754` View All); 11 reactions (9 card hovers + 2 footer "Register" hovers) | `docs/figma/reference/landing-pages/list-page-80_1482.png` (1062x2880) |
| `326:13058` | List Page (filters open) | 1460 x 3961.73 | Doctors list with Type + Experience menus open; children identical to `80:1482` plus popovers `326:13379` (230x221 @113,364) and `326:13367` (216x196 @417,364) | none (11 identical hover reactions, no navigation) | `.../list-page-filter-popovers-326_13058.png` (1062x2880) |
| `80:2652` | Main | 1440 x 1979.73 | Doctor detail - About tab | none (3 hover reactions) | `.../main-80_2652.png` (1440x1980) |
| `80:2778` | Main | 1440 x 2044.73 | Doctor detail - Experience tab | none (3 hover reactions) | `.../main-80_2778.png` (1440x2045) |
| `80:2896` | Main | 1440 x 2044.73 | Doctor detail - Education tab (draft) | none (3 hover reactions) | `.../main-80_2896.png` (1440x2045) |
| `303:14598` | Main | 1440 x 1550 | Doctor detail (legacy page) + wizard step 1 "Hospital" | none, no reactions | `.../main-303_14598.png` (1440x1552) |
| `303:14768` | Main | 1440 x 1550 | same + wizard step 2 "Appointment" | none | `.../main-303_14768.png` |
| `303:14940` | Main | 1440 x 1550 | same + wizard step 3 "Patient Details" | none | `.../main-303_14940.png` |
| `303:15866` | Main | 1440 x 1550 | same + step 4 success "Appointment Created Successfully" | none | `.../main-303_15866.png` |
| `303:15350` | Modal | 617 x 451 | Add Hospital form (doctor console) | none | `.../modal-303_15350.png` (654x488, includes shadow bleed) |
| `303:15363` | Modal | 619 x 216 | Add Hospital header/progress | none | `.../modal-303_15363.png` (656x253, includes shadow bleed) |

Frame-level facts (read): `80:1482` / `326:13058`: fill `#fafafa`, vertical auto-layout, `itemSpacing 48`, padding 0, primary+counter axis CENTER. `80:2652` / `80:2778` / `80:2896`: fill `#fafafa`, vertical auto-layout, gap 48, `clipsContent true`. Section children (list): `Navbar` 1460x92 @y0, `Header` 1460x107 @y140, `Filtration` 1460x56 @y295, `Result Show` 1460x48 @y399, `How it works` 1440x1554 @(10,495), `Pagination` 1460x96 @y2097, `Frame 1000010275` ("Our Services") 1460x775 @y2241, `Footer` 1460x898 @y3064.

## 2. Design tokens used

Base token catalogue and app mapping: `docs/figma/tokens.md` (colours 1.1, type 2.2, radii 3, shadows 4.1). Only the tokens actually used by this unit are listed. "App" = existing token in `tailwind.config.js` / `index.css`; **NEW TOKEN NEEDED** = proposed in tokens.md section 9.

### 2.1 Colours

| Use | Hex | Figma variable | App mapping |
|---|---|---|---|
| Page background (list + main frames) | `#fafafa` | literal (26 uses) | **NEW TOKEN NEEDED** `page` (tokens.md 9; = Tailwind `neutral-50`) |
| Primary text, titles, "Find The Right Doctor" | `#171c1a` | `Text/Primary` | **NEW** `content-primary` |
| Secondary text (breadcrumb, table rows, Sort rows, pagination) | `#4b5752` | `Text/secondary` | **NEW** `content-secondary` |
| Tertiary text (eyebrow, qualification line, hero paragraph) | `#707b76` | `Text/tertiary` | **NEW** `content-tertiary` |
| Accent (Register pill, search button, active page, active tab, progress fill, step labels) | `#0ca768` | `Accent/Accent-500`, `Accent Color` | `primary-500` (themed) |
| Gradient button | `#3cbb8d` -> `#098d58` (top->bottom, `bg-gradient-to-b`) | `Accent-400` -> `Accent-600` | `from-primary-400 to-primary-600` (app uses 300->500, STYLE-DIFF) |
| Selected menu row bg / text | `#e6f7f0` / `#03402a` | `Accent-50` / `Accent-900` | `bg-primary-50` / `text-secondary-500` (exact `#03402a` = default secondary) |
| Input field fill + stroke | `#fbfbfb` | `Input Field` | `ink-50` |
| Neutral border (Type/Experience chips, popover border) | `#f2f2f2` | `Neutral Light` (library) | `ink-200` |
| Filter & Sort chip border + text; chip text | `#4a4a4a` | literal | no exact token (nearest `ink-700` #444 D6) -> `text-[#4a4a4a]` / NEW `ink-650` |
| Sort By border / text / arrow-button border | `#e3e3e3` / `#303030` / `#f0f0f0` | literal | arbitrary values (no token) |
| Sort menu popover divider | `#fbfbfb` | fill of Line 17/18 asset | `ink-50` |
| Doctor-card stat tile | `#fbfbfb` | literal | `ink-50` |
| Hover-card chip (blue) | bg `#eff6ff`, text `#2563eb` | literal | **legacy blue** - Tailwind `blue-50`/`blue-600`; must not stay literal blue (tokens.md D8); recommended `bg-primary-50 text-primary-700` after design sign-off |
| Vertical divider next to Filter & Sort | stroke `#C7DFFF` | asset `divider-line-34.svg` | legacy blue tint; render as `bg-[#C7DFFF]` 1x34 or recolor to `ink-200` (open issue) |
| Star (list cards, About) | list: `#f59e0b` (icon-star.svg); About-tab profile card: `#929291` (gray) | -- | `amber-500` / gray `#929291` (arbitrary) |
| Doctor-detail Register/Booking side card fill | `#fefefe` | literal | `bg-[#fefefe]` (Δ1 from white) or `white` |
| Progress track / inactive step bars (wizard, Add Hospital) | `#eeeeee` | literal | `ink-200` (Δ4) or NEW `ink-150` |
| Step label inactive / subtitle | `#7b87a4` | `Secondary` | **NEW** `steel` |
| Back button text | `#8a94a3` | literal | `steel-400` alias / `content-tertiary` (D2) |
| Wizard success panel fill | `#fbfbfb` | `Input Field` | `ink-50` |
| Serial box fill | `#f5f7f6` | `Fill Color` | `bg-background` (themed) |
| Success glow ellipse | `#e6f7f0` | `Accent-50` | `primary-50` |
| Success check disc | `#3cbb8d` | `Accent-400` | `primary-400` |
| Success ring strokes | `#a3e2ca` (0.5 px) | `Accent-200` | `primary-200` |
| Modal scrim | `#000` @ 0.5 | literal | `bg-black/50` |
| **Legacy (do not port)** | `#2e8cff`, `#3d87f5`, `#3766fa` (blue buttons/tabs/verified/eyebrow), `#061535` (navy text/icons), `#2563eb`, `#888`/`#373737` (Outfit breadcrumb), `#909090`, `#8f8f8f`, `#d9d9d9` (old chip borders) | -- | appear only in `80:2778`, `80:2896`, the four `303:*` page underlays, footer eyebrow of `80:2734`, and the Add Hospital modals' Next button; map to `primary-500` / `content-*` / `ink-*` per tokens.md D8 |

### 2.2 Typography (Instrument Sans unless noted; tokens.md 2.2)

| Role | Font / size / weight / line-height / tracking | Where |
|---|---|---|
| Page H1 | Instrument Sans Regular 48 / 58 / +0.96 px, `#171c1a` | "Find The Right Doctor", "Our Services" |
| Card / section title | Instrument Sans Medium 24 / normal | doctor name in cards, "Personal Information", "Experiences", "Get an Appoinment", "Consultation Fee" value, modal-card titles |
| Card body | Instrument Sans Regular 16 / 22 (`Subtitle - 16`), tertiary `#707b76` (list cards) or secondary `#4b5752` (detail rows) | qualification, table rows, breadcrumb |
| Service caption | Instrument Sans Regular 18 / 1.5 `#4b5752` | "Consultaion with a trusted doctor" |
| Tabs (detail page) | **Inter** Bold 14 (active) / Regular 14 (inactive), normal line-height | About / Experience / Education / Reviews |
| Filter chips, search text | Instrument Sans Regular 14 `#4a4a4a` (chips); **Inter** Regular 14 `#4a4a4a` (search placeholder) | filtration row |
| Results line | Instrument Sans Regular 16 `#000` / sort `#303030` | Result Show row |
| Nav chrome | **Inter** Regular 16 `#171717`, logo wordmark Inter Regular 16 | Navbar/Default |
| Pagination | **Inter** Regular 14 / 22 `#4b5752` (active: white) | Pagination |
| Hover-card tiles | **Inter** Medium 36 (number) / Inter Medium 14 (label) `#171c1a` / `#707b76` | Default (hovered) Doctor Card |
| Wizard title | Instrument Sans Regular 24 `#171c1a`; subtitle Regular 13 / 1.5 `#7b87a4` | Modal header |
| Wizard step labels | Instrument Sans Medium 12 (active, `#0ca768`) / Regular 12 (inactive `#7b87a4`) | progress steps |
| Wizard field label / hint | Instrument Sans Regular 14 `#4b5752` / Regular 12 `#707b76` | Input Field - Dococlock |
| Success title | **Inter** Medium 24 `#171c1a`; body Inter Regular 16 / 22 center `#4b5752`; "#23" Inter Medium 70 | step 4 |
| Footer | Instrument Sans as in landing footer (48/58/+0.96 white H2; 16 `#707b76` +0.32 px body); logo wordmark Inter Regular 28 white | Footer |

### 2.3 Radii / shadows / spacing

Radii: 24 (cards, tiles, chips, image), 500/100 (pills, buttons), 48 (search pill), 16 (pagination active square, success modal, Info Box), 8 (inputs), 36 (wizard body bottom corners), 64 (tab row). Shadows (all `#000`): Doctor-card hover `0,-8,20,0.05` (NEW `shadow-ds-doctor-hover`, drop-shadow); popover menus and success modal `0,-4,12,0.04` (= tokens.md `shadow-ds-rise-lg`, exact); wizard header card `0,0,26.4,0.1` (arbitrary `shadow-[0_0_26.4px_rgba(0,0,0,0.1)]`; `get_design_context` prints `drop-shadow 13.2` = half); Add Hospital modals `0,0,18.1,0.1` (= `shadow-ds-modal`; design context prints 9.05); phone-number field `0,0,0.5(=r1),0.15/0.25` (`shadow-ds-input` = `0 0 1px .25`). Spacing scale: 4/8/12/16/24/32/48; content column 1200 inside 1440 (`px-[120px]`), navbar pill 1224 at x=118.

Motion tokens (this unit): every reaction is `ON_HOVER -> CHANGE_TO`, `SMART_ANIMATE`, `EASE_OUT` = `cubic-bezier(0,0,.58,1)`, **0.3 s (300 ms)**. No other transition exists (no click/overlay/navigate reactions on these frames). `get_motion_context` returned `{"nodes":[]}` (no keyframe animation) for all 11 frames.

## 3. Per-frame layout spec

Notation: `H`/`V` = auto-layout horizontal/vertical, `p` = padding (t/r/b/l), `g` = gap, `x,y w x h` = position inside parent. Class strings are Tailwind arbitrary-value shorthand taken from `get_design_context` (font names are Figma names; in the app Instrument Sans = `font-display`, Inter = `font-sans`). Asset paths are in `public/assets/figma/` (served as `/assets/figma/...`).

### 3.1 `80:1482` List Page (public Doctors list) and `326:13058` (menus open)

Root: `bg-[#fafafa] flex flex-col gap-[48px] items-center justify-center w-[1460px]` (height hugs = 3961.73). Children top->bottom at y = 0 / 140 / 295 / 399 / 495 / 2097 / 2241 / 3064 (each `w-full`, spacing 48 between children, first child is the navbar).

**A. Navbar `80:1483`** 1460 x 92, `px-[120px] py-[24px]` (H, space-between). Contains one absolutely positioned pill `Navbar/Default` `80:7492`: `absolute left-[118px] top-[26px] w-[1224px] h-[68.73px] bg-white rounded-[500px] px-[24px] py-[12px] flex items-center`, **no shadow / no stroke** (effects: none). Inside (H, space-between, `flex-1`):
- left `loge`: H gap 8: `Favicon` 40x40 (`logo-favicon-40.svg`) + "Dococlock" Inter Regular 16 `#171717`.
- centre: H gap 44, Inter Regular 16 `#171717`: Doctor | Hospital | `Lab & Diagnostic` | Blogs | About us | Contact us. (The `Main` copies read "Lab&Diagnostic" - text override; app uses `Lab&Diagnostic`, `Layout.tsx:27`.)
- right: H gap 20: "Login " Inter Regular 16 `#171717` + `Buttons` **Gradient** instance 113.78 x 44.73 (label always visible: "Register" IS Regular 16 white + chevron arrow 43.78x44.73 with `mr-[-24px]` overlap; `bg-gradient-to-b from-[#3cbb8d] to-[#098d58] rounded-[100px]`). **No hover reaction on this button in any frame of this unit** (see 7.1).

**B. Header `80:1497`** 1460 x 107, `px-[120px]`, H `gap-[127px]`; one column `w-[679px]` V gap 16:
- Eyebrow (component `Eyebbrow` Variant2, no fill) `px-[12px] py-[8px] gap-[10px] rounded-[100px]`: bar `w-[21px] h-[8px] bg-gradient-to-r from-[#0ca768] to-[#0ca768]` + "Specialists" IS Regular 14 `#707b76`.
- H1 "Find The Right Doctor": `font-['Instrument_Sans'] font-normal text-[48px] leading-[58px] tracking-[0.96px] text-[#171c1a]`.
(The app currently also shows a right-hand paragraph - not present in Figma, see 7.2.)

**C. Filtration `80:1500`** 1460 x 56, `px-[120px]`, H, `items-center justify-between`:
- Left group `right` (`80:1501`, x120, 394 x 56, H gap 16, items-center):
  1. `Filter & Sort` chip (`80:1502`, 129 x 48): `border-[0.5px] border-[#4a4a4a] rounded-[24px] p-[12px] gap-[4px] flex items-center justify-center`; icon `icon-filter-24.svg` 24x24 (stroke `#4A4A4A`) + text IS Regular 14 `#4a4a4a`.
  2. Vertical divider `80:1505` 34 tall: `divider-line-34.svg` (1 px, stroke `#C7DFFF`, rotated 90) - width 0 frame.
  3. `DropDowns` `80:1506` (x161, 233 x 48, H gap 8): chip **Type** 92 x 48 and chip **Experience** 133 x 48 (x100): `border border-[#f2f2f2] rounded-[24px] px-[16px] py-[12px] gap-[4px] flex items-center` + label IS Regular 14 `#4a4a4a` + chevron-down 24x24 (`icon-chevron-down-24.svg`, fill `#4A4A4A`).
- Right group `left` (`80:1513`, x687, `w-[653px]` 56 tall): `Search` `80:1514`: `bg-white rounded-[48px] p-[4px] flex items-center justify-between flex-1 drop-shadow-[0_0_0.5px_rgba(0,0,0,0.15)]` (Figma effect `0,0,r1,a0.15`); left text (`px-[16px]`) "What are you looking for?" **Inter** Regular 14 `#4a4a4a`; right button 48x48 `bg-[#0ca768] rounded-[24px] p-[12px]` with `icon-search-24.svg` 24x24 (white).

**D. Result Show `80:1519`** 1460 x 48, `px-[120px]` H space-between: "Showing 1-10 of 60 results" IS Regular 16 black; sort select `Brands` (`80:1521`) `w-[258px] border border-[#e3e3e3] rounded-[100px] p-[12px] flex items-center justify-between`: "Sort By Recommendation" IS Regular 16 `#303030` + 24x24 chevron `icon-chevron-down-sort-24.svg` (`Component 8` `11:377`; the export has `fill="black"`, tint it with `#303030`/`content-secondary` in code).

**E. Doctor grid `How it works` `80:1522`** x10, 1440 x 1554, `px-[120px]`, V `gap-[24px]` items-center. 3 rows (`80:1523`, `80:1527`, `80:1531`), each H `gap-[24px] w-full` (content 1200), 3 cards per row, each `Doctor Card - Final` (component set `80:4685`) **resting variant `Variant2`** (`80:4718`): `w-[384px] p-[4px] rounded-[24px] flex flex-col items-center justify-center self-stretch`, natural height 502 (3 x 502 + 2 x 24 = 1554):
- `Image Container` 376 x 405 (at 4,4): image `rounded-[24px]` object-cover; **Chip** `bg-white px-[8px] py-[4px] rounded-[100px]` at (275,15) in the 376-wide image (top-right): "Cardiology" IS Regular 12 `#171c1a`.
- `Info` (`80:4723`, `px-[8px] py-[16px]`, at y409, 376 x 89): H space-between `w-[368px]`: left V gap 8: name IS Medium 24 `#171c1a` ("Dr. Sarah Rahman"), qualification IS Regular 16/22 `#707b76` ("MBBS, FCPS(CARDIOLOGY)"); right H gap 4: star 16x16 (`icon-star.svg`, `#f59e0b`) + "4.5" IS Regular 16 `#171c1a`.
- Photos by slot: row 1 = `doctor-card-1.png` (`imgRectangle17`, object-cover), `doctor-card-2.png` (`imgRectangle16`, crop `h-[118.4%] left-[0.11%] top-[-0.02%]`), `doctor-card-3.png` (`imgRectangle18`, object-cover); rows 2 and 3 = `doctor-card-2.png`, `doctor-list-photo-suit-blue.png` (`imgRectangle19`, object-cover), `doctor-list-photo-suit-dark.png` (`imgRectangle20`, crop `h-full left-[-71.66%] w-[193.46%]`).
- **Hovered variant `Default`** (`80:4686`): see section 5.1 for the full property diff. Static description: `w-[384px] h-[481.73px] p-0 rounded-[24px] overflow-clip drop-shadow(0 -8px 20px rgba(0,0,0,.05))`; image container 384 x 405 (edge to edge, radius 24 on the image), gradient overlay `bg-gradient-to-b from-[rgba(250,250,250,0)] to-[#fafafa] to-[87.5%] mix-blend-screen` 384 x 405 over the image, `Info` overlay at (0,190) `w-[384px] p-[16px] gap-[16px]` V: header row (name IS Medium 24 / qualification 16/22 `#707b76` / star + 4.5) and a tile row `h-[113px] gap-[8px]` with two `flex-1 bg-[#fbfbfb] rounded-[24px]` tiles (V gap 16, centered): "10+" Inter Medium 36 `#171c1a` over [clock 16 (`icon-clock-16.svg`) + "Experience" Inter Medium 14 `#707b76`], "2.5K+" over [people 16 (`icon-people-outline-16.svg`) + "Patients"]; Chip becomes `bg-[#eff6ff]` at (272,16) with "CARDIOLOGY" Inter Regular 12 `#2563eb`; below the image a `Button` area `p-[16px]` holding `Button Usual Hover` (full width 352 x 44.73): "Get an Appointment" IS Regular 16 white on `#0ca768` pill with arrow.

**F. Pagination `80:1535`** 1460 x 96, `px-[120px] py-[20px]` centered; inner grid 442 x 56 (all items absolutely placed by margin): prev chevron `icon-chevron-left-24.svg` 24 @ (0,16); "1" Inter Regular 14/22 `#4b5752` @ (84,17); **active "2"** `56x56 bg-[#0ca768] rounded-[16px]` @ (131,0), text Inter Regular 14/22 white; "3" @ (227,17); "..." `icon-more-dots-24.svg` 24 @ (276,16); "30" @ (340,17); next chevron `icon-chevron-right-24.svg` 24 @ (418,19).

**G. Our Services `Frame 1000010275` `80:1548`** 1460 x 775, `px-[80px] py-[50px]`, V gap 40: header row (H space-between): "Our Services" IS Regular 48/58 +0.96 `#171c1a`; two round arrow buttons (H gap 12): `border border-[#f0f0f0] rounded-[24px] p-[8px]` with 24x24 chevron (`icon-chevron-right-24.svg`; the left one wrapped in `rotate-180`) - 42 x 42 each. Then H `gap-[20px]` two `flex-1` columns (V gap 20): image `h-[492px] rounded-[24px] object-cover` (`service-consultation.png` 1125x750 / `service-doctors.png` 1125x750) + text V gap 4: title IS Medium 24/34 `#171c1a` ("Consultaition" [sic] / "Doctors"), caption IS Regular 18 / 1.5 `#4b5752` ("Consultaion with a trusted doctor" [sic] / "Thousands of doctors with specific or general expertise").

**H. Footer `80:1570`** 1460 x 898 (identical component to the landing footer; identical to `80:2846`): `flex flex-col gap-[120px] items-center overflow-clip py-[64px]`, background `linear-gradient(180deg, #302f34 0%, #0a0a0a 100%)` (plus two stacked fills `linear-gradient(180deg,#2e8cff,#061535)` and white underneath, fully covered). Layers: `Rectangle 4995` 1458 x 848 @(2,-8.51) `mix-blend-multiply` image `footer-bg.png` (`h-full left-[-3.24%] w-[104.98%]`); `Group 1000009031` 2858 x 2199 @(-668,-774.51) `mix-blend-exclusion` `footer-texture-lines.svg` (`inset-[-3.25%_-2.5%]`). Content: CTA block `w-[808px]` V gap 28 center: eyebrow (`Join to Dococlock`, IS 14 white, bar 21x8 `#0ca768`), H2 IS Regular 48/58 +0.96 white centered (`w-[759px]`): "Healthcare made simple with smarter appointment scheduling.", paragraph IS Regular 16 `#707b76` +0.32 px centered ("Understand your audience without compromising their trust. Dococlock helps you grow with clarity, compliance, and confidence."), buttons row H gap 10: `Button Usual Hover` Primary "Register" + `Button Usual Hover` white pill "Register" (`text-[#202020]`). Then `w-[1200px]` V gap 120: row H `gap-[333px]`: left `w-[375px]` V gap 28 (logo `logo-mark.svg` 50x50 + "Dococlock" Inter Regular 28 white; paragraph IS 16 `#707b76` +0.32), right `w-[492px]` V gap 28 (quote IS 16 `#707b76` +0.32; email pill `bg-white rounded-[100px] pl-[16px] pr-[4px] py-[4px] flex justify-between`: "Email Address" Inter Regular 16 `#2b2929` + Gradient `Buttons` "Subscribe"); bottom line IS 16 `#707b76` +0.32 "Dococlock is a privacy-first web analytics platform ...".

**I. `326:13058` popovers** (absolute children of the frame, both `bg-white border border-[#f2f2f2] rounded-[24px]` + `drop-shadow(0 -4px 12px rgba(0,0,0,.04))`, top y = 364, i.e. 13 px under the 351-bottom of the filtration row):
- `2` = **Type menu** `326:13379` at x113, 230 x 221: V `gap-[12px] p-[20px]`, rows Inter Regular 14 `#171c1a`: Cardiologist / Dentist / Orthopedics / Surgeon / Cardiologist [sic - duplicated in the mock], with 1 px separators (`pop-line` assets, fill `#FBFBFB`, near invisible).
- `3` = **Experience menu** `326:13367` at x417, 216 x 196: V, rows `px-[20px] py-[16px]` Inter Regular 14 `#171c1a`: "Less than 1 Year", "1 - 5 Year", **"5 - 10 Years" = selected/hover row** (`bg-[#e6f7f0]`, text `#03402a`), "10+ Years"; 1 px separators between rows.
No trigger opens them (no reaction) - they are static "open" states.

### 3.2 `80:2652` Main - Doctor detail, About tab (canonical, most migrated frame)

Frame 1440 x 1979.73, V gap 48 centered? (children are stretched full width): `Rectangle 4994` (decor), `Navbar` 1440 x 92 @y0 (same `Navbar/Default` pill at x118 y26, 1224 wide), `Main` `80:2668` 1440 x 894 @y140, `Footer` 1440 x 898 @y1082, `Frame 1000012752` (booking card) absolute @(1012,160) 349 x 430.

Decor `Rectangle 4994` `80:2653` (vector; a RECTANGLE in the other two frames @(1101,-408)): 295.22 x 2749.1 @(945.69,-221.36), rotation -34.65 deg, fill `#ffffff`, `LAYER_BLUR` radius 75.1 (CSS ~37.5 px), clipped by the frame - a faint diagonal light streak over the `#fafafa` page.

`Main` `80:2668`: V `gap-[24px]`:
- **Page Header** (breadcrumb) `px-[120px]` H gap 8 items-center: "Home" IS Regular 16/22 `#4b5752` + chevron 20x20 (`icon-breadcrumb-chevron-20.svg`, fill `#4B5752`, `-rotate-90 -scale-y-100`) + "Specialists" IS Regular 16/22 `#4b5752`.
- **Top** `80:2674` `px-[120px]` H: `Info` column `w-[811px]` V `gap-[16px]`:
  1. **Profile card** `Main` `80:2676` 811 x 470: `bg-white rounded-[24px] overflow-clip` V, `gap -57`. `Images` `80:2677` (811 x 353, V center, gap -200): cover `80:2678` 811 x 297, radius 24 24 0 0, image = hills photo `footer-bg.png` (visible fill = `imgRectangle5000`, CROP transform scale-x 0.9526 / offset 0.0309; lower fill `imgRectangle4999` fully covered - not needed); avatar `Ellipse 57` `80:2679` 256 x 256 at (277.5,97), fill = doctor photo, stroke **3 px `#fafafa` OUTSIDE** (export `doctor-detail-avatar-ring-262.png` 524x524 already includes the ring, drawn at 262x262 with `inset-[-1.17%]`). `Card` `80:2680` 811 x 174 at y296, `p-[24px] gap-[16px] rounded-[24px]` V: `User Card` (H space-between): `User` V gap 4 [`Name` H gap 8: "Ahmed Irtiza" IS Medium 24 `#171c1a` (w180) + `Verified` 32x32 green badge `doctor-verified-badge-green-32.svg`; degrees "MBBS, MD (Neurology)" IS Regular 16/22 `#4b5752`] and `Rating` H gap 4 [star 16 (`doctor-detail-star-gray-16.svg`, `#929291`) + "4.5" IS 16/22 `#4b5752`]; `Info` H gap 16: two V gap-8 columns `Experience`/`12+` and `Sessions`/`200` (IS Regular 16/22 `#4b5752`).
  2. **Tabs** `Companies` `80:2699` (811 x 33): `Search` `rounded-[64px] px-[11px] gap-[8px] flex items-center`: tab cells `px-[16px] py-[8px]` (About 75 x 33 @x11, Experience 106 @94, Education 98 @208, Reviews 87 @314): **active** = `border-b border-[#0ca768]` + Inter **Bold** 14 `#0ca768`; inactive = Inter Regular 14 `#4b5752`.
  3. **Info Box** `80:2711` `bg-white rounded-[16px] p-[24px] gap-[24px]` V, no shadow: `Header` H space-between ("Personal Information" IS Medium 24 `#171c1a`; user icon 24x24 `icon-user-outline-24.svg` stroke `#171C1A`); `Info` V gap 16 - six rows `H justify-between` (label left / value right) IS Regular 16/22 `#4b5752`: BMDC Number 23458 | Consultation Fee ৳840 (inc. VAT) | Follow-Up Fee ৳840 (inc. VAT) | Doctor Code DT1290 | Joined DocTime March 14, 2022 | Patient Attended 1018.
- **Booking card** `Frame 1000012752` (349 x 430) -> `65` `80:2761` 349 x **352** at (0,39): `bg-[#fefefe] rounded-[24px] p-[24px] flex flex-col justify-between` (no shadow, no stroke): `Label And Drop` H space-between: "Get an Appoinment" [sic] IS Medium 24 `#171c1a` + round button `Buttons` `80:2765` (Primary instance 43.78 x 44.73, `bg-[#0ca768] rounded-[100px]`, arrow asset `booking-arrow-right-btn.svg`); `Info` V gap 24: block 1 V gap 4 [label row H gap 4 (bank-card icon 14 `icon-bank-card-14.svg` + "Consultation Fee" IS Regular 16/22 `#171717`) / value "BDT 1000" IS Medium 24 `#171c1a`], block 2 [time icon 14 `icon-time-line-14.svg` + "Average Duration" / "12-15 minutes"]. (Note the card sits at x=1012, i.e. 41 px beyond the 1200 column's right edge at 1320: 120 + 811 + 81 gap.)
- Footer `80:2734` as 3.1.H except the eyebrow bar is `#3766fa -> #2e8cff` (blue) and paragraph text `#909090` here (legacy on this frame only; `80:2846` and the list page use green + `#707b76`).

### 3.3 `80:2778` Main - Experience tab; `80:2896` Main - Education tab

Both share the same skeleton as 3.2 with these differences (read from the design context of `80:2794` and a property diff `80:2794` vs `80:2912`; the navbar frames are identical across all three, 0 differences):
- **Legacy styling in the page body** (not yet migrated to the new tokens): breadcrumb uses **Outfit** Regular 16 (`Home` `#888`, `Specialists` `#373737` +0.16 px) - `Page Header` is `w-[687px]` wrapper; verified badge is **blue** `doctor-verified-badge-blue-legacy-32.svg`; star amber `icon-star.svg`; profile-card degrees / labels `#171717`, values `#909090`; **active tab = `border-b border-[#2e8cff]` + Inter Bold 14 `#2e8cff`** ("Experience"), inactive Inter Regular 14 `#8f8f8f`. Use `80:2652` for colour tokens (green active tab, `#4b5752` text) and these frames only for **content structure**.
- Main column has `gap-[48px]` and a trailing 33 px spacer (`80:2845`, `Frame 1000012700` @y926); tab cell positions differ slightly (Info y=68); frame heights 2044.73.
- **Info Box** `80:2838` (811 x 275 @y535, `rounded-[16px] p-[24px] gap-[24px]`, no shadow): Header ("Experiences" IS Medium 24 `#171c1a` + icon 20x20: `Handbag` `icon-handbag-20.svg` (stroke `#171717`) on Experience, `cil:education` graduation cap `icon-education-29.svg` (29x29, fills `#141414`/`#444444`) on Education) then `Cards` V gap 16: two `User Card` (component `80:2891`) 763 x 79: `bg-[#fafafa] rounded-[24px] p-[16px] gap-[8px]` V: header row H space-between [hospital name IS Regular 16/22 `#171c1a` ("Apollo Hospital") | dates IS Regular 12 `#707b76` ("Nov 2024 - Feb 2025 ")], designation IS **Medium** 14 `#707b76` ("Cardiologist").
- Education frame `80:2896` differs from Experience `80:2778` only by: Sessions value "12+" (vs 200), the header icon (education cap 29x29 vs handbag 20x20). Header text still "Experiences" and tab highlight still "Experience" -> unfinished frame (open issue 8.3).
- Right booking card, decor rectangle (RECTANGLE type at (1101,-408)), navbar and footer as in 3.2 (footer here = green `80:2846` version).

### 3.4 `303:14598` / `303:14768` / `303:14940` / `303:15866` Main - wizard modal states

Common: frame 1440 x 1550, V gap 48. `Navbar` 1440 x 92: **placeholder** nav (logo text "Dococlock" 34 tall, links Home / Features / Pricing / Resources / Docs, Login, black "Register" pill) - not the marketing nav; ignore (legacy). `Main` `303:14613` 1440 x 1410 @y140 = legacy page (below) + the scrim `Modal` `303:14733` (`absolute left-0 top-[-140px] w-[1440px] h-[1552px] bg-[rgba(0,0,0,0.5)]`) holding the wizard panels. All page copy is `capitalize`.

**Wizard panels** (children of the scrim; both centred on x = 720; 636 wide, left 402):
1. **Header card** `Modal` (`303:15470` step 1, `303:15530` step 2, `303:15624` step 3): `bg-white rounded-[24px] px-[36px] py-[48px] gap-[12px] flex flex-col justify-center drop-shadow(0 0 26.4px rgba(0,0,0,.1))`, 636 x 216, top y = 458 (steps 1-2) / 249 (step 3), **stacked above the body panel**:
   - `Q&A Card` (H space-between, `rounded-[12px]`): `Text` V gap 4: "Get an Appointment" IS Regular 24 `#171c1a` / "Once you complete next person will be on the queue" IS Regular 13 / 1.5 `#7b87a4`; `Steps` 48 x 5 (H gap 2, 4 bars each 10.5 x 5, `rounded-[24px]`): filled `#0ca768` for steps <= current (1,2,3 bars), remaining `#eee`.
   - `Progress Bar` V gap 4, 564 wide: `Steps` row (H space-between; 4 `Icons` chips each icon + label): **Hospital** (icon `wizard-step-icon-hospital-18.svg` 18x18, no chip fill, label IS Medium 12), **Appointment** (`wizard-step-icon-appointment-16.svg` 16x16), **Patient Details** (`wizard-step-icon-patient-16.svg` 12x16), **Review And Confirm** (`wizard-step-icon-review-16.svg` 13.85x16); chips 2-4 are `bg-white p-[10px] rounded-[100px] gap-[4px]` 36 tall, label IS Regular 12; label colour `#0ca768` for done/current, `#7b87a4` for upcoming (step 3: Review = `#8a94a3`).
   - `Progress Line` 564 x 15 (H `items-end justify-between`): track segments 8 px high, `rounded-[24px]`: **step 1**: `Indicate` 44 (green fill 44 x 8 + 7x7 marker triangle at x37 pointing down, asset `wizard-progress-indicator-44x15.svg`) then `#eee` 139 + 266 + 115 = 564; **step 2**: green 129 + `Indicate` 44 (=173 green) + `#eee` 177 + 214; **step 3**: green 99 + green 130 + `Indicate` 106 (=335 green) + `#eee` 229. So fill fraction = 44/564 (7.8 %), 173/564 (30.7 %), 335/564 (59.4 %); segment boundaries are the step label centres (they are not equal quarters). Marker sits on the leading edge of the fill.
2. **Body panel** `Modal` (`303:14734` step 1 @y642 h257.73, `303:14904` step 2 @y644 h338.73, `303:15076` step 3 @y423 h508.73): `bg-white px-[36px] py-[48px] rounded-bl-[36px] rounded-br-[36px]` (top corners **0**, no shadow), 636 wide; inner `w-full` V `gap-[48px]` (fields, then Buttons). The header card **overlaps the top 32 px (steps 1-2: 642 vs header bottom 674; 644 vs 674 = 30 px) / 42 px (step 3: 423 vs 465)** of the body panel.
   Fields use component `Input Field - Dococlock` (`302:12650`): V gap 8: label IS Regular 14 `#4b5752`, `Input Box` `bg-[#fbfbfb] border border-[#fbfbfb] rounded-[8px] p-[12px] gap-[8px]` full width, hint IS Regular 12 `#707b76`, optional trailing chevron (`arrow-up-s-line` 20x20 flipped Y -> chevron-down; existing asset `dashboard-components/icon-dropdown-arrow-up.svg`) or calendar icon 16 (`dashboard-components/icon-calendar.svg`).
   - Step 1 body: one field "Choose Hospital" (hint "Choose", trailing chevron).
   - Step 2 body: "Choose Date" (hint value `11-27-2025`, trailing calendar icon 16) 65 tall @(0,0) and "Choose Session Type" (value "Follow Up", trailing chevron) 69 tall @(0,81), V gap 16 group (150 tall).
   - Step 3 body (V gap 16 group): row 1 H gap 8 [Name "Enter your Name" | Age "Enter Age"], row 2 H gap 8 [Gender "Select" chevron | Blood Group "Choose" chevron], **Phone Number** field (`Input Field` variant: label IS Regular 14 `#45474d`; box `bg-white rounded-[8px] p-[12px] gap-[8px] drop-shadow(0 0 0.5px rgba(0,0,0,.25))` with left chip `+880 v` (`bg-[#fbfbfb] rounded-[4px] px-[4px] py-[2px]`, IS 12 `#45474d`, chevron `icon-chevron-down-20-phone-code.svg`) then 13 px vertical divider `wizard-phone-divider-13.svg` and a caret), "Description (optional)" field (hint "Enter texts here...").
   - **Buttons row** (`H justify-between`, 564 wide): `Back` (`Button Effect` Variant2, white `rounded-[500px] px-[4px] py-[8px] w-[121px]` 35 tall, label Inter Regular 16 `#8a94a3` tracking -0.32) at left; **Next** `Buttons` Primary `w-[349px]` 44.73 tall (`bg-[#0ca768] rounded-[100px]`, "Next" IS Regular 16 white + arrow). Button row starts at y = body-padding + fields + 48: step 1 @198-... (see frames).
3. Legacy page underneath (visible dimmed by the 50 % scrim; **legacy tokens** - blue `#2e8cff`, navy `#061535`, Outfit breadcrumb): breadcrumb; `Ibfo` (811 wide, sticky) = video poster 318 x 349 r24 (`legacy-doctor-detail-video-poster.png` + play icon 61) beside name "Ahmed Irtiza" Instrument Sans **Bold** 36 capitalize + Verified 32, degrees 16, blurb 16/1.5, three `Values` tiles (white r16 p16: Experience 12+ / Sessions 20 / Ratings 4.8+, labels 12 `#666`, numbers Bold 24); right card `65` 304 x 352 `bg-[#fefefe] r24 p24` (title "Get an Appoinment" IS Medium 24 + "0", map pin address, Consultation Fee BDT 1000 (Inter Medium 20), Average Duration 12-15 minutes, **Book Now** `bg-[#3d87f5] r24 py16` full width); chips row (Availability active `bg-[#2e8cff]` white Inter Bold 12 / Experience / Education outlined `#d9d9d9`, `rounded-[24px] px-16 py-8`); "Hospital" (IS Bold 24) with two hospital cards (`Square Hospital` 296 x 300 white with 7 % photo `legacy-hospital-card-bg-square.png`, arrow disc `#2e8cff` 40 x 40, schedule day pills Sun-Thu `bg-white rounded-[100px] px-8 py-4` Inter 14; second card 343 x 300 photo `legacy-hospital-card-bg-apollo.png` + white text). All of this is superseded by the `80:2652` design for tokens; keep as content reference (hospital cards + availability chips do not exist in `80:2652`).

**Step 4 success** (`303:15866`): scrim child `765` `303:16161` at (403,438.14) **634 x 675.73**, `bg-[#fbfbfb] rounded-[16px] shadow-[0_-4px_12px_rgba(0,0,0,0.04)] p-[24px] gap-[24px] overflow-clip` V center, no header card:
- Art frame 834 x 255 (`shrink-0`, centred; clipped by the card): dome `Ellipse 50` `success-glow-half-ellipse.svg` (758 x 692, fill `#e6f7f0`) at inset `[-180.78% 4.56% 9.41% 4.56%]` i.e. left 38 / top -461 (only its lower arc shows as a big pale half-moon behind the icon); rings centred at (420,~109.85): `Ellipse 47` 134 (stroke `#a3e2ca` 0.5) @(353,42.85), `Ellipse 46` 111 (fill `#cff0e3`) @(364.5,53.85), `Ellipse 48` 93 (fill `#a3e2ca`) @(373.5,62.85), `Ellipse 49` 70 (stroke `#a3e2ca` 0.5) @(385,74.85); centre disc `Verified` 52 x 52 `bg-[#3cbb8d] rounded-[500px]` @(394.5,83.85) holding check `success-check-32.svg` 32 x 32 (white).
- `Header` V gap 16 center: title Inter Medium 24 `#171c1a` ("Appointment Created Successfully", `w-[399px]`), body Inter Regular 16/22 `#4b5752` centred `w-[441px]` ("You can keep track of the order and the transaction details in appointment page").
- `Body` -> `Date Picker` `bg-[#f5f7f6] rounded-[24px] pl-[8px] pr-[16px] py-[8px]` full width, centred V gap 12: "#23" Inter Medium **70** `#171c1a`, "Serial Number" Inter Regular 16/22 `#4b5752`.
- Buttons row `p-[16px] gap-[8px]`: `Back Home` `bg-white rounded-[100px] w-[122px]` (label IS Regular 16 `#4b5752`) + `View Schedule` `Buttons` Primary `flex-1` (label white + arrow).

### 3.5 `303:15350` Modal 617 x 451 - Add Hospital form (doctor console)

`bg-white rounded-bl-[36px] rounded-br-[36px] drop-shadow(0 0 9.05px .1 => Figma effect r18.1) px-[36px] py-[48px]` V; inner V `gap-[16px]`: field group V gap 16: **Image** ("Choose", trailing upload icon (reuse `dashboard-components/icon-upload.svg`, 13.33 px - see 8.5)), **Name** ("Enter Name"), **Address** ("Enter Address"), `DropDowns` H gap 8 with three `flex-1` fields: Follow Up Fee / Consultation Fee / Report Fee (hint "Enter Address" [sic] on all). Buttons row H space-between: `Cancel` (white 121 wide, Inter Regular 16 `#8a94a3`) and **Next** `Button Effect` `w-[349px] bg-[#2e8cff]` (legacy blue - map to `primary-500`), Inter Regular 16 white tracking -0.32. Same `Input Field - Dococlock` as 3.4.

### 3.6 `303:15363` Modal 619 x 216 - Add Hospital header

`bg-white rounded-[24px] px-[36px] py-[48px] gap-[12px] drop-shadow(0 0 9.05px .1)`: `Q&A Card`: "Add Hospital" IS Regular 24 `#171c1a` + subtitle IS Regular 13/1.5 `#7b87a4`; `Steps` **28** x 5 (2 bars: `#0ca768`, `#eee`). `Progress Bar` V gap 4: `Steps` row (H space-between) two white chips `p-[10px] rounded-[100px] gap-[4px]`: "Appointment" (`wizard-step-icon-appointment-alt-18.svg`, IS Regular 12 `#171c1a`) and "Schedule" (`wizard-step-icon-schedule-16.svg`, 12x16); `Progress Line` H items-end: `Indicate` flex-1 (marker 7x7 `wizard-progress-marker-6.svg` right-aligned over an 8 px `#0ca768` bar) + `#eee` flex-1 segment + `#eee` 115 segment.

## 4. Components & variants used

Component sets / components (ids from `Instance.getMainComponentAsync()` scans of each frame):

| Component (set id) | Variants used in this unit | Where |
|---|---|---|
| `Navbar/Default` (`80:7430`, component, not a set) | single | Navbar of every list/main frame (instance `80:7492`, `80:7554`, ...); contains one `Buttons` Gradient (`326:13007`, 113.78 x 44.73) |
| `Buttons` (`80:4641`) | `Property 1=Gradient` (`80:4662`, nav Register + footer Subscribe), `Property 1=Primary` (`80:4657`, footer Register, wizard Next / View Schedule, doctor-detail round arrow), `Property 1=Secondary` (`80:4642`, white "Register" in footer CTA) | see 3.1, 3.2, 3.4 |
| `Button Usual Hover` (`80:4768`) | `Default` (`80:4769`), `Hovered` (`80:4772`) | footer CTA "Register" x2 (`I80:1579;80:2152`, `I80:1579;80:2153`; on the `Main` frames `I80:2743;80:2152/2153`), and the "Get an Appointment" button inside the hovered Doctor Card |
| `Button Featured Hover` (`80:4763`) | `Default` (`80:4766`, 43.78 x 44.73 icon only), `Hovered` (`80:4764`, 113.78 x 44.73 icon + label "Register") | swap target of the doctor-detail round arrow button (`80:2765`) |
| `Doctor Card - Final` (`80:4685`) | `Variant2` (`80:4718`, resting 384 x 502) x9 per list; `Default` (`80:4686`, hovered 384 x 481.73) | list grid |
| `Eyebbrow` (`80:4634`) | `Variant2` (`80:4637`, 137 x 33 no fill, 14 px text) | "Specialists" header eyebrow; footer eyebrow (white text) |
| `Header` (`80:4667`), `Information Component` (`80:2149`) | single | H1 header block; footer CTA paragraph + buttons |
| `Material Icons` (`5:88`) | `Filter` (`5:108`), `Down` (`5:89`), `Search` (`5:101`) | filtration row |
| `Typography` (`80:4747`) | `Title - 24` (`80:4750`), `Value - 14` (`80:4752`), `Subtitle - 16` (`80:4756`), `Paragraph - 16` (`80:4748`) | all body text (see 2.2 for the resolved styles) |
| `Brands ` (`11:382`), `Component 8` (`11:377`, chevron 24) | single | "Sort By Recommendation" select |
| `User Card` (`80:2891`) | single (763 x 79) | Experience/Education cards |
| `Handbag` (`5:116`), `Bank-card` (`5:130`), `Every-user` (`303:14553`), `alert-02` (`222:5404`, hidden 48x48) | icons | detail page / legacy tiles |
| `Frame 1000012039` (`5:4`) `Default` (`5:5`) | single | legacy black "Register" of the `303:*` placeholder navbar |
| `Input Field - Dococlock` (`302:12650`) | single component with boolean-controlled parts (label icon / leading icon / hint / value / trailing icon): all wizard + Add Hospital fields | see 3.4, 3.5 |
| `Icons` (`302:12556`) | `DropDown` (`302:12586`), `Upload` (`303:13898`) | trailing icons in `303:*` |
| `Typography - Dashboard` (`302:12624` / `191:4753`) | `Value - 14`, `Small - 12`, `Title - 24` | modal titles |
| `Buttons` (`303:13029`) `Default`, `Button Effect` (`303:13020`) `Variant2` (`303:13025`), `Buttons` (`255:6569`) `Default`/`Blue Button` (`255:6572`), `Button Effect` (`255:6560`) `Variant2` (`255:6565`) | Back / Cancel (white, label Inter `#8a94a3`) and the blue "Next" | wizard + Add Hospital |

## 5. Interactions

All reactions were read with the reactions-dump script on each frame (raw rows in `docs/figma/interactions/landing-pages.json`). Result: **only `ON_HOVER -> CHANGE_TO` variant swaps exist** in this unit, all `SMART_ANIMATE`, `EASE_OUT` = `cubic-bezier(0,0,.58,1)`, `0.3 s`. No ON_CLICK, no OVERLAY, no NAVIGATE, no timeout. The filter menus, wizard steps, success screen and Add Hospital modals are **static frames with no prototype wiring**; their open/close/step behaviour must be inferred from the app's existing state (`isTypeOpen`, `isExpOpen`, `bookingStep`, ...) - recommended motion for them is given below and is clearly marked **[no Figma motion]**. `get_motion_context(recursive=true)` returned `{"nodes":[]}` (no keyframe animations) for all 11 nodes.

### 5.1 Reaction table

| # | Trigger | Source layer (id + name) | Action -> destination | Transition | Frames |
|---|---|---|---|---|---|
| R1-R9 | ON_HOVER | `Doctor Card - Final` instances `80:1524, 80:1525, 80:1526, 80:1528, 80:1529, 80:1530, 80:1532, 80:1533, 80:1534` | CHANGE_TO `Property 1=Default` `80:4686` (set `80:4685`) | SMART_ANIMATE, EASE_OUT, 0.3 s | `80:1482` (same 9 cards `326:13088-13098` in `326:13058`) |
| R10-R11 | ON_HOVER | `Button Usual Hover` instances `I80:1579;80:2152` and `I80:1579;80:2153` ("Register" x2) | CHANGE_TO `Property 1=Hovered` `80:4772` (set `80:4768`) | SMART_ANIMATE, EASE_OUT, 0.3 s | `80:1482` (`I326:13143;80:2152/2153` in `326:13058`; `I80:2743;...` in `80:2652`; `I80:2855;...` in `80:2778`; `I80:2989;...` in `80:2896`) |
| R12 | ON_HOVER | `Buttons` (Primary) round arrow button `80:2765` (`247:5709` in `80:2778`, `247:5771` in `80:2896`) inside the doctor-detail booking card | CHANGE_TO `Property 1=Hovered` `80:4764` (set **`80:4763` Button Featured Hover**) | SMART_ANIMATE, EASE_OUT, 0.3 s | `80:2652`, `80:2778`, `80:2896` |
| - | -- | Frames `303:14598/14768/14940/15866`, `303:15350`, `303:15363` | no reactions at all | -- | -- |

Cross-frame link (flows.md 2.1): `Landing 80:1754` `View All` (`I80:1817;80:4765`) -> `80:1482`, NAVIGATE SMART_ANIMATE **GENTLE 1.022 s** (spring constants not exposed). This unit's frames do not contain further navigation: clicking a Doctor Card is **not prototyped** in the current design (gap G1); the click-through exists only in the legacy Flow 1.

### 5.2 Variant diffs (source of truth for the motion)

**R1-R9 Doctor Card `Variant2` (`80:4718`, resting) -> `Default` (`80:4686`, hovered)** - property diff (read; `n = 105` diffs, condensed):
- Card root: height `502 -> 481.73`; padding `4/4/4/4 -> 0/0/0/0`; alignment `CENTER/CENTER -> MIN/MIN`; `clipsContent false -> true`; effect `[] -> DROP_SHADOW (0,-8) blur 20 spread 0 #000 @0.05`; radius 24 unchanged; width 384 unchanged.
- `Image Container`: x/y `(4,4) -> (0,0)`, width `376 -> 384` (image `Rectangle 16` also 376 -> 384, radius 24 kept, height 405 unchanged).
- `Chip`: replaced: `x,y (275,15) -> (272,16)`, fill `#ffffff -> #eff6ff`, text `"Cardiology" (IS 12 #171c1a) -> "CARDIOLOGY" (Inter 12 #2563eb)`, size 77x23 -> 94x23.
- **Added** (absent in Variant2): `Rectangle 3510` gradient overlay 384 x 405 @(0,0), `mix-blend-mode: screen`, `linear-gradient(to bottom, rgba(250,250,250,0), #fafafa 87.5%)`; `Info` overlay `384 x 218 @(0,190)` (`p 16`, gap 16: header row + two 113-tall stat tiles).
- **Removed / replaced**: the bottom `Info` row (`376 x 89 @(4,409)`, `p 16/8`, name + qualification + rating) is replaced by `Button` (`384 x 76.73 @(0,405)`, `p 16`, centered) holding `Button Usual Hover` 352 x 44.73 "Get an Appointment" (primary pill). Name/qualification/rating text nodes move from below the image to inside the overlay (their y goes `~425 -> ~206`).
- Height arithmetic: `405 (image) + 76.73 (button area) = 481.73`. The instance is `self-stretch` in a row whose tallest sibling is 502, so the visible card stays **502 px tall in the layout** (rows and grid do not reflow on hover) and the swapped content is top-aligned.

**R10-R11 `Button Usual Hover` `Default` (`80:4769`) -> `Hovered` (`80:4772`)** (113.78 x 44.73 button, container `clipsContent true`): container radius `0 -> 100`; child `Ellipse 51` (blend `SOFT_LIGHT`, no blur, horizontal constraint STRETCH, vertical MIN): `x,y (40.78, 46) -> (-1.22, -39.73)`, `w x h 37 x 45 -> 115 x 123`, fill `#ffffff -> #bebebe` (opacity 1 both). In the Default state the ellipse sits **below** the button (y 46 > height 44.73) so it is clipped away; on hover it rises, grows to cover the whole pill (left inset `-1.22`, right inset `0`) and its fill dims to `#bebebe`. Left inset in Default = 40.78, right inset = 36 (constraint STRETCH => width scales with the button).

**R12 `Button Featured Hover` `Default` (`80:4766`) -> `Hovered` (`80:4764`)**: width `43.78 -> 113.78` (height 44.73 same); inner `arrow-right-s-line` frame `43.78 x 44.73 (p16/18) -> 94 x 20 (p 0/16)` becoming a label frame `Frame 1000012737` with text "Register" (IS Regular 16, `x 16`), the arrow vector is re-parented as a second child (icon stays last). Net effect = the round icon button expands to the right to a pill revealing the label; label text in the component is the stale "Register" (open issue 8.6).

### 5.3 IMPLEMENTATION RECIPES

Shared tokens (add once to `index.css` / `tailwind.config.js`, tokens.md 7): `--ds-ease-out: cubic-bezier(0,0,.58,1)`, `--ds-dur-fast: 300ms`. Wrap every motion in `@media (prefers-reduced-motion: no-preference)` (CLAUDE.md non-negotiable) - under reduced motion apply the end state instantly (`transition: none`).

**A. Doctor Card hover (R1-R9)** - target `components/ui/DoctorCard.tsx` compact card (used by `DoctorSearchView.tsx:120-137` and the landing experts carousel). Keep the wrapper `onClick` (`onSelectDoctor(doc)`), `key`, data props. Suggested DOM (one element per Figma layer so CSS transitions play the SMART_ANIMATE morph):
```
<div class="dc group" (w-full max-w-[384px] h-[502px] rounded-ds-lg relative) onClick=...>
  <div class="dc__frame" (absolute inset-0 p-1 rounded-ds-lg overflow-hidden transition-[padding,box-shadow] duration-300 ease-ds-out
       group-hover:p-0 group-hover:shadow-[0_-8px_20px_rgba(0,0,0,0.05)]>
    <div class="dc__img" (relative h-[405px] rounded-ds-lg overflow-hidden)>   // 376 -> 384 comes from the padding 4 -> 0
      <img object-cover />  (no scale-105 hover: Figma has no image zoom)
      <div class="dc__fade" (absolute inset-0 bg-gradient-to-b from-[rgba(250,250,250,0)] to-[#fafafa] to-[87.5%] mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-ds-out)/>
      <span class="dc__chip" (absolute top-[15px] right-[..] rounded-full px-2 py-1 text-[12px] bg-white text-content-primary
            group-hover:top-[16px] group-hover:bg-<chip-hover> group-hover:text-<chip-hover-text> group-hover:uppercase font-sans transition-[background-color,color,top] duration-300)/>
      <div class="dc__overlay" (absolute left-0 top-[190px] w-full p-4 flex flex-col gap-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 ease-ds-out)>
          name / qualification / rating  +  <div class="grid grid-cols-2 gap-2 h-[113px]"> two tiles bg-ink-50 rounded-ds-lg (Inter Medium 36 number, Inter Medium 14 label + 16px icon) </div>
      </div>
    </div>
    <div class="dc__rest" (px-2 py-4 flex justify-between)> name (24 Medium) / qualification (16/22 tertiary) / star+rating </div>   // group-hover: opacity-0 (fades out, no layout shift because the card height is fixed at 502)
    <div class="dc__cta" (absolute left-0 right-0 top-[405px] h-[76.73px] p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 ease-ds-out)>
        <button class="btn-sheen w-full h-[44.73px] rounded-full bg-primary-500 ...">Get an Appointment</button>
    </div>
  </div>
</div>
```
Exact hover end-state numbers: card `p 0`, shadow `0 -8px 20px rgba(0,0,0,.05)`, image `384 x 405`, overlay `top 190`, CTA area `y 405..481.73` (button 352 x 44.73 at x16,y421). Rest state: image `376 x 405` at (4,4), info row `y 409 .. 498`. Transition: `0.3s cubic-bezier(0,0,.58,1)` on `padding, box-shadow, opacity, transform, background-color, color`. Grid must use a **fixed card height** (`h-[502px]`, `self-stretch`) so hovering never reflows the grid (Figma keeps the 502 row).
- Functional constraints: whole-card click and keyboard focus keep calling `onClick`; CTA `onClick` must `stopPropagation()` (the full `DoctorCard` already does at `DoctorCard.tsx:125-128`) and should call the same handler (`onSelectDoctor(doc)` -> `/doctor/:id`) - Figma does not prototype the CTA. Touch devices: no hover - show the resting state only, CTA reachable via card tap (`@media (hover:hover)` guard on the hover rules).
- Data mapping for the overlay tiles: "10+" <- `experienceYears` (`doc.experienceYears`), "2.5K+" <- `totalPatients` (see full card `DoctorCard.tsx:110,116`); qualification line is currently hard-coded `MBBS, FCPS(...)` at `DoctorCard.tsx:56` (Figma text is a mock too) - keep the app's data.
- Chip colours: the hovered chip in Figma is legacy blue (`#eff6ff`/`#2563eb`); use theme tokens (`bg-primary-50 text-primary-700`) unless design confirms blue (open issue 8.4).

**B. Filled-pill CTA hover ("Button Usual Hover", R10-R11 and every `.btn-sheen` pill)** - current `.btn-sheen::after` (`index.css:126-148`) is a radial gradient fade approximation. Figma-exact recipe (replace the pseudo-element rules; same class name so all call sites keep working):
```css
.btn-sheen { position:relative; overflow:hidden; isolation:isolate; }
.btn-sheen::after{
  content:''; position:absolute; pointer-events:none; mix-blend-mode:soft-light;
  left:40.78px; right:36px;          /* Default: 37px-wide ellipse; stretches with the button (STRETCH constraint) */
  top:calc(100% + 1.27px);            /* y=46 on a 44.73px button => just below the pill, hidden by overflow */
  height:45px; border-radius:50%; background:#fff;
  transition: left .3s var(--ds-ease-out), right .3s var(--ds-ease-out), top .3s var(--ds-ease-out),
              height .3s var(--ds-ease-out), background-color .3s var(--ds-ease-out);
}
.btn-sheen:hover::after{ left:-1.22px; right:0; top:-39.73px; height:123px; background:#bebebe; }
```
The button itself needs `border-radius:9999px` (Figma flips the clip radius 0 -> 100 on hover; with `overflow:hidden` + real radius from the start there is no visible difference). Applies to `Button.tsx` primary/accent/gradient variants and hand-rolled pills unchanged.

**C. Round arrow -> expanded pill (R12, doctor-detail "Get an Appoinment" card)** - the icon button (`43.78 x 44.73`, `bg-primary-500 rounded-full`) grows to `113.78 x 44.73` on hover revealing a label; same pattern as the existing navbar "Register" collapse in `Layout.tsx:139-147` (pure CSS `max-width` transition). Recipe: `group inline-flex items-center rounded-full overflow-hidden`; label wrapper `max-w-0 group-hover:max-w-[70px] overflow-hidden whitespace-nowrap transition-[max-width] duration-300 ease-ds-out` with `pl-4` (label 62 x 20, Figma text box `x16`); arrow keeps `px-[18px] py-4`. Click handler = existing booking start (`handleBookClick`, `DoctorProfile.tsx:137`). Label text: not specified by Figma (component default "Register") - use the existing copy ("Book Appointment") - open issue 8.6.

**D. Filter menus (Type / Experience) [no Figma motion]** - menus are static open states (326:13058). Keep the existing toggle logic (`isTypeOpen`/`isExpOpen`, `DoctorSearchView.tsx:30-31,75-98`). Recommended: `opacity 0 -> 1` + `translateY(-4px -> 0)` over 0.3 s `cubic-bezier(0,0,.58,1)` (Figma's overlay default = DISSOLVE 0.3 EASE_OUT elsewhere in the file), chevron `rotate-180` at the same duration (already `transition-transform`). Selected/hover row = `bg-primary-50` + `text-secondary-500` (matches the `5 - 10 Years` row).

**E. Booking wizard steps [no Figma motion]** - suggested (consistent with the file's motion vocabulary: SWAP = DISSOLVE 0.3): on `bookingStep` change cross-fade the body (0.3 s ease-out) and animate the progress fill width (`width: 44/564 -> 173/564 -> 335/564`, i.e. `7.8% / 30.7% / 59.4%`) and the marker with `transition: width .3s cubic-bezier(0,0,.58,1)`; step-bar segments (`10.5x5`) and labels change colour `#eee -> #0ca768` / `#7b87a4 -> #0ca768` at the same duration. Modal open: scrim `opacity 0 -> 1` 0.3 s, panel dissolve 0.3 s. The success step uses `SWAP`-like dissolve (see the Booking wizard in flows.md 3.3 for the doctor console: `SWAP DISSOLVE 0.3`).

## 6. Assets manifest

All under `public/assets/figma/landing-pages/` (served at `/assets/figma/landing-pages/...`) unless "reuse". Existing 36 files under `public/assets/figma/**` were sha256-compared first; identical downloads were discarded and the existing path is referenced ("reuse"). SVGs are Figma exports (never hand-written); several keep Figma's hard-coded colours (noted) - recolour via CSS `mask` if theming is required.

| Local path | Source node (const in design context) | Format | Notes |
|---|---|---|---|
| reuse `doctor-card-1.png` | `imgRectangle17` (list card row 1 col 1) | PNG 540x360 | sha identical to existing `doctor-card-1.png` / `badge-photo-2.png` |
| reuse `doctor-card-2.png` | `imgRectangle16` (Variant2 photo) | PNG 961x1200 | identical |
| reuse `doctor-card-3.png` | `imgRectangle18` | PNG 600x400 | identical |
| `doctor-list-photo-suit-blue.png` | `imgRectangle19` | PNG 800x534 | row 2/3 col 2, object-cover |
| `doctor-list-photo-suit-dark.png` | `imgRectangle20` | PNG 642x350 | row 2/3 col 3, crop `h-full left-[-71.66%] w-[193.46%]` |
| `service-consultation.png`, `service-doctors.png` | `imgRectangle2703`, `imgRectangle2704` | PNG 1125x750 | Our Services images, 492 tall, r24 |
| reuse `footer-bg.png` | `imgRectangle4995` = `imgRectangle5000` (doctor-detail cover) | PNG 740x410 | identical; used by footer (multiply) and as the visible doctor-detail cover image |
| `footer-texture-lines.svg` | `imgGroup1000009031` | SVG | footer exclusion texture (differs from existing `footer-texture.svg`; identical Figma node -> prefer this one if the landing unit did not add the same) |
| reuse `logo-mark.svg` | `imgAtomLine` | SVG | footer logo 50x50 |
| `logo-favicon-40.svg` | `imgFavicon` | SVG 40x40 | navbar logo |
| reuse `icon-star.svg` | `imgStar39` (list, Experience tab) | SVG (fill `#f59e0b`) | |
| `doctor-detail-star-gray-16.svg` | `imgStar39` (About tab) | SVG (fill `#929291`) | |
| `icon-filter-24.svg`, `icon-chevron-down-24.svg`, `icon-chevron-down-sort-24.svg`, `icon-search-24.svg`, `icon-chevron-left-24.svg`, `icon-chevron-right-24.svg`, `icon-more-dots-24.svg` | `imgMaterialIcons`, `imgMaterialIcons1`, `imgProperty11`, `imgGroup4`, `imgArrowLeftSLine`, `imgArrowRightSLine2/3/4` (all three identical), `imgMoreLine` | SVG 24 | filter/search/sort/pagination glyphs (`#4A4A4A` / `#4B5752` fills) |
| `divider-line-34.svg` | `imgLine17` | SVG | 1x34 stroke `#C7DFFF` (legacy blue) |
| `icon-clock-16.svg`, `icon-people-outline-16.svg` | `imgMdiLightClock`, `imgFamiconsPeopleOutline` | SVG 16 | hovered-card stat tiles |
| `btn-sheen-ellipse-white.svg`, `btn-sheen-ellipse-green.svg` | `imgEllipse51`, `imgEllipse52` | SVG 37x45 | the Default-state sheen ellipse (white); the CSS recipe in 5.3.B replaces them - kept for reference only |
| reuse `booking-arrow-right-btn.svg` | `imgArrowRightSLine1` (white chevron in Primary/Gradient `Buttons`, 43.78x44.73) | SVG | identical sha |
| reuse `landing-components/button-arrow-dark.svg` | `imgArrowRightSLine` (dark chevron on white button) | SVG | identical sha |
| `doctor-detail-avatar-ring-262.png` | `imgEllipse57` | PNG 524x524 | avatar incl. 3 px `#fafafa` ring (mock doctor photo) |
| `icon-breadcrumb-chevron-20.svg` | `imgArrowUpSLine` | SVG 20 | fill `#4B5752`; the Outfit-styled frames use `#888888` variant (not kept) |
| `doctor-verified-badge-green-32.svg`, `doctor-verified-badge-blue-legacy-32.svg` | `imgVerified` (80:2652) / (80:2794) | SVG 32 | green `#0CA768` current, blue `#2E8CFF` legacy |
| `icon-user-outline-24.svg`, `icon-handbag-20.svg`, `icon-education-29.svg` | `imgBoxiconsUserFilled`, `imgHandbag`, export of `326:13392` (`cil:education`, 2 vectors) | SVG | Info Box header icons |
| `icon-bank-card-14.svg`, `icon-time-line-14.svg` | `imgBankCard`, `imgTimeLine` | SVG 14 | stroke/fill `#061535` (legacy navy) |
| `wizard-step-icon-hospital-18.svg`, `wizard-step-icon-appointment-16.svg`, `wizard-step-icon-patient-16.svg`, `wizard-step-icon-review-16.svg`, `wizard-progress-indicator-44x15.svg` | `imgGroup`, `imgVector`, `imgVector1`, `imgVector2`, `imgIndicate` (from `303:14613`) | SVG | wizard stepper (colours: hospital `#0CA768`, others per state) |
| `icon-chevron-down-20-phone-code.svg`, `wizard-phone-divider-13.svg` | `imgArrowUpSLine1`, `imgLine59` (from `303:15076`) | SVG | phone-number field; fill/stroke `#45474D` |
| reuse `dashboard-components/icon-dropdown-arrow-up.svg`, `dashboard-components/icon-calendar.svg` | `imgArrowUpSLine`, `imgMynauiCalendar` | SVG 20 / 16 | field trailing icons (identical sha) |
| `success-glow-half-ellipse.svg`, `success-ring-134.svg`, `success-ring-111.svg`, `success-ring-93.svg`, `success-ring-70.svg`, `success-check-32.svg` | `imgEllipse50/47/46/48/49`, `imgFrame1000012702` | SVG | step-4 art (`#E6F7F0` dome, rings `#A3E2CA`/`#CFF0E3`, white check) |
| reuse `dashboard-components/icon-upload.svg` | svgAssets[2] of `download_assets(303:15353)` | SVG 13.33 | "Image" field trailing icon (the design-context const for this node resolved to the calendar glyph - see 8.5) |
| `wizard-step-icon-appointment-alt-18.svg`, `wizard-step-icon-schedule-16.svg`, `wizard-progress-marker-6.svg` | `imgVector`, `imgVector1`, `imgRectangle5114` (from `303:15363`) | SVG | Add Hospital header |
| `legacy-doctor-detail-video-poster.png`, `legacy-hospital-card-bg-square.png`, `legacy-hospital-card-bg-apollo.png` | `imgFrame427318945`, `img63`, `img64` (`303:14613`) | PNG 525x350 / 637x779 / 634x767 | legacy page underlay only |
| `legacy-play-61.svg`, `legacy-icon-handbag-14.svg`, `legacy-icon-every-user-14.svg`, `legacy-icon-star-12.svg`, `legacy-icon-map-pin-navy-14.svg`, `legacy-icon-map-pin-white-14.svg`, `legacy-icon-bank-card-white-14.svg`, `legacy-icon-time-navy-14.svg` | `303:14613` icon consts | SVG | legacy underlay only (do not use unless rebuilding the legacy page) |

Only the download links (expire ~7 days) were used; every kept file is a byte-exact Figma export. Files verified with `file` (PNG/SVG signatures correct).

## 7. App mapping & gap analysis

Legend: **MATCH** already equals Figma; **STYLE-DIFF** same structure, different values; **STRUCTURE-DIFF** different DOM/composition; **MISSING** Figma element with no app counterpart; **NEW-INTERACTION** Figma hover/motion the app lacks. Line numbers are from the files as read on 2026-09-20 (HEAD `2dd66ce`).

### 7.1 Navbar - `components/Layout.tsx` (public chrome, shared by every frame here)

| Region | App (file:line) | Figma | Class |
|---|---|---|---|
| Pill container | `Layout.tsx:106-107` `fixed`, `max-w-7xl` (1280) `px-6`, `h-14`/`h-11` compact, `rounded-full bg-white shadow-ds-pill` (`0 0 7px .05`) | `Navbar/Default` 1224 x 68.73 @x118,y26 (frame padding 24), `bg-white rounded-[500px] px-[24px] py-[12px]`, **no shadow** | STYLE-DIFF (width 1224, height 68.73, shadow none; keep sticky/compact-on-scroll logic `isNavCompact` - not in Figma) |
| Logo | `Layout.tsx:117-124` `<Logo/>` + "DocOclock" `font-display font-bold text-2xl` | Favicon 40x40 (`logo-favicon-40.svg`) + "Dococlock" **Inter Regular 16** `#171717` gap 8 | STYLE-DIFF (wordmark size/weight; spelling "Dococlock" in Figma) |
| Links | `Layout.tsx:23-30,128-137` `gap-[44px] text-[16px] font-normal text-ink-800 hover:text-medical-600`; labels Doctor / Hospital / Lab&Diagnostic / Blogs / About us / Contact us | gap 44, Inter Regular 16 `#171717`, same six labels (list frame shows "Lab & Diagnostic" with spaces, `Main` frames "Lab&Diagnostic") | MATCH |
| Login | `Layout.tsx:133-135` text-only, 16, ink-800 | "Login " Inter Regular 16 `#171717` | MATCH |
| Register | `Layout.tsx:138-148` **collapses to an icon-only circle** (`max-w-0 group-hover:max-w-[100px]`), gradient `from-medical-300 to-medical-500` | `Buttons` **Gradient** 113.78 x 44.73, label always visible, `#3cbb8d -> #098d58`, **no hover reaction** on any nav instance | **STRUCTURE-DIFF** - contradicts CLAUDE.md ("Register collapses ... Button Featured Hover"). In Figma the collapse/expand pattern is on the landing's `View All` (`80:1817`) and on the doctor-detail round arrow (R12), **not** on the navbar Register. Needs an owner decision (see 8.1); handler `onRegisterClick` unchanged either way. |

### 7.2 Doctors list - `views/patient/DoctorSearchView.tsx` (frames `80:1482`, `326:13058`)

| Region | App (file:line) | Figma value | Class |
|---|---|---|---|
| Page bg + column | `:56` `min-h-screen bg-white`; `:57` `max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16` | `#fafafa`; 1200 content inside 1440 (`px-[120px]`), vertical gap 48 between blocks | STYLE-DIFF (`bg-page`, `max-w-[1200px]`) |
| Eyebrow | `:60-63` bar `w-[21px] h-2 rounded-full bg-medical-500`, text `text-ink-500 text-[14px]` | 21x8 bar `#0ca768`, IS 14 `#707b76` `px-3 py-2` | STYLE-DIFF (text token) |
| H1 | `:64` `font-display font-normal text-[32px] md:text-[46px] text-[#131215] leading-tight tracking-[0.92px]` | 48 / 58 / +0.96 `#171c1a` | STYLE-DIFF (48/58/0.96px; drop literal `#131215`) |
| Header right paragraph | `:66-68` marketing paragraph (`max-w-[380px]`) | **not in Figma** (header block is eyebrow + H1 only, `w-[679px]`) | STRUCTURE-DIFF (extra copy; remove or keep as designer decision) |
| Filter & Sort chip + vertical divider | absent | chip 129x48, border 0.5 `#4a4a4a`, r24 + divider 34px | **MISSING** (no Figma behaviour; suggested: toggles the Type menu or is a static label; do not invent sort logic without decision) |
| Type / Experience buttons | `:73-76`, `:85-88` `h-12 px-5 rounded-full bg-white shadow-ds-card text-[14px] font-medium text-ink-700` showing `Type: {value}` / `Experience: {label}` | chips 92x48 / 133x48 `border #f2f2f2`, r24, `px-4 py-3`, IS 14 `#4a4a4a`, chevron 24 `#4A4A4A`, **static labels** "Type" / "Experience" | STYLE-DIFF (keep dynamic value text; shape/border/shadow to Figma) |
| Type menu | `:77-86` `w-56 rounded-2xl shadow-ds-soft border border-ink-50`, rows `px-5 py-3 text-[14px] text-ink-700 hover:bg-medical-50`, list = `SPECIALTIES` (`:13`, incl. "All") | 230x221, r24, border `#f2f2f2`, shadow `0 -4 12 .04`, `p-20 gap-12`, rows Inter 14 `#171c1a` + 1px separators | STYLE-DIFF (keep "All"/data; Figma list omits "All" and repeats "Cardiologist" - mock) |
| Experience menu | `:89-98` same panel; selected row `bg-medical-50 text-medical-600 font-semibold`; `EXPERIENCE_BANDS` (`:14-20`) labels "Any Experience", "Less than 1 Year", "1 - 5 Years", "5 - 10 Years", "10+ Years" | 216x196, rows `px-5 py-4`, selected/hover `bg-primary-50` + text `#03402a`; labels "Less than 1 Year", "1 - 5 Year" [sic], "5 - 10 Years", "10+ Years" | STYLE-DIFF (copy: keep app labels; "Any Experience" is an app-only reset row) |
| Menu placement | `:77,:89` `absolute top-[calc(100%+8px)] left-0` under each button | popover y = 364 = 13 px below the 351-bottom of the row; Type menu x113 (under Filter & Sort), Experience menu x417 (chip x381) | STYLE-DIFF (13 px gap; left offsets inferred, see 8.2) |
| Search | `:99-110` input `h-12 rounded-full bg-white shadow-ds-card`, left `Search` icon, right clear (X) button | one white pill 653x56 `p-1 rounded-[48px]`, placeholder Inter 14 `#4a4a4a` at left, **48x48 green r24 search button on the right** | STRUCTURE-DIFF (icon moves into a right-hand green button; keep the clear (X) and `searchTerm` binding; the button can focus the input / no-op since filtering is live) |
| Results line + sort | absent | "Showing 1-10 of 60 results" (IS 16 black) + "Sort By Recommendation" select 258 wide | **MISSING** (count = `filteredDoctors.length`; sort has no app logic - propose static "Recommendation" only, or client-side sort by rating; decision 8.7) |
| Grid | `:120` `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10` of `<DoctorCard compact>` | 3 columns x 3 rows, gap 24 both axes, card 384 x 502 | STYLE-DIFF (`gap-6`, fixed card height; keep responsive collapse) |
| Card (resting) | `DoctorCard.tsx:33-63` `aspect-square` image, pill `text-[10px] font-bold` white/95, name `text-[15px] font-bold`, qualification `text-[11px] ink-500`, star `amber-500` + rating `text-[13px] font-bold` | image 376 x **405** (not square), chip IS 12 `#171c1a`, name IS **Medium 24**, qualification 16/22 `#707b76`, star 16 + "4.5" IS 16 | STYLE-DIFF (large: sizes 15->24, 11->16, 13->16, 10->12; image ratio 376:405) |
| Card hover | `DoctorCard.tsx:42` `group-hover:scale-105 transition-transform duration-500` on the image only | overlay + stat tiles + "Get an Appointment" CTA + shadow + chip recolour, 0.3 s `cubic-bezier(0,0,.58,1)` (5.2 / 5.3.A) | **NEW-INTERACTION** (replaces the zoom) |
| Pagination | absent (all doctors rendered) | prev / 1 / **2 (active 56x56 r16 `#0ca768`)** / 3 / ... / 30 / next | **MISSING** (client-side paging of `filteredDoctors`, page size from Figma = 9 cards per page although the caption says "1-10"; new behaviour -> 8.7) |
| Our Services | absent | H2 "Our Services" + 2 arrow buttons + 2 image cards (Consultaition / Doctors) | **MISSING** (static content; arrows have no reaction in Figma) |
| Loading / empty | `:113-118` spinner `border-ink-100 border-t-medical-500`; `:133-148` "No Doctors Found" + `Clear All Filters` | not designed | keep, restyle only |
| Footer | `components/Footer.tsx` | see 7.7 | see 7.7 |

Functional constraints (do not change): `fetchDoctors()` + `filteredDoctors` memo (`:41-54`) incl. `specialtyStem` matching; `initialCategory` prop from `navigate(path, id, category)` (`App.tsx:136-138`); `onSelectDoctor(doc)` -> `handleSelectDoctor` -> `navigate('/doctor/${id}')` (`App.tsx:147-150`); card `key`/`onClick`; empty-state "Clear All Filters" resets `searchTerm`, `selectedType`, `selectedExperience`; the dropdown mutual-exclusion (`setIsExpOpen(false)` when opening Type and vice versa).

`views/patient/DoctorSearch.tsx` (130 lines, `GlassCard`, `blue-600`, `slate-*`) is **dead code**: no file imports it (`App.tsx:17` aliases `DoctorSearchView` as `DoctorSearch`). It has no Figma counterpart; leave untouched or delete in a cleanup task (not part of the sync).

### 7.3 Doctor detail - `views/patient/DoctorProfile.tsx` (frames `80:2652`, `80:2778`, `80:2896`)

| Region | App (file:line) | Figma value | Class |
|---|---|---|---|
| Top actions | `:286-296` Back + heart + share icon buttons | breadcrumb "Home > Specialists" (IS 16/22 `#4b5752`, chevron 20) at `px-[120px]`; no heart/share | STRUCTURE-DIFF (keep `onBack`; breadcrumb "Home" -> `/` navigate, "Specialists" -> `/patient/doctors`) |
| Layout | `:297` `max-w-4xl mx-auto px-6 mt-10`, single column (info left, portrait right) | two columns: **811** main + **349** booking card (x1012), 120 side padding | STRUCTURE-DIFF |
| Header | `:305-315` eyebrow + `h1 font-display text-2xl md:text-4xl font-black`, degrees `text-[11px] font-bold uppercase` | cover 811x297 + avatar 256 (r-full, 3 px `#fafafa` ring) overlapping 200 px, then name IS Medium 24 + green verified 32 + degrees IS 16/22 + rating star/4.5 | STRUCTURE-DIFF (cover photo = static brand hills `footer-bg.png`; avatar = `doctor.imageUrl`) |
| Stats | `:318-333` three cards (Experience / Rating / Patients) `p-2.5 px-4 rounded-2xl` | two text columns "Experience 12+" / "Sessions 200" (IS 16/22, no card); Rating is top-right of the header | STRUCTURE-DIFF ("Sessions" <- total sessions/patients count) |
| Portrait + badge | `:337-355` `rounded-ds-xl` portrait + floating "Elite Specialist / Top Tier Verified" badge | none (avatar in cover) | STRUCTURE-DIFF (badge removed) |
| Tabs | `:358-375` `['About','Availability','Experience','Education','Reviews']`, `px-6 py-3 text-sm font-black`, active `text-medical-600` + underline | 4 tabs About / Experience / Education / Reviews in a 33-tall row, cell `px-4 py-2`, Inter 14, active = Bold + `border-b border-[#0ca768]` (+ green text) | STYLE-DIFF + structure: **Availability tab is not in the Figma strip** (legacy `303:*` frames show it as a chip). Keep the tab (functionality: chamber/schedule selection `:410-434`) - Figma gap |
| About panel | `:377-408` paragraph + 2-col metric grid (`Follow-Up Charge`, `Avg. Duration`, `Total Cases`) | white Info Box `rounded-[16px] p-6 gap-6`, header "Personal Information" + user icon, 6 rows label/value: BMDC Number, Consultation Fee, Follow-Up Fee, Doctor Code, Joined DocTime, Patient Attended | STRUCTURE-DIFF (needs BMDC `doctor.bmdcNumber`, fees from `chambers[0]`, doctor code / joined date / patients attended - data availability to verify, see 8.8; `doctor.about` paragraph has no place in Figma) |
| Experience panel | `:436-452` single `Senior Specialist` block (generic text) | "Experiences" Info Box + list of `User Card`s (hospital name / dates / designation) `bg-[#fafafa] rounded-[24px] p-4` | STRUCTURE-DIFF (needs a list of experiences - `DoctorProfileEditor` has add-experience (flows.md 3.3); read path in `storage.ts` to be confirmed) |
| Education panel | `:454-475` "Verified Degrees & Certifications" | frame is a copy of Experience with education icon, no distinct content | STRUCTURE-DIFF (draft - see 8.3) |
| Reviews | `:476-560` review form + list (fetched when `activeTab === 'Reviews'` `:100-103`) | tab exists in the strip; **no Reviews content frame** | keep (Figma gap) |
| Booking card | absent; sticky bottom button `:564-577` "Book Appointment" `h-16 px-16` `pointer-events-auto` | right card 349 x 352 `bg-[#fefefe] r24 p-6`: title "Get an Appoinment" [sic], round green arrow button (hover expands, R12), Consultation Fee "BDT 1000", Average Duration "12-15 minutes" | **MISSING** (`handleBookClick` `:137-144` must stay the click handler; fee <- chamber fee, duration currently hard-coded "12-15 Minutes" at `:390`) |
| Hover motion | `:349-353` badge/portrait scale; stat cards `hover:border-slate-200` | only R12 (`Buttons` -> Featured Hover), 0.3 s | NEW-INTERACTION (5.3.C) |

Functional constraints: `activeTab` state + Reviews fetch; `handleBookClick` (role check -> `setIsBookingModalOpen(true)` else `onLoginRequest()`), `bookingStep`, `selectedChamber`, `selectedDate`, `takenSerials` effect (`:110-135`), `canAdvanceFromStep` (`:154-158`), `handleConfirmBooking` (`:160-`), `confirmedApp`, `finishAndGoToAppointments`, `onBookSuccess`, `onBack`, `onNavigate`.

### 7.4 Booking wizard modal - `DoctorProfile.tsx:578-815` (frames `303:*`)

| Region | App (file:line) | Figma value | Class |
|---|---|---|---|
| Overlay | `:580` `fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm animate-fade-in` | scrim `#000 @ 0.5`, no blur | STYLE-DIFF (`bg-black/50`, drop blur) |
| Container | `:581` `max-w-[560px] bg-[#fdfdfd] rounded-[20px] shadow-[0_-4px_24px_rgba(0,0,0,.08)] overflow-y-auto` single card | **two stacked panels 636 wide**: header card (white r24, shadow `0 0 26.4 .1`) on top of a body panel (white, top corners 0, bottom r36, no shadow) overlapping it by 30-42 px | STRUCTURE-DIFF |
| Header | `:600-608` **coloured banner** `bg-medical-500` with decorative vectors `booking-vector25/26.svg`, white title "Get an Appointment" 28-32 px + close button (X) | white card: title IS Regular 24 `#171c1a`, subtitle IS 13 `#7b87a4` "Once you complete next person will be on the queue", 4 step bars (48x5) at right; **no banner, no close button drawn** | STRUCTURE-DIFF (keep a close affordance for accessibility; Figma has none) |
| Stepper | `:609-630` floating card `bg-medical-50 border-8 border-white rounded-[20px]` with circular step icons `/assets/figma/booking-icon-*.svg` and connector lines | icon+label chips in a row (Hospital / Appointment / Patient Details / Review And Confirm) + 8-px progress line with marker; asset set in section 6 | STRUCTURE-DIFF |
| Step contents | `:634` step 1 chamber cards, `:671` step 2 date + serial slots, `:727` step 3 patient (new/self, `newPatientData`), `:775` step 4 review | step 1: single dropdown "Choose Hospital"; step 2: "Choose Date" + "Choose Session Type" dropdowns; step 3: Name/Age/Gender/Blood Group/Phone/Description fields; step 4: **success screen** (not a review step) | STRUCTURE-DIFF - Figma has no "Review And Confirm" body and no slot picker; the app's slot/serial selection and review step must be **kept** (functional) and only restyled with `Input Field - Dococlock` styling; treat Figma's Session Type ("Follow Up") as a new field to confirm |
| Footer buttons | `:797-815` `Cancel/Back` + `Continue/Confirm` (disabled state via `canAdvanceFromStep`, spinner `isBooking`) | `Back` (white 121 wide, Inter `#8a94a3`) at left, `Next` primary pill 349 wide with arrow at right; Back on step 1 = Cancel in the app | STYLE-DIFF (labels: "Next" vs "Continue"; keep `Confirm` on final step) |
| Success | `:583-599` emerald check circle, "Booking Confirmed!", doctor name, `#{serialNumber}` in `font-stat text-7xl`, `View My Schedule` full-width button | card 634x676 `bg-[#fbfbfb] r16`, dome + concentric rings + green check disc, "Appointment Created Successfully", explanatory line, serial box `#f5f7f6` "#23 / Serial Number" (Inter 70), `Back Home` + `View Schedule >` | STRUCTURE-DIFF ("Back Home" is a new action -> `onNavigate('/')`/close; `View Schedule` = `finishAndGoToAppointments`) |

### 7.5 Add Hospital modals (`303:15350`, `303:15363`) - out of this unit's app files

Doctor-console piece: `views/doctor/DoctorPracticeSettings.tsx` add-hospital modal. Figma layout = the same wizard chrome (header card + body panel, 2 steps "Appointment"/"Schedule"). Recorded for the doctor-console unit (flows.md 3.3: step 2 `368:16869`, toasters). The "Next" button is legacy blue `#2e8cff` (map to `primary-500`).

### 7.6 Shared elements used by these frames

| Element | App | Note |
|---|---|---|
| `Button.tsx` primary/gradient | `.btn-sheen` (`index.css:126-148`) | STYLE-DIFF - see recipe 5.3.B; gradient stops `Accent-400 -> Accent-600` |
| `Input Field - Dococlock` | inline in each view | no shared component; 12 inputs across wizard steps; a shared `FormField` (label 14 `#4b5752`, box `bg-ink-50 border-ink-50 rounded-ds-sm p-3`, hint 12 `#707b76`) would remove duplication - optional |

### 7.7 Footer - `components/Footer.tsx` (same footer in every frame; owned by the landing unit)

Figma vs app: container `gap-[120px] py-[64px]` (`Footer.tsx:8-11` uses `gap-[80px] md:gap-[120px] py-16`) MATCH; gradient `#302f34 -> #0a0a0a` MATCH (`:10`); `footer-bg.png` multiply (`:14-16`) MATCH; texture (`:18-20`, `footer-texture.svg`, `opacity-60`) vs Figma `footer-texture-lines.svg` exclusion (opacity not verified); eyebrow copy "Join Dococlock" vs Figma "Join to Dococlock" (STYLE-DIFF text); H2 `text-[46px] tracking-[0.92px]` vs 48/58/0.96 (STYLE-DIFF); CTA paragraph text differs (app custom copy `:34-36`, Figma "Understand your audience ..."); **CTA buttons: Figma shows two pills (primary "Register" + white "Register" via `Button Usual Hover`), app renders one** (`:38-46`) (STRUCTURE-DIFF); newsletter form MATCH structurally (`:66-88`), button gradient app `medical-300 -> 500` vs Figma `400 -> 600`; the app's copy of the logo paragraph / subscribe quote / legal line are product copy (keep). Nav "Register" `onClick` (`onNavigate('/patient/doctors')`) must remain.

### 7.8 Routes / App shell - `App.tsx`

Routes present and matching the frame identification: `/patient/doctors` (`:328`), `/doctor/:id` and `/patient/profile` (`:295-320`). `navigate()` (`:125-145`) pushes history and scrolls to top (no page-transition motion exists; the landing -> list `GENTLE 1.022 s` SMART_ANIMATE has no equivalent - treat as NEW-INTERACTION owned by the landing unit; a simple 0.3 s route fade is the safe approximation). The doctor detail page currently renders under `Layout` (`max-w-7xl` main with `pt-[calc(6.5rem...)]`, `Layout.tsx:417`), whereas Figma frames are full-width 1440 with their own 120 px gutters -> the detail page container must not double-pad.

### 7.9 Pages with no Figma design in this unit

`views/marketing/HospitalsPage.tsx`, `LabDiagnosticsPage.tsx`, `BlogsPage.tsx`, `AboutUsPage.tsx`, `ContactUsPage.tsx` and `views/doctor/DoctorLanding.tsx` have **no matching frame** in the eleven nodes (verified against all frame names/contents; the only Figma trace is the six navbar labels). They must not be restyled from this spec except for the shared Navbar/Footer/tokens. The login/register modals also have no frame here (Authentication Page section is another unit).

## 8. Open issues / uncertainties

1. **Navbar Register**: Figma = always-visible gradient pill (113.78 x 44.73, no reaction); CLAUDE.md and `Layout.tsx:138-148` describe a collapsed icon-only circle. Verified on `80:7492`, `80:7554` and the landing navbar instance (`326:13007`), all `Buttons Property 1=Gradient`. Decision needed: follow Figma (always expanded) or keep the documented collapse.
2. **Popover x-offsets** (`326:13379` x113, `326:13367` x417): the Type menu is drawn under the "Filter & Sort" chip (chip x120..249) and the Experience menu is not left-aligned to its chip (Experience chip x381..514, menu x417). Read as-is; intended alignment (left edge of the trigger vs the hard-coded offsets) is a designer question. Also no reaction opens them, so open/close motion is inferred.
3. **Education frame `80:2896`** is an unfinished copy: header "Experiences", highlighted tab "Experience", same cards. No distinct Education content exists.
4. **Legacy colours inside otherwise-current components**: hovered Doctor Card chip (`#eff6ff` / `#2563eb`), Add Hospital "Next" (`#2e8cff`), `80:2778`/`80:2896` (blue tab/verified, Outfit breadcrumb, `#909090` values), footer eyebrow of `80:2734` (`#3766fa -> #2e8cff`), vertical divider (`#C7DFFF`), bank-card/time icon strokes `#061535`. The spec maps them to theme tokens (tokens.md D8) but the designer has not re-coloured them; blue must not ship as a fixed literal (CLAUDE.md theming rule).
5. **SMART_ANIMATE layer matching**: the Doctor Card variants use different layer names (e.g. `Info` -> `Button`, `Chip` frame -> `Rectangle 3510`), so Figma's tween for name/rating text is a cross-fade/move that cannot be derived exactly; the recipe (5.3.A) reproduces start/end states and the 0.3 s ease-out, not per-frame text morphs.
6. **R12 label**: hover swaps the icon button for `Button Featured Hover / Hovered`, whose label is the stale component text "Register" (also `80:2765` is a `Buttons` instance, not a Featured Hover instance, so it is a swap-instance reaction). Intended label unknown; the spec assumes "Book Appointment".
7. **Behaviour that Figma implies but the app lacks** (do not add silently): pagination (page 2 of 30 while the caption says "1-10 of 60" and only 9 cards are drawn), "Sort By Recommendation", results count, "Filter & Sort" chip, wizard "Session Type" (Follow Up), "Back Home". Each is new behaviour -> needs product sign-off.
8. **Doctor-detail data** in Figma that may not exist in `types.ts`/`storage.ts`: "Doctor Code" (DT1290), "Joined DocTime", "Patient Attended", "Sessions", experience list with hospital/dates/designation, verified flag. Not verified here (out of scope: no source edits) - implementation should map to existing fields or omit rows.
9. **Booking-card position**: the card sits at x=1012 (41 px beyond the 1200 column edge at 1320, right margin 79) - possibly a designer slip; implement as a 349 px right column of the 1200 grid unless told otherwise.
10. **Wizard vertical placement**: header-card tops are y=458 (steps 1-2) and 249 (step 3) in the scrim (1552 tall); the stacks' centres are 678.9 / 720.4 / 590 (not consistently centred). Treat as "centred stack" in code; exact offsets are not a rule. Body panel overlap under the header card is 30 / 32 / 42 px (read from y positions).
11. **Success art**: ring centres are 3 px right of the card centre (centre x 420 vs 417 in the 834 art frame); dome/rings clipped by the card. Read as-is.
12. **Reference PNG scale**: not true 2x (see section 1). Modal PNGs include shadow bleed (654x488 for a 617x451 frame).
13. **`Navbar` text** "Lab & Diagnostic" (list) vs "Lab&Diagnostic" (Main frames) - text override inside the same component; the app uses "Lab&Diagnostic".
14. **Fonts**: Instrument Sans + Inter both used in body content (Inter for tabs/pagination/search placeholder/hover tiles/success modal titles) - app loads both (tokens.md 2.1). Outfit (breadcrumb of legacy frames) is not loaded and not needed.
15. **Effect radii vs CSS**: `get_design_context` prints `drop-shadow(... 10px)` for the Figma effect radius 20 (half). Specs above use the Figma radius as the `box-shadow` blur (20 / 12 / 26.4 / 18.1); if implemented with CSS `filter: drop-shadow()` use half.
16. **Mock data typos preserved verbatim** ("Get an Appoinment", "Consultaition", "Consultaion", "Visitng Schedule", "1 - 5 Year", "Cardiologist" duplicated, "Enter Address" on fee fields): production copy should be corrected, not ported.
