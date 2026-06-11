import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './config/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:         '#0A0A0A',
        surface:    '#111111',
        'surface-high': '#161616',
        border:     '#1F1F1F',
        accent:     '#6C63FF',
        'accent-hover': '#857DFF',
        'accent-muted': 'rgba(108,99,255,0.12)',
        'text-primary':   '#F5F5F5',
        'text-secondary': '#A0A0A0',
        'text-muted':     '#666666',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-sm': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(3rem, 6vw, 5rem)', { lineHeight: '1.0', letterSpacing: '-0.04em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      zIndex: {
        dropdown:       '10',
        sticky:         '20',
        'modal-backdrop': '30',
        modal:          '40',
        toast:          '50',
        tooltip:        '60',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        nav: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
