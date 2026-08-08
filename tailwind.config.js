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
                // Ubuntu (bold, capitalized) — exclusively for big analytics/stat numbers
                stat: ['Ubuntu', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            colors: {
                primary: '#0f172a',
                // Dococlock brand blue scale — kept under the pre-existing `medical-*`
                // key so every current call site (views/patient, views/doctor, etc.)
                // repaints to the new brand color automatically without renaming classes.
                medical: {
                    50: '#F5FAFF',
                    100: '#E5F1FF',
                    200: '#C7E1FF',
                    300: '#88BEFF',
                    400: '#3FA2FF',
                    500: '#2E8CFF',
                    600: '#1F6FD6',
                    700: '#17569F',
                },
                // Same brand blue scale under the design system's own naming, plus
                // sparing dashboard accents (teal/sky match Tailwind's stock teal-500
                // / sky-500 exactly, so those utilities can be used directly too).
                brand: {
                    50: '#F5FAFF',
                    100: '#E5F1FF',
                    300: '#88BEFF',
                    400: '#3FA2FF',
                    500: '#2E8CFF',
                    600: '#1F6FD6',
                    teal: '#14B8A6',
                    sky: '#0EA5E9',
                },
                // Single dark-navy used for hero/footer contrast bands — the only
                // other saturated surface color in the brand.
                navy: {
                    800: '#0B1F4D',
                    900: '#061535',
                },
                surface: '#F5FAFF',
                container: '#F7FAFF',
                // Ink/gray scale — the brand's near-black to mid-gray text ramp
                // (kept separate from Tailwind's default `gray`/`slate` so we don't
                // repaint every pre-existing gray-* utility across the app).
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
