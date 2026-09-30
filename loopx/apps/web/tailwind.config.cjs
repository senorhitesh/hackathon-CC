/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AdProof Design System — zinc dark palette
        canvas: {
          bg: '#09090b',       // zinc-950 — main app background
          surface: '#18181b',  // zinc-900 — panels and cards
          border: '#27272a',   // zinc-800 — default borders
          hover: '#3f3f46',    // zinc-700 — hover states
          muted: '#71717a',    // zinc-500 — muted text
          subtle: '#52525b',   // zinc-600 — subtle text
        },
        accent: {
          DEFAULT: '#6366f1',  // indigo-500
          hover: '#818cf8',    // indigo-400
          dim: '#312e81',      // indigo-900 — for subtle backgrounds
          violet: '#8b5cf6',   // violet-500
        },
        pin: {
          open: '#6366f1',     // indigo for open pins
          resolved: '#22c55e', // green for resolved pins
          hovered: '#f59e0b',  // amber for focused pin
        },
        huddle: {
          active: '#22c55e',   // green when live
          muted: '#ef4444',    // red when muted
        },
      },
      fontFamily: {
        sans: ['GeistVF', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['GeistMonoVF', 'monospace'],
      },
      animation: {
        'pin-pulse': 'pin-pulse 2s ease-in-out infinite',
        'huddle-wave': 'huddle-wave 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
      },
      keyframes: {
        'pin-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.8' },
        },
        'huddle-wave': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
