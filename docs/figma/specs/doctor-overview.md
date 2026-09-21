# doctor-overview - Doctor Overview (`/doctor/dashboard`, "Doctor Overview / doctor profile page")

Figma `zJRyAML8hv0uEBOXtu5Hpn`, page `Web Version V1`. Extracted with `get_design_context`, `use_figma` (read-only: reactions + geometry), `get_motion_context(recursive)` = `{"nodes":[]}` (no keyframe motion anywhere). Status: EXTRACTED (desktop + popover), phone frame pending, IMPLEMENTATION pending. (progress notes - rewritten at the end)

## 1. Frames
| id | name | size | role | reference PNG (2x) |
|---|---|---|---|---|
| `339:17421` | Queue (= Overview) | 1440x800, fill `linear-gradient(120.38deg, Fill Color 0%, #fff 84.355%)` (Layout already sets `bg-ds-page-overview`) | page | `reference/doctor-overview/queue-overview-339_17421.png` (2880x1600) |
| `368:18696` | `7` hospital switcher | 179x117 | ON_CLICK overlay of `341:18169` | `.../hospital-switcher-popover-368_18696.png` |
| `572:25777` / `572:26261` (App Version V1) | phone Overview 400x868 / popover 387x219 | phone | not in the unit's frame list, used for the 390px layout | (see section 6) |

Frame-relative geometry @1440 (Body pad 48/64, gap 24; content x64..1376): Navbar y48 h49 (shared chrome) | Header y121 h72 (`Welcome` 160x44, subtitle 380x20 at y173) | Row y217 h513: profile card x64 388x513 (pad 24, gap 24, photo 340x298 r24, Contents 340x143 at y563) | right column x468 w896 h458 (gap 16): Appointments card 896x205, Queue Status card 536x237 at y438, Earning card x1020 344x123 (hugs its content, top aligned) | hospital pill x1151 y132 225x66 (absolute, right edge = content edge 1376), icon button x1318 y144 42x42.
`368:18796` `Frame 2147224481` (x60 y49 50x50) is a second copy of the navbar logo mark drawn over the shared navbar favicon -> shared chrome, not built here (asset kept: `frame-2147224481.svg`).

