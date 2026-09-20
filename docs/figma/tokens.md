# DocOClock — Figma design tokens (unit: tokens)

Figma file `zJRyAML8hv0uEBOXtu5Hpn`. Every number below was read from Figma (variables API, node properties via `use_figma` read-only scripts, `get_variable_defs`, `get_design_context`) — nothing is estimated from screenshots. Anything that could not be read is listed in section 12.

## 0. What the file actually contains (read this first)

| Fact | Value |
|---|---|
| Pages | `Design System` (0:1) — **empty (0 children)**; `Web Version V1` (5:2) — 33 top-level nodes (15 sections + loose frames/rectangles); `App Version V1` (5:3) — 17 top-level nodes |
| Local paint / text / effect / grid styles | **0 / 0 / 0 / 0** — no Figma styles exist. All typography, radii, shadows are raw values on nodes. Typography is expressed through two component sets (`Typography` 80:4747, `Typography - Dashboard` 302:12624). |
| Variable collections | `Texts` (VariableCollectionId:303:13421) — 24 COLOR variables, single mode `Mode 1`; `Collection` (303:13423) — empty. The `Texts` collection is misnamed: it holds **all** colour tokens. |
| Library (remote) variables used | 4: `Secondary-button-text` #666666, `Neutral Light` #f2f2f2, `color/background/neutral/sufacePrimary` (alias, value not resolvable), `Paragraph Text` FLOAT 16. Leftovers from a third-party kit; treat as literals. |
| Node population scanned | 12,053 nodes across 18 roots of `Web Version V1` (Pre Login Pages, Patient Dashboard, Doctor Profile, Doctor - Queue, Doctor Appointment, Analytics, Prescription, Manage, Account, Doctor Overview, both Components sections, Authentication Page, loose phone/queue frames). `Old Pre Login Pages` (20 frames) deliberately excluded from counts (legacy). |

Counts quoted below ("x44") are number of nodes in that scan unless stated otherwise.

---

## 1. Colours

### 1.1 Figma variables (collection `Texts`) — the authoritative palette

Hex values converted from the float RGB returned by the API. "Uses" = bound fills + bound strokes across the scan. "App token" = where it lands in the app (details and rationale in sections 8–10).

| Figma variable | Hex | RGB | Uses (fill/stroke) | Where used in Figma | App token (default theme) |
|---|---|---|---|---|---|
| `Text/Primary` | `#171c1a` | 23,28,26 | 479 / 51 | headings, values, button labels (Typography Title/Value/Small) | NEW `content-primary` (fixed neutral) |
| `Text/secondary` | `#4b5752` | 75,87,82 | 473 / 70 | body text on dashboards, secondary buttons, icons | NEW `content-secondary` |
| `Text/tertiary` | `#707b76` | 112,123,118 | 428 / 76 | paragraph/subtitle copy, inactive tabs, placeholder icons | NEW `content-tertiary` |
| `Text/disabled` | `#a8b0ac` | 168,176,172 | 113 / – | inactive nav link label, disabled text | NEW `content-disabled` |
| `Text/inverse` | `#ffffff` | 255,255,255 | 93 / 66 | text on primary fills | `white` |
| `Text/accent` | `#0ca768` | 12,167,104 | 4 / – | small accent text (dates, counts) | `primary-500` (themed) |
| `Text/link` | `#0ca768` | 12,167,104 | – | link | `primary-500` (themed) |
| `Text/link-hover` | `#098d58` | 9,141,88 | – | link hover | `primary-600` (themed) |
| `Accent Color` | `#0ca768` | 12,167,104 | 70 / 12 | Nav Link - Dashboard active fill, radio, selected states | `primary-500` (themed) |
| `Accent/Accent-50` | `#e6f7f0` | 230,247,240 | 44 / – | soft tinted panels (Years Experience badge, Modal header strip, Prescription rows, Patient page gradient end) | `primary-50` (themed; **value differs, see 1.3**) |
| `Accent/Accent-100` | `#cff0e3` | 207,240,227 | 1 / 12 | ring strokes on icon buttons | `primary-100` (themed; value differs) |
| `Accent/Accent-200` | `#a3e2ca` | 163,226,202 | 21 / 2 | queue ring fills, pale accent | `primary-200` (themed; value differs) |
| `Accent/Accent-300` | `#70d0ad` | 112,208,173 | 10 / – | Button Effect (dashboard button glow) | `primary-300` (themed; value differs) |
| `Accent/Accent-400` | `#3cbb8d` | 60,187,141 | 35 / – | gradient stop 1 of the Gradient button, icons | `primary-400` (themed; value differs) |
| `Accent/Accent-500` | `#0ca768` | 12,167,104 | 219 / 25 | Primary button, tab active, icons, chips | `primary-500` (themed) |
| `Accent/Accent-600` | `#098d58` | 9,141,88 | 14 / – | gradient stop 2 of the Gradient button | `primary-600` (themed; Δ1) |
| `Accent/Accent-700` | `#077448` | 7,116,72 | 3 / 3 | vector strokes on landing, chart dots | `primary-700` (themed; Δ1) |
| `Accent/Accent-800` | `#055a39` | 5,90,57 | 3 / – | Chip fill, icon | `primary-800` (themed; Δ2) |
| `Accent/Accent-900` | `#03402a` | 3,64,42 | 4 / – | text on soft menus ("Monthly", "Download") | `secondary-500` (**exactly equals default secondary `#03402a`**) |
| `Accent/Accent-950` | `#022a1c` | 2,42,28 | 16 / – | Analytics bars/polygon, Chip | NEW `primary-950` (or nearest existing `secondary-700` `#022d1d`, Δ3) |
| `Fill Color` | `#f5f7f6` | 245,247,246 | 44 / 17 | page background on dashboards, Medicine Track, toggles | `background` / `surface` (themed, exactly equals default `#f5f7f6`) |
| `Input Field` | `#fbfbfb` | 251,251,251 | 88 / 79 | Input Box fill+stroke, Search, Trail Icon Button | `ink-50` (`#FBFBFB`, exact) |
| `Ghost` | `#d0d8eb` | 208,216,235 | 18 / 45 | schedule grid lines, Medicine Track bars, dividers | NEW `ghost` (fixed blue-grey) |
| `Secondary` | `#7b87a4` | 123,135,164 | 13 / 1 | placeholder-ish labels ("14 px", "Patient Details") | NEW `steel` (fixed blue-grey) |

