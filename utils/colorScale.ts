// Generates a Tailwind-style 50-900 shade scale from a single base hex color
// (anchored at 500), so a Super Admin only ever has to pick one color per
// brand role instead of 9 coordinated shades. Used by ThemeContext to derive
// the full scale that gets written into the app's CSS variables.

export type ColorScale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

type Rgb = [number, number, number];

// Lighter steps: mix the base color toward white by this amount.
const TINT_STEPS: Record<number, number> = {
  50: 0.95,
  100: 0.9,
  200: 0.75,
  300: 0.6,
  400: 0.3,
};

// Darker steps: mix the base color toward black by this amount.
const SHADE_STEPS: Record<number, number> = {
  600: 0.15,
  700: 0.3,
  800: 0.45,
  900: 0.6,
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

/** Generates the full 50-900 RGB-triplet scale from one base hex, anchored at 500. */
export function generateColorScale(hex: string): ColorScale {
  const base = hexToRgb(isValidHex(hex) ? hex : '#0ca768');
  const scale = { 500: rgbToTriplet(base) } as ColorScale;

  for (const [step, amount] of Object.entries(TINT_STEPS)) {
    (scale as any)[step] = rgbToTriplet(mix(base, 255, amount));
  }
  for (const [step, amount] of Object.entries(SHADE_STEPS)) {
    (scale as any)[step] = rgbToTriplet(mix(base, 0, amount));
  }

  return scale;
}
