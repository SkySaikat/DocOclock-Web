// Path helpers for the exported Figma assets used by the Doctor Overview screen.
// Files live in public/assets/figma/doctor-overview/ (see docs/figma/specs/doctor-overview.md §5). Render them through <MaskIcon> so
// theme tokens (text-* classes) recolour them instead of the colour baked into the SVG.
export const OV_ASSET_BASE = '/assets/figma/doctor-overview/';
export const ovAsset = (file: string) => `${OV_ASSET_BASE}${file}`;

export const OV_ICONS = {
  /** arrow-right-up-line 16x16 (profile card "open profile" button). Baked colour #707b76 = content-tertiary. */
  arrowRightUp: ovAsset('icon-arrow-right-up.svg'),
  /** Hospital-switch glyph 13.906x16 (white on the primary circle inside the hospital pill). */
  hospitalSwitch: ovAsset('icon-hospital-switch.svg'),
  /** Progression arrow 8.014x8.014, points up-right; Figma rotates it 135deg for a decline. */
  progressArrow: ovAsset('icon-progress-arrow.svg'),
  /** Hospital-building glyph 10.278x12.5 in the switcher popover rows. Baked colour #707b76; the selected row's green twin is the same shape. */
  hospital: ovAsset('popover-icon-hospital.svg'),
} as const;
