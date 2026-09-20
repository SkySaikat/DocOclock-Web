// Generates a Tailwind-style 50-950 shade scale from a single base hex color
// (anchored at 500), so a Super Admin only ever has to pick one color per
// brand role instead of 11 coordinated shades. Used by ThemeContext to derive
// the full scale that gets written into the app's CSS variables.
//
// Fidelity notes (docs/figma/tokens.md §1.3, decisions D3-C / D4):
//  - Figma's "Accent" ramp is NOT a straight white/black mix. Its tints are a
//    fixed-saturation ramp, so the plain white mix used before was up to 46/255
//    off on the default green (exactly the colour shown on soft cards/badges).
//  - The default primary (#0ca768) therefore returns the hard-coded Figma ramp
//    verbatim (pixel-exact on the default theme).
//  - Any other colour (admin-picked, or the secondary role) uses the constants
//    model below: tints mix toward white by TINT_STEPS, shades toward black by
//    SHADE_STEPS. The constants were fitted against the Figma ramp, so a custom
//    colour lands within ~9/255 of what Figma would have drawn for it, and
//    lightness is always monotonic from 50 (lightest) to 950 (darkest).

export type ColorScale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;

/** Every step of a generated scale, lightest to darkest. */
export const COLOR_SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

type Rgb = [number, number, number];

/** Base color the exact Figma table below belongs to (the platform default primary). */
const DEFAULT_PRIMARY_HEX = '#0ca768';

// Figma `Accent/Accent-50 … Accent-950` for the default primary, as RGB triplets.
// 500 = #0ca768, 900 = #03402a (which is also the default secondary).
const DEFAULT_PRIMARY_SCALE: Readonly<ColorScale> = {
  50: '230 247 240', // #e6f7f0
  100: '207 240 227', // #cff0e3
  200: '163 226 202', // #a3e2ca
  300: '112 208 173', // #70d0ad
  400: '60 187 141', // #3cbb8d
  500: '12 167 104', // #0ca768
  600: '9 141 88', // #098d58
  700: '7 116 72', // #077448
  800: '5 90 57', // #055a39
  900: '3 64 42', // #03402a
  950: '2 42 28', // #022a1c
};

// Lighter steps: mix the base color toward white by this amount.
const TINT_STEPS: Record<number, number> = {
  50: 0.9,
  100: 0.81,
  200: 0.65,
  300: 0.45,
  400: 0.22,
};

// Darker steps: mix the base color toward black by this amount.
const SHADE_STEPS: Record<number, number> = {
  600: 0.15,
  700: 0.3,
  800: 0.45,
  900: 0.6,
  950: 0.75,
};

export function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function mix([r, g, b]: Rgb, target: number, amount: number): Rgb {
  return [
    Math.round(r + (target - r) * amount),
    Math.round(g + (target - g) * amount),
    Math.round(b + (target - b) * amount),
  ];
}

/** "12 167 104" — the RGB-triplet form Tailwind's `rgb(var(--x) / <alpha-value>)` pattern needs. */
export function rgbToTriplet([r, g, b]: Rgb): string {
  return `${r} ${g} ${b}`;
}

/**
 * Generates the full 50-950 RGB-triplet scale from one base hex, anchored at 500.
 * Pure: the same input always yields an equal (freshly allocated) object, and an
 * invalid input falls back to the default primary scale.
 */
export function generateColorScale(hex: string): ColorScale {
  const safeHex = isValidHex(hex) ? hex : DEFAULT_PRIMARY_HEX;

  if (safeHex.toLowerCase() === DEFAULT_PRIMARY_HEX) {
    return { ...DEFAULT_PRIMARY_SCALE };
  }

  const base = hexToRgb(safeHex);
  const scale = { 500: rgbToTriplet(base) } as ColorScale;

  for (const [step, amount] of Object.entries(TINT_STEPS)) {
    (scale as any)[step] = rgbToTriplet(mix(base, 255, amount));
  }
  for (const [step, amount] of Object.entries(SHADE_STEPS)) {
    (scale as any)[step] = rgbToTriplet(mix(base, 0, amount));
  }

  return scale;
}