Library variables (values from `valuesByMode`): `Secondary-button-text` `#666666` (16 fills) = `ink-600` exact; `Neutral Light` `#f2f2f2` (13 strokes) = `ink-200` exact; `color/background/neutral/sufacePrimary` (17 fills) alias not resolved — check the actual painted fill before mapping (open issue O6); `Paragraph Text` = 16 (fontSize, 2 uses) = Paragraph 16.

Default theme relationship (from `ThemeContext.tsx` `DEFAULT_THEME`): primary `#0ca768` = Accent-500; secondary `#03402a` = Accent-900; background `#f5f7f6` = Fill Color. All three admin-themed roles have an exact Figma counterpart, so **never write these three as literal hex**.

### 1.2 Literal (unbound) colours — frequency and nearest app token

Top literal fills/strokes/text colours by count. "Nearest" is computed against the app's `ink-*` scale and Tailwind default neutrals (max per-channel delta shown). Colours flagged **legacy** appear only inside old mock frames (`Main`, legacy stat cards) and should not be ported.

| Literal | Where (node context) | Count | Nearest app token | Action |
|---|---|---|---|---|
| `#ffffff` | card/button/chip fills, Search, Chip in Doctor Card | 576 fills (+132 text) | `white` | use `white` |
| `#0ca768` (unbound) | Ellipse 73 in Queue, Tab Buttons, Nav Link | 52 | `primary-500` | must be theme token, not hex |
| `#fbfbfb` (unbound) | Toggle in User Card | 53 | `ink-50` Δ0 | `ink-50` |
| `#fafafa` | Landing / List Page frame background, User Card, Main | 26 (page bg on pre-login frames) | Tailwind `neutral-50` Δ0 | page bg token `page` (proposed) |
| `#f9f9f9` | Prescription/Appointments page frames, Bottom cards, start of Patient page gradient | 23 | `neutral-50` Δ1 | treat as `page` |
| `#f6f6f6` | Analytics rects, Appointments frames | 34 | `ink-100` Δ0 | `ink-100` |
| `#f2f2f2` | strokes (13) | 13 | `ink-200` Δ0 | `ink-200` |
| `#eeeeee` | strokes on cards (65), fills (21) | 86 | `ink-200` Δ4 | `ink-200` acceptable, or new `ink-150 #eeeeee` |
| `#d9d9d9` | Rectangle 3871 (queue bar track) | 23 | `ink-300` Δ0 | `ink-300` |
| `#909090` / `#8f8f8f` / `#999999` | Main nav labels, Analytics axis text (`#999`) | 16 / 24 text / 43 text | `ink-500` Δ0/1/9 | `ink-500` |
| `#8a94a3` | icon vectors in cards (50 fills), placeholder text (89) | 139 | none (`ink-500` Δ19) | keep as `steel-400` alias or map to `content-tertiary`; decide (D2) |
| `#666666` | (library var Secondary-button-text) | 16 | `ink-600` Δ0 | `ink-600` |
| `#5e5e5e` | dashboard captions | 87 text + 19 fills | `ink-600` Δ8 | `ink-600` or `content-secondary` |
| `#505050` / `#515151` | table cell text (Appointments/Prescriptions) | 63+14 text, 21 fills | Tailwind `neutral-600` Δ2/1 | `content-secondary` (Δ 5–13 from `#4b5752`) or keep `neutral-600` |
| `#444444` | | 12 fills | `ink-700` Δ6 | `ink-700` |
| `#171717` | Typography - Dashboard "Title 1/2" text, Expand-your-reach copy | **241 text** | `ink-800` Δ0 | `ink-800` (already exists) |
| `#000000` | Main frames, vectors | 25 fills, 34 text | `ink-900` Δ0 | `ink-900` |
| `#202020` | Button label (Buttons Secondary/Tertiary) | 11 text | none (`ink-800` Δ9) | label uses `content-primary` in new system |
| `#38bdf8` | Navbar - Dashboard icon vectors (38), Navbar/Default (12) | 58 | Tailwind `sky-400` Δ0 | fixed decorative (keep literal, like `brand.sky`) |
| gradient `#0ea5e9 → #14b8a6` | stroke 2.4 (58), stroke 1.6 (29) on avatar/logo rings, fills (29) | 116 | existing `brand.sky` `#0EA5E9` + `brand.teal` `#14B8A6` exact | `bg-gradient-to-r from-brand-sky to-brand-teal` (already fixed hex by design) |
| `#f59e0b` | rating stars (Star 39 in Doctor Card) | 37 | Tailwind `amber-500` Δ0 | fixed semantic (star) |
| `#2e8cff` | Star 47 / Ellipse 68 in `User Card` and `Main` mock frames | 51 fills, 7 text | — | **legacy blue**; if visible in a shipped component, map to `primary-500` |
| `#061535` | `Consultation Fee`, `Main` mock texts, ellipses | 33 fills, 89 text | — | **legacy navy** (old brand), map text to `content-primary` |
| `#8a38f5` | stroke 1 in Main mock | 15 strokes | — | legacy, ignore |
| Pastel queue-ring palette `#96ced7 #d6b2ba #c8db9c #8ec7b7 #e9e8ef #b2d8b4 #99b8cd #b5b6bf #dae0e0` | Rectangles 49xx in the Queue frames (ring segments) | 120/112/83/56/48/40/40/32/32 | — | decorative, brand-independent (already documented as intentional in CLAUDE.md, e.g. SerialManager) |
| `#24b565` | status text | 6 text | — | status green, keep as semantic |

### 1.3 The Accent scale vs `generateColorScale()` — value gap

Figma Accent (11 steps incl. 950) vs what the app generates today for the default primary `#0ca768` (`utils/colorScale.ts`: tints mix toward white 0.95/0.90/0.75/0.60/0.30, shades toward black 0.15/0.30/0.45/0.60; and `index.css` static first-paint values):

