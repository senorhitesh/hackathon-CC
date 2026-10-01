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
        // loopx Design System — light studio palette (Linear / Figma / Botera style)
        canvas: {
          bg: '#f8fafc',       // slate-50 — light workspace background
          surface: '#ffffff',  // white — panels, cards, modals
          border: '#e2e8f0',   // slate-200 — light borders
          hover: '#f1f5f9',    // slate-100 — hover states
          fg: '#0f172a',       // slate-900 — dark text
          muted: '#64748b',    // slate-500 — secondary text
          subtle: '#94a3b8',   // slate-400 — muted labels
        },
        accent: {
          DEFAULT: '#0f172a',  // slate-900 — primary dark button accent
          hover: '#334155',    // slate-700
          blue: '#3b82f6',     // blue-500
          indigo: '#6366f1',   // indigo-500
          purple: '#8b5cf6',   // violet-500
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
