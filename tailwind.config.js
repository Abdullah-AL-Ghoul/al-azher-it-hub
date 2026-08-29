/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
        english: ['Inter', 'sans-serif'],
      },
      colors: {
        /* Brand */
        navy: {
          500: '#3B5283',
          600: '#2C4066',
          700: '#1E3A5F',
          800: '#1E293B',
          900: '#0F172A',
        },
        amoled: {
          950: '#000000',
          900: '#0A0A0A',
          800: '#111111',
          700: '#1A1A1A',
        },
        royal: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        cyan: {
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#06B6D4',
          500: '#0891B2',
          600: '#0E7490',
        },
        spatial: {
          bg: '#05060A',
        },
        /* Semantic tokens — driven by CSS vars (light/dark/amoled) */
        surface: 'var(--bg-surface)',
        canvas: 'var(--bg-page)',
        accent: 'var(--color-accent)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        line: {
          DEFAULT: 'var(--border-default)',
          card: 'var(--border-card)',
        },
      },
      fontSize: {
        'display': ['clamp(2.5rem, 5vw, 3.75rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'h1': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'h2': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'h4': ['1.25rem', { lineHeight: '1.35' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.8125rem', { lineHeight: '1.5' }],
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.04em', textTransform: 'uppercase' }],
        'btn': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        floating: 'var(--shadow-floating)',
        glow: '0 0 0 3px var(--ring-color, rgba(37,99,235,0.12))',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'spatial-drift': 'spatialDrift 20s ease-in-out infinite',
        'aurora-shift': 'auroraShift 15s ease-in-out infinite',
        'depth-breathe': 'depthBreathe 5s ease-in-out infinite',
        'orb-float-1': 'orbFloat1 20s ease-in-out infinite',
        'orb-float-2': 'orbFloat2 25s ease-in-out infinite',
        'orb-float-3': 'orbFloat3 30s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        spatialDrift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '25%': { transform: 'translate(30px, -20px) rotate(1deg) scale(1.02)' },
          '50%': { transform: 'translate(-10px, 15px) rotate(-0.5deg) scale(0.98)' },
          '75%': { transform: 'translate(-25px, -10px) rotate(0.5deg) scale(1.01)' },
        },
        auroraShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        depthBreathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        orbFloat1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        orbFloat2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-35px, 25px) scale(0.9)' },
          '66%': { transform: 'translate(25px, -35px) scale(1.08)' },
        },
        orbFloat3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, 30px) scale(1.05)' },
          '66%': { transform: 'translate(-40px, -15px) scale(0.92)' },
        },
      },
    },
  },
  plugins: [],
}