| Step | Figma | App today (generated) | ΔRGB (app − Figma) |
|---|---|---|---|
| 50 | `#e6f7f0` (230,247,240) | `#f4fbf7` (244,251,247 in index.css; generator gives 243,251,247) | +14,+4,+7 |
| 100 | `#cff0e3` (207,240,227) | `#e7f6f0` (231,246,240) | +24,+6,+13 |
| 200 | `#a3e2ca` (163,226,202) | `#c2e9d9` (194,233,217) | +31,+7,+15 |
| 300 | `#70d0ad` (112,208,173) | `#9edcc3` (158,220,195) | +46,+12,+22 |
| 400 | `#3cbb8d` (60,187,141) | `#55c195` (85,193,149) | +25,+6,+8 |
| 500 | `#0ca768` | `#0ca768` | 0 |
| 600 | `#098d58` (9,141,88) | `#0a8e58` (10,142,88) | +1,+1,0 |
| 700 | `#077448` (7,116,72) | `#087549` (8,117,73) | +1,+1,+1 |
| 800 | `#055a39` (5,90,57) | `#075c39` (7,92,57) | +2,+2,0 |
| 900 | `#03402a` (3,64,42) | `#05432a` (5,67,42) | +2,+3,0 |
| 950 | `#022a1c` (2,42,28) | (does not exist) | – |

Analysis: the shades already match Figma to within 3/255 (black mix 0.15/0.30/0.45/0.60; step 950 = black mix 0.75, residual (+1,0,−2)). The **tints are wrong by up to 46/255** — Figma's tints are not straight white mixes: they are a fixed-saturation HSL ramp (measured HSL: S ≈ 0.52 for steps 50–400 against S = 0.87 of the base, L = 0.94/0.88/0.76/0.63/0.48, hue 155–158°; base hue 155.6°).

Fit options (deltas are per-channel vs Figma, computed):
- **Option A (constants only)**: `TINT_STEPS = {50:0.90,100:0.81,200:0.65,300:0.45,400:0.22}`, `SHADE_STEPS += {950:0.75}` → residuals 50:(1,−1,0) 100:(2,−2,−1) 200:(7,−2,0) 300:(9,−1,−1) 400:(5,−1,−4).
- **Option B (HSL tints)**: tint = HSL(base hue, 0.6 × base S, L = 0.935/0.877/0.762/0.63/0.486) → 50:(2,1,1) 100:(2,0,0) 200:(−1,0,−2) 300:(0,2,−3) 400:(−1,−1,−7 on B).
- **Option C (exact for the default)**: option A or B for custom admin colours **plus** a hard-coded 11-step table returned when the primary equals `#0ca768` (keeps the theme contract, gives pixel-exact Figma on the default theme). Recommended (decision D3).

### 1.4 Gradients

