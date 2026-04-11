/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(0.13 0.005 270)',
        foreground: 'oklch(0.95 0.005 270)',
        card: 'oklch(0.18 0.005 270)',
        primary: 'oklch(0.72 0.19 155)',
        'primary-foreground': 'oklch(0.13 0.005 270)',
        muted: 'oklch(0.22 0.005 270)',
        'muted-foreground': 'oklch(0.6 0.005 270)',
        accent: 'oklch(0.25 0.01 270)',
        'accent-foreground': 'oklch(0.95 0.005 270)',
        destructive: 'oklch(0.6 0.22 25)',
        border: 'oklch(0.28 0.005 270)',
        input: 'oklch(0.25 0.005 270)',
        surface: 'oklch(0.2 0.005 270)',
        player: 'oklch(0.15 0.005 270)',
        sidebar: 'oklch(0.1 0.005 270)',
        'sidebar-foreground': 'oklch(0.85 0.005 270)',
        'sidebar-accent': 'oklch(0.2 0.005 270)',
      },

      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },

      boxShadow: {
        glow: '0 10px 30px rgba(0,0,0,0.5)',
        soft: '0 4px 20px rgba(0,0,0,0.3)',
      },

      backdropBlur: {
        xs: '2px',
      },

      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 oklch(0.72 0.19 155 / 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px oklch(0.72 0.19 155 / 0.2)' },
        },
      },

      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};