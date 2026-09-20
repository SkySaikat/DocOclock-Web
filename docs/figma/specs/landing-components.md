# landing-components - Landing component library (variants, hover states, interaction recipes)

Figma file `zJRyAML8hv0uEBOXtu5Hpn`, page `Web Version V1` (5:2), section `Components` (5:2401, 2589x4513). Every number below was read from Figma in this pass (`use_figma` read-only scripts, `get_design_context`, `get_metadata`, `download_assets`); values derived by arithmetic are labelled **(derived)**. Nothing was estimated from a screenshot. Prior docs: `docs/figma/tokens.md` (colours/type/radii/shadows) and `docs/figma/flows.md` (§7 lists the component-level reactions; this unit re-derives and corrects them, see §8).

Key facts up front:
- The section holds **14 component entries** (10 component sets + 4 single components: Information Component, Header, Values, User Card). Only **6 prototype reactions** exist in the whole section, all `ON_HOVER -> CHANGE_TO`, all `SMART_ANIMATE / EASE_OUT / 0.3 s`. `get_motion_context(recursive)` returns `{"nodes":[]}` (no keyframe animation anywhere).
- **Tab, Featured Tabs, Process Cards, Eyebbrow, Header, Values, Typography, Input Field, User Card, Information Component have no reactions of their own** and no hover/focus/error/filled variants. Their "states" are only the variants listed in §4.
- The Figma sheen on buttons is **not** a radial-gradient fade. It is a hard-edged, `SOFT_LIGHT`-blended **ellipse that slides up out of the bottom edge of the button while growing and turning from white to `#bebebe`**. The app's current `.btn-sheen` is a different effect (§5, §7).

## 1. Frames

Node type note: "set" = COMPONENT_SET frame (dashed purple border in the exports), "comp" = single COMPONENT. All exports are 2x PNGs from `download_assets(defaultScale 2)` because `get_screenshot` never upscales beyond 1x (the section shot is 0.65x, it is a 2589x4513 node). Export backgrounds are Figma's grey canvas showing through transparent set frames.

| node id | name | size | role in the product | prototype flow membership | reference PNG |
|---|---|---|---|---|---|
| `5:2401` | Components (section) | 2589x4513 | library section holding the 14 entries below | none (no flow starts here; PreLogin 1 `80:1754` instances these) | `docs/figma/reference/landing-components/components-section-5_2401.png` (1674x2880, 0.65x) |
| `80:4641` set | Buttons | 171x339.64 | pill CTA, 5 variants (Secondary, Tertiary, Sage, Primary, Gradient) | inherited by every CTA | `.../buttons-80_4641.png` |
| `80:4768` set | Button Usual Hover | 161.78x214.18 | Primary pill with sheen; Default `80:4769`, Hovered `80:4772` | reaction on Default `80:4769` | `.../button-usual-hover-80_4768.png` |
| `80:4763` set | Button Featured Hover | 161.78x149.46 | compact CTA: icon-only Default `80:4766` <-> label+icon Hovered `80:4764` | reaction on `80:4767` (Buttons instance in Default) | `.../button-featured-hover-80_4763.png` |
| `80:4680` set | Tab | 167x146 | category pill; `active` `80:4681` 63x43, `inactive` `80:4683` 67x43 | none | `.../tab-80_4680.png` |
| `80:4670` set | Featured Tabs | 610x174 | underlined list tab; `active` `80:4671`, `inactive` `80:4677` (570x50) | none | `.../featured-tabs-80_4670.png` |
| `80:4685` set | Doctor Card - Final | 424x1414 | doctor card; resting `Variant2` `80:4718` 384x502, hover `Default` `80:4686` 384x481.73 | reaction on `80:4718`; inner CTA `80:4717` has its own | `.../doctor-card-final-80_4685.png` (848x2828) |
| `80:4731` set | Process Cards | 560x612 | "How it works" card; `Default` `80:4732` 505x314.68, `Variant3` `80:4737` 256x233 | none | `.../process-cards-80_4731.png` |
| `80:4634` set | Eyebbrow (sic) | 221x126 | section eyebrow; `Variant 1` `80:4635` 195x36, `Variant2` `80:4637` 137x33 | none | `.../eyebbrow-80_4634.png` |
| `80:4667` comp | Header | 759x339 | eyebrow + 48px heading block | none | `.../header-80_4667.png` |
| `80:2149` comp | Information Component | 387x140.73 | paragraph + two Button Usual Hover CTAs | reactions `80:2152`, `80:2153` | `.../information-component-80_2149.png` |
| `80:2143` comp | Values | 226x119 | big stat number + caption | none | `.../values-80_2143.png` |
| `80:4747` set | Typography | 481x396 | 7 text styles (the only "type styles" in the file) | none | `.../typography-80_4747.png` |
| `80:4937` set | Input Field | 436x640 | 5 variants Text, Simple, Numeric, Drop Down, Upload | none | `.../input-field-80_4937.png` |
| `80:2891` comp | User Card | 763x102 | experience row card (hospital + date + eyebrow) | none | `.../user-card-80_2891.png` |

Component usage map (snippet C over the section): `Typography` used 18x (inside Information Component, Process Cards, Doctor Card - Final, Values, Input Field, User Card); `Buttons` 7x (inside Information Component, Button Featured Hover, Button Usual Hover, Doctor Card - Final); `Button Usual Hover` 3x (Information Component x2, Doctor Card Default x1); `Eyebbrow` 1x (Header). Note: a different `User Card` (`368:15036`, dashboard) exists in the dashboard Components section; `80:2891` is the landing one.

## 2. Design tokens used

Colours (variable names are the ones in collection `Texts`, see tokens.md §1.1) and the app mapping. "exact" = equal to an existing value.

| Where used here | Value | Figma variable | App token | Status |
|---|---|---|---|---|
| Primary button fill, active Tab fill, sheen host, Featured tab marker, Eyebrow marker | `#0ca768` | `Accent/Accent-500` (Buttons Primary is bound to `Accent Color` `VariableID:317:13341`) | `primary-500` / `medical-500` (`--color-primary-500`) | exact, themed |
| Gradient button stop 1 -> stop 2 | `#3cbb8d` -> `#098d58` | `Accent/Accent-400` -> `Accent-600` | `from-primary-400 to-primary-600` | exists, but tokens.md 1.3: app 400 (`#55c195`) is Δ25 off unless the tint fix D3 lands |
| Heading, names, labels, Featured-tab active title, stat numbers | `#171c1a` | `Text/Primary` | NEW `content-primary` | NEW TOKEN NEEDED (nearest `ink-800` `#171717`) |
| Body paragraphs, qualification, captions, inactive Tab text, inactive Featured tab title, placeholder text, eyebrow text | `#707b76` | `Text/tertiary` | NEW `content-tertiary` | NEW TOKEN NEEDED (nearest `ink-500` `#909090` is Δ32) |
| Secondary/Tertiary button label | `#202020` | literal (unbound) | none exact (`ink-800` Δ9) | fixed neutral; use `text-[#202020]` or `text-ink-800` (decision D-LC-3) |
| Secondary button fill, Tab inactive fill, Search/Input Box fill, Eyebbrow Variant 1 fill, Process Card fill, sheen start colour | `#ffffff` | literal | `white` | exact |
| Sheen ellipse end colour (Hovered) | `#bebebe` (r=g=b=0.7451) | literal | none | fixed, brand-independent blend colour, keep literal (comment it) |
| Featured-tab rule (both states) | `#d9d9d9` | literal | `ink-300` | exact |
| Doctor Card stat panels | `#fbfbfb` | literal | `ink-50` | exact |
| Doctor Card hover gradient overlay | `#fafafa` (alpha 0 -> 1) | literal | Tailwind `neutral-50` / proposed `page` | exact; blend `SCREEN` |
| Doctor Card hover chip | fill `#eff6ff`, text `#2563eb` | literals | Tailwind `blue-50` / `blue-600` | exact; already used by the app's non-compact DoctorCard chip |
| Rating star | `#f59e0b` | literal | Tailwind `amber-500` | exact |
| Numeric input phone-code chip | `#f5f5f5` | literal | Tailwind `neutral-100` | exact |
| User Card fill | `#fafafa` | literal | `neutral-50` / `page` | exact |
| Calendar icon in Drop Down (hidden by default) | `#909090` | literal | `ink-500` | exact |
| Tertiary button stroke | `#171c1a` 1px INSIDE | `Text/Primary` | `content-primary` | NEW |
| Sage button stroke | `#ffffff` 1px INSIDE | literal | white | exact |

Type styles (all read from nodes; family/size/weight/line-height/letter-spacing):