## 2. Layout / type / colour table (desktop, from design context)
| element | spec |
|---|---|
| Header title "Welcome" | Instrument Sans Regular 36, `#171717` (`ink-800`); subtitle Regular 16 tracking .32px `#8a94a3` (no token -> `steel`, precedent `IconButtons`), text "Track Your Queue and arrive on time" |
| Hospital pill | `rgba(255,255,255,.5)` fill, r32, pad 16/12, w225, shadow `0 -1px 12px rgba(0,0,0,.04)` (`shadow-ds-rise`); name Inter Regular 16 `content-primary`; button 42x42 r21 fill `primary-500`, pad 13, icon `icon-hospital-switch.svg` (13.906x16 in a 32x32 slot) white |
| Profile card | white, r32, pad 24, gap 24, `filter: drop-shadow(0 -1px 6px rgba(0,0,0,.04))`; photo 298 high r24 `object-cover`; name Inter Regular 24 `content-primary` (flex-1); arrow button 42x42 r21, 1px border `primary-100`, pad 13, `icon-arrow-right-up.svg` 16x16 (`#707b76` = `content-tertiary`); Stats gap 4: label Inter 12 tracking -.72px `content-secondary` ("Designation" / "Active"), value Inter 16 tracking -.32px `content-primary` (specialty / active hospital) |
| Appointments card | 896x205, r32, pad 24, `linear-gradient(210.96deg,#fff 67.488%,#f6f6f6 96.269%)` (`ink-100` end), same drop-shadow; title Inter Regular 24 `content-primary`; stat row px48 justify-between: two 1px vertical dividers `#f5f7f6` (`surface`) full row height; number Instrument Sans Medium 48 tracking -.96px `primary-500` (Today, This Month), Progression number Regular 48 no tracking + `icon-progress-arrow.svg` 8.014px box in an 11.333 slot rotated 135deg (points down) gap 10; label Instrument Sans 12 `content-secondary`, gap 8 |
| Queue Status card | white r24 pad 16 gap 16, 536x237, no shadow; title Instrument Sans Regular 24 `#171717`; "Today" chip r100 pad 12/4, 1px border `#eaeceb` (-> `content-disabled/25`), Instrument Sans 12 `ink-800`; body row gap 24 centred: gauge box 218x160 (arc svg 217.73x218.4 at top +17) + legend flex-1 (gap 8; chip 10x10 r5 + label Instrument Sans 16 `#5e5e5e` (`ink-600`), value Inter 16 tracking -.64px `#515151` (`neutral-600`)); chip colours Completed `primary-800` / In consultation `primary-400` / Waiting `primary-50` |
| Earning card | white r24 pad 16 gap 24 (fill remaining width); same header (chip border `#f9f9f9` -> `page`); rows Inter 12 tracking -.48px `#515151`, dot 10x10 r5 gap 4: Earning `primary-500`, Total `ink-300` (#d9d9d9), rows gap 8 |
| Arc gauge (asset `queue-arc-gauge.svg`) | three stacked round-capped arcs, centre (108.87,108.9) of a 217.73 box, outer R 108.87, thickness 43 (r 87.4 centreline, cap radius 21.5): Waiting `#e6f7f0` (`primary-50`) 0..182.8deg, In consultation `#3cbb8d` (`primary-400`) 6.3..156.7deg, Completed `#077448` (`primary-700`) 1.5..124.2deg (angles = cap centres, clockwise from 9 o'clock; drawn light -> dark so lighter caps peek out) |

## 3. Interactions (7 reactions on `339:17421`, `368:18696` has none, no ON_HOVER / CHANGE_TO anywhere -> no variant diff needed)
| # | trigger | source | action | destination | transition |
|---|---|---|---|---|---|
| 1-4 | ON_CLICK | navbar links Queue / Appointments / Prescriptions / Analytics | NAVIGATE | `368:14306` / `255:11674` / `307:13617` / `257:10189` | DISSOLVE EASE_OUT 0.3s (shared navbar) |
| 5 | ON_CLICK | avatar `Frame 1000012212` | OVERLAY | profile menu `368:17693` offset (-181,55) | none (shared chrome) |
| 6 | ON_CLICK | arrow button `339:17434` | NAVIGATE | Doctor Profile `276:12374` -> app `/doctor/profile` | DISSOLVE EASE_OUT 0.3s |
| 7 | ON_CLICK | hospital icon button `341:18169` | OVERLAY | switcher `368:18696`, offset (-145,+56) from the button (popover x1173..1352, y200..317 = 2px under the pill; right edge 8px inside the button's right edge), no scrim, closes on outside click | DISSOLVE EASE_OUT 0.3s |
No hover states exist for the pill, the arrow button or any card (do not invent any).

## 4. Hospital switcher popover `368:18696` (179x117)
White, 1px inside stroke `Fill Color` (`surface`), r16, shadow `0 -4px 12px rgba(0,0,0,.04)` (`shadow-ds-rise-lg`), clip. Three rows 39 high (pad 16/12, gap 8): hospital icon 9.778x12 (`popover-icon-hospital.svg`, `#707b76`; selected row `popover-icon-hospital-active.svg` `#0ca768`) + name Instrument Sans Regular 12 `content-secondary` + count Bold 12 (`content-secondary`); selected row fill `primary-50`, name `primary-500`, count `primary-500`. 1px dividers (`popover-divider-line-18.svg`, `#fbfbfb` = `ink-50`) drawn over the bottom edge of row 1 and row 3.

## 5. Assets (`public/assets/figma/doctor-overview/`, sha256-checked against every other figma asset: no duplicates)
`icon-arrow-right-up.svg`, `icon-hospital-switch.svg`, `icon-progress-arrow.svg`, `queue-arc-gauge.svg` (reference art only - the app draws a data-driven path), `divider-line-64.svg` (not used, CSS hairline), `frame-2147224481.svg` (navbar logo copy, not used), `popover-icon-hospital.svg`, `popover-icon-hospital-active.svg` (identical shape, only stroke differs -> one MaskIcon), `popover-divider-line-18.svg`.
