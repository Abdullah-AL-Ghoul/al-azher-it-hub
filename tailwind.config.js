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