| Style (component) | Font | Size | Weight | Line-height | Letter-spacing | Colour |
|---|---|---|---|---|---|---|
| Button label (Buttons, all variants) | Instrument Sans | 16 | Regular 400 | auto | 0 | `#202020` (Secondary, Tertiary) / `#fff` (Sage, Primary, Gradient) |
| Tab active | **Inter** | 16 | Bold 700 | auto | 0 | `#fff` |
| Tab inactive | **Inter** | 16 | Regular 400 | auto | 0 | `#707b76` |
| Featured Tabs title | Instrument Sans | 24 | Regular 400 | auto | 0 | active `#171c1a`, inactive `#707b76` |
| Eyebbrow Variant 1 text | Instrument Sans | 16 | Regular | auto | 0 | `#707b76` |
| Eyebbrow Variant2 text | Instrument Sans | 14 | Regular | auto | 0 | `#707b76` |
| Header H | Instrument Sans | 48 | Regular | **58 px** | **2 % = 0.96 px** | `#171c1a` |
| Doctor Card name | Instrument Sans | 24 | Medium 500 | auto | 0 | `#171c1a` |
| Doctor Card qualification | Instrument Sans | 16 | Regular | **auto (20 px box)** (see §8 O-LC-3) | 0 | `#707b76` |
| Doctor Card rating value | Instrument Sans | 16 | Regular | auto | 0 | `#171c1a` |
| Doctor Card chip (resting) | Instrument Sans | 12 | Regular | auto | 0 | `#171c1a` |
| Doctor Card chip (hover) | **Inter** | 12 | Regular | auto | 0 | `#2563eb`, text uppercase literally ("CARDIOLOGY") |
| Doctor Card stat number ("10+", "2.5K+") | **Inter** | 36 | Medium 500 | auto | 0 | `#171c1a` |
| Doctor Card stat label | **Inter** | 14 | Medium 500 | auto | 0 | `#707b76` |
| Process Card title | Instrument Sans | 24 | Medium | auto | 0 | `#171c1a` |
| Process Card body | Instrument Sans | 16 | Regular | 22 px | 0 | `#707b76` |
| Process Card Variant3 student caption ("10K+ Student") | **Inter** | 16 | Regular | auto | 0 | `#171c1a` |
| Values number ("15+") | **Inter** | 70 | Medium | auto (85 px box) | 0 | `#171c1a`, centered |
| Values caption | Instrument Sans | 16 | Regular | 22 px | 0 | `#707b76` |
| Information Component paragraph | Instrument Sans | 16 | Regular | auto | **2 % = 0.32 px** | `#707b76` |
| Input label ("Name") | Instrument Sans | 16 | Medium | auto | 0 | `#171c1a` |
| Input label in Numeric/Drop Down/Upload (Typography Subtitle-16 instance) | Instrument Sans | 16 | Regular | 22 px | 0 | `#171c1a` |
| Input placeholder Text/Simple | Instrument Sans | 12 | Regular | auto | 0 | `#707b76` |
| Input placeholder Drop Down/Upload ("Choose") | Instrument Sans | 14 | Regular | auto | 0 | `#707b76` |
| Phone code "+880" | Instrument Sans | 12 | Regular | auto | 0 | `#707b76` |
| User Card title / date / eyebrow | Instrument Sans | 16 (lh 22) / 12 Medium / 14 Medium | Regular / Medium / Medium | 22 px / auto / auto | 0 | `#171c1a` / `#707b76` / `#707b76` |
| Typography set (7 variants) | Instrument Sans | Paragraph-16 (Regular, ls 2 %, `#707b76`), Title-24 (Medium), Value-14 (Medium), Button Text-16 (Medium), Subtitle-16 (Regular, lh 22, `#707b76`), Title-20 (Medium), Small-12 (Medium) | see left | auto unless noted | 0 unless noted | `#171c1a` unless noted |

Radii: 100 (all pills, Tab, Eyebbrow Variant 1 fill, chips, Buttons), 500 (arrow frame inside Buttons; irrelevant, it has no fill), 24 (Doctor Card, Process Cards, User Card, Doctor Card stat panels, image), 8 (Input `Search` boxes), 4 (phone-code chip), 19 (38px avatars), 0 (Eyebrow marker bar and Featured Tabs 16x16 marker, both square).

Shadows: Doctor Card `Default` (hover) `DROP_SHADOW 0,-8, blur 20, spread 0, rgba(0,0,0,0.05)` = **NEW TOKEN NEEDED `shadow-ds-doctor-hover: 0 -8px 20px 0 rgba(0,0,0,0.05)`** (tokens.md §4.1; `get_design_context` prints `drop-shadow(0 -8px 10px)` because CSS `drop-shadow()` blur = half the Figma radius; for `box-shadow` use 20px). Input boxes `DROP_SHADOW 0,0, blur 1, 0.25` = existing `shadow-ds-input` (exact). No other component has a shadow.

Motion tokens: every reaction is `SMART_ANIMATE`, easing `EASE_OUT` = **CSS keyword `ease-out` = `cubic-bezier(0, 0, 0.58, 1)`** (identical), duration **0.3 s = 300 ms**. Proposed shared vars from tokens.md §9: `--ds-ease-out`, `duration-ds-fast`.

## 3. Per-frame layout spec

Conventions: `H`/`V` = horizontal/vertical auto-layout; `pad t,r,b,l`; `gap`; `main/cross` alignment; `@x,y` = position in the parent (px); sizes `WxH`. All fonts Instrument Sans unless written.

### 3.1 Buttons `80:4641` (5 variants, all 113.78x44.73, root H, gap **-24**, CENTER/CENTER, r100, pad 0)
Children (identical in all variants): label frame (94x20 @0,12.36, H, pad `0,16,0,16`, gap 10, CENTER/CENTER; clips content only in Primary/Gradient) holding the text "Register" (62x20 @16,0), then arrow frame `arrow-right-s-line` (43.78x44.73 @70,0, H, pad `16,18,16,18`, r500, no fill) holding a 7.78x12.73 chevron vector @18,16. The label frame overlaps the arrow frame by 24 px (gap -24), so width = 94 - 24 + 43.78 = **113.78**.

| Variant | id | Fill / stroke | Label colour | Chevron colour / asset |
|---|---|---|---|---|
| Secondary | `80:4642` | fill `#fff` | `#202020` | `#171c1a` -> `public/assets/figma/landing-components/button-arrow-dark.svg` |
| Tertiary | `80:4647` | no fill, stroke 1 `#171c1a` INSIDE | `#202020` | `#171c1a` -> same dark asset |
| Sage | `80:4652` | no fill, stroke 1 `#fff` INSIDE (for dark backgrounds) | `#fff` | white -> `public/assets/figma/booking-arrow-right-btn.svg` |
| Primary | `80:4657` | fill `#0ca768` | `#fff` | white asset |
| Gradient | `80:4662` | linear top->bottom `#3cbb8d` (0) -> `#098d58` (1) (gradientTransform `[[0,1,0],[-1,0,1]]` = CSS `to bottom`) | `#fff` | white asset |

Tailwind from design context (Primary): root `flex items-center justify-center rounded-[100px] bg-[#0ca768]`; label frame `flex items-center justify-center mr-[-24px] px-[16px] overflow-clip`; label `font-['Instrument_Sans'] font-normal text-[16px] leading-[normal] text-white`; arrow `h-[44.728px] w-[43.778px]` holding the exported svg (the svg already includes the 18/16 padding, viewBox 43.7782x44.7279, white `#fff` path `M22.9498 22.364L18 17.4142L19.4142 16L25.7782 22.364L19.4142 28.7279L18 27.3137L22.9498 22.364Z`). No shadow, no hover colour change on any variant.

### 3.2 Button Usual Hover `80:4768`
Root (both variants) 113.78x44.73, H, no padding, **clipsContent = true**, fill hidden. Default `80:4769`: root radius **0**; Hovered `80:4772`: root radius **100**. Children in z-order: (1) `Buttons` instance = Primary (`80:4657`), 113.78x44.73; (2) `Ellipse 51` (absolute, `SOFT_LIGHT`, constraints horizontal STRETCH, vertical MIN):

| | x (left) | y (top) | w | h | right inset | fill |
|---|---|---|---|---|---|---|
| Default | 40.78 | **46** (outside the 44.73 high button, so invisible) | 37 | 45 | 36 (113.78-40.78-37) | `#ffffff` |
| Hovered | **-1.22** | **-39.73** | 115 | 123 | 0 | `#bebebe` |

Because of the STRETCH constraint the ellipse is `left/right`-anchored: on a wider button (e.g. the 352 px CTA in the Doctor Card) the Default ellipse is `left 40.78 / right 36` (=275 wide) and the Hovered one `left -1.22 / right 0` (=353.2 wide), height fixed 45 -> 123. No other property differs (snippet B: 7 diff rows, all on `Ellipse 51` plus root radius).