| Where | Stops | Notes |
|---|---|---|
| Buttons `Gradient` variant (80:4662), Buttons - Dashboard `Gradient` | `Accent-400 #3cbb8d` → `Accent-600 #098d58` | stop 1 bound to `Accent/Accent-400`; use `from-primary-400 to-primary-600` (the app's `gradient` Button currently uses primary-500→600) |
| Page background, Doctor Overview `339:17421` and Queue `368:14306` | `Fill Color #f5f7f6` (0) → `#ffffff` (1), linear, gradientTransform `[[0.894,0.291,0],[-0.291,0.276,0.5]]` on a 1440×800 frame | direction derived from the matrix ≈ 120° CSS (top-left → bottom-right, slightly steeper than 45°). Derived, not read as an angle: verify visually. |
| Page background, Patient Queue `339:15916` | `#f9f9f9` (0) → `Accent-50 #e6f7f0` (1), `[[-0.896,-0.3,1.017],[0.3,-0.276,0.516]]` | derived ≈ 301° CSS (light-green glow in the top-left) |
| Card ring/stroke | `#0ea5e9` → `#14b8a6` | see 1.2 |

### 1.5 Page backgrounds (root frame fills)

| Frame | Fill |
|---|---|
| Landing Page 80:1754, List Page 80:1482/32:1183, Main 59:3964, Patient List Page 396:12430 | `#fafafa` |
| Appointments 255:11674, Analytics 257:10189, phone Queue 341:18476/368:17738 | `Fill Color #f5f7f6` (variable bound on the desktop ones) |
| Prescriptions 307:13617, Patient Appointments 191:5570 | `#f9f9f9` |
| Doctor Overview 339:17421, Queue 368:14306 | gradient (1.4) |
| Patient Queue 339:15916 | gradient (1.4) |

---

## 2. Typography

### 2.1 Family — verified

- **Primary family: Instrument Sans** (Google Font). 1,810 of ~2,410 text nodes in the scan (~75%). `get_design_context` returns `style={{ fontVariationSettings: '"wdth" 100' }}` on every text — the width axis is at its default (100) so **no variable-width axis is needed**; static weights suffice. Weights used: Regular 400, Medium 500, SemiBold 600, Bold 700. (`index.html` already loads Instrument Sans 400/500/600/700, so no font-loading change.)
- **Inter** (24%): only in chrome — `Navbar/Default` links (Inter Regular 16, 36+20 nodes), `Logo` wordmark "Dococlock" (Inter Regular 16 / 28), `Buttons - Dashboard` labels (Inter Regular 16, **−2 % tracking**, 49 nodes), pagination numbers (Inter 14), table column heads (Inter Regular 14 **−5 %**), chart axis labels (Inter 12 **−4 %**), progress-bar step labels (Inter 12 **−6 %**), and the `Tab` component (Inter Bold 16 active / Regular 16 inactive).
- **Outfit** (16 nodes): breadcrumb "Home / Specialists" only (Regular 16, 0 % / 1 %). **Roboto** (2): the "or" divider on the auth page. Neither is loaded in the app; not worth adding.
- **Ubuntu is not used anywhere in Figma.** The app's `font-stat` (Ubuntu, 37 uses) has no Figma counterpart; big numbers in Figma are Instrument Sans Medium/Regular. **Manrope** is also absent from Figma (and `font-manrope` is used 0 times in the app).

### 2.2 Type scale — Instrument Sans (counts from the dedicated 13-section type scan)

Line-height "auto" = normal (`line-height: normal`). Letter-spacing given as Figma % and its px equivalent (% × font size).

| Role (Figma variant / usage) | Weight | Size | Line-height | Letter-spacing | Case | Count | Colour |
|---|---|---|---|---|---|---|---|
| Stat XL (landing stats "15+", "5,000+") | Medium 500 | 70 | auto | 0 | – | 3 | Text/Primary |
| Display (queue counters "35", "09:00 PM") | Regular 400 | 64 | auto | 0 | – | 3 | Text/Primary |
| **Hero / section H1** ("Find The Right Doctor", "Our Services") | Regular 400 | 48 | **58 px** | **+2 % (0.96 px)** | – | 17 | Text/Primary |
| Stat (Overview "20", "5000") | Medium 500 | 48 | auto | **−2 % (−0.96 px)** | – | 2 | Text/Primary |
| Stat delta ("−10.4 %") | Regular 400 | 48 | auto | 0 | – | 1 | – |
| Header 36 (Typography - Dashboard `Header`; page titles "Medicines") | Regular 400 | 36 | auto | 0 | – | 34 | Text/Primary |
| Name 36 ("Ahmed Irtiza") | Bold 700 | 36 | auto | 0 | TITLE (capitalize) | 4 | Text/Primary |
| Title 24 (marketing card titles, "Dr. Sarah Rahman") | Medium 500 | 24 | auto | 0 | – | 77 | Text/Primary |
| Title 24 (dashboard) | Regular 400 | 24 | auto | 0 | – | 71 | Text/tertiary by default, instances override |
| Title 24 two-line ("Consultation / Doctors") | Medium 500 | 24 | **34 px** | 0 | – | 4 | Text/Primary |
| Stat 24 ("12+", "20" in Doctor Card) | Bold 700 | 24 | auto | 0 | TITLE | 16 | Text/Primary |
| CTA 24 ("Get an Appointment") | Medium 500 | 24 | auto | 0 | TITLE | 12 | – |
| Title 20 (Typography `Title - 20`; FAQ questions) | Medium 500 | 20 | auto | 0 | – | 6 (+21 in component) | Text/Primary |
| Title 20 (dashboard list titles "Napa") | Regular 400 | 20 | auto | 0 | – | 52 | Text/tertiary by default, instances override |
| Subtitle 16 (Typography `Subtitle - 16`) | Regular 400 | 16 | **22 px** | 0 | – | 164 | Text/tertiary |
| Paragraph 16 (Typography `Paragraph - 16`) | Regular 400 | 16 | auto | **+2 % (0.32 px)** | – | 44 | Text/tertiary |
| Body 16 / labels / button labels in Buttons set | Regular 400 | 16 | auto | 0 | – | 138 | varies |
| Button Text 16 (Typography `Button Text - 16`, Input labels) | Medium 500 | 16 | auto | 0 | – | 3 | Text/Primary |
| Long-form body ("Once you complete next…", doctor bio) | Regular 400 | 18 / 16 / 13 | **150 %** | 0 | 16 = TITLE | 4 / 4 / 9 | Text/tertiary |
| Body 14 (most common text in the file) | Regular 400 | 14 | auto | 0 | – | **409** | Text/secondary / tertiary |
| Body 14 tabular (pagination) | Regular 400 | 14 | auto | 0 px | – | 78 | – |
| Value / Eyebrow 14 (Typography `Value - 14`) | Medium 500 | 14 | auto | 0 | – | 12 | Text/Primary |
| Nav link active (Nav Link - Dashboard) | SemiBold 600 | 14 | auto | 0 | – | 14 | Text/inverse |
| Names in table rows | Regular 400 | 14 | auto | +1 % (0.14 px) | – | 8 | – |
| Small 12 (Typography `Small - 12`, chips, captions) | Regular 400 | 12 | auto | 0 | – | 305 | Text/tertiary |
| Small 12 medium ("Hospital", "Appointment" tags) | Medium 500 | 12 | auto | 0 | – | 6 | Text/Primary |
| Small 12 label uppercase-ish ("Experience", "Sessions") | Regular 400 | 12 | auto | 0 | TITLE | 16 | Text/tertiary |
| Weekday abbreviations ("SUN MON") | Regular 400 | 12 | auto | 0 px | LOWER | 14 | – |
| Month title | Medium 500 | 16 | auto | 0 px | – | 2 | – |

`Typography` component set 80:4747 (7 variants, all Instrument Sans): `Paragraph - 16` Regular/tertiary +2 %; `Title - 24` Medium/primary; `Value - 14` Medium/primary; `Button Text - 16` Medium/primary; `Subtitle - 16` Regular/tertiary lh 22; `Title - 20` Medium/primary; `Small - 12` Medium/primary.
`Typography - Dashboard` 302:12624 (8 variants): the same seven **plus `Header` 36**, but every variant defaults to **Regular / Text/tertiary** (instances override weight and colour, hence the many `#171717` overrides).

Note the two weight systems: the `Buttons` (80:4641) labels are Regular 16 whereas Typography `Button Text - 16` is Medium 16. Buttons in Figma use Regular.

### 2.3 Inter usages (chrome only)

| Where | Size / weight / tracking |
|---|---|
| Navbar/Default links, Login | Inter Regular 16, 0 |
| Logo wordmark | Inter Regular 16 (dashboard) / 28 (marketing) |
| Buttons - Dashboard labels | Inter Regular 16, −2 % (−0.32 px) |
| Table column heads | Inter Regular 14, −5 % (−0.7 px) |
| Chart axis | Inter Regular 12, −4 % (−0.48 px) |
| Progress-bar step labels | Inter Regular 12, −6 % (−0.72 px) |
| Tab pills | Inter Bold 16 (active) / Regular 16 (inactive, Text/tertiary) |
| Pagination | Inter Regular 14, 0 |

---

## 3. Radius scale

| Figma radius | Count | Used on | App token |
|---|---|---|---|
| 24 | 391 | Doctor Card + its image, Icons, cards, Status chips | `rounded-ds-lg` (24px, exists) = Tailwind `rounded-3xl` (overridden to 1.5rem) |
| 8 | 320 | Input Box, Search, Navbar dashboard controls | `rounded-ds-sm` (8px, exists) = `rounded-lg` |
| 500 | 244 | Icon buttons, Button Effect, Buttons arrow, Navbar bar | `rounded-full` (equivalent for pill heights) / `rounded-ds-pill` (500px exists) |
| 100 | 201 | Buttons, Chip, Eyebrow, Icons in Main | `rounded-full` |
| 12 | 148 | Nav Link - Dashboard items, cards Queue/Appointments/Prescriptions/Analytics | Tailwind `rounded-xl` (12px) |
| 64 | 135 | Tab Buttons, Toggle, Search pill | `rounded-full` |
| 16 | 131 | Medicine Track, Navlinks, Info Box | Tailwind `rounded-2xl` (16px) |
| 21 | 80 | Frame 1000012551 (42×42 icon-button circles) | `rounded-full` |
| 32 | 77 | User Card, Frame 1000012514, Queue cards | `rounded-ds-xl` (32px, exists) = `rounded-4xl` |
| 5 | 71 | Rectangle 3871 (progress/queue bar segments) | `rounded-[5px]` (new `ds-xs`) |
| 10 | 70 | numbered instances 1–4 | `rounded-[10px]` |
| 4 | 51 | Analytics bars, small frames | Tailwind `rounded` (4px) |
| 20 | 32 | Hospitals, Patients Status, Bottom cards | `rounded-[20px]` |
| 0.5 / 1 / 2 | 4/19/13 | hairlines | – |
| 13 | 2 | (the app's `ds-md` = 13px has essentially no Figma use) | keep, low priority |

Corner smoothing not used.

---

## 4. Effects

### 4.1 Drop shadows (all colour `#000`)

| Figma effect (x, y, blur r, spread 0, alpha) | Count | Used on | App token |
|---|---|---|---|
| `12, 9, 20, 0.04` | 44 | User Card, Frame 1000012514/567/568 (rows in dashboards) | NEW `shadow-ds-row: 12px 9px 20px 0 rgba(0,0,0,.04)` |
| `0, 0, 1, 0.25` | 39 | Search / Input Box | `shadow-ds-input` (exists: `0 0 1px rgba(0,0,0,.25)`, exact) |
| `0, 0, 12, 0.06` | 21 | Queue Card, Queue cards "1", Card 3 | NEW `shadow-ds-queue: 0 0 12px 0 rgba(0,0,0,.06)` |
| `0, −1, 12, 0.04` | 19 | Queue cards "3", "767", "769" | NEW `shadow-ds-rise: 0 -1px 12px 0 rgba(0,0,0,.04)` |
| `0, 0, 7, 0.05` | 17 | Trail Icon Button, Verified | `shadow-ds-pill` (exists, exact) |
| `−2, −4, 8, 0.02` | 15 | Medicine Track | NEW `shadow-ds-track: -2px -4px 8px 0 rgba(0,0,0,.02)` |
| `0, −4, 12, 0.04` | 13 | Queue cards "3","4","7" | NEW `shadow-ds-rise-lg: 0 -4px 12px 0 rgba(0,0,0,.04)` |
| `0, 0, 18.1, 0.10` | 10 | Modal (all modals) | NEW `shadow-ds-modal: 0 0 18.1px 0 rgba(0,0,0,.1)` |
| `0, −4, 12, 0.08` | 8 | Action in Toaster | NEW `shadow-ds-toast: 0 -4px 12px 0 rgba(0,0,0,.08)` |
| `0, 2, 20, 0.04` | 7 | – | NEW (low priority) |
| `0, −8, 20, 0.05` | 1 (component) | **Doctor Card - Final `Default` (hover) state** | NEW `shadow-ds-doctor-hover: 0 -8px 20px 0 rgba(0,0,0,.05)` |
| `0, 0, 2, 0.15` / `0, 0, 1, 0.15` / `7, 5, 13.7, 0.04` / `−3, 2, 20.5, 0.1` / `0, 0, 26.4, 0.1` / `0, 0, 18.1, 0.15` | 3/3/3/2/3/3 | misc | keep as arbitrary |

The app's `shadow-ds-card` (`0 0 2px rgba(0,0,0,.25)`, 47 uses) has **no exact Figma counterpart** (nearest is `0,0,2,0.15`, 3 nodes). `shadow-ds-soft` (`0 10px 40px -10px .05`, used by `.glass-panel`) does not appear in Figma at all.

### 4.2 Blur / glass / shader

- **LAYER_BLUR** on decorative ellipses: radius 71.4 (24 nodes), 44.7 (11), 75.1 (6), 55.2 (5), 70 (1). Figma layer-blur radius maps to CSS `filter: blur(radius/2)` (Figma convention — verify visually) → blur ≈ 35.7px / 22.35px / 37.5px / 27.6px / 35px.
- **GLASS** (Figma "Liquid Glass" effect) on `3` frames inside `Queue Manage Row › Top` (Patient Dashboard, 328×202 and 218×66; fill `#fff @ 0.5`): `radius 40, refraction 0.8, depth 51, lightAngle −45, lightIntensity 0.8, dispersion 0.83, splay 0.52` (13 nodes). Not reproducible in plain CSS; closest: `backdrop-filter: blur(20px) saturate(1.2)` on a `rgba(255,255,255,.5)` fill + 1 px inner light edge. Approximation, flag as such (D6).
- **SHADER** custom effect on `Ellipse 77` (258×258) inside `Queue Manage Row` (2 nodes; id `fdd6f30d…/613`, properties are opaque keys). Cannot be read as parameters — use an exported asset or a CSS conic/radial gradient (open issue O3).

---

## 5. Spacing

Auto-layout gap (`itemSpacing`), most used first: **10 (2,505 — Figma's auto-layout default on Typography wrappers, not a design value)**, 8 (957), 4 (922), 24 (353), 0 (299), 16 (232), 12 (135), −14 (78), 113 (67), 48 (63), 20 (62), −24 (54), 28 (46), 2 (44), 126 (32), 415 (29), 131 (28), 258 (28), 36 (21), 88 (18), 64 (17), 208 (17), 120 (13), 32 (12), 41 (11).
Meaningful scale: **4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 36 · 48 · 64** — all multiples of 4, all in Tailwind's default spacing (`1 2 3 4 5 6 7 8 9 12 16`). Negative gaps (−14, −24) are overlapping avatar stacks / Buttons label-over-effect stacks. The big gaps (88, 113, 120, 126, 131, 208, 258, 415) are hero/section layout compositions (inspect per frame).

Padding (top,right,bottom,left), most used: `12,20,12,20` (129, Nav Link, buttons) · `4,8,4,8` (113) · `4,4,4,4` (111) · `12,12,12,12` (111) · `16,16,16,16` (111) · `20,20,20,20` (83, User Card) · `12,16,12,16` (81) · `13,13,13,13` (80) · `0,12,0,12` (79) · `8,8,8,8` (78) · `16,20,16,20` (74) · `24,24,24,24` (69) · `0,16,0,16` (61) · `16,18,16,18` (55) · `8,16,8,16` (54) · `8,4,8,4` (53) · `8,12,8,12` (49, Eyebrow) · `0,120,0,120` (37, section gutters) · `48,64,48,64` (25) · `12,24,12,24` (19, Tab) · `32,32,32,32` (Process Cards).
No new spacing tokens are needed except two odd values (13, 18) that appear as arbitrary `p-[13px]` / `px-[18px]`.

### 5.1 Component dimensions (reusable sizing tokens read from the component sets)

| Component (set id) | Variant → size | Details |
|---|---|---|
| Buttons (80:4641) | Primary / Secondary / Tertiary / Sage / Gradient → **114×45**, pill r100 | Primary fill Accent-500; Secondary fill `#fff`; Tertiary stroke 1 Text/Primary; Sage stroke 1 white; Gradient Accent-400→Accent-600; label Instrument Sans Regular 16 (white on primary/gradient/sage, `#202020` on secondary/tertiary) |
| Button Usual Hover (80:4768) | Default 114×45 (r0) ↔ Hovered 114×45 (r100) | hover = soft-light radial sheen (already `.btn-sheen`) |
| Button Featured Hover (80:4763) | **Default 44×45 (icon only) ↔ Hovered 114×45 (icon + label)** | the collapse/expand nav CTA |
| Tab (80:4680) | active 63×43 · inactive 67×43; pad 12/24; r100 | active fill Accent-500, Inter Bold 16 white; inactive fill `#fff`, Inter Regular 16 Text/tertiary |
| Eyebbrow (80:4634) | Variant 1: 195×36, white fill, 16 px text; Variant2: 137×33, no fill, 14 px text | pad 8/12, r100, Text/tertiary |
| Nav Link - Dashboard (317:13571) | Default 69×41 · Inactive 68×41; pad 12/20; r12 | active fill Accent Color, SemiBold 14 white; inactive Regular 14 Text/disabled |
| Buttons - Dashboard (303:13196) | Monochrome / Secondary / Primary / Gradient → **121×48** | label Inter Regular 16 (−2 %) |
| User Card (368:15036) | Default 320×154 fill `#fff` · Variant2 367×154 fill `#f8f8f8` · Variant3 320×154 fill `#dde5e1` | pad 20, gap 24, r32, shadow `12,9,20,.04` |
| Doctor Card - Final (80:4685) | Variant2 (resting) **384×502**, pad 4, r24 · Default (hovered) **384×482**, r24, shadow `0,-8,20,.05` | see flows.md for the hover chain |
| Process Cards (80:4731) | Default 505×315 · Variant3 256×233 | pad 32, gap 24, r24, fill `#fff` |
| Featured Tabs (80:4670) | 570×50, gap 20 | active Regular 24 Text/Primary; inactive Regular 24 Text/tertiary |
| Input Field (80:4937) | Text/Simple/Drop Down/Upload 388×75–76 · Numeric 680×84 | label Medium 16 Text/Primary, gap 8; Input Box r8, fill+stroke `Input Field #fbfbfb` |
| 3 Buttons (317:15075) | 32×32 toggles, pad 16, r24 | active fill Accent-500 |

---

## 6. Layout / page widths

| Frame family | Width | Height | Notes |
|---|---|---|---|
| Landing / List Page (Pre Login) | **1460** | Landing 8223, List 3962 | content sits in a 1440 column inset 10 px (`Group 18@10,915 1440×84`, `How it works@10 1440×…`); `Navbar/Default` container **1224×69** at x=118; vertical auto-layout, gap 48 on List Page |
| Section content column | **1200** (`0,120,0,120` padding inside 1440) | – | e.g. Patient `How it works@52 1200×502` |
| Doctor / Patient dashboard pages | **1440 × 800** viewport frames (body 1048–1147 tall, content scrolls) | – | `Body 1440×1048/842/847/1147` |
| Phone (App Version V1, phone frames) | **400 / 402** (also 420 on old mobile-web frames) | 800–917 | plus `Body 400×842` |
| Modals | 411×142 · 447×420 · 565×515 · 565×549 · 612×414 · 612×422 · 612×580 · 644×636 · 696×636 · 696×693 | – | fixed widths; overlays centred |
| Toaster | 287×800 / 298×800 / 203×800 / 329×800 (full-height frame; toast at the bottom) | – | slide-up |
| Popover menus | 136×117 · 136×119 · 179×117 · 260×376 (account menu) | – | placed with overlay offsets (flows.md) |
| Side panel | Queue Card 363×801 (slides in from the left) | – | |

Breakpoints: Figma defines only 1440/1460 (desktop) and 400/402 (phone); nothing for tablet — keep the app's existing responsive breakpoints.

---

## 7. Motion tokens (from every prototype reaction in the file)

389 nodes with reactions on Web, 160 on App. Vocabulary:

| Token | Value | Meaning / CSS |
|---|---|---|
| Easing (all reactions except 4) | `EASE_OUT` | `cubic-bezier(0, 0, 0.58, 1)` |
| Fast duration | 0.3 s | hover, navigate, overlay, swap, most transitions |
| Medium duration | 0.5 s | Manage/Profile screen changes (SMART_ANIMATE 0.5), toaster/modal (DISSOLVE/MOVE_IN 0.5) |
| Spring | `GENTLE`, 1.022 s | only "View All" on the landing (80:1817 → List Page); spring constants are not exposed by the API — use ~1 s ease-out-back-ish or a `motion` spring named "gentle" |
| Toaster auto-dismiss | `AFTER_TIMEOUT` 0.5 s (Web), 0.5–0.8 s (App) | after the toast appears, navigate back |

Histogram on Web (trigger | action | transition): hover CHANGE_TO SMART_ANIMATE EASE_OUT 0.3 ×145 · click NAVIGATE DISSOLVE 0.3 ×117 · click OVERLAY DISSOLVE 0.3 ×55 · click OVERLAY (no transition, popover) ×17 · click NAVIGATE SMART_ANIMATE 0.3 ×12 · timeout NAVIGATE DISSOLVE 0.3 ×8 · CLOSE ×8 · SWAP DISSOLVE 0.3 ×6 · NAVIGATE SMART_ANIMATE 0.5 ×5 · NAVIGATE SMART_ANIMATE **GENTLE 1.022** ×4 · BACK ×4 · SWAP MOVE_IN BOTTOM 0.5 ×2 · OVERLAY MOVE_IN LEFT 0.3 ×1 (Queue list panel) · OVERLAY MOVE_IN BOTTOM 0.5 ×1.
App adds: OVERLAY MOVE_IN **TOP** 0.3 ×18 (phone sheets slide from the top), NAVIGATE MOVE_IN TOP 0.3, OVERLAY MOVE_IN BOTTOM 0.3/0.5.

Existing app motion (`index.css`): `.btn-sheen` transition 0.3s ease; `.animate-fade-in` 0.3s ease-out; `.animate-fade-in-up` 0.4s cubic-bezier(.16,1,.3,1). Proposed: a single `--ease-ds: cubic-bezier(0,0,.58,1)` and duration tokens 300/500ms.

---

## 8. Mapping table — Figma token → existing app token

| Figma | Value | App token / file | Status |
|---|---|---|---|
| Accent-500 / Accent Color / Text/accent / Text/link | `#0ca768` | `primary-500` = `medical-500` = `brand-500` (`--color-primary-500: 12 167 104`) | exact |
| Accent-600 / Text/link-hover | `#098d58` | `primary-600` (`10 142 88`) | Δ1 → fixed by 1.3 |
| Accent-700 / 800 | `#077448` / `#055a39` | `primary-700` / `primary-800` | Δ1–2 |
| Accent-900 | `#03402a` | `secondary-500` (`--color-secondary-500: 3 64 42`) | exact, default theme |
| Accent-950 | `#022a1c` | none → NEW `primary-950` (or `secondary-700` `2 45 29`, Δ3) | new |
| Accent-50…400 | see 1.3 | `primary-50…400` | **value gap up to 46**, fix in generator |
| Fill Color | `#f5f7f6` | `--color-background` / `bg-surface` / `bg-container` / `bg-background` | exact |
| Input Field | `#fbfbfb` | `ink-50` | exact |
| Text/Primary | `#171c1a` | NEW `content-primary` (`ink-800` `#171717` is Δ6,5,3) | new |
| Text/secondary | `#4b5752` | NEW `content-secondary` (nearest `slate-600`/`ink-700` are very different) | new |
| Text/tertiary | `#707b76` | NEW `content-tertiary` (nearest `ink-500` `#909090` Δ32) | new |
| Text/disabled | `#a8b0ac` | NEW `content-disabled` (nearest `ink-400` `#A3A3A3`, Δ5,13,9) | new |
| Text/inverse | `#ffffff` | `white` | exact |
| Ghost | `#d0d8eb` | NEW `ghost` | new |
| Secondary | `#7b87a4` | NEW `steel` | new |
| Neutral Light (lib) | `#f2f2f2` | `ink-200` | exact |
| Secondary-button-text (lib) | `#666666` | `ink-600` | exact |
| literal `#171717` | | `ink-800` | exact |
| literal `#f6f6f6` / `#d9d9d9` / `#909090` / `#000` | | `ink-100` / `ink-300` / `ink-500` / `ink-900` | exact |
| literal `#fafafa` / `#f9f9f9` | page bg | Tailwind `neutral-50` (Δ0/1) or NEW `page` | new alias |
| brand gradient `#0ea5e9→#14b8a6` | | `brand.sky` / `brand.teal` | exact (fixed by design) |
| `#f59e0b` stars | | Tailwind `amber-500` | exact |
| radius 8 / 24 / 32 / 500 | | `rounded-ds-sm` / `-lg` / `-xl` / `-pill` | exact |
| radius 12 / 16 / 4 | | Tailwind `rounded-xl` / `-2xl` / `rounded` | exact |
| radius 100 / 64 / 21 | | `rounded-full` | equivalent |
| shadow `0 0 1px .25` / `0 0 7px .05` | | `shadow-ds-input` / `shadow-ds-pill` | exact |
| shadow `0 0 2px .25` (`ds-card`) | | (none in Figma) | orphan |
| font Instrument Sans | | `font-display` (199 uses) | exists |
| font Inter | | `font-sans` (base) | exists |
| font Ubuntu / Manrope | | `font-stat` / `font-manrope` | no Figma counterpart |

---

## 9. NEW tokens proposed

`tailwind.config.js` (extend):
```js
colors: {
  primary: { 950: 'rgb(var(--color-primary-950) / <alpha-value>)' },   // also add to medical/brand? only primary needed
  // fixed (not admin-themed) text/neutral tokens from the Figma "Texts" collection
  content: { primary: '#171c1a', secondary: '#4b5752', tertiary: '#707b76', disabled: '#a8b0ac' },
  ghost: '#d0d8eb',
  steel: '#7b87a4',
  page: '#fafafa',                       // pre-login page background (= neutral-50)
},
boxShadow: {
  'ds-row':   '12px 9px 20px 0 rgba(0,0,0,0.04)',
  'ds-queue': '0 0 12px 0 rgba(0,0,0,0.06)',
  'ds-rise':  '0 -1px 12px 0 rgba(0,0,0,0.04)',
  'ds-rise-lg': '0 -4px 12px 0 rgba(0,0,0,0.04)',
  'ds-track': '-2px -4px 8px 0 rgba(0,0,0,0.02)',
  'ds-modal': '0 0 18.1px 0 rgba(0,0,0,0.1)',
  'ds-toast': '0 -4px 12px 0 rgba(0,0,0,0.08)',
  'ds-doctor-hover': '0 -8px 20px 0 rgba(0,0,0,0.05)',
},
borderRadius: { 'ds-xs': '5px', 'ds-2xs': '4px' /* optional */ },
fontSize: {
  'ds-stat-xl': ['70px', { lineHeight: 'normal', fontWeight: '500' }],
  'ds-display': ['64px', { lineHeight: 'normal' }],
  'ds-hero':    ['48px', { lineHeight: '58px', letterSpacing: '0.02em' }],
  'ds-stat':    ['48px', { lineHeight: 'normal', letterSpacing: '-0.02em', fontWeight: '500' }],
  'ds-h36':     ['36px', { lineHeight: 'normal' }],
  'ds-title-24':['24px', { lineHeight: 'normal' }],
  'ds-title-20':['20px', { lineHeight: 'normal' }],
  'ds-subtitle':['16px', { lineHeight: '22px' }],
  'ds-paragraph':['16px', { lineHeight: 'normal', letterSpacing: '0.02em' }],
  'ds-body':    ['14px', { lineHeight: 'normal' }],
  'ds-small':   ['12px', { lineHeight: 'normal' }],
},
transitionTimingFunction: { 'ds-out': 'cubic-bezier(0, 0, 0.58, 1)' },
transitionDuration: { 'ds-fast': '300ms', 'ds-slow': '500ms' },
```
`index.css :root`: add `--color-primary-950` (and `--color-secondary-950` if the generator gains step 950), a `--ds-ease-out`, and utility classes for the two page gradients (`.bg-ds-page-overview`, `.bg-ds-page-patient`) built from `rgb(var(--color-background))` and `rgb(var(--color-primary-50))` so they stay themable (the gradient stops are `Fill Color→#fff` and `#f9f9f9→Accent-50`).
`utils/colorScale.ts`: new tint model + step 950 (decision D3). `ThemeContext.applyToDocument`: also write `--color-primary-950`.

---

## 10. Decisions to make (recommendation first)

| # | Decision | Recommendation | Evidence |
|---|---|---|---|
| **D1** | Base body font: Inter (today) vs Instrument Sans | **Instrument Sans as the document default; Inter kept (as `font-inter`/`font-sans`) only for navbar links, logo wordmark, dashboard button labels, pagination, table heads and chart axes.** | 76% of text nodes are Instrument Sans; Inter only appears in the chrome items listed in 2.3. The app currently does the reverse (body Inter, Instrument Sans opt-in via `font-display`, 199 uses). Caution: flipping the body font reflows every un-classed text; do it with the per-view restyles. |
| **D2** | Neutral text colours | **Add `content-*` tokens for `#171c1a/#4b5752/#707b76/#a8b0ac` and use them for anything restyled to Figma; keep `ink-*` (exact `#171717`, `#666666`, `#909090`, `#f2f2f2` etc.) for the dashboards' literal greys. Do not bulk-replace the 167 `text-slate-400`/62 `text-slate-500` etc. blindly.** | Variable-bound text (`Text/Primary/secondary/tertiary/disabled`) covers ~1,500 nodes; literal greys (`#171717` 241, `#5e5e5e` 87, `#505050` 63, `#8a94a3` 89, `#999` 43) still cover ~900 nodes in the dashboards. Both systems exist in the file. |
| **D3** | Accent tint fidelity | **Option C (exact table for the default primary + Option A constants for custom colours + step 950).** | 1.3. Anything else leaves `primary-100..400` up to 46/255 off on the default theme, which is exactly the colour shown on soft cards/badges. |
| **D4** | Accent-900 / 950 mapping | `Accent-900 → secondary-500` (exact); `Accent-950 → new primary-950` (black-mix 0.75, residual (1,0,−2)). | 900 equals default secondary exactly; 950 has no hue-shift needed. |
| **D5** | Fonts to drop | Remove Manrope (0 uses) from the Google Fonts URL and stop using Ubuntu `font-stat`; render stat numbers in Instrument Sans Medium. Ignore Outfit/Roboto (breadcrumb / auth "or"). | Ubuntu/Manrope absent from Figma. |
| **D6** | Glass + shader effects | Approximate with `backdrop-filter` and an asset/gradient; do not chase parity. | 4.2 |
| **D7** | `shadow-ds-card` / `shadow-ds-soft` | Keep for un-restyled views; use the new shadows only where restyled to Figma. | No Figma equivalent. |
| **D8** | Legacy `#2e8cff`/`#061535` inside `User Card` and `Main` mocks | Do not port; if a shipped component still shows the blue, use `primary-500`. | 1.2 |
| **D9** | Page backgrounds | Doctor/Patient: `background` token (themed) + the two gradients built from theme vars; pre-login: `page` (#fafafa). | 1.5 |

---

## 11. Verification recipe (for the implementers)

- Colours: `getComputedStyle` of the default-theme page should give `--color-primary-500: 12 167 104`, `-50: 230 247 240`, `-100: 207 240 227`, `-200: 163 226 202`, `-300: 112 208 173`, `-400: 60 187 141`, `-600: 9 141 88`, `-700: 7 116 72`, `-800: 5 90 57`, `-900: 3 64 42`, `-950: 2 42 28` (after D3-C).
- Type: Instrument Sans body 14/normal; hero 48/58 with `letter-spacing: .96px`.
- Motion: every hover/navigate transition `0.3s cubic-bezier(0,0,.58,1)`; page-level Manage/Profile changes `0.5s`.

## 12. Open issues / gaps

- **O1** `Design System` page (0:1) is empty; there are no local styles — token names above are the only ones Figma provides (`Texts` collection). If a Design System page exists in another branch/version it was not visible.
- **O2** `Payment & Subscription` section (341:18165) has **0 children** — no design to implement (the app has `views/doctor/PaymentSubscription.tsx`).
- **O3** SHADER effect parameters are opaque (keys `2574390939:2910070296`, `2687053985:3528483286` (x:64,y:56), `2813038873:597654388` = 2.2, `3600823871:2051844648` = 20); GLASS is a native Figma effect.
- **O4** GENTLE spring constants (mass/stiffness/damping) are not returned by the API; only name and 1.022 s duration.
- **O5** Gradient angles (1.4) are derived from `gradientTransform`, not read as CSS angles — verify visually.
- **O6** Library variable `color/background/neutral/sufacePrimary` (17 fills) is an alias whose resolved value was not read; inspect the painted fills before choosing a token.
- **O7** Scan excludes `Old Pre Login Pages` (legacy) and `App Version V1`'s node population; `App Version V1` was read only for flows (see flows.md) and shares the same tokens (same variable ids observed).
