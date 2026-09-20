/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./views/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // Inter stays the base sans (nav/forms/body — the most-used family)
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                manrope: ['Manrope', 'sans-serif'],
                // Instrument Sans — marketing headlines/titles + dashboard type scale
                display: ['"Instrument Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                // Inter as an explicit opt-in (same stack as `sans`). Figma uses Inter only in chrome:
                // navbar links, wordmark, dashboard button labels, pagination, table heads, chart axes.
                // The base body font is deliberately NOT flipped (docs/figma/tokens.md D1 override):
                // restyled screen roots opt into `font-display`, un-restyled views keep Inter.
                inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                // Ubuntu (bold, capitalized) — exclusively for big analytics/stat numbers
                stat: ['Ubuntu', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
                    50: 'rgb(var(--color-primary-50) / <alpha-value>)',
                    100: 'rgb(var(--color-primary-100) / <alpha-value>)',
                    200: 'rgb(var(--color-primary-200) / <alpha-value>)',
                    300: 'rgb(var(--color-primary-300) / <alpha-value>)',
                    400: 'rgb(var(--color-primary-400) / <alpha-value>)',
                    500: 'rgb(var(--color-primary-500) / <alpha-value>)',
                    600: 'rgb(var(--color-primary-600) / <alpha-value>)',
                    700: 'rgb(var(--color-primary-700) / <alpha-value>)',
                    800: 'rgb(var(--color-primary-800) / <alpha-value>)',
                    900: 'rgb(var(--color-primary-900) / <alpha-value>)',
                    // Figma Accent-950 (Analytics bars, Chip) — black-mix step, see utils/colorScale.ts
                    950: 'rgb(var(--color-primary-950) / <alpha-value>)',
                },
                // Admin-configurable secondary brand color (Super Admin → Branding).
                // New semantic alias for this redesign's new code — see `navy` below
                // for the pre-existing key that resolves through the same variables.
                secondary: {
                    50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
                    100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
                    200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
                    300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
                    400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
                    500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
                    600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
                    700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
                    800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
                    900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
                    950: 'rgb(var(--color-secondary-950) / <alpha-value>)',
                },
                // Dococlock brand scale — kept under the pre-existing `medical-*` key
                // so every current call site (views/patient, views/doctor, etc.)
                // resolves through the live theme CSS variables without renaming
                // classes. Admin-configurable via Super Admin → Branding.
                medical: {
                    50: 'rgb(var(--color-primary-50) / <alpha-value>)',
                    100: 'rgb(var(--color-primary-100) / <alpha-value>)',
                    200: 'rgb(var(--color-primary-200) / <alpha-value>)',
                    300: 'rgb(var(--color-primary-300) / <alpha-value>)',
                    400: 'rgb(var(--color-primary-400) / <alpha-value>)',
                    500: 'rgb(var(--color-primary-500) / <alpha-value>)',
                    600: 'rgb(var(--color-primary-600) / <alpha-value>)',
                    700: 'rgb(var(--color-primary-700) / <alpha-value>)',
                    800: 'rgb(var(--color-primary-800) / <alpha-value>)',
                    900: 'rgb(var(--color-primary-900) / <alpha-value>)',
                },
                // Same brand scale under the design system's own naming. `.teal`/`.sky`
                // are one-off dashboard accents (match Tailwind's stock teal-500 /
                // sky-500 exactly) — intentionally NOT part of the admin-configurable
                // brand ramp, so they stay literal hex.
                brand: {
                    50: 'rgb(var(--color-primary-50) / <alpha-value>)',
                    100: 'rgb(var(--color-primary-100) / <alpha-value>)',
                    300: 'rgb(var(--color-primary-300) / <alpha-value>)',
                    400: 'rgb(var(--color-primary-400) / <alpha-value>)',
                    500: 'rgb(var(--color-primary-500) / <alpha-value>)',
                    600: 'rgb(var(--color-primary-600) / <alpha-value>)',
                    teal: '#14B8A6',
                    sky: '#0EA5E9',
                },
                // Dark-navy used for hero/footer contrast bands and admin-tier dark
                // surfaces — resolves through the same admin-configurable secondary
                // color as the new `secondary` alias above.
                navy: {
                    800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
                    900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
                },
                surface: 'rgb(var(--color-background) / <alpha-value>)',
                container: 'rgb(var(--color-background) / <alpha-value>)',
                // Ink/gray scale — the brand's near-black to mid-gray text ramp
                // (kept separate from Tailwind's default `gray`/`slate` so we don't
                // repaint every pre-existing gray-* utility across the app).
                // Intentionally fixed (not admin-configurable) for text-contrast safety.
                ink: {
                    900: '#000000',
                    800: '#171717',
                    700: '#3E3E3E',
                    600: '#666666',
                    500: '#909090',
                    400: '#A3A3A3',
                    300: '#D9D9D9',
                    200: '#F2F2F2',
                    100: '#F6F6F6',
                    50: '#FBFBFB',
                },
                // Figma `Texts` collection neutrals (Text/Primary, /secondary, /tertiary, /disabled).
                // Fixed (not admin-themed) for contrast safety. Use for anything restyled to Figma;
                // `ink-*` stays for the dashboards' literal greys (docs/figma/tokens.md D2).
                content: {
                    primary: '#171c1a',
                    secondary: '#4b5752',
                    tertiary: '#707b76',
                    disabled: '#a8b0ac',
                },
                // Figma `Ghost` (#d0d8eb): schedule grid lines, Medicine Track bars, dividers.
                ghost: '#d0d8eb',
                // Figma `Secondary` (#7b87a4) — a fixed blue-grey, NOT the themable `secondary` role.
                steel: '#7b87a4',
                // Pre-login page background (Figma #fafafa / #f9f9f9 frames).
                page: '#fafafa',
            },
            boxShadow: {
                'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                'soft': '0 10px 30px -5px rgba(0, 0, 0, 0.03)',
                'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
                // Dococlock design-system shadows (plain white cards, no borders)
                'ds-input': '0px 0px 1px 0px rgba(0,0,0,0.25)',
                'ds-card': '0px 0px 2px 0px rgba(0,0,0,0.25)',
                'ds-pill': '0px 0px 7px 0px rgba(0,0,0,0.05)',
                'ds-soft': '0px 10px 40px -10px rgba(0,0,0,0.05)',
                // Figma drop shadows (all #000), x y blur spread alpha — docs/figma/tokens.md §4.1.
                // Use only on screens restyled to Figma; ds-card/ds-soft above have no Figma counterpart.
                'ds-row': '12px 9px 20px 0px rgba(0,0,0,0.04)',        // User Card, dashboard rows
                'ds-queue': '0px 0px 12px 0px rgba(0,0,0,0.06)',       // Queue Card
                'ds-rise': '0px -1px 12px 0px rgba(0,0,0,0.04)',       // Queue cards
                'ds-rise-lg': '0px -4px 12px 0px rgba(0,0,0,0.04)',    // Queue cards
                'ds-track': '-2px -4px 8px 0px rgba(0,0,0,0.02)',      // Medicine Track
                'ds-modal': '0px 0px 18.1px 0px rgba(0,0,0,0.1)',      // all modals
                'ds-toast': '0px -4px 12px 0px rgba(0,0,0,0.08)',      // Toaster action
                'ds-doctor-hover': '0px -8px 20px 0px rgba(0,0,0,0.05)', // Doctor Card hovered state
            },
            borderRadius: {
                '3xl': '1.5rem',
                '4xl': '2rem',
                '5xl': '3rem',
                // Dococlock design-system radii
                'ds-sm': '8px',
                'ds-md': '13px',
                'ds-lg': '24px',
                'ds-xl': '32px',
                'ds-pill': '500px',
                // Figma radii with no existing token (queue-bar segments 5px, analytics bars 4px)
                'ds-xs': '5px',
                'ds-2xs': '4px',
            },
            // Figma type scale — Instrument Sans (docs/figma/tokens.md §2.2). Pair with `font-display`.
            // Weight is left to the call site except where the role fixes it (stats = Medium).
            fontSize: {
                'ds-stat-xl': ['70px', { lineHeight: 'normal', fontWeight: '500' }],
                'ds-display': ['64px', { lineHeight: 'normal' }],
                'ds-hero': ['48px', { lineHeight: '58px', letterSpacing: '0.02em' }],
                'ds-stat': ['48px', { lineHeight: 'normal', letterSpacing: '-0.02em', fontWeight: '500' }],
                'ds-h36': ['36px', { lineHeight: 'normal' }],
                'ds-title-24': ['24px', { lineHeight: 'normal' }],
                'ds-title-20': ['20px', { lineHeight: 'normal' }],
                'ds-subtitle': ['16px', { lineHeight: '22px' }],
                'ds-paragraph': ['16px', { lineHeight: 'normal', letterSpacing: '0.02em' }],
                'ds-body': ['14px', { lineHeight: 'normal' }],
                'ds-small': ['12px', { lineHeight: 'normal' }],
            },
            // Figma prototype motion: every hover/navigate reaction is EASE_OUT 0.3s; screen changes 0.5s.
            transitionTimingFunction: {
                'ds-out': 'cubic-bezier(0, 0, 0.58, 1)',
            },
            transitionDuration: {
                'ds-fast': '300ms',
                'ds-slow': '500ms',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
            },
            animation: {
                'blob': 'blob 7s infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                }
            }
        }
    },
    plugins: [],
};
