/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Custom banking palette (kept for backward compatibility, but we rely heavily on cyan/fuchsia gradients now)
        navy: {
          50: '#eef3ff',
          100: '#dfe8ff',
          200: '#c6d5ff',
          300: '#a3b8ff',
          400: '#7e90fc',
          500: '#5e68f5',
          600: '#4a45e9',
          700: '#3e36ce',
          800: '#332fa6',
          900: '#2e2d83',
          950: '#1c1a4c',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.5s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(6, 182, 212, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0)' },
        }
      },
    },
  },
  plugins: [],
};
