# landing-home - Main landing page (Hero to Footer) incl. Meet Our Medical Experts

Figma file `zJRyAML8hv0uEBOXtu5Hpn`, page `Web Version V1` (5:2). Every number in this document was read from Figma this session (`get_design_context`, `get_metadata`-equivalent `use_figma` read scripts, `get_motion_context`, `download_assets`); nothing is estimated from screenshots. Anything that could not be read is in section 8.

Read first: `docs/figma/tokens.md` (global tokens), `docs/figma/flows.md` (prototype graph), `FIGMA_SYNC_PLAN.md` (node map). Reference PNGs: `docs/figma/reference/landing-home/` (2x unless the name says `@1x`). Raw interaction rows: `docs/figma/interactions/landing-home.json`. Assets: `public/assets/figma/landing-home/` plus the pre-existing `public/assets/figma/*` files (reused where the sha256 matched).

Contents of this spec were filled frame by frame; the priority frame (Meet Our Medical Experts, doctor-card hover) is section 3.1 and 5.1 and is intentionally the most detailed.

---

## 1. Frames

| Node id | Name | Size | Position in parent | Role in the product | Prototype flow | Reference PNG |
|---|---|---|---|---|---|---|
| `80:1754` | Landing Page | 1460 x 8223.23, VERTICAL auto-layout, fill `#fafafa` | section `Pre Login Pages` `80:1481` | The public marketing home = app route `/` (`views/patient/Home.tsx` inside `components/Layout.tsx`) | **Flow start "PreLogin 1"** (Landing -> List Page `80:1482`) | `landing-page-full-80_1754@2x.png` (2920 x 16447) |
| `80:1755` | Hero | 1460 x 915, clip | (0,0) | Full-bleed photo hero, headline, blurb, 2 CTAs | - | `hero-80_1755@2x.png` |
| `80:7430` | Navbar/Default (COMPONENT, placed directly in the landing) | 1224 x 68.73, white pill r500, `ABSOLUTE` | (118, 26) | Marketing top bar over the hero | none | `navbar-default-80_7430@2x.png` |
| `80:1767` | Group 18 (specialty row) | 1440 x 84, white bar | (10, 915) | Row of 6 specialty names with sparkle glyphs, directly under the hero | none | `specialty-row-hero-80_1767@2x.png` |
| `80:1794` | After Hero | 1460 x 6326.51, VERTICAL, pad `96,0,96,0`, gap 96, counter-axis CENTER | (0, 999) | Container of sections 3.4 to 3.10 | - | (inside the full-page PNG) |
| `80:1795` | 2nd Section ("How it works") | 1200 x 536.78 | (130, 96) in After Hero | Header + 3 Process Cards | Register buttons have hover only | `how-it-works-80_1795@2x.png` |
| `80:1803` | Frame 1000012208 ("Meet Our Medical Experts") | 1460 x 918.73 | (0, 728.78) | Header, 6 tab pills, 3 doctor cards, "View All" CTA. **TOP PRIORITY** | Cards: ON_HOVER swap; View All: ON_CLICK -> List Page | `meet-our-medical-experts-80_1803@1x.png` (1460 x 919; the tool never returns more than 1x), card states below |
| `80:4718` | Doctor Card - Final, variant `Variant2` (resting) | 384 x 502 | in set `80:4685` | Resting card | ON_HOVER -> `80:4686` | `doctor-card-resting-Variant2-80_4718@2x.png` (768 x 1004) |
| `80:4686` | Doctor Card - Final, variant `Default` (hovered) | 384 x 481.73 | in set `80:4685` | Hover card | (none; reverts on mouse-leave) | `doctor-card-hover-Default-80_4686@2x.png` (848 x 1028, includes the canvas margin the export adds) |
| `80:1818` | Frame 1000012728 ("Transparency") | 1460 x 1473 | (0, 1743.51) | Big statement, photo + 3 floating badges, 3 stats | none | `transparency-80_1818@2x.png` |
| `80:1839` | Group 17 (second specialty row) | 1440 x 84 (+ a **hidden** 358x22 text "Trusted by patients and clinics wo...") | (10, 3312.51) | Same row as 80:1767, repeated between sections | none | `trusted-specialty-row-80_1839@2x.png` |
| `80:1866` | Frame 1000012147 ("Simplifying healthcare") | 1200 x 855 | (130, 3492.51) | Header + 4 Featured Tabs + product visual | none (tabs are static variants) | `simplifying-featured-tabs-80_1866@2x.png` |
| `80:1881` | Frame 1000008959 ("Testimonials") | 1206 x 1014 | (127, 4443.51) | 3-column masonry of quotes/photos, top fade | none | `testimonials-80_1881@2x.png` |
| `80:1907` | Frame 1000012112 ("FAQ") | 1200 x 677 | (130, 5553.51) | Header + 5 accordion-styled rows | none | `faq-80_1907@2x.png` |
| `80:1932` | Footer | 1460 x 897.73, clip | (0, 7325.51) | Dark CTA band + logo/newsletter + legal line | Register buttons hover only | `footer-80_1932@2x.png` |
| `80:7429` | Navbar (COMPONENT_SET, 1 variant `Variant2`) | 1264 x 197.46; variant 404 x 68.73 | loose on the canvas | Older compact nav, blue gradient Register (legacy `#88beff -> #2e8cff`) | none | `navbar-component-set-80_7429@2x.png` |
| `80:1747` | Text | 1460 x 105 | loose (4952, 2080) | List-page title block ("Specialists" eyebrow, "Find The Right Doctor", "Popular" chip). Belongs to the **List Page**, not the landing | none | `text-list-header-80_1747@2x.png` |
| `80:1730` | "3" | 251 x 237 | loose (6732, 1867) | List-page filter popover "Choose Experience Range" (5 options). Belongs to the List Page filters | none | `experience-range-popover-80_1730@2x.png` |

Vertical stack (all read): Hero 0-915, Group 18 915-999, After Hero 999-7325.51, Footer 7325.51-8223.24. Inside After Hero (y relative to After Hero): 2nd Section 96 (h536.78) - Meet Experts 728.78 (h918.73) - Transparency 1743.51 (h1473) - Group 17 3312.51 (h84) - Featured 3492.51 (h855) - Testimonials 4443.51 (h1014) - FAQ 5553.51 (h677) - end 6230.51 + pad 96 = 6326.51. **Between every two sections the gap is exactly 96** (it is the After Hero `itemSpacing`), not 2 x 96.

Prototype flow membership: Landing `80:1754` is the start of flow `PreLogin 1`. Only 9 reactions exist in the whole landing subtree (snippet A run on `80:1754`): 3 doctor-card hovers, 5 `Button Usual Hover` hovers, 1 `View All` click. There is **no scroll, load or timed trigger**, and `get_motion_context` (recursive) returns `{"nodes":[]}` for the landing and for the card component set: no keyframe animation exists (section 5).

---

## 2. Design tokens used

Token source of truth: `docs/figma/tokens.md`. This section lists what the landing uses and how it maps. "NEW" = the tokens agent already proposes it in tokens.md section 9 (do not invent a second name).

### 2.1 Colours