### 3.3 Button Featured Hover `80:4763`
Root H, no padding, no clip. Both variants contain one `Buttons` instance = Primary. Default `80:4766`: root **43.78x44.73**, the instance has **only the arrow frame** (the label frame does not exist), so it is an icon-only pill of 43.78x44.73 with r100 (the radius clamps to half the short side, so it renders as a circle; the 0.95 px width/height difference is Figma's own). Hovered `80:4764`: root **113.78x44.73** = full Primary button (label frame `Frame 1000012737` 94x20 @0,12.36 + arrow frame @70,0). Fill `#0ca768` both. The arrow frame keeps its name `arrow-right-s-line` in both states (that is what SMART_ANIMATE matches); the label frame appears only in Hovered.

### 3.4 Tab `80:4680`
`active` `80:4681`: 63x43 (**width is FIXED 63**, `w-[63px]`), V, pad `12,24,12,24`, CENTER/CENTER, r100, fill `#0ca768` (Accent-500 bound), text "All" **Inter Bold 16** white, text box 21x19 @21,12 (so the pad shrinks to 21 because the width is fixed). `inactive` `80:4683`: 67x43 (hug: 19 + 2*24 = 67), same padding/radius, fill `#fff`, text **Inter Regular 16** `#707b76` (Text/tertiary bound), 19x19 @24,12. Height = 12 + 19 + 12 = **43**.

### 3.5 Featured Tabs `80:4670` (both variants 570x50, V, no padding, gap 20)
- `active` `80:4671`: child `Frame 1000012070` 570x50 (V, gap 20) = [`Frame 1000012069` 191x29 (H, pad `0,8,0,8`, gap 16, cross CENTER) holding `Rectangle 3852` **16x16 square @8,6.5 `#0ca768`** then title "Doctor Panel" Regular 24 `#171c1a` 143x29 @40,0] + `Rectangle 3853` **570x1 @0,49 `#d9d9d9`**.
- `inactive` `80:4677`: title "Patient Panel" Regular 24 `#707b76` **570x29 @0,0 (no side padding, no marker)** + `Rectangle 3854` 570x1 @0,49 `#d9d9d9`.
So the active title starts at x=40 and the inactive one at x=0. The rule colour is `#d9d9d9` in BOTH states (there is no green underline).

### 3.6 Eyebbrow `80:4634`
- `Variant 1` `80:4635`: 195x36, H, pad `8,12,8,12`, gap 10, CENTER/CENTER, r100, fill `#fff`; text "Welcome to Dococlock" Regular **16** `#707b76` (171x20). Used on the hero.
- `Variant2` `80:4637`: 137x33, H, pad `8,12,8,12`, gap 10, CENTER/CENTER, r100, **no fill**; `Rectangle 3746` **21x8 `#0ca768`, radius 0 (square bar, confirmed in the 2x export)** @12,12.5; text "How it works" Regular **14** `#707b76` (82x17 @43,8).

### 3.7 Header `80:4667`
V, gap 16, width 759 (hug height 339), children: `Eyebbrow` instance (Variant2, 137x33) then the heading text 759x290 @0,49: Instrument Sans Regular **48 / line-height 58 px / letter-spacing 2 % (0.96 px)**, `#171c1a`, 5 lines in the demo. Design context prints four `<p className="leading-[58px]">` lines because the sample text has hard line breaks; the real block is left-aligned, wraps at 759.

### 3.8 Information Component `80:2149`
V, gap **36**, width 387: `Typography` 380x60 (Paragraph 16: Regular 16, auto, ls 0.32 px, `#707b76`), then `Buttons` frame (H, gap **10**, 237.56x44.73 @0,96) with two `Button Usual Hover` instances 113.78x44.73: `80:2152` = Primary sheen button (fill `#0ca768`, white "Register"), `80:2153` = the same wrapper but with the nested `Buttons` swapped to **Secondary** (fill `#fff`, label `#202020`, chevron `#171c1a`). Both keep `Ellipse 51` (37x45 @40.78,46, `SOFT_LIGHT`, `#fff`).

### 3.9 Process Cards `80:4731`
- `Default` `80:4732`: 505x314.68, V, **pad 32**, gap **24**, r24, fill `#fff` (a hidden stroke `#b24e4e` 1px INSIDE exists, ignore), no shadow. Children: `Texts` (441x63, V, gap 12) = title "Find Specialists" (Typography Title-24, Medium 24 `#171c1a`, 180x29) + body (Subtitle-16: 441x22, Regular 16 / lh 22, `#707b76`); then `image 114` **441x163.68** @32,119 (IMAGE fill, scaleMode CROP, hash `bf1365e4...`, design context: `aspect-[520/193] w-full` container, `<img class="absolute h-[156.46%] left-[-0.01%] top-[-15.49%] w-[100.03%]">`) = `public/assets/figma/process-card-1.png` (existing, 843x488).
- `Variant3` `80:4737`: 256x233, V, pad 32, gap 24, r24, fill `#fff`. `Texts` 192x107 (V, gap 12): title "Get Consultancy" (192 wide) + 3-line body (190x66, Regular 16 / lh 22, lines "Steamline your daily / operations and savehous / every week." as typed in Figma - copy typos are content, ignore). Then `Frame 53` 146x38 (H, gap 20, cross CENTER) = `Group 52` 66x38 of three **38x38 circular avatars (r19, IMAGE FILL)** at x = 0 / 11 / 28 (overlaps 27 then 21 px, **not** a uniform step; hidden 1px strokes) + text "10K+\nStudent" (**Inter Regular 16** `#171c1a`, 60x38). Avatars = `avatar-stack-1..3.png` (existing).
- On the landing (frame `80:1795`) the instances are 507 / 349 / 296 wide x 307.8; those are instance overrides owned by the landing-home unit.

### 3.10 Values `80:2143`
V, gap **12**, main MIN / cross CENTER, 226x119: number "15+" **Inter Medium 70**, auto lh (226x85), centered, `#171c1a`; caption "Years of Combined Experience" (Typography Subtitle-16, Regular 16 / lh 22, `#707b76`, 226x22 @0,97).

### 3.11 Typography `80:4747`
7 text variants listed in the §2 table (sizes 380x60, 180x29, 58x17, 73x20, 441x22, 180x24, 180x15). There are **no Figma text styles** (tokens.md §0); this set is the only type "scale".

### 3.12 Doctor Card - Final `80:4685`
**Variant2 (resting) `80:4718`**: 384x502, V, **pad 4** (all sides), main/cross CENTER, r24, no fill, no shadow, no clip. Children:
1. `Image Container` 376x405 @4,4 containing `Rectangle 16` 376x405 r24 (IMAGE fill `c9f6e528...`, scaleMode CROP, transform `[[1,0,-0.0011],[0,0.8446,0.0002]]`; CSS: `<img class="absolute h-[118.4%] w-full left-[0.11%] top-[-0.02%] max-w-none">` inside an `overflow-hidden rounded-[24px]` box) and `Chip` 77x23 @**275,15** (H, pad `4,8,4,8`, r100, fill `#fff`, text "Cardiology" Instrument Sans Regular 12 `#171c1a`, 61x15). Photo asset = existing `public/assets/figma/doctor-card-2.png` (961x1200, sha `e4d770c7...`).
2. `Info` 376x89 @4,409 (V, **pad `16,8,16,8`**, gap 16) -> row `1` 368x57 (H, `SPACE_BETWEEN`, gap 126) = left column (V, gap 8, 326x57: name Medium 24 `#171c1a` 29 high; qualification "MBBS, FCPS(CARDIOLOGY)" Regular 16 `#707b76` 20 high) + right `2` 42x20 (H, gap 4, cross CENTER: 16x16 amber star `#f59e0b` (asset `icon-star.svg`, inset `0 2.45% 9.55% 2.45%`) + "4.5" Regular 16 `#171c1a`).

**Default (hover) `80:4686`**: 384x**481.73**, V, no padding, r24, **clipsContent true**, `DROP_SHADOW 0,-8, r20, rgba(0,0,0,.05)`, no fill. Children:
1. `Button` 384x76.73 @0,405 (V, **pad 16**, CENTER/CENTER, gap 10) holding a `Button Usual Hover` instance 352x44.73 (@16,16, clip) whose `Buttons` (Primary, flex-1 = 352 wide) shows the label **"Get an Appointment"** (Regular 16 white; label frame 183x20, text 151x20) centered with the chevron (label frame @74.61, arrow frame @233.61) and the Default `Ellipse 51` (275x45 @40.78,46, `SOFT_LIGHT` `#fff`, ABS).
2. `Image Container` 384x405 @0,0: `Rectangle 16` **384**x405 r24 (same fill/crop as Variant2); `Rectangle 3510` **384x405 gradient overlay, blend `SCREEN`**: linear top->bottom (`[[0,1,0],[-1,0,1]]`), stop 0 = `#fafafa` alpha **0**, stop 0.875 = `#fafafa` alpha **1** (CSS `linear-gradient(to bottom, rgba(250,250,250,0), #fafafa 87.5%)`); `Info` 384x218 @**0,190** (V, **pad 16**, gap 16) = row `1` 352x57 (H `SPACE_BETWEEN`; left column `3` 310x57 name+qualification identical text styles; right `2` rating 42x20) + `Frame 1000010559` 352x**113** (H, gap **8**, cross CENTER) = two stat panels 172x113 (fill `#fbfbfb`, **r24**, V, gap 16, CENTER/CENTER): number **Inter Medium 36** `#171c1a` (65x44 / 99x44) over a row (H, gap 4) of a 16x16 icon + label **Inter Medium 14** `#707b76`. Icons: `mdi-light:clock` -> `public/assets/figma/landing-pages/icon-clock-16.svg`; `famicons:people-outline` -> `public/assets/figma/landing-pages/icon-people-outline-16.svg` (both exist, shared with the landing-pages unit); `Chip` **94x23 @272,16**, fill `#eff6ff`, r100, pad `4,8`, text "CARDIOLOGY" **Inter Regular 12 `#2563eb`**.

### 3.13 Input Field `80:4937` (all boxes named `Search`, fill `#fff`, r8, shadow `0 0 1px rgba(0,0,0,.25)`)
- `Text` `80:4938` and `Simple` `80:4942` (identical, 388x75, V, gap 8): label "Name" Medium 16 `#171c1a` (45x20) + box 388x47 (H, **pad 16**, gap 4, cross CENTER) with placeholder "Your Name" Regular 12 `#707b76` (61x15). Height = 20 + 8 + 47 = 75.
- `Numeric` `80:4946` 680x84 (V, gap 8 -> inner `2` V gap 10): label "Phone Number" (Typography Subtitle-16: Regular 16 / lh 22 `#171c1a`) + box 680x52 (H, **pad 12**, gap 8) = chip `Left` 57x28 (fill `#f5f5f5`, r4, pad 4, "+880" Regular 12 `#707b76` + a 20x20 chevron-down (`arrow-up-s-line` flipped vertically, asset `dashboard-components/icon-dropdown-arrow-up.svg`)) then a 13 px vertical divider (`Line 59`, stroke 1 `#707b76`, rotated 90 deg, 13x0). The number text itself is not designed (no placeholder node).
- `Drop Down` `80:4955` 388x76 and `Upload` `80:4965` 388x76: label (Subtitle-16 instance: "Dropdown" / "Upload") + box 388x44 (H, `SPACE_BETWEEN`, pad `12,16,12,16`, gap 8) = "Choose" Regular 14 `#707b76` + trailing 20x20 slot: Drop Down = chevron-down (flipped `arrow-up-s-line`, `#707b76`) and a **hidden** 16x16 `calendar-2-line` (`#909090`, `showCalendarIcon` = false by default) -> `landing-components/input-field-calendar-icon.svg`; Upload = 20x20 upload glyph `Group 24` (`#707b76`) -> `landing-components/input-field-upload-icon.svg`.
- Component properties exposed: `showArrow`, `showCalendarIcon`, `showLabel` (booleans) plus the `Property 1` variant.

### 3.14 User Card `80:2891`
763x102, V, **pad 16**, gap 8, r24, fill `#fafafa`. `Header` 731x45 (H, `SPACE_BETWEEN`, gap 28, cross CENTER) = title "Apollo Hospital" (Regular 16 / lh 22 `#171c1a`, 441 wide box) and date "Nov 2024 - Feb 2025 " (Medium 12 `#707b76`, **fixed 58 wide so it wraps to 3 lines in the sample**; a real implementation should not fix 58) ; below `Typography` "Eyebrow" (Medium 14 `#707b76`, 58x17).

## 4. Components & variants used

| Component set / comp (id) | Variant property | Values (node) | Nested components |
|---|---|---|---|
| Buttons (`80:4641`) | `Property 1` | Secondary `80:4642`, Tertiary `80:4647`, Sage `80:4652`, Primary `80:4657`, Gradient `80:4662` | - |
| Button Usual Hover (`80:4768`) | `Property 1` | Default `80:4769`, Hovered `80:4772` | Buttons=Primary (swappable, e.g. Secondary in `80:2153`) |
| Button Featured Hover (`80:4763`) | `Property 1` | Hovered `80:4764`, Default `80:4766` | Buttons=Primary (label layer removed in Default) |
| Tab (`80:4680`) | `Property 1` (boolean-like: `active`/`inactive`) | active `80:4681`, inactive `80:4683` | - |
| Featured Tabs (`80:4670`) | `Property 1` | active `80:4671`, inactive `80:4677` | - |
| Doctor Card - Final (`80:4685`) | `Property 1` + booleans `showButton`, `showInfo` | Variant2 (resting) `80:4718`, Default (hover) `80:4686` | Typography x2 (Title-24, Subtitle-16), Button Usual Hover (Default only) |
| Process Cards (`80:4731`) | `Property 1` | Default `80:4732`, Variant3 `80:4737` | Typography x2 |
| Eyebbrow (`80:4634`) | `Property 1` | Variant 1 `80:4635`, Variant2 `80:4637` | - |
| Header (`80:4667`) | boolean `showEyebbrow` | single | Eyebbrow Variant2 |
| Information Component (`80:2149`) | booleans `showButton1`, `showButton2`, `showButtons` | single | Typography (Paragraph-16), Button Usual Hover x2 |
| Values (`80:2143`) | - | single | Typography Subtitle-16 |
| Typography (`80:4747`) | `Property 1` | Paragraph - 16 `80:4748`, Title - 24 `80:4750`, Value - 14 `80:4752`, Button Text - 16 `80:4754`, Subtitle - 16 `80:4756`, Title - 20 `80:4758`, Small - 12 `80:4760` | - |
| Input Field (`80:4937`) | `Property 1` + booleans `showArrow`, `showCalendarIcon`, `showLabel` | Text `80:4938`, Simple `80:4942`, Numeric `80:4946`, Drop Down `80:4955`, Upload `80:4965` | Typography |
| User Card (`80:2891`) | - | single | Typography x3 |

## 5. Interactions

### 5.0 Complete reaction inventory (snippet A over `5:2401`: 6 nodes carry reactions; identical rows saved in `docs/figma/interactions/landing-components.json`)

| # | trigger | source layer id + name | action | destination | transition / easing / duration | what changes (variant DIFF, snippet B) |
|---|---|---|---|---|---|---|
| R1 | ON_HOVER | `80:4769` `Button Usual Hover / Property 1=Default` (COMPONENT) | CHANGE_TO | `80:4772` `Button Usual Hover / Property 1=Hovered` | SMART_ANIMATE / EASE_OUT / **300 ms** | `Ellipse 51`: x 40.78 -> -1.22, y 46 -> -39.73, w 37 -> 115, h 45 -> 123, fill `#ffffff` -> `#bebebe` (blend stays `SOFT_LIGHT`); root corner radius 0 -> 100. Nothing else (7 diff rows total). |
| R2 | ON_HOVER | `80:2152` `Button Usual Hover` (INSTANCE, Information Component, Primary) | CHANGE_TO | `80:4772` | same | same as R1 (inherits) |
| R3 | ON_HOVER | `80:2153` `Button Usual Hover` (INSTANCE, Information Component, nested Buttons = Secondary/white) | CHANGE_TO | `80:4772` | same | same geometry change; on a `#fff` button `SOFT_LIGHT` is a no-op (see 5.1), and whether Figma keeps the Secondary swap when switching variant cannot be read from the API (O-LC-4) |
| R4 | ON_HOVER | `80:4717` `Button Usual Hover` (INSTANCE inside Doctor Card **Default** `80:4686`, the "Get an Appointment" CTA) | CHANGE_TO | `80:4772` | same | same as R1 but the ellipse is `left/right`-stretched across the 352 px button (see 3.2) |
| R5 | ON_HOVER | `80:4767` `Buttons` (INSTANCE inside Button Featured Hover **Default** `80:4766`) | CHANGE_TO | `80:4764` `Button Featured Hover / Property 1=Hovered` | SMART_ANIMATE / EASE_OUT / **300 ms** | root and `Buttons` width 43.78 -> 113.78; a new layer `Frame 1000012737` (label frame, 94x20 @0,12.36, text "Register") **appears**; the layer `arrow-right-s-line` (43.78x44.73, padding `16,18,16,18`, r500, unchanged) is matched by name and moves x 0 -> 70; the label frame is `Frame 1000012737` (pad `0,16,0,16`, r0) |
| R6 | ON_HOVER | `80:4718` `Doctor Card - Final / Property 1=Variant2` (COMPONENT) | CHANGE_TO | `80:4686` `Doctor Card - Final / Property 1=Default` | SMART_ANIMATE / EASE_OUT / **300 ms** | see 5.3 (card 384x502 -> 384x481.73, padding 4 -> 0, image 376 -> 384 wide, +shadow, +gradient overlay, info block moves over the image, +2 stat panels, +CTA button, chip re-skins) |

No reaction exists on: `Buttons` (5 variants), `Tab`, `Featured Tabs`, `Process Cards`, `Eyebbrow`, `Header`, `Values`, `Typography`, `Input Field`, `User Card`, and none on the Hovered variants (`80:4772`, `80:4764`, `80:4686`): Figma's "while hovering" reverts to the previous variant when the pointer leaves, using the **same** transition (the API only stores the forward transition; symmetric reverse is Figma's documented behaviour, not read - see O-LC-6). `get_motion_context(5:2401, recursive)` = `{"nodes":[]}`: **no keyframe animation** anywhere in the section.

