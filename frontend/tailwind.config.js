/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        navy: {
          50: 'var(--color-navy-50)',
          100: 'var(--color-navy-100)',
          200: 'var(--color-navy-200)',
          300: 'var(--color-navy-300)',
          400: 'var(--color-navy-400)',
          500: 'var(--color-navy-500)',
          600: 'var(--color-navy-600)',
          700: 'var(--color-navy-700)',
          800: 'var(--color-navy-800)',
          900: 'var(--color-navy-900)',
        },
        slate: {
          50: 'var(--color-navy-50)',
          100: 'var(--color-navy-100)',
          200: 'var(--color-navy-200)',
          300: 'var(--color-navy-300)',
          400: 'var(--color-navy-400)',
          500: 'var(--color-navy-500)',
          600: 'var(--color-navy-600)',
          700: 'var(--color-navy-700)',
          800: 'var(--color-navy-800)',
          900: 'var(--color-navy-900)',
        },
        ai: {
          50: '#F5F3FF',
          100: '#EDEAFE',
          200: '#DCD6FD',
          300: '#BFB4FA',
          400: '#8E7CF6',
          500: '#6B5BF2',
          600: '#5A46E0',
          700: '#4A37BC',
        },
        mint: {
          50: '#ECFBF5',
          100: '#D7F5EA',
          200: '#AFE9D5',
          500: '#12B886',
          600: '#0E9F6E',
          700: '#0A7A55',
        },
        amber: {
          50: '#FFF8EC',
          100: '#FDEFD3',
          200: '#FAE0A8',
          500: '#F5A524',
          600: '#D98016',
          700: '#A85F0D',
        },
        coral: {
          50: '#FFF1F0',
          100: '#FDE3E1',
          200: '#FAC4C0',
          500: '#F2645A',
          600: '#D9443C',
          700: '#AE2F29',
        },
        lavender: {
          50: '#F7F4FF',
          100: '#EFE9FF',
          200: '#E0D6FF',
          500: '#A78BFA',
          600: '#8B6BF0',
        },
        white: 'var(--color-white)',
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2rem, 3.6vw, 3rem)', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.6rem, 2.4vw, 2.125rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,21,48,0.04), 0 10px 30px -18px rgba(11,21,48,0.28)',
        lift: '0 2px 4px rgba(11,21,48,0.04), 0 18px 42px -20px rgba(11,21,48,0.35)',
        ai: '0 18px 44px -22px rgba(90,70,224,0.55)',
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
}