| Where | Value | Figma variable | App token | Status |
|---|---|---|---|---|
| Landing page bg; also the end colour of the card-hover gradient | `#fafafa` | literal (root fill) | proposed `page` (= Tailwind `neutral-50`) | NEW TOKEN NEEDED (`bg-page`). Home root is `bg-white` today |
| Brand green: Primary button, active Tab, eyebrow bar, Featured-Tab bullet | `#0ca768` | `Accent/Accent-500` | `primary-500` / `medical-500` | exact (themed) |
| Gradient Register (navbar), Subscribe (footer) | `#3cbb8d -> #098d58` top-to-bottom | `Accent/Accent-400 -> Accent-600` | `from-primary-400 to-primary-600` | value gap on 400 (see tokens.md 1.3); app uses `from-medical-300 to-medical-500` today |
| Badge gradient end ("Years Experience") | `#e6f7f0` | `Accent/Accent-50` | `primary-50` (app value `#f4fbf7`) | exact once tokens.md D3 lands |
| Badge gradient start | `#fefffa` | literal | arbitrary `from-[#fefffa]` | fixed decorative |
| Headline / values | `#171c1a` | `Text/Primary` | proposed `content-primary` | NEW (nearest `ink-800` `#171717`, delta 6/5/3) |
| Name/rating overrides on card instances, big stats "15+", body copy | `#171717` | literal | `ink-800` | exact |
| Paragraph / subtitle / inactive tab / eyebrow text | `#707b76` | `Text/tertiary` | proposed `content-tertiary` | NEW (nearest `ink-500` `#909090`, delta 32) |
| Specialty row text and glyphs | `#868887` | literal | none (`ink-500` `#909090` delta 8) | arbitrary `text-[#868887]` |
| FAQ eyebrow only | `#7c7b7b` | literal | none | arbitrary; every other eyebrow is `#707b76` |
| FAQ row bg | `#f5f5f5` | literal | Tailwind `neutral-100` (delta 0) | exact |
| Tab inactive bg, secondary button bg, Featured-tab rule | `#ffffff`, `#ffffff`, `#d9d9d9` | - | `white`, `white`, `ink-300` | exact |
| Card-hover stat panels | `#fbfbfb` | `Input Field` | `ink-50` | exact |
| Card-hover chip | bg `#eff6ff`, text `#2563eb` | literal | Tailwind `blue-50`, `blue-600` | exact; fixed semantic (the app's current `DoctorCard` non-compact already uses them) |
| Rating star | `#f59e0b` | literal | Tailwind `amber-500` | exact |
| Card-hover CTA sheen ellipse (hovered) | `#bebebe`, blend `soft-light` | literal | none | arbitrary, brand-independent |
| Secondary button label | `#202020` | literal | none (`ink-800` delta 9) | arbitrary |
| Process-card gradient stops | `#feffff -> #e3e3e3` | literal | none | arbitrary (angles in 3.3) |
| Hero title | `#fffffd`; chip `#ffffff @ 20%`; blurb `#ffffff` | literal | `text-[#fffffd]`, `bg-white/20`, `text-white` | - |
| Footer gradient | `#302f34 -> #0a0a0a` top-to-bottom (the visible top fill layer) | literal | arbitrary | the underlying blue `#2e8cff -> #061535` layer and white layer are fully covered (opacity 1) |
| Footer email placeholder | `#2b2929` | literal | arbitrary | - |
| Testimonial fade | `#f6f6f6`, layer blur 70 | literal | `ink-100` | CSS `blur(35px)` (Figma radius / 2, see tokens.md 4.2) |
| Featured-visual backgrounds | `#efefef`, `#f4f4f4 @40%`, `#f9f9f9` | literal | arbitrary | - |

### 2.2 Type

Instrument Sans (`font-display`) is the marketing family here; Inter (`font-sans`) is used for nav links, hero title, tabs, testimonial text, stat panel numbers/labels and the specialty row. `fontVariationSettings: "wdth" 100` on every Instrument Sans text = no variable axis needed.

| Role | Family / weight | Size / line-height / tracking | Colour | Where |
|---|---|---|---|---|
| Section title | Instrument Sans Regular | 48 / 58px / +2% (0.96px) | `#171c1a` | every Header (`80:4667`) |
| Hero title | Inter Medium | 68 / normal / +2% (1.36px) | `#fffffd` | `80:1765` (563px wide box) |
| Hero chip | Inter Regular | 14 / normal / +2% (0.28px) | white | `80:1764` |
| Hero / info blurb | Instrument Sans Regular | 16 / normal / +2% (0.32px) | white on hero, `#707b76` elsewhere | `Information Component` |
| Eyebrow | Instrument Sans Regular | 14 / normal / 0 | `#707b76` | `Eyebbrow` Variant2 |
| Card name | Instrument Sans Medium | 24 / normal | `#171717` (instance override; main component `#171c1a`) | doctor card |
| Card qualification | Instrument Sans Regular | 16 / 22px | `#707b76` | doctor card |
| Rating | Instrument Sans Regular | 16 / normal | `#171717` | doctor card |
| Card chip (rest) | Instrument Sans Regular | 12 / normal | `#171c1a` | Variant2 |
| Card chip (hover) | Inter Regular, **CARDIOLOGY typed uppercase** | 12 / normal | `#2563eb` | Default |
| Card stat number | Inter Medium | 36 / normal | `#171c1a` | Default |
| Card stat label | Inter Medium | 14 / normal | `#707b76` | Default |
| CTA / button label | Instrument Sans Regular | 16 / normal | white (`#202020` on white button) | `Buttons` |
| Tab active / inactive | Inter Bold / Inter Regular | 16 / normal | white / `#707b76` | `Tab` |
| Process-card title / body | Instrument Sans Medium / Regular | 24 / normal ; 16 / 22 | `#171717` ; `#707b76` | Process Cards |
| Wait-time line | Inter Regular | 16 / normal | `#171717` | Process Card 3 |
| Badge title | Instrument Sans Medium | 24 / normal, centered | `#171c1a` | Years Experience |
| Big stats | Instrument Sans Medium | 70 / normal, centered | `#171717` | Values |
| Stat label | Instrument Sans Regular | 16 / 22px | `#707b76` | Values |
| Featured tab | Instrument Sans Regular | 24 / normal | `#171c1a` (active in component) / `#171717` (instance) / `#707b76` (inactive) | Featured Tabs |
| Testimonial text | Inter Regular | 24, line-height 32 (one 40), **-3% (-0.72px)** | `#171717` | Testimonials |
| Testimonial name | Inter Regular | 24 / 32 / -3% | `#171717` | Testimonials |
| FAQ question | Instrument Sans Medium | 20 / normal | `#171c1a` open, `#707b76` closed | FAQ |
| FAQ answer | Instrument Sans Regular | 16 / 22 | `#707b76` | FAQ |
| Specialty row | Inter Regular | 18 / 28 | `#868887` | Group 18/17 |
| Nav links, Login, logo word | Inter Regular | 16 / normal | `#171717` | Navbar |
| Footer logo word | Inter Regular | 28 / normal | white | Footer |
| Footer eyebrow | Instrument Sans Regular | 14 | white | Footer |
| Footer title | Instrument Sans Regular | 48 / 58 / +2%, white, centered | white | Footer |
| Footer email label | Inter Regular | 16 | `#2b2929` | Footer |

### 2.3 Radii, shadows, blur, spacing

- Radii: 24 (doctor card, its image, stat panels, process cards), 100 (buttons, chips, tabs), 500 (navbar pill, arrow frame), 20 (Years Experience badge), 34 (transparency photo), 32 (testimonial photos), 28 (56px avatars), 36 (featured inner cards), 12 (FAQ rows), 24 (featured visual), 4 (none here: the eyebrow bar is a **square** 21x8 rectangle, radius 0).
- Shadow: only one on the whole landing - `DROP_SHADOW 0,-8 blur 20 spread 0 #000 @5%` on the hovered card (`80:4686`). CSS: box-shadow `0 -8px 20px rgba(0,0,0,.05)` **or** (recommended, see 3.1) `filter: drop-shadow(0 -8px 10px rgba(0,0,0,.05))` because the card has no fill. NEW `shadow-ds-doctor-hover` in tokens.md 9. Navbar, cards, badges have **no shadow** in Figma.
- Layer blur: testimonial fade `LAYER_BLUR radius 70` (-> CSS `blur(35px)`).
- Blend modes: hover gradient `SCREEN`; button sheen `SOFT_LIGHT`; footer photo `MULTIPLY`; footer texture group `EXCLUSION` at 40%.
- Spacing scale used: 4, 8, 12, 16, 20, 24, 28, 32, 36, 44, 56, 64, 72, 96, 120. Section gutters: page column 1200 (inset 130 in 1460), Meet-Experts and Transparency are 1460 full width (children centred), Testimonials 1206.
- Image filters: hero photo has Figma image filters (exposure -0.17, contrast +0.333, saturation +0.27, temperature -0.08, tint +0.06, shadows +0.10). The exported asset `hero-field-bg.png` already has crop + filters baked in (it also has a transparent bottom band, see 3.2).

### 2.4 Motion tokens (from the prototype)

`EASE_OUT` = `cubic-bezier(0, 0, 0.58, 1)`; hover = 0.3 s (300 ms); click-navigate on "View All" = SMART_ANIMATE `GENTLE` spring, 1.022 s (spring constants are not exposed by the API). Proposed CSS variables (tokens.md 9): `--ds-ease-out: cubic-bezier(0,0,.58,1)`, duration 300 ms.


---

## 3. Per-frame layout spec

Notation: `x,y` are relative to the parent unless stated; `WxH`; `AL-V/H` = auto-layout vertical/horizontal, `pad t,r,b,l`, `gap`, `main/cross` alignment (`MIN|CENTER|MAX|SPACE_BETWEEN`); `sz FILL|HUG|FIXED` per axis. Tailwind strings are the design-context reference code, trimmed; use them as a numeric source, not verbatim (rule: tokens from section 2).

### 3.1 Meet Our Medical Experts - node `80:1803` (TOP PRIORITY)

`Frame 1000012208`: 1460 x 918.73, AL-V, pad 0, gap 64, main MIN / cross CENTER. Children in order:

1. `Frame 23` `80:1804` - 1058 x 244 at x201 y0, AL-V, pad `0,142,0,142`, gap 36, CENTER/CENTER
   - `Header` `80:1805` (instance of `80:4667`) - 759 x 165, AL-V gap 16, cross-centred
     - `Eyebbrow` `I80:1805;80:4668` (variant `Variant2` `80:4637`): 124 x 33, AL-H pad `8,12,8,12` gap 10, radius 100, **no fill**; children: `Rectangle 3746` 21 x 8 solid `#0ca768` (radius 0, square) + text "Specialists" Instrument Sans 14 `#707b76`
     - Title text 759 x 116 (two lines, `text-align:center`): "Meet Our Medical" / "Experts", Instrument Sans Regular 48, line-height 58, tracking +2% (0.96px), `#171c1a`
   - `Tabs` `80:1806` - 774 x 43 at x142 y201, AL-H gap 8, cross CENTER. Six instances of `Tab` (`80:4680`): widths 63 / 139 / 161 / 102 / 135 / 134 (=734) + 5 gaps of 8 = 774. Each: AL-V, pad `12,24,12,24`, radius 100, height 43 (12 + 19 text + 12). `active` (`80:4681`): fill `#0ca768`, text Inter **Bold** 16 white. `inactive` (`80:4683`): fill `#ffffff`, text Inter Regular 16 `#707b76`. Labels in the file: All (active), Cardiologist, Dermatplpgost (sic - a Figma typo; keep "Dermatologist" as the app does), Dentist, Neurologist, Orthopedic. No stroke, no shadow.
2. `Doctor Cards` `80:1813` - 1460 x 502 at y308, AL-H gap 24, CENTER/CENTER (three 384-wide cards = 1200, centred: card x = 130 / 538 / 946)
   - Each child (`80:1814`, `80:1815`, `80:1816`) is an **instance of `Doctor Card - Final`** in state `Property 1=Variant2`, size 384 x 502, sizing `FIXED` horizontal / **`FILL` vertical**, wrapped as `flex flex-row items-center self-stretch`.
   - Card photos (image overrides): 1 -> `doctor-card-1.png` (== `badge-photo-2.png`, 540x360, `object-cover`); 2 -> `doctor-card-2.png` (961x1200, positioned `h-[118.4%] left-[0.11%] top-[-0.02%] w-full`, i.e. a crop that shows the face); 3 -> `doctor-card-3.png` (600x400, `object-cover`). All three cards show identical text ("Dr. Sarah Rahman", "MBBS, FCPS(CARDIOLOGY)", "Cardiology", "4.5") - placeholder copy; the app binds real doctor data.
3. `Button Featured Hover` `80:1817` - 110.78 x 44.73 at x674.61 y874 (centred), an instance of set `80:4763` **in the `Hovered` variant** (label + arrow). Inner `Buttons` `I80:1817;80:4765` (Primary): fill `#0ca768`, radius 100, AL-H gap -24, label frame `mr -24px, px 16px, clip` with "View All" (Instrument Sans Regular 16 white) + `arrow-right-s-line` frame 43.778 x 44.728 (pad `16,18,16,18`, radius 500, white chevron 7.778 x 12.728). Total = 16 + text 55 + 16 - 24 + 43.778 = 110.78. It is an `<a>` in the reference code (navigates, see 5.3).

Vertical rhythm inside the section: title block 0-244, 64 gap, cards 308-810, 64 gap, button 874-918.73.

#### 3.1.1 Resting card - variant `Variant2` `80:4718` (384 x 502)

Root: AL-V, pad `4,4,4,4`, gap 0, main/cross CENTER, radius 24, **no fill, no stroke, no shadow, no clip**. Slot origin = top-left of the 384 x 502 card. Coordinates below are slot coordinates.

| Layer | x,y | size | Style |
|---|---|---|---|
| `Image Container` `80:4719` (FILL x FIXED) | 4,4 | 376 x 405 | frame, no fill |
| - `Rectangle 16` (photo) | 4,4 | 376 x 405 | image fill CROP `[[1,0,-0.001],[0,0.845,0]]`, radius 24 |
| - `Chip` `80:4721` | 279,19 (in container: 275,15) | 77 x 23 | AL-H pad `4,8,4,8` gap 10 centred, fill `#ffffff`, radius 100; text "Cardiology" Instrument Sans Regular 12 `#171c1a`; 24 px from the container's right edge, 15 from its top |
| `Info` `80:4723` (FILL x HUG) | 4,409 | 376 x 89 | AL-V pad `16,8,16,8` gap 16 |
| - row `1` `80:4724` | 12,425 | 368 x 57 | AL-H, main SPACE_BETWEEN, cross MIN |
| - - column `1` `80:4725` | 12,425 | 326 x 57 | AL-V gap 8 |
| - - - name (`Typography` `80:4726`) | 12,425 | 198 x 29 | Instrument Sans Medium 24 `#171717` |
| - - - qualification (`Typography` `80:4727`) | 12,462 | 326 x 20 (line-height 22 in the instance) | Instrument Sans Regular 16 `#707b76` |
| - - rating `2` `80:4728` | 338,425 | 42 x 20 | AL-H gap 4 cross CENTER: star `Star 39` 16 x 16 (svg 15.2169 x 14.4721, inset `0 2.45% 9.55% 2.45%`, `#f59e0b`) at (0,2) + "4.5" Instrument Sans Regular 16 (22 x 20) at x20 |

Sum: 4 + 405 + 89 + 4 = 502.

#### 3.1.2 Hovered card - variant `Default` `80:4686` (384 x 481.73)

Root: AL-V, pad **0**, gap 0, main/cross **MIN**, radius 24, **`clipsContent` true**, effect `DROP_SHADOW offset (0,-8) radius 20 spread 0 #000000 @ 5%`, still **no fill and no stroke**. Height = 405 (image container) + 76.73 (Button row). In the landing the *instance* keeps sizing FILL vertical (502) so its content is pinned to the top and the bottom 20.27 px stay empty (open issue 8.1).

| Layer | x,y (slot) | size | Style |
|---|---|---|---|
| `Image Container` `80:4687` (FILL x FIXED) | 0,0 | 384 x 405 | frame, **not clipped**, absolute children (`layoutMode NONE`) |
| - `Rectangle 16` `80:4688` (photo) | 0,0 | 384 x 405 | same image crop, radius 24 |
| - `Rectangle 3510` `80:4689` (**new layer**) | 0,0 | 384 x 405 | linear gradient `#fafafa @ alpha 0` (position 0) to `#fafafa @ alpha 1` (position 0.875), `gradientTransform [[0,1,0],[-1,0,1]]` = parameter t equals the normalised y, so **top to bottom**; node blend mode **SCREEN**; radius 0 (square corners) |
| - `Info` `80:4690` | 0,190 | 384 x 218 | AL-V pad `16,16,16,16` gap 16; sits **inside the image container**; its bottom (190 + 218 = 408) overhangs the 405 container by 3 px (padding only) |
| - - row `1` `80:4691` | 16,206 | 352 x 57 | AL-H SPACE_BETWEEN |
| - - - column `3` (renamed from `1`) `80:4692` | 16,206 | 310 x 57 | AL-V gap 8 |
| - - - - name | 16,206 | 198 x 29 | unchanged style |
| - - - - qualification | 16,243 | 310 x 20/22 | unchanged style |
| - - - rating `2` `80:4695` | 326,206 | 42 x 20 | unchanged style (star at 326,208; "4.5" at 346,206) |
| - - `Frame 1000010559` `80:4698` (**new**) | 16,279 | 352 x 113 | AL-H gap 8, cross CENTER; two stat panels |
| - - - `Frame 1000010555` `80:4699` | 16,279 | 172 x 113 | AL-V gap 16 CENTER/CENTER, fill `#fbfbfb`, radius 24; "10+" Inter Medium 36 `#171c1a` (65 x 44 at panel 53.5,18) then label row (95 x 17 at 38.5,78, AL-H gap 4): `mdi-light:clock` 16 x 16 (`#707b76`) + "Experience" Inter Medium 14 `#707b76` |
| - - - `Frame 1000010556` `80:4705` | 196,279 | 172 x 113 | same; "2.5K+" (99 x 44 at 36.5,18); label row (75 x 17 at 48.5,78): `famicons:people-outline` 16 x 16 (4 vector strokes 1px `#707b76`) + "Patients" |
| - `Chip` `80:4714` | 272,16 | 94 x 23 | fill **`#eff6ff`**, radius 100, pad `4,8,4,8`; text **"CARDIOLOGY"** (characters are typed uppercase; `textCase ORIGINAL`) Inter Regular 12 **`#2563eb`**; 18 px from the right edge, 16 from the top |
| `Button` `80:4716` (FILL x HUG) | 0,405 | 384 x 76.73 | AL-V pad `16,16,16,16` gap 10, CENTER/CENTER; transparent |
| - `Button Usual Hover` `80:4717` (instance of set `80:4768`, state `Default`) | 16,421 | 352 x 44.73 | AL-H, `clip`, transparent (fill hidden) |
| - - `Buttons` `80:4770` (Primary) | 16,421 | 352 x 44.73 | fill `#0ca768`, radius 100, AL-H gap -24 CENTER/CENTER; label frame 183 x 20 at (74.61, 12.36) inside the button (pad `0,16,0,16`, `clip`) with "Get an Appointment" (text 151 x 20, Instrument Sans Regular 16 white); `arrow-right-s-line` frame 43.778 x 44.728 at x 233.61, pad `16,18,16,18`, radius 500, white chevron 7.778 x 12.728 at (18,16) |
| - - `Ellipse 51` `80:4771` (absolute) | 56.78,467 (inside the button: 40.78, 46) | 275 x 45 | solid `#ffffff`, blend **SOFT_LIGHT**, constraints STRETCH/MIN; lies **below** the 44.73 px button, hidden by the clip |

Text colours: in the Default variant main component both name and rating are `#171c1a`; the landing instances override name and rating to `#171717`. Use one value (`ink-800` `#171717`) in the app; the 6/5/3 per-channel delta is not visible.

#### 3.1.3 Rest -> hover: complete property delta (source for the recipe in 5.1)

| Layer (matched by name in Smart Animate) | Property | Rest `Variant2` | Hover `Default` |
|---|---|---|---|
| root | size | 384 x 502 | 384 x 481.73 (see 8.1 for the slot) |
| root | padding | 4 | 0 |
| root | main/cross align | CENTER/CENTER | MIN/MIN |
| root | clip | false | true |
| root | effects | none | DROP_SHADOW 0,-8 blur 20 #000 @ 5% |
| `Image Container` | x,y | 4,4 | 0,0 |
| `Image Container` / `Rectangle 16` | width | 376 | 384 |
| `Rectangle 3510` (gradient) | exists | no (fades **in**) | yes, SCREEN |
| `Info` | parent / x,y / size | root / 4,409 / 376 x 89 | Image Container / 0,190 / 384 x 218 (moves **up 219 px**) |
| `Info` | padding / gap | `16,8,16,8` / 16 | `16,16,16,16` / 16 |
| row `1` | x / width | 8 / 368 | 16 / 352 |
| name, qualification, rating | style | Instrument Sans 24 M / 16 R / 16 R | identical |
| stat panels | exists | no (fade **in**) | yes at y279 |
| `Chip` | x,y (in container) | 275,15 | 272,16 |
| `Chip` | size | 77 x 23 | 94 x 23 |
| `Chip` | fill | `#ffffff` | `#eff6ff` |
| chip text | string / family / colour | "Cardiology" / Instrument Sans / `#171c1a` | "CARDIOLOGY" / Inter / `#2563eb` (layer names differ, so Smart Animate cross-fades instead of tweening) |
| `Button` row | exists | no (fades **in**) | yes at y405, 384 x 76.73 |
| `Ellipse 51` (inside the CTA) | position | below the button | still below (its own hover moves it, 3.1.5) |

#### 3.1.4 View All - `Button Featured Hover` `80:1817`

Set `80:4763` (`Button Featured Hover`), variants: `Default` `80:4766` 43.778 x 44.728 (icon-only circle: only the `arrow-right-s-line` frame, `Buttons` fill `#0ca768` radius 100) and `Hovered` `80:4764` 113.778 x 44.728 (label frame + arrow). Only `Default` carries a reaction (`80:4767` ON_HOVER -> `Hovered`, SMART_ANIMATE EASE_OUT 0.3). **The landing uses the `Hovered` instance** (label "View All"), so on the landing it is a static, expanded pill; it has no hover reaction, only the click (5.3). The pill has no `Ellipse 51`.

#### 3.1.5 Nested CTA sheen - `Button Usual Hover` set `80:4768`

Default `80:4769` (113.778 x 44.728, `clip`, radius 0): `Ellipse 51` 37 x 45 at (40.778, 46), fill `#ffffff`, SOFT_LIGHT (below the button). `Hovered` `80:4772` (`clip`, **radius 100**): `Ellipse 51` **115 x 123 at (-1.222, -39.727)**, fill **`#bebebe`**, SOFT_LIGHT; constraints STRETCH (left/right offsets are kept, so on a 352-wide button the hovered ellipse is 353.2 x 123: left -1.222, right 0; the default one is left 40.778, right 36). Reaction on `Default`: ON_HOVER -> `Hovered`, SMART_ANIMATE EASE_OUT 0.3. Used by 5 buttons on the landing (hero x2, How-it-works x1, footer x2) and by the "Get an Appointment" CTA of the hovered card.

### 3.2 Hero - node `80:1755` (1460 x 915, clip)

- `Group 1000008961` `80:1756` at (-21,-52) 1502 x 1018 -> `Rectangle 3476` `80:1757` image fill (CROP `[[0.88,0,0.06],[0,0.895,0.156]]` + filters, see 2.3). Asset `public/assets/figma/landing-home/hero-field-bg.png` (612 x 408, RGBA, crop and colour grading baked in; **the bottom ~6% is transparent** - the crop reaches beyond the source - so the page colour shows in the last ~9 px of the hero). Reference code: `absolute h-[1018px] left-[-21px] top-[-52px] w-[1502px]` with `<img class="object-bottom size-full">`.
- Text block `Frame 1000012134` `80:1761`: 1200 x 303 at (130, 526), AL-H gap 340, main MIN / cross **MAX** (bottom aligned).
  - Left `80:1762`: 480 x 303 AL-V gap 24. Chip `80:1763` (181 x 33, pad `8,12,8,12`, radius 100, fill `#ffffff @20%`) "Welcome to Dococlock" Inter 14 tracking 0.28px white. Headline `80:1765` 563 x 246 at y57: Inter Medium 68, `#fffffd`, tracking 1.36px, text "Your Time.Your Health. " + newline + "Fully Controlled." (renders 3 lines: "Your Time.Your" / "Health." / "Fully Controlled.").
  - Right `Information Component` `80:1766` (instance `80:2149`): 387 x 140.73 at (820, 162.27), AL-V gap 36. `Typography` 380 x 60: "Powering privacy-first analytics for modern websites without compromising performance or compliance." (**placeholder copy from a web-analytics template**; see 8.3) Instrument Sans 16, white, tracking 0.32px. `Buttons` row 237.56 x 44.73 (AL-H gap 10): two `Button Usual Hover` (113.78 x 44.73 each): green Primary "Register" (`80:2152`) and white Secondary "Register" (`80:2153`, fill `#ffffff`, label `#202020`, sheen ellipse the same).
- The Navbar (`80:7430`) is drawn over the hero at (118, 26), see 3.3.

### 3.3 Navbar/Default - node `80:7430`

Component 1224 x 68.73 at (118,26) in the landing (`ABSOLUTE`, sizing FIXED x HUG): AL-H, pad `12,24,12,24`, gap 41, fill `#ffffff`, radius 500, **no stroke, no shadow**. Child `Frame 1000012133` 1176 x 44.73 (FILL), AL-H SPACE_BETWEEN, cross CENTER, three groups:

1. `loge` -> `Logo` 128 x 40 (AL-H gap 8): `Favicon` 40 x 40 (vector logo, gradient `#0ea5e9 -> #14b8a6`; asset `public/assets/figma/landing-pages/logo-favicon-40.svg`, same paths as this file's export) + word "Dococlock" Inter Regular 16 `#171717`.
2. Links `Frame 1000012131` 646 x 19 (AL-H gap **44**, cross CENTER): Doctor (52), Hospital (62), Lab&Diagnostic (119), Blogs (42), About us (68), Contact us (83), each Inter Regular 16 `#171717`, no underline/hover in the file.
3. `Frame 1000012132` 179.78 x 44.73 (AL-H gap 20): "Login" Inter Regular 16 `#171717` (46 x 19) + `Buttons` `326:13007` (variant `Gradient`, 113.778 x 44.728): fill linear `#3cbb8d -> #098d58` top-to-bottom (`gradientTransform [[0,1,0],[-1,0,1]]`), radius 100, label "Register" Instrument Sans 16 white + arrow frame 43.778 x 44.728 (radius 500) with white chevron; **the label is always visible** (no icon-only collapse).

Set `80:7429` `Navbar`: only variant `Variant2` (`80:7456`, 404 x 68.73, same structure with Login + a blue-gradient Register `#88beff -> #2e8cff` = legacy brand). The nav has **no reactions**.

### 3.4 Specialty row - `Group 18` `80:1767` (and the identical `Group 17` `80:1839`)

`Frame 1000008958` `80:1769` at (10,915): 1440 x 84, AL-V, pad `28,24,28,24`, fill `#ffffff`, no stroke. Inside: a wrapping AL-H row (`flex-wrap`, gap **72**, cross CENTER, full width). Six items (each AL-H gap 16, cross CENTER; items 4 and 6 are cross-aligned `MAX`): sparkle icon 24 x 24 + label Inter Regular 18 / 28 `#868887`. Labels in the file: "Medicne & Nephrology" (sic), "Dental Care", "Neurology", "Food & Nutrition", "Dental Care", "Food &Nutrition" (sic). Item 1 uses `Vector` 24 x 23.8 (`icon-sparkle.svg` in the repo, sha-identical); items 2-6 use `gemini-fill` 24 x 24 (asset `landing-home/icon-gemini-sparkle-24.svg`, fill `#868887`, clip 24 x 24). Both glyphs are the same four-point spark silhouette; `gemini-fill` is the name of a Google Gemini brand icon in an open icon set - see 8.4. The row is static (no marquee) in Figma.

### 3.5 How it works - `2nd Section` `80:1795` (1200 x 536.78)

AL-V gap 64, pad 0.
- `Header` `80:1796` 1200 x 165, AL-H **SPACE_BETWEEN**, cross CENTER. Left `Header` `80:1797` 790 x 165 AL-V gap 16: Eyebbrow "How it works" (`80:4668`) + title "Healthcare made simple with smarter appointment scheduling." (48/58, +2%, `#171c1a`, left aligned, 790 wide, 3 lines = 174). Right `80:1798` (`flex-row items-center self-stretch`) `Information Component` AL-V gap 36, `h-full`, main **MAX** (content bottom-aligned): `Typography` 380 wide "Delve high-quality consultations to patients / wherever they are." (Instrument Sans 16, `#707b76`, tracking 0.32px, 2 forced lines) + `Buttons` row with one `Button Usual Hover` = white **Secondary** "Register" 113.78 x 44.73 (fill `#ffffff`, label `#202020`).
- `Cards` `80:1799` 1200 x 307.78 at y229, AL-H gap 24, cross MIN. Three `Process Cards` (instances of `80:4731`, variants `Default` `80:4732` / `Variant3` `80:4737`): each AL-V, **pad 32**, radius 24, `self-stretch` (all 307.78 high), fills = white + `linear-gradient(#feffff 8.6904%, #e3e3e3 88.607%)` at these CSS angles (converted by the design-context tool from the Figma transform `[[0.616,0.635,-0.109],[-0.635,0.445,0.542]]`): card 1 **149.48deg**, card 2 **139.43deg**, card 3 **134.73deg**; no stroke, no shadow.
  - Card 1 `80:1800`: 507 wide, main SPACE_BETWEEN. Texts (AL-V gap 12): title "Find Specialists" (Instrument Sans Medium 24 `#171717`, box 180 wide) + body "Find the right Doctor to guide your healthcare journey." (16/22 `#707b76`, box 441 wide). Image `image 114` (aspect 520/193, full width, `process-card-1.png` sha-identical, rendered `h-[156.46%] left-[-0.01%] top-[-15.49%] w-[100.03%]` = cropped).
  - Card 2 `80:1801`: 349 wide, gap 24. Title "Get an Appointment" (box 180, wraps to 2 lines), body "Browse top-rated specialists and book your visit instantly.", image `process-card-2.png` (`object-cover`, aspect 520/193 = 285 x 106.5 inside).
  - Card 3 `80:1802`: 296 wide (fills the remaining `flex-1`), main SPACE_BETWEEN. Title "Track Your Live Serial" (box 192, 2 lines), body "Skip the waiting room and arrive exactly when it's your turn" (box 190), footer row (AL-H gap 20, cross CENTER): avatar stack (3 x 38 px circles r19, offsets x 0 / 11 / 28, `avatar-stack-1..3.png`) + "<15 Min Average Wait Time" (Inter Regular 16 `#171717`).

### 3.6 Transparency - `Frame 1000012728` `80:1818` (1460 x 1473)

AL-V gap **120**, cross CENTER, pad 0.
- `Header` (instance of `80:4667`, but only the title is shown) 1054 x 472: AL-V gap 16, **pad `120,0,120,0`**; text "DocOclock brings transparency to clinical visits. Track your live queue status from anywhere and access verified healthcare instantly." 48/58, +2%, `#171c1a`, **center**, four lines (4 x 58 = 232 + 240 = 472). No eyebrow.
- `Design` `80:1820` 803 x 642 (absolute children):
  - Photo `Rectangle 10` `80:1821`: 341 x 446 at (219.75, 40), radius **34**, two stacked image fills (bottom `badge-photo-1.png` 840x1200 - a woman doctor, and **top `doctor-card-1.png`/`badge-photo-2.png` 540x360 with FILL transform `[[0.96,0,0.02],[0,1,0]]`** = the man in a beige shirt that is actually visible in the design). The bottom fill is fully covered.
  - Badges = three `Years Experiece` frames (AL-V gap 16, cross CENTER, pad `44,16,44,16`, radius **20**, fill linear top-to-bottom `#fefffa -> #e6f7f0`, no shadow): "Live Queue Tracking" at (0.5, 80.49) 238 x 198 (sizing FIXED x HUG) - icon `fluent:people-queue-48-regular` 36 x 36 (asset `landing-home/icon-people-queue-36.svg`, fill `#077448`), text box 161 wide; "Digital Prescription" at (525.5, -21.51) 261 x 198 (icon `hugeicons:prescriptions` 36 x 36, `landing-home/icon-prescriptions-36.svg`, stroke `#077448`, text box 165); "BMDC Verified" at (401.5, 436.49) 224 x 190 (icon `Group` 28 x 28 with -1.79% inset, `landing-home/icon-bmdc-verified-badge-28.svg`, stroke `#077448`, text box 136). Title Instrument Sans Medium 24 `#171c1a` centered. No hover/float motion is defined in Figma (the app's float + parallax is an addition, keep it).
- `Values` `80:1835` 815 x 119, AL-H gap **90**, three `Values` (`80:2143`, AL-V gap 12, cross CENTER): number Instrument Sans Medium 70 `#171717` + label 16/22 `#707b76`. Values: "15+ / Years of Combined Experience", "5,000+ / Smiles Transformed", "100% / Smiles Transformed" (label 3 is a duplicate in Figma; the app already uses "Patient Satisfaction" - keep the app's).

### 3.7 Second specialty row - `Group 17` `80:1839`

Identical to 3.4 at (10, 3312.51). A hidden (invisible) text "Trusted by patients and clinics wo..." (Inter Medium 18 `#7c7f7e`, 358 x 22 at (547, 3274.51)) sits above it - `visible=false`, do not render.

### 3.8 Simplifying healthcare - `Frame 1000012147` `80:1866` (1200 x 855)

AL-V gap 80. `Header` `80:1867` 1200 x 223, AL-H gap 329, cross MAX: left `Header` 792 wide: Eyebbrow "How it works" + title "Simplifying healthcare appointments from booking to consultation." (48/58 +2%, 3 lines). Body `80:1870` 1200 x 552, AL-H gap 56, cross CENTER:
- Left column 570 wide, `py 32`, AL-V, content centred vertically; inner AL-V gap 28: four `Featured Tabs` (set `80:4670`, 570 x 50: gap 20 between text and rule): `active` = bullet 16 x 16 square `#0ca768` (radius 0) + text Instrument Sans Regular 24 (gap 16, pad `0,8,0,8`) then a 1 px `#d9d9d9` rule; `inactive` = text 24 `#707b76` (no bullet, text starts at x0 - the bullet+8 pad indent is not reserved) + 1 px `#d9d9d9` rule. Items: "Doctor Panel" (active, `#171717`), "Patient Panel", "Appointment Management", "Queue Tracker" (last one has **no rule** in the file). The rule stays grey for the active tab (it is not green).
- Right visual `80:1877` 577 x 552 radius 24, fill `#efefef` + image (`dashboard-mockup.png` 1091 x 722, CROP `[[0.438,0,0.505],[0,0.885,0.071]]`) - green-hills photo with a "Clean air" pin; inside it `Group 1000008928` `80:1878` at (83, 100.49): ghost card `Rectangle 3864` 405 x 349 at x98 (fill `#f4f4f4`, opacity 0.4, radius 36) and main card `Rectangle 3865` 435 x 375 at (83,110.49) (fill `#f9f9f9` + image `dashboard-mockup-2.png` 278 x 236, CROP `[[0.927,0,0.029],[0,0.941,0.03]]`, radius 36). No reactions: the tabs are not wired in the prototype.

### 3.9 Testimonials - `Frame 1000008959` `80:1881` (1206 x 1014)

AL-V gap 16, cross CENTER. `Header` 1206 x 165 (AL-H gap 329, cross MAX): left `Header` 670 wide: Eyebbrow "Testimonials" + title "What Our Patients / Say" (two paragraphs, 48/58 +2%). Below, `Frame 1000012726` `80:1885` 1440 x 833 at x -117 (wider than its parent): `80:1886` at (120, 106), AL-H **gap 36**, three columns:
- Col 1 `80:1887` 389 wide, AL-V gap 42: quote 1 (Inter 24 / 32, -3%, 5 lines, `#171717`), author (56 px avatar r28 `testimonial-avatar-rahul-sharma.png` + name "Rahul Sharma" Inter 24/32 at (64, 12)), photo 389 x 395 r32 (`testimonial-photo-rahul-sharma.png`, cover).
- Col 2 `80:1893` 351 wide, AL-V gap 63: quote 2 (6 lines), author "Natasha" (avatar `testimonial-avatar-natasha.png`), quote 3 (Inter 24 / **40**, 5 lines).
- Col 3 `80:1899` 389 wide, AL-V gap 60, main CENTER: quote 4 (3 lines - starts mid-sentence, cut by the fade), quote 5 (5 lines), author "Daniel Thomas" (avatar `testimonial-avatar-daniel-thomas.png`), photo 389 x 235 r32 (`testimonial-photo-daniel-thomas.png`).
- Top fade: `Rectangle 3408` `80:1906` 1440 x 151 at (0,0), fill `#f6f6f6`, `LAYER_BLUR 70` (CSS `blur(35px)`), drawn **over** the first ~106 px of the columns so the first lines fade out.
Text in the file is deliberately broken placeholder copy ("doctoe", "appointmet", "MediNova"); the app keeps real reviews (Home.tsx comment) - only layout/type are to be matched.

### 3.10 FAQ - `Frame 1000012112` `80:1907` (1200 x 677)

AL-V gap 72. `Header` 759 wide (Eyebbrow "Frequently Asked Questions" with text `#7c7b7b` + title "Everything you need to know about Dococlock." 48/58 +2%). List `80:1909` 1200 x 440, AL-V gap **16**, five rows (`1`-`5`): fill `#f5f5f5`, radius 12, pad **20**, AL-H gap 12, no stroke/shadow. Row 1 (open, 120 high): column (AL-V gap 12) question Instrument Sans Medium 20 `#171c1a` + answer Instrument Sans Regular 16 / 22 `#707b76` (leading space in the string), chevron slot 24 x 24. Rows 2-5 (closed, 64 high): question only, Medium 20 `#707b76`. Chevron: `arrow-right-s-line` 24 x 24 **rotated 90deg (points down)** in **both** states (fill `#171c1a` open / `#171717` closed; asset `landing-home/faq-chevron-right-24.svg`). No reactions.

### 3.11 Footer - node `80:1932` (1460 x 897.73, clip)

AL-V gap **120**, pad `64,0,64,0`, cross CENTER. Fills bottom-to-top: `#ffffff`; linear `#2e8cff -> #061535`; linear **`#302f34 -> #0a0a0a`** (all top-to-bottom, opacity 1, so only the last is visible). Decorative layers (absolute): `Rectangle 4995` at (2, -8.51) 1458 x 848, image `footer-bg.png` (CROP `[[0.953,0,0.031],[0,1,0]]`), blend **MULTIPLY**; `Group 1000009031` at (-668, -774.51) 2858 x 2199 (4 blurred circles `#0a1c42`/`#061535`, exported as `footer-texture.svg` 3000.8 x 2341.8 with the group's **opacity 0.4 and mix-blend exclusion baked in**), blend **EXCLUSION**.
- CTA band `80:1939` 808 wide, AL-V gap 28, cross CENTER: `Header` 759 wide (gap 16): Eyebbrow (no fill; bar + "Join to Dococlock" Instrument Sans 14 **white**) + title "Healthcare made simple with smarter appointment scheduling." (48/58 +2%, white, centered, 3 lines). `Information Component` (gap 36, 808 wide): blurb "Understand your audience without compromising their trust. Dococlock helps you grow with clarity, compliance, and confidence." (Instrument Sans 16, tracking 0.32px, **`#707b76`**, centered) + two buttons (gap 10, centred): Primary "Register" and Secondary (white) "Register" (both `Button Usual Hover`).
- Lower block `80:1942` 1200 wide, AL-V gap 120. Row `80:1944` AL-H gap 333: left 375 wide AL-V gap 28: logo row (AL-H gap 4: `atom-line` 50 x 50 = `logo-mark.svg`, sha-identical + "Dococlock" Inter Regular **28** white) and paragraph (16, `#707b76`, tracking 0.32px: "Dococlock is a privacy-first web analytics platform designed to deliver meaningful insights without collecting personal data." - template copy). Right 492 wide AL-V gap 28: line ` "Subscribe to receive thoughtful insights, health guidance, and our programs"` (16 `#707b76`) + pill `80:1953` (fill `#ffffff`, radius 100, pad `4,4,4,16`, AL-H SPACE_BETWEEN): "Email Address" Inter 16 `#2b2929` (box 134, centered) + `Buttons` Gradient "Subscribe" (`#3cbb8d -> #098d58`, radius 100, label + arrow frame 43.778 x 44.728). Bottom `80:1956`: one 16 px `#707b76` line (again the template paragraph).
- Footer has no link columns, no social icons, no copyright line in Figma.

### 3.12 Loose frames (List Page pieces, listed for completeness)

- `Text` `80:1747` (1460 x 105, AL-H SPACE_BETWEEN, pad `0,120,0,120`): left 684 wide gap 16 - legacy `Eyebrow` (116 x 31, pad `8,16,8,16`, radius 24, bar 17 x 6 radius 4 **`#56a2e8`** + "Specialists" Instrument Sans 12 **`#061535`** = legacy blue/navy) + "Find The Right Doctor" (Inter Medium 48, **capitalize**, black); right chip `2` 76 x 31 fill `#d9d9d9` radius 24 "Popular" Inter 12 black. Part of the List Page unit.
- `3` `80:1730` (251 x 237, AL-V, pad 20, gap 12, fill `#fdfdfd`, **border 1px `#f2f2f2`**, radius 24): header row "Choose Experience Range" (Inter 14 `#171717`, clock icon 14 x 14 `landing-home/experience-popover-time-14.svg`, row pad `8,0,8,0` gap 8) then four options (5 - 10 Years, Less than 1 Year, 1 - 5 Year, 10+ Years; Inter 14 `#171717`) each separated by a 211 x 1 divider (`landing-home/popover-divider-line-211.svg`, `#f9f9f9`). No reactions.

---

## 4. Components & variants used (snippet C run on `80:1754`)

| Component set (id) | Uses on the landing | Variants used | Properties / notes |
|---|---|---|---|
| `Doctor Card - Final` (`80:4685`) | 3 | `Property 1=Variant2` (`80:4718`, resting, the placed state) and `Property 1=Default` (`80:4686`, hover target) | Only two variants exist. Variant naming is inverted vs behaviour (Variant2 = rest, Default = hover). The `Default` variant exposes two boolean-like layers in the generated code (`showInfo`, `showButton`) = the stat row and the CTA row |
| `Button Usual Hover` (`80:4768`) | 5 (hero 2, how-it-works 1, footer 2) + 1 nested in the hovered card | `Default` (`80:4769`), `Hovered` (`80:4772`) | Wraps a `Buttons` instance (variant `Primary` green or `Secondary` white); hover moves/recolours `Ellipse 51` (3.1.5) |
| `Buttons` (`80:4641`) | 8 | `Primary` `80:4657` (`#0ca768`), `Secondary` `80:4642` (`#ffffff`, label `#202020`), `Gradient` `80:4662` (`#3cbb8d -> #098d58`) | 113.78 x 44.73 pill; label frame `mr -24`; arrow frame 43.778 x 44.728 radius 500. Primary used in hero/footer/cards, Secondary in hero/how-it-works/footer, Gradient in the navbar and footer Subscribe |
| `Button Featured Hover` (`80:4763`) | 1 | `Hovered` (`80:4764`) placed; `Default` (`80:4766`, icon-only) exists but is not placed | See 3.1.4 |
| `Tab` (`80:4680`) | 6 | `active` (`80:4681`) x1, `inactive` (`80:4683`) x5 | No reactions |
| `Featured Tabs` (`80:4670`) | 4 | `active` (`80:4671`) x1, `inactive` (`80:4677`) x3 (the 4th item is plain text) | No reactions |
| `Process Cards` (`80:4731`) | 3 | `Default` (`80:4732`, 505 x 315) x2 and `Variant3` (`80:4737`, 256 x 233) x1, all overridden to 507 / 349 / 296 x 307.78 | Gradient background per instance angle (3.5) |
| `Eyebbrow` (`80:4634`) | 6 | `Variant2` (`80:4637`, 137 x 33, no fill, bar + 14 px text) | `Variant 1` (195 x 36, white fill, 16 px) exists, unused here |
| `Header` (`80:4667`) | 7 | single | Eyebbrow + 48/58 title, 759 wide, AL-V gap 16 |
| `Information Component` (`80:2149`) | 3 | single | `Typography` (380 wide) + `Buttons` row; own ON_HOVER reactions x2 (the two nested `Button Usual Hover`) |
| `Values` (`80:2143`) | 3 | single | number 70 + label |
| `Typography` (`80:4747`) | 32 | `Paragraph - 16`, `Title - 24`, `Subtitle - 16`, `Title -  20`, ... | text wrappers |

---

## 5. Interactions

Global vocabulary (verified, flows.md section 0/7 and tokens.md 7): `SMART_ANIMATE` matches layers **by name** between the two states and tweens position, size, fill, radius, opacity and effects; layers with no match fade in (incoming) or out (outgoing). `EASE_OUT` = `cubic-bezier(0, 0, 0.58, 1)`. "While hovering" reactions revert to the source variant on mouse-leave. `GENTLE` is a Figma spring preset (constants not exposed). Keyframe motion (`get_motion_context`, recursive) on the landing frame `80:1754` and on the card set `80:4685`: **none** (`{"nodes":[]}`).

### 5.0 Reaction table (all 9 on the landing subtree + the component-level ones)

| # | Trigger | Source layer (id, name) | Action | Destination | Transition | What visually changes |
|---|---|---|---|---|---|---|
| 1 | ON_HOVER | `80:1814`, `80:1815`, `80:1816` `Doctor Card - Final` (instances; reaction inherited from `80:4718`) | CHANGE_TO | `80:4686` `Property 1=Default` | SMART_ANIMATE, EASE_OUT, **0.3 s** | Section 3.1.3 (full delta) |
| 2 | ON_CLICK | `I80:1817;80:4765` `Buttons` (View All) inside `Button Featured Hover` `80:1817` | NAVIGATE | `80:1482` List Page | SMART_ANIMATE, **GENTLE**, **1.022 s** | screen change; matched layers between Landing and List Page tween |
| 3 | ON_HOVER | `I80:1766;80:2152` (hero Register, green), `I80:1766;80:2153` (hero Register, white), `I80:1798;80:2153` (How-it-works Register, white), `I80:1941;80:2152` + `I80:1941;80:2153` (footer Registers) `Button Usual Hover` | CHANGE_TO | `80:4772` `Property 1=Hovered` | SMART_ANIMATE, EASE_OUT, 0.3 s | `Ellipse 51`: 37x45 below the button -> 115x123 covering it, fill `#ffffff` -> `#bebebe` (soft-light); root radius 0 -> 100 |
| 4 | ON_HOVER | component-level: `80:4769` Default of `Button Usual Hover` | CHANGE_TO | `80:4772` | same | same as 3 (this is the source of 3 and of the nested CTA in the hovered card) |
| 5 | ON_HOVER | component-level: `80:4718` Variant2 of the card set | CHANGE_TO | `80:4686` | same as 1 | same as 1 |
| 6 | ON_HOVER | component-level: `80:4767` (`Buttons` inside `Button Featured Hover` `Default` `80:4766`) | CHANGE_TO | `80:4764` Hovered | SMART_ANIMATE, EASE_OUT, 0.3 s | icon-only circle 43.778 x 44.728 -> pill 113.778 x 44.728 with the label revealed. **Not reachable on the landing** (the placed instance is already `Hovered`, whose Buttons has only the click reaction) |

The doctor-card `Default` variant has **no** reaction (the earlier note in flows.md 7 about a stale `Default -> Hovered` link is not present in the file any more: `80:4686` has none). Tab, Featured Tabs, navbar, process cards, badges, testimonials and FAQ rows have **no** reactions. Scroll-linked, load, in-view or timed triggers: **none**.

### 5.1 Doctor card hover (IMPLEMENTATION RECIPE) - the priority interaction

**What the designer specified**: hovering a card swaps it (SMART_ANIMATE, EASE_OUT, 300 ms) from a quiet photo card to an information card: the photo widens to the card edges (padding 4 -> 0), a gradient screened onto the lower part of the photo turns it into the page colour, the name / qualification / rating block **slides up 219 px into the photo**, the "10+ Experience" and "2.5K+ Patients" panels **fade in**, the specialty chip turns blue and upper-case, a green "Get an Appointment" CTA row **fades in** below the photo, and a faint upward shadow appears. Mouse-leave reverses it.

**Why a naive `scale()`/`translateY` hover is wrong here**: the card also changes photo width, chip fill/text/size, and adds three layers. The end states are fully specified numerically (3.1.1, 3.1.2), so build the two states as *the same DOM at two sets of coordinates* and transition the differences. All layers below live inside one fixed 384 x 502 slot (constant hit area = no flicker, no layout shift in the grid; the hovered card content is 481.73 tall, top-aligned, see 8.1).

**Timing**: every transition `300ms cubic-bezier(0, 0, 0.58, 1)`; nothing is staggered (Smart Animate runs all layer tweens in parallel). Mouse-leave uses the same curve/duration.

```css
/* index.css (or a CSS module). Colours as tokens where they exist; the literals below are Figma-fixed. */
:root { --ds-ease-out: cubic-bezier(0, 0, 0.58, 1); --ds-dur: 300ms; }

.dcf {                                   /* the slot: constant footprint = resting card */
  position: relative; flex: none; width: 384px; max-width: 100%; height: 502px; cursor: pointer;
}
.dcf__card {                             /* Figma root: r24, clip, drop shadow on hover */
  position: absolute; inset: 0 0 auto 0; height: 502px; border-radius: 24px; overflow: hidden;
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
  transition: filter var(--ds-dur) var(--ds-ease-out);
}
.dcf:hover .dcf__card, .dcf:focus-within .dcf__card {
  filter: drop-shadow(0 -8px 10px rgba(0, 0, 0, .05));   /* Figma DROP_SHADOW 0,-8 blur 20 #000 5% (filter blur = half) */
}

/* Image Container: (4,4) 376x405  ->  (0,0) 384x405 */
.dcf__media {
  position: absolute; left: 4px; top: 4px; width: 376px; height: 405px; border-radius: 24px; overflow: hidden; isolation: isolate;
  transition: left var(--ds-dur) var(--ds-ease-out), top var(--ds-dur) var(--ds-ease-out), width var(--ds-dur) var(--ds-ease-out);
}
.dcf:hover .dcf__media, .dcf:focus-within .dcf__media { left: 0; top: 0; width: 384px; }
.dcf__media > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* Rectangle 3510: absent -> screened gradient (top: alpha 0, 87.5%: #fafafa alpha 1) */
.dcf__fade {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(250, 250, 250, 0) 0%, #fafafa 87.5%);   /* #fafafa = page bg token */
  mix-blend-mode: screen;
  transition: opacity var(--ds-dur) var(--ds-ease-out);
}
.dcf:hover .dcf__fade, .dcf:focus-within .dcf__fade { opacity: 1; }

/* Info: y425/x12/w368 (below the photo)  ->  y206/x16/w352 (over the photo) */
.dcf__info {
  position: absolute; left: 12px; top: 425px; width: 368px;
  display: flex; align-items: flex-start; justify-content: space-between;
  transition: left var(--ds-dur) var(--ds-ease-out), top var(--ds-dur) var(--ds-ease-out), width var(--ds-dur) var(--ds-ease-out);
}
.dcf:hover .dcf__info, .dcf:focus-within .dcf__info { left: 16px; top: 206px; width: 352px; }
/* children: column (gap 8): name 24/29 medium, qualification 16/22; rating (gap 4): star 16 + 16px text */

/* Stat panels: absent -> present at (16,279) 352x113, fade in */
.dcf__stats {
  position: absolute; left: 16px; top: 279px; width: 352px; height: 113px; display: flex; gap: 8px;
  opacity: 0; pointer-events: none; transition: opacity var(--ds-dur) var(--ds-ease-out);
}
.dcf:hover .dcf__stats, .dcf:focus-within .dcf__stats { opacity: 1; }
.dcf__stat { flex: 1; border-radius: 24px; background: #fbfbfb /* ink-50 */; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px; }
.dcf__stat b { font: 500 36px/normal Inter, sans-serif; color: #171c1a; }
.dcf__stat span { display: inline-flex; gap: 4px; align-items: center; font: 500 14px/normal Inter, sans-serif; color: #707b76; }

/* Chip: two stacked pills that cross-fade (Figma: same-named frame tweens, differently named texts cross-fade) */
.dcf__chip { position: absolute; padding: 4px 8px; border-radius: 100px; white-space: nowrap; font-size: 12px; line-height: normal;
  transition: opacity var(--ds-dur) var(--ds-ease-out); }
.dcf__chip--rest  { right: 28px; top: 19px; background: #fff; color: #171c1a; font-family: 'Instrument Sans', sans-serif; opacity: 1; }
.dcf__chip--hover { right: 18px; top: 16px; background: #eff6ff; color: #2563eb; font-family: Inter, sans-serif; text-transform: uppercase; opacity: 0; }
.dcf:hover .dcf__chip--rest,  .dcf:focus-within .dcf__chip--rest  { opacity: 0; }
.dcf:hover .dcf__chip--hover, .dcf:focus-within .dcf__chip--hover { opacity: 1; }

/* CTA row: absent -> (0,405) 384x76.73, button (16,421) 352x44.73; fade in */
.dcf__cta { position: absolute; left: 16px; top: 421px; width: 352px; height: 44.728px; opacity: 0; pointer-events: none;
  transition: opacity var(--ds-dur) var(--ds-ease-out); }
.dcf:hover .dcf__cta, .dcf:focus-within .dcf__cta { opacity: 1; pointer-events: auto; }
/* the button itself: .btn-sheen (5.2), height 44.728, radius 9999, bg primary-500, label 16 Instrument Sans white, chevron svg 43.778x44.728 with margin-left:-24px */

@media (prefers-reduced-motion: reduce) {
  .dcf__card, .dcf__media, .dcf__fade, .dcf__info, .dcf__stats, .dcf__chip, .dcf__cta { transition-duration: 1ms; }
}
```

Layer stacking order (bottom to top), matching the Figma layer order of the Default variant: `.dcf__media` (photo, then `.dcf__fade`) -> `.dcf__info` -> `.dcf__stats` -> chips -> `.dcf__cta`. Put `.dcf__info`, `.dcf__stats`, chips and CTA as siblings *after* `.dcf__media` inside `.dcf__card` (not inside the overflow-hidden media, because the info block overhangs the 405 px media by 3 px and must not be clipped).

React mapping (no behaviour change; props come from the existing `Doctor` type - `name, specialty, degrees, imageUrl, rating, experienceYears, totalPatients`):

```tsx
// components/ui/DoctorCard.tsx : add a `reveal` mode next to `compact`; Home.tsx renders <DoctorCard reveal ... />
<div className="dcf" onClick={onClick} tabIndex={0} onKeyDown={/* Enter/Space -> onClick, as a11y equivalent of click */}>
  <div className="dcf__card">
    <div className="dcf__media"><img src={doctor.image} alt={doctor.name} /><div className="dcf__fade" /></div>
    <div className="dcf__info">
      <div className="min-w-0 flex flex-col gap-2">
        <p className="font-display font-medium text-[24px] text-ink-800 whitespace-nowrap">{doctor.name}</p>
        <p className="font-display text-[16px] leading-[22px] text-content-tertiary">{doctor.degrees || `MBBS, FCPS(${doctor.specialty.toUpperCase()})`}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0"><img src="/assets/figma/icon-star.svg" .../><span className="font-display text-[16px] text-ink-800">{doctor.rating || '4.5'}</span></div>
    </div>
    <div className="dcf__stats">
      <div className="dcf__stat"><b>{experienceYears}+</b><span><img src="/assets/figma/landing-pages/icon-clock-16.svg" />Experience</span></div>
      <div className="dcf__stat"><b>{formatPatients(totalPatients)}+</b><span><img src="/assets/figma/landing-pages/icon-people-outline-16.svg" />Patients</span></div>
    </div>
    <span className="dcf__chip dcf__chip--rest">{doctor.specialty}</span>
    <span className="dcf__chip dcf__chip--hover">{doctor.specialty}</span>
    <div className="dcf__cta"><button className="btn-sheen ..." onClick={(e) => { e.stopPropagation(); onCtaClick?.(); }}>Get an Appointment <img src="/assets/figma/booking-arrow-right-btn.svg" .../></button></div>
  </div>
</div>
```

`formatPatients(n)`: `n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n)`; Figma text "2.5K+". Keep the card `onClick` (current Home.tsx `onSelectDoctor?.(doc)`), keep the CTA calling the same handler (the app has no separate booking route from the home; `onSelectDoctor` opens the doctor profile where the booking wizard lives).

Touch / keyboard (Figma has no definition): hover does not exist on touch; recommended: `@media (hover: none)` keeps the resting card, tap = existing `onClick` (navigate to profile). `:focus-within` (already in the CSS above) gives keyboard users the same state. Flag in 8.2.

Mid-transition fidelity note: because Smart Animate matches by name, Figma tweens `Info` position/size and the `Chip` frame geometry; the two Info/Chip text layers with different names cross-fade. The recipe above reproduces the end states exactly and the mid-states closely (position/size tween + opacity cross-fades); it cannot be diffed frame-by-frame without playing the prototype (8.5).

### 5.2 Filled-pill CTA hover ("sheen") - `Button Usual Hover` `80:4768` (5 landing buttons + the card CTA + `Button.tsx`)

Figma sheen is **not a radial gradient**: it is a solid ellipse (`Ellipse 51`) blended `SOFT_LIGHT`, parked below the button, that on hover **slides up and grows over the whole pill and darkens to `#bebebe`**; the root's clip radius goes 0 -> 100. Property deltas (button 113.778 x 44.728; offsets are STRETCH constraints so they hold at any width):

| Property | Default | Hovered |
|---|---|---|
| ellipse left / right offset | 40.778 / 36 | -1.222 / 0 |
| ellipse top | 46 (= button height + 1.272) | -39.727 |
| ellipse height | 45 | 123 |
| ellipse fill | `#ffffff` | `#bebebe` |
| blend | soft-light | soft-light |

```css
.btn-sheen { position: relative; overflow: hidden; isolation: isolate; }
.btn-sheen::after {
  content: ''; position: absolute; left: 40.78px; right: 36px; top: calc(100% + 1.272px); height: 45px;
  border-radius: 50%; background: #fff; mix-blend-mode: soft-light; pointer-events: none;
  transition: left var(--ds-dur) var(--ds-ease-out), right var(--ds-dur) var(--ds-ease-out), top var(--ds-dur) var(--ds-ease-out),
              height var(--ds-dur) var(--ds-ease-out), background-color var(--ds-dur) var(--ds-ease-out);
}
.btn-sheen:hover::after { left: -1.22px; right: 0; top: -39.73px; height: 123px; background: #bebebe; }
```
This replaces the current `.btn-sheen::after` (radial-gradient at 30%/20%, opacity 0 -> 1, `0.3s ease`) in `index.css` lines 126-145. Selectors, names and the "apply to filled pills only" rule stay the same. On a white pill the sheen is invisible by construction (soft-light over white stays white); that is the Figma behaviour, not a bug. Colours here (`#fff`, `#bebebe`) are brand-independent literals.

### 5.3 "View All" click (`I80:1817;80:4765`)

ON_CLICK -> NAVIGATE `80:1482` (List Page), SMART_ANIMATE, spring **GENTLE**, **1.022 s**. App mapping: `onNavigate('/patient/doctors')` (List Page = `DoctorSearchView`). Page-level transition recipe (optional polish): wrap the navigation in `document.startViewTransition` (fallback: plain navigate) with `::view-transition-group(root) { animation-duration: 1022ms; animation-timing-function: <spring approximation> }`; a CSS `cubic-bezier(0.34, 1.2, 0.64, 1)` is a reasonable stand-in for a gentle spring (assumption, spring constants unknown). Priority: low; the button itself has no hover motion on the landing.

### 5.4 Tabs (`Tab` `80:4680`, six pills)

No reaction, no motion. State model: `active` = fill `#0ca768`, Inter Bold 16 white; `inactive` = fill `#ffffff`, Inter Regular 16 `#707b76`. Recipe (the app must invent the transition, per flows.md 7): `transition: background-color 300ms var(--ds-ease-out), color 300ms var(--ds-ease-out)`; do **not** animate `font-weight` (it changes the width); use `font-weight` swap only. Figma defines no hover style for inactive pills; the app's `hover:bg-ink-50` is an addition (8.6). Functional constraint: keep `onClick={() => setSelectedSpecialty(tab)}` and the `filteredDoctors` stem-match logic.

### 5.5 Everything else

`Featured Tabs`, FAQ rows, process cards, badges, testimonials, nav links: **no Figma motion**. Keep the app's existing behaviour (panel switch via `activePanel`, FAQ accordion via `openFaq`) and use the same token (`300ms cubic-bezier(0,0,.58,1)`) for any colour/opacity/height change. Non-Figma motion already in the app and **not** to be removed by this pass: specialty marquee (26 s linear), floating + mouse-parallax badges, count-up stats, `animate-fade-in` panel swap. All must honour `prefers-reduced-motion`.
