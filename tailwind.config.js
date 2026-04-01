/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        brand: {
          50:  '#f0faf5',
          100: '#d8f3e6',
          200: '#b3e8cf',
          300: '#7dd5b0',
          400: '#44bb8a',
          500: '#22a06b',
          600: '#178055',
          700: '#126645',
          800: '#105138',
          900: '#0e4330',
        },
        surface: {
          0: '#ffffff',
          1: '#f8faf9',
          2: '#f0f5f2',
          3: '#e4ede8',
        },
        ink: {
          primary:   '#0e1f17',
          secondary: '#3d5448',
          muted:     '#7a9488',
          faint:     '#b8cdc5',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)',
        glow: '0 0 0 3px rgba(34,160,107,.25)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .4s ease both',
        'fade-up-delay': 'fadeUp .4s .1s ease both',
        pulse2: 'pulse2 2s ease infinite',
      },
    },
  },
  plugins: [],
};