Correction of `flows.md` §7 row "Doctor Card - Final / Default -> CHANGE_TO Hovered (`80:4772`), wrong-set stale link, ignore": that reaction is on the **inner CTA instance `80:4717`** (a Button Usual Hover, so the destination is correct). It is the CTA's own hover sheen (R4), not a stale link, and it must be implemented.

### 5.1 Behaviour card - Button Usual Hover (R1-R4): the sheen

What the user sees: a soft, pale-green lightening sweeps up from the bottom of a green pill and fills it; on leave it sinks back. Mechanism: a pure-white ellipse parked just below the button (invisible because the button clips) grows and rises to cover the whole button while its colour dims from `#fff` to `#bebebe`; `mix-blend-mode: soft-light` blends it with the green button (white text and white backgrounds do not change under soft-light).

Measured result: sampling the 2x export `button-usual-hover-80_4768.png` (Figma's own render) gives the Default button `rgb(12,167,104)` = `#0ca768` (unchanged) and every fully covered pixel of the Hovered button **`rgb(18,195,134)` = `#12c386`** (measured at 5 points, uniform: the ellipse has no gradient/blur). Figma's `SOFT_LIGHT` is the Pegtop form `B = (1 - 2*Cs)*Cb^2 + 2*Cs*Cb`, which reproduces the measurement exactly for `Cs = #be (0.7451)`, `Cb = #0ca768` (derived check: 17.6 / 195.2 / 134.2). Browsers implement the W3C soft-light, which for the same inputs gives about `rgb(26,186,133)` = `#1aba85` (derived): about 9 levels different per channel, visually indistinguishable at this size, but a designer diffing pixels should know (keep `#bebebe`, it is Figma's literal). On a white (Secondary) button the result stays `#ffffff` (both formulas map a white backdrop to white), so the sheen is only visible on Primary/Gradient-type fills, exactly the scoping CLAUDE.md already states.

Drop-in replacement for `.btn-sheen` (index.css:126-145). Same class name, same host requirements (`position:relative; overflow:hidden; isolation:isolate`), `::after` only, so every existing call site keeps working with zero markup change:

```css
/* Figma "Button Usual Hover" 80:4768: Default 80:4769 -> Hovered 80:4772, SMART_ANIMATE EASE_OUT 0.3s */
.btn-sheen { position: relative; overflow: hidden; isolation: isolate; }
.btn-sheen::after {
  content: '';
  position: absolute; pointer-events: none;
  /* Ellipse 51, Default: constraints horizontal STRETCH (left/right), vertical MIN (top) */
  left: 40.78px; right: 36px; top: 46px; height: 45px;
  border-radius: 50%;
  background-color: #fff;              /* fixed neutral blend colour, brand independent (comment it, CLAUDE.md theming note) */
  mix-blend-mode: soft-light;
  transition: left .3s ease-out, right .3s ease-out, top .3s ease-out, height .3s ease-out, background-color .3s ease-out;
  /* ease-out === cubic-bezier(0,0,.58,1) === Figma EASE_OUT */
}
@media (hover: hover) {
  .btn-sheen:hover::after { left: -1.22px; right: 0; top: -39.73px; height: 123px; background-color: #bebebe; }
}
.btn-sheen:focus-visible::after { left: -1.22px; right: 0; top: -39.73px; height: 123px; background-color: #bebebe; }  /* keyboard parity (not in Figma) */
@media (prefers-reduced-motion: reduce) { .btn-sheen::after { transition: none; } }
```
Notes for the implementer:
- Because it is anchored `left/right/top/height` in px (Figma constraint semantics) it works for any button width; Figma never scales it with height. For buttons much taller than 44.73 (e.g. `h-[52px]`, `h-11` = 44 is fine) the ellipse still covers the button since it is 123 high and starts 39.73 above; for `h` > ~80 raise `height` proportionally (derived: keep top = -0.888*H, height = 2.75*H, i.e. 44.73 -> 39.73 / 123).
- Do not keep the old `opacity` fade or the `radial-gradient(circle at 30% 20%, rgba(255,255,255,.95), transparent 60%)`; they are not in Figma.
- `Button.tsx` variants `primary`, `accent`, `gradient` already carry `btn-sheen`; its `hover:bg-medical-600` / `hover:brightness-105` are NOT in Figma (§7).
- Behaviour on touch: `:hover` sticks after tap on mobile; the `(hover:hover)` media query above avoids that.

### 5.2 Behaviour card - Button Featured Hover (R5): compact CTA expands

Default = 43.78x44.73 green circle with a white chevron; Hover = label "Register" fades in on the left while the button grows to 113.78 wide and the chevron slides to x=70. The Figma root is left-anchored (the chevron moves right by 70 px), the app's nav Register is right-aligned in a flex row so the chevron stays put and the button grows leftwards (same visual, different anchor: fine).

```css
.btn-featured { display:inline-flex; align-items:center; height:44.73px; border-radius:9999px; overflow:hidden;
  background-color: rgb(var(--color-primary-500)); color:#fff; font-family:'Instrument Sans',sans-serif; font-size:16px; font-weight:400; }
.btn-featured__label { display:grid; grid-template-columns:0fr; margin-right:0; opacity:0; white-space:nowrap;
  transition: grid-template-columns .3s ease-out, margin-right .3s ease-out, opacity .3s ease-out; }
.btn-featured__label > span { overflow:hidden; min-width:0; padding-left:16px; }      /* text 62 + 16 = 78 wide for "Register" */
.btn-featured:hover .btn-featured__label, .btn-featured:focus-visible .btn-featured__label { grid-template-columns:1fr; margin-right:-8px; opacity:1; }
.btn-featured__icon { flex:none; width:43.78px; height:44.73px; }   /* <img src="/assets/figma/booking-arrow-right-btn.svg"> (43.78 x 44.73 incl. its padding) */
@media (prefers-reduced-motion: reduce) { .btn-featured__label { transition:none; } }
```
Arithmetic: Figma label frame = 16 + text + 16 with gap -24, so it advances by text + 8; expressed as `padding-left 16` + `margin-right -8` = text + 8 -> 62 + 8 = 70, plus the 43.78 chevron = **113.78**. `grid-template-columns: 0fr -> 1fr` animates the label's auto width (Chrome 107+, Safari 16+, Firefox 66+); fallback = the app's current `max-width` transition. Opacity 0 -> 1 is the SMART_ANIMATE dissolve of the appearing label layer.

### 5.3 Behaviour card - Doctor Card - Final (R6 + R4): resting card -> full info card

Resting (`Variant2`, what the landing shows) -> hover (`Default`). Layers are matched by name during SMART_ANIMATE: `Image Container`, `Rectangle 16`, `Chip` exist in both and morph; `Info` sits **beside** the image in Variant2 but **inside** `Image Container` in Default, so it is expected to cross-fade (inference from Figma's matching rule, the API does not expose match results); `Rectangle 3510`, `Frame 1000010559` (stats) and `Button` exist only in Default and fade in.

Property deltas (resting -> hover), all `0.3 s ease-out`:

| layer | resting `Variant2` | hover `Default` |
|---|---|---|
| card shell | 384x**502**, padding **4**, no shadow | 384x**481.73**, padding **0**, clip, shadow `0 -8px 20px rgba(0,0,0,.05)` |
| image frame `Image Container` / `Rectangle 16` | 376x405 @4,4, r24 | **384**x405 @0,0, r24 (crop identical: `h 118.4%, left 0.11%, top -0.02%`) |
| `Rectangle 3510` gradient (screen) | absent | opacity 0 -> 1: `linear-gradient(to bottom, rgba(250,250,250,0), #fafafa 87.5%)`, `mix-blend-mode: screen`, 384x405 |
| name / qualification / rating | row **below** the image at y=409, x-pad 8 (`Info` 376x89, pad `16,8`) | row **over** the image at y=190 (`Info` 384x218, pad 16), fully white-faded background from the gradient |
| stat panels (Experience 10+, Patients 2.5K+) | absent | 2 x 172x113, `#fbfbfb`, r24, gap 8, opacity 0 -> 1 |
| `Chip` | @275,15, 77x23, fill `#fff`, "Cardiology", Instrument Sans Regular 12 `#171c1a` | @272,16, 94x23, fill `#eff6ff`, "CARDIOLOGY", Inter Regular 12 `#2563eb` |
| CTA `Button` (Button Usual Hover, "Get an Appointment") | absent | 384x76.73 @0,405 (pad 16), fades in; its own hover = R4 |

Recommended DOM (single component; keep the slot height fixed so surrounding layout never jumps: resting height 502 is the reserved slot, the hover card is 20.27 px shorter and simply leaves slack, which is also what the prototype does):

```tsx
<div tabIndex={0} onClick={onClick} className="group relative h-[502px] w-[384px] max-w-full cursor-pointer">
  <div className="relative overflow-hidden rounded-[24px] p-1 h-[502px] transition-[padding,height,box-shadow] duration-300 ease-out
                  group-hover:p-0 group-hover:h-[481.73px] group-hover:shadow-ds-doctor-hover
                  group-focus-within:p-0 group-focus-within:h-[481.73px] group-focus-within:shadow-ds-doctor-hover">
    {/* Image Container: 405 high, width follows the shell padding (376 -> 384) */}
    <div className="relative h-[405px] overflow-hidden rounded-[24px]">
      <img className="absolute left-[0.11%] top-[-0.02%] h-[118.4%] w-full max-w-none" src={doctor.image} alt="" />
      <div className="absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 ease-out group-hover:opacity-100
                      bg-gradient-to-b from-[rgba(250,250,250,0)] to-[#fafafa] to-[87.5%]" />
      {/* overlay Info: top 190, pad 16, gap 16 (name+qual+rating, then 2 stat panels h-[113px]) : opacity 0 -> 1 */}
      {/* Chip: absolute, top 15 -> 16, left 275 -> 272 (or anchored right: 24 -> 18), bg white -> #eff6ff, text #171c1a -> #2563eb */}
    </div>
    {/* Info below: absolute top-[409px] inset-x-1, px-2 py-4, opacity 1 -> 0 on hover */}
    {/* CTA: absolute top-[405px] inset-x-0 h-[76.73px] p-4, opacity 0 -> 1, holds <button className="btn-sheen ..."> */}
  </div>
</div>
@media (hover: none) -> keep resting state (whole card already taps through to the profile)
@media (prefers-reduced-motion: reduce) -> transition-duration 0 (state still switches)
```
Numbers to keep exactly: 384 / 502 / 481.73 / 405 / 376 / 89 / 76.73 / 218 / 190 / 113 / 172 / gap 8 / r24 / pad 16 / shadow `0 -8px 20px rgba(0,0,0,.05)`.

### 5.4 Tab, Featured Tabs (no reactions - static `active`/`inactive` variants)

Figma defines only the two static states; there is no hover, pressed, focus or transition. State switch is caused by the app (category click). To keep the file's interaction language, tokens.md §7 recommends `0.3 s ease-out`:
- Tab: `transition: background-color .3s ease-out, color .3s ease-out`. Active `bg-primary-500 text-white font-bold`, inactive `bg-white text-[#707b76] font-normal` (both Inter 16). A hover style is **not designed** (app has `hover:bg-ink-50`; decision D-LC-1: drop it to match Figma, or keep as an undocumented affordance). Widths: active is FIXED 63 in the component (hug would be 69) - ignore, use hug.
- Featured Tabs: colour `#171c1a` <-> `#707b76` on the title; the 16x16 `#0ca768` square marker exists only in active. To reproduce the geometry: inactive title x=0, active title x=40 (= wrapper padding 8 + marker 16 + gap 16); animate marker `width 0 -> 16px`, `margin-right 0 -> 16px`, wrapper `padding-left 0 -> 8px` over `.3s ease-out`. The 1px rule is `#d9d9d9` in both states (the app's active `bg-medical-500` rule is wrong).

### 5.5 Input Field (no reactions, no state variants)

Figma defines **no** focus, hover, filled, error, disabled or validation states (5 static variants only; placeholder shown in `#707b76`; no filled-text or error colours exist in the file). Anything beyond the resting spec in 3.13 is an invention and needs a design decision (D-LC-4). Suggested, clearly non-Figma: keep `shadow-ds-input`, on `:focus-within` add a 2 px `ring-primary-500/40` (themed) with `transition: box-shadow .3s ease-out`, error = red border using the app's existing status red. The chevron-down in Numeric/Drop Down is `arrow-up-s-line` flipped vertically (rotate 180) so an open state could rotate it back (not prototyped).

### 5.6 Everything else (Buttons variants, Process Cards, Eyebbrow, Header, Values, Typography, User Card)

No motion. Implement statically. The Process Card, Values and User Card have no hover; the app's `hover:shadow-*` / `-translate-y` on cards (StatCard, SpecialtyCard) has no Figma basis.

### 5.7 Comparison: existing `.btn-sheen` and `Button.tsx` vs Figma

| Aspect | Figma | App today | Class |
|---|---|---|---|
| Sheen shape | hard-edged ellipse (`#fff` -> `#bebebe`), 37x45 -> 115x123 | `radial-gradient(circle at 30% 20%, rgba(255,255,255,.95), transparent 60%)`, inset -40% -10% | STYLE-DIFF |
| Sheen motion | ellipse **rises from below** and grows (left/right/top/height tween) | static gradient, only `opacity 0 -> 1` | NEW-INTERACTION |
| Blend | `SOFT_LIGHT` | `soft-light` | MATCH |
| Timing | 300 ms `EASE_OUT` (= CSS `ease-out`) | `opacity .3s ease` (`ease` = `cubic-bezier(.25,.1,.25,1)`, not `ease-out`) | STYLE-DIFF (easing keyword) |
| Host | clip + isolation | `overflow:hidden; isolation:isolate` | MATCH |
| Colour change on hover | none besides the sheen | `Button.tsx` primary adds `hover:bg-medical-600`, gradient adds `hover:brightness-105` | STYLE-DIFF (remove) |
| Press state | none designed | `active:scale-95` on DoctorCard CTA/Layout mobile Register | not in Figma (keep or drop, D-LC-5) |
| Reduced motion | not specified | none | add (CLAUDE.md/plan requires it) |

## 6. Assets manifest

Every asset was downloaded from the design-context / `download_assets` URLs and its sha256 compared against `public/assets/figma/**` before keeping. No SVG was hand-written or inlined; the sheen ellipse and the 13 px divider are plain CSS shapes, so their tiny SVG exports were not kept.

| local path | source node | format | notes |
|---|---|---|---|
| `public/assets/figma/booking-arrow-right-btn.svg` (existing, sha `50c6b01b...`) | `arrow-right-s-line` in Buttons Primary/Gradient/Sage `80:4660`/`80:4665`/`80:4655`, Featured Hover `80:4660`, Doctor Card CTA `I80:4717;80:4770;80:4660` | svg 43.7782x44.7279, path fill white | the white chevron incl. its 18/16 padding; reuse, do not add a copy |
| `public/assets/figma/landing-components/button-arrow-dark.svg` (NEW, sha `f5cd9a89...`) | `arrow-right-s-line` in Buttons Secondary `80:4645` / Tertiary `80:4650` | svg 43.7782x44.7279, path fill `#171C1A` | dark chevron for white / outlined buttons |
| `public/assets/figma/icon-star.svg` (existing, sha `801a8109...`) | `Star 39` `80:4696` / `80:4729` | svg 16x16 box (inset `0 2.45% 9.55% 2.45%`) | rating star `#f59e0b` |
| `public/assets/figma/landing-pages/icon-clock-16.svg` (existing, owned by the landing-pages unit, sha `1588bc0a...`) | `mdi-light:clock` `80:4702` | svg 16x16 `#707B76` | Doctor Card "Experience" stat |
| `public/assets/figma/landing-pages/icon-people-outline-16.svg` (existing, sha `667332cb...`) | `famicons:people-outline` `80:4708` | svg 16x16 stroke `#707B76` | Doctor Card "Patients" stat |
| `public/assets/figma/doctor-card-2.png` (existing, sha `e4d770c7...`) | `Rectangle 16` `80:4720` / `80:4688` (image hash `c9f6e528...`, CROP) | png 961x1200 | placeholder doctor photo; in the app the image is the real doctor photo, only the crop math matters |
| `public/assets/figma/process-card-1.png` (existing) | `image 114` `80:4736` (hash `bf1365e4...`, CROP) | png 843x488 | Process Card Default illustration |
| `public/assets/figma/avatar-stack-1.png`, `-2.png`, `-3.png` (existing) | `Rectangle 3420` / `3419` / `3418` (`80:4743..80:4745`, FILL, r19) | png 275x183 / 275x183 / 276x183 | Process Card Variant3 avatars (which raw image maps to which rectangle was not read; the three files are all three of them) |
| `public/assets/figma/dashboard-components/icon-dropdown-arrow-up.svg` (existing, dashboard unit, sha `57cbdc7a...`) | `arrow-up-s-line` `80:4961` / `80:4952` | svg 20x20 `#707B76` | Input Field chevron; the node is flipped vertically (`-scale-y-100`), so render it rotated 180 deg |
| `public/assets/figma/landing-components/input-field-upload-icon.svg` (NEW, sha `7b0d217b...`) | `Group 24` `80:4971` | svg 20x20 `#707B76` | Upload variant trailing glyph |
| `public/assets/figma/landing-components/input-field-calendar-icon.svg` (NEW, sha `19f2170a...`) | `calendar-2-line` `80:4963` | svg 16x16 `#909090` (clip-path) | Drop Down `showCalendarIcon` (hidden by default) |
| not kept | `Ellipse 51` (`80:4771`, `80:4774`), `Line 59` `80:4954`, a 422x244 transparent "five doctors" PNG returned as a raw image of Process Cards (not referenced by any visible layer) | - | ellipse/line are CSS; the PNG is unused in this section |

## 7. App mapping & gap analysis

Legend: STYLE-DIFF (values differ), STRUCTURE-DIFF (DOM/anatomy differs), MISSING (not in app), NEW-INTERACTION (Figma motion the app lacks), MATCH.

### 7.1 Buttons and sheen

| Region | Current implementation | Figma value | Class |
|---|---|---|---|
| `.btn-sheen` | `index.css:126-145` radial gradient fade, `opacity 0->1 .3s ease` | rising soft-light ellipse recipe 5.1, `ease-out` | STYLE-DIFF + NEW-INTERACTION |
| Button base | `components/ui/Button.tsx:17` `rounded-full font-display font-medium transition-all duration-200` | pill r100, label Regular (400) 16, transition 300 ms `ease-out` | STYLE-DIFF (`font-medium` -> normal weight, 200 -> 300 ms) |
| Button trailing chevron | none (children only) | every `Buttons` variant has the 43.78x44.73 chevron frame; total width 113.78 for "Register" | STRUCTURE-DIFF (add optional `trailingIcon`/arrow prop; default must stay unchanged, `Button` is used in dashboards for every role) |
| primary | `Button.tsx:25` `btn-sheen bg-medical-500 text-white hover:bg-medical-600 shadow-md shadow-medical-200` | fill `#0ca768`, **no shadow, no hover recolour** | STYLE-DIFF |
| gradient | `Button.tsx:31` `bg-gradient-to-b from-medical-500 to-medical-600 hover:brightness-105 shadow-md ...` | `to bottom` `#3cbb8d` (Accent-400) -> `#098d58` (Accent-600), no shadow/brightness | STYLE-DIFF (`from-primary-400 to-primary-600`) |
| secondary | `Button.tsx:26` `bg-sky-100 text-medical-700 hover:bg-sky-200` | fill `#fff`, label `#202020`, chevron `#171c1a` | STYLE-DIFF |
| outline | `Button.tsx:28` `border-2 border-medical-500 text-medical-500 hover:bg-medical-50` | Tertiary: 1px `#171c1a` stroke INSIDE, label `#202020`, no fill | STYLE-DIFF |
| Sage | none | 1px white stroke, white label, for dark backgrounds | MISSING (add `sage` variant for hero/closing bands if used) |
| accent (teal), danger | `Button.tsx:27,29` | not in the Figma library | keep (not Figma-covered) |
| sizes | `Button.tsx:34-38` `md = px-5 py-2.5 text-base` (~44 px high) | 44.73 high, label pad 16 + chevron frame | STYLE-DIFF (only matters for the new Figma-style variants) |
| Nav Register | `components/Layout.tsx:138-148`: `bg-gradient-to-b from-medical-300 to-medical-500`; label `max-w-0 -> group-hover:max-w-[100px] transition-[max-width] duration-300 ease-out`, `pl-4 pr-0`; icon `ArrowRight size 14` in `px-[18px] py-4` (= 50 x 46) | Featured Hover: solid `#0ca768`, chevron asset 43.78x44.73, height 44.73, expanded width 113.78, label fades in (`opacity` 0->1) | STYLE-DIFF (fill, icon glyph, 50x46 vs 43.78x44.73, missing opacity fade); timing MATCH (`300 ms`, `ease-out` == Figma) |
| Mobile drawer Register | `Layout.tsx:357-360` `btn-sheen ... from-medical-300 to-medical-500` | not designed (Featured Hover is desktop nav only) | out of scope |
| Home "See more doctors" round arrow | `views/patient/Home.tsx:240-251` (`w-11 h-11` circle scrolling the carousel) | Landing frame uses `Button Featured Hover` "View All" -> List Page (flows.md 2.1, SMART_ANIMATE GENTLE 1.022 s) | STRUCTURE-DIFF, owned by landing-home; note the handler scrolls, Figma navigates to `/patient/doctors` |
| Other `btn-sheen` hosts | 24 usages in 13 files (`App.tsx`, `Footer.tsx`, `Layout.tsx`, `HomepageManager.tsx`, `HospitalManager.tsx`, `Button.tsx`, `DoctorCard.tsx`, `AdminLogin.tsx`, `BrandingSettings.tsx`, `DoctorMore.tsx`, `DoctorProfileEditor.tsx`, `PatientManualRegistry.tsx`, `SerialManager.tsx`) | the new ellipse is anchored in px so it works on any width | verify visually that no host is taller than ~80 px (then raise `height` per 5.1) |

FUNCTIONAL CONSTRAINTS: `Button` must keep forwarding `...props` (`onClick`, `disabled`, `type`), `fullWidth`, `className`, focus ring and `disabled:opacity-50`. `.btn-sheen` must stay class-name compatible (pure CSS change, `::after` only). Layout's Register must keep `onClick={() => onRegisterClick?.()}` and stay gated by `isPublic`; the `group` hover collapse must also expand on `:focus-visible` (accessibility, not in Figma).

### 7.2 Doctor Card

| Region | Current implementation | Figma value | Class |
|---|---|---|---|
| Compact card (`compact`) shell | `DoctorCard.tsx:33-65`: `w-full group cursor-pointer`, image `aspect-square rounded-ds-lg`, no padding, no shadow | Variant2: 384x502, pad 4, image 376x405 (0.928 aspect, not square), r24 | STRUCTURE-DIFF / STYLE-DIFF |
| Compact image hover | `DoctorCard.tsx:42` `group-hover:scale-105 transition-transform duration-500` | not in Figma (hover swaps to the Default card, no zoom) | remove / replace by 5.3 |
| Specialty chip | `DoctorCard.tsx:49` `top-3 right-3 bg-white/95 text-[10px] font-bold px-2.5 py-1` | 77x23 @275,15, pad `4,8`, r100, fill `#fff`, Instrument Sans Regular 12 `#171c1a` | STYLE-DIFF |
| Name | `DoctorCard.tsx:55` `text-[15px] font-bold text-ink-800 truncate` | Medium 24 `#171c1a`, auto lh | STYLE-DIFF |
| Qualification | `DoctorCard.tsx:56` `text-[11px] text-ink-500 font-medium` (`MBBS, FCPS(...)` string built in JSX) | Regular 16 `#707b76` | STYLE-DIFF |
| Rating | `DoctorCard.tsx:58-61` star 13, `text-[13px] font-bold` | star 16, value Regular 16 `#171c1a`, gap 4 | STYLE-DIFF |
| Info block | `DoctorCard.tsx:53` `pt-3` | `px-2 py-4` (376x89), row gap 126 `SPACE_BETWEEN`, column gap 8 | STYLE-DIFF |
| Hover state (Default) | none for `compact`; the non-compact card (`DoctorCard.tsx:67-137`) shows stats/CTA permanently in a 260-280 px wide card with `shadow-ds-card` | full overlay card, 384x481.73, gradient, stat panels 172x113 `#fbfbfb` r24, chip re-skin, CTA "Get an Appointment", shadow `0 -8px 20px .05` | NEW-INTERACTION + STRUCTURE-DIFF |
| Non-compact card | `DoctorCard.tsx:67-137` (used by `components/ui/RecommendedDoctorsSection.tsx:64` carousel) | not a Figma design (older layout) | decision D-LC-2: keep for the recommended carousel or migrate it to the Figma card |
| Home inline experts card | `views/patient/Home.tsx:210-235`: `w-[384px] rounded-[24px] overflow-hidden shadow-[0_-8px_20px_rgba(0,0,0,.05)]`, full-bleed 384 image, info `p-4`, name `text-black leading-tight`, chip `top-4 right-4` | resting card has **no** shadow, pad 4, image 376, chip 275/15 (top 15 / right 24), info `px-2 py-4`; the shadow belongs to the **hover** state only | STYLE-DIFF + NEW-INTERACTION (shadow always-on today, hover missing) |
| Search results grid | `views/patient/DoctorSearchView.tsx:122-133` `compact` cards, 3 columns `gap-x-6 gap-y-10` | Figma List Page grid uses the same card at 384 wide (flows.md 2.1); hover = Default | uses compact; gets the new hover automatically once DoctorCard is done |

FUNCTIONAL CONSTRAINTS: keep props `doctor` (`name, specialty, bmdcNumber, experience, rating, reviews, totalPatients, image, hospitalName`), `ctaLabel`, `onCtaClick` (must `stopPropagation`), `compact`, `onClick`. Whole-card click -> `onSelectDoctor(doc)` (Home, DoctorSearchView) must stay; on touch devices there is no hover, so the CTA is unreachable but the card tap runs the same `onSelectDoctor`, so nothing is lost (RecommendedDoctorsSection passes `onCtaClick={() => onSelectDoctor?.(doc)}`, identical). The no-image fallback (initial letter tile) and `truncate` behaviour for long names must be preserved (Figma name box is 326 px wide; use `truncate`). Rating fallback `4.5` stays. Chip text is the doctor's specialty (Figma shows both "Cardiology" and "CARDIOLOGY": use CSS `uppercase` in hover).

### 7.3 Tabs, Featured Tabs, Eyebrow/Header, Process Cards, Values

| Region | Current implementation | Figma value | Class |
|---|---|---|---|
| Tab pills | `Home.tsx:196-205` `h-[47px] px-6 rounded-full text-[16px] transition-colors`; active `bg-medical-500 text-white font-bold`; inactive `bg-white text-ink-500 hover:bg-ink-50` | height **43** (12 + 19 + 12), pad `12,24`, r100; active `#0ca768` Inter Bold 16 white; inactive `#fff` Inter Regular 16 `#707b76`; **no hover** | STYLE-DIFF (47 -> 43, `text-ink-500` -> content-tertiary `#707b76`, remove `hover:bg-ink-50` (D-LC-1), 150 -> 300 ms `ease-out`) |
| Featured Tabs | `Home.tsx:273-283`: active marker `w-4 h-4 bg-medical-500`, both rows `px-2`, title `text-black` / `text-ink-500 hover:text-ink-700`, rule active `bg-medical-500`, inactive `bg-ink-200` | marker 16x16 `#0ca768` only in active; wrapper pad `0,8` **only in active**; inactive title x=0; titles `#171c1a` / `#707b76`; **rule `#d9d9d9` in both states** | STYLE-DIFF |
| Eyebbrow Variant2 | `SectionEyebrowHeader.tsx:6-8`: `px-3 py-2 rounded-full`, marker `w-[21px] h-2 rounded-full bg-medical-500`, text `text-ink-500 text-[14px]`, gap 2.5 | pad `8,12`, gap 10, marker 21x8 **radius 0**, text 14 `#707b76` | STYLE-DIFF (marker `rounded-full` -> square; text colour) |
| Eyebbrow Variant 1 | not a component; hero uses `Home.tsx:121-123` `bg-white/20 ... text-[14px]` on the dark hero | white pill, 16 px `#707b76` | MISSING (hero has its own variant; owned by landing-home) |
| Header H | `SectionEyebrowHeader.tsx:10` `text-[28px] md:text-[46px] text-[#131215] leading-[1.3] md:leading-[58px] tracking-[0.92px]` | 48 / 58 px / **0.96 px** (2 %), `#171c1a` | STYLE-DIFF (46 -> 48, 0.92 -> 0.96, literal `#131215` -> content-primary; mobile 28 is an app-only responsive size) |
| Header gap | `SectionEyebrowHeader.tsx:5` `gap-4` | 16 | MATCH |
| Process Cards | `Home.tsx:165-188` `bg-white rounded-[24px] shadow-ds-card p-6 gap-6`; title `text-lg font-bold`, body `text-[13px]`, image `h-36 rounded-2xl` | pad **32**, gap 24, r24, **no shadow**, title Medium 24, body 16 / lh 22 `#707b76`, image 441x163.68 (no radius) inside the padding | STYLE-DIFF |
| Process Card Variant3 avatars | `Home.tsx:178-184` `w-9 h-9 -space-x-3 ring-2 ring-white`, caption `text-[15px] text-ink-800` "<15 Min Average Wait Time" | 38 px, offsets 0/11/28, no ring, caption Inter 16 (`10K+ / Student` in the sample; text is content) | STYLE-DIFF |
| Values | `Home.tsx:432-434` `font-sans font-medium text-[70px] text-black leading-none`, label `text-[16px] text-ink-500`, `gap-3` | Inter Medium 70 (Inter confirmed), lh auto (85 px box), `#171c1a`, label 16 / lh 22 `#707b76`, gap 12 | STYLE-DIFF (`leading-none` -> normal, colours); font MATCH |
| Information Component | none (paragraph + CTA row is inline in landing sections) | paragraph 16 ls 0.32 + gap 36 + two 113.78x44.73 CTAs gap 10 | MISSING as a component (landing-home consumes) |
| User Card `80:2891` | none in the mapped files | 763x102, `#fafafa`, r24, pad 16 | MISSING (doctor-profile experience list, other unit) |
| Typography set | none (classes inline; `font-display` = Instrument Sans exists) | 7 styles, only weights differ (Medium 24/20/16/14/12, Regular 16 paragraph/subtitle) | new Tailwind `fontSize` tokens proposed in tokens.md §9 |
| Input Field | no shared Input component under `components/ui/` | 5 variants, r8, `shadow-ds-input`, label Medium 16, placeholder 12/14 `#707b76` | MISSING (forms use ad-hoc classes); states undefined in Figma |
| StatCard, SpecialtyCard | `components/ui/StatCard.tsx`, `components/ui/SpecialtyCard.tsx` | **no counterpart in this Components section** (StatCard = dashboard analytics; SpecialtyCard = Browse Specialty grid; the landing specialty row is Figma `Group 17` under landing-home) | n/a here |

FUNCTIONAL CONSTRAINTS: Tabs must keep `setSelectedSpecialty(tab)` filtering over `DOCTOR_FILTER_TABS` and `selectedSpecialty` equality for the active state; Featured Tabs must keep `setActivePanel(i)` driving `PanelMockup`; Process card content comes from `PROCESS_CARDS` (title/desc/image) and must stay data-driven; Values keep the `CountUpStat` count-up (`IntersectionObserver`, 1400 ms cubic ease-out) untouched - only classes change; `SectionEyebrowHeader` props (`eyebrow`, `title`, `titleClassName`, `center`) are used by Home, BlogsPage, LabDiagnosticsPage, AboutUsPage, HospitalsPage, ContactUsPage, so the visual change propagates to all of them (intended).

## 8. Open issues / uncertainties

- **O-LC-1** Reverse (mouse-leave) motion: Figma's "while hovering" reverts to the original variant; the API stores only the forward transition (`SMART_ANIMATE EASE_OUT 0.3`). Recipes use the same 300 ms `ease-out` in both directions (standard Figma behaviour, not readable).
- **O-LC-2** Reference PNGs are 2x exports via `download_assets(defaultScale 2)` (the `get_screenshot` tool never upscales past 1x). The section-level shot is 1674x2880 (0.65x) because the section is 2589x4513. Export backgrounds show Figma's grey canvas.
- **O-LC-3** Conflict inside Figma data: `get_design_context` prints `leading-[22px]` for the qualification text in the Doctor Card, but the node read (`getStyledTextSegments`) says line-height **AUTO** with a 20 px high box in both Doctor Card variants (22 px in Process Cards / Values / Input labels). Spec uses the node read (auto). Impact <= 2 px per card.
- **O-LC-4** R3 (white Secondary button inside Information Component): the destination variant `80:4772` contains a Primary `Buttons`; whether Figma preserves the Secondary swap on `CHANGE_TO` cannot be read. It does not matter visually: `soft-light` over `#fff` is `#fff`.
- **O-LC-5** SMART_ANIMATE layer matching for the Doctor Card is inferred from names/hierarchy (`Info` is a sibling of `Image Container` in Variant2 but a child of it in Default, so it should cross-fade); the API does not expose the match table.
- **O-LC-6** Doctor Card chip position (`x 275 / 272`, `y 15 / 16`) is a single sample with MIN/MIN constraints, so where it sits for other label widths is undefined; the spec derives an equivalent right-anchoring (24 px resting / 18 px hover from the right edge of the image: 376 - 275 - 77 = 24, 384 - 272 - 94 = 18) (derived).
- **O-LC-7** Tab width: active is FIXED 63 (text 21 + 21 padding each side), inactive hugs (67). In the landing the six instances have widths 63/139/161/102/135/134 (plan §4). Implement hug (12/24 padding) everywhere.
- **O-LC-8** Input Field has no focus, error, filled, hover or disabled variants and the Numeric variant has no number text node: those need design decisions (D-LC-4); nothing was invented in the recipes beyond a clearly-flagged suggestion.
- **O-LC-9** Correction to `flows.md` §7: the Doctor Card "Default -> Hovered `80:4772`" reaction is on the inner CTA instance `80:4717` (R4), not a stale link; and the Button Featured Hover reaction lives on the nested `Buttons` (`80:4767`), not on the variant.
- **O-LC-10** Correction to `tokens.md` §2.1: Inter is not limited to chrome. In these components Inter is also used for the Tab pill (Bold/Regular 16), Doctor Card stat numbers (Medium 36) and labels (Medium 14), the hover-state chip (Regular 12), Values "15+" (Medium 70) and Process Card Variant3 caption (Regular 16). The app's `Home.tsx:433` (`font-sans` Medium 70) already matches this.
- **O-LC-11** Gradient direction of the Gradient button is derived from `gradientTransform [[0,1,0],[-1,0,1]]` (= top -> bottom, agrees with `bg-gradient-to-b` in the design context) rather than read as an angle.
- **O-LC-12** Hover colour: Figma renders `rgb(18,195,134)` (measured from the export PNG); a browser's W3C `soft-light` of `#bebebe` over `#0ca768` gives about `rgb(26,186,133)` (derived). The gap is the different soft-light formula (Figma = Pegtop), not a spec error. Verify visually in the browser; if a pixel-exact match is required, the ellipse grey can be nudged but the spec deliberately keeps Figma's literal `#bebebe`. `isolation:isolate` on the button reproduces the same backdrop (the button's own painted content).
- **O-LC-13** No Figma variables are bound to the ellipse colours; `#bebebe` is a raw literal (`0.7451` grey). Treat as a fixed decorative blend colour (allowed under CLAUDE.md's theming exception), do not tokenise.
- **O-LC-14** Decisions needed: **D-LC-1** drop `hover:bg-ink-50` on inactive Tab (Figma has none) or keep as undocumented affordance; **D-LC-2** migrate `RecommendedDoctorsSection` to the Figma card or keep the legacy non-compact card; **D-LC-3** Secondary/Tertiary label `#202020` literal vs `ink-800`/`content-primary`; **D-LC-4** Input Field state styling (focus/error/filled); **D-LC-5** keep `active:scale-95` on CTAs (not designed).
- No rate-limit or quota errors occurred during this unit (about 41 Figma tool calls).
