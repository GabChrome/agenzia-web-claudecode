import type { Config } from 'tailwindcss';

// I colori puntano a variabili CSS: il tema di ogni cliente viene applicato
// a runtime impostando le variabili su :root (vedi src/app/theme.ts).
export default {
  content: ['./index.html', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        accent: 'var(--accent)',
        accentsoft: 'var(--accent-soft)',
        ink: 'var(--text)',
        soft: 'var(--text-soft)',
        line: 'var(--border)',
      },
      borderRadius: {
        theme: 'var(--radius)',
        'theme-sm': 'calc(var(--radius) * 0.6)',
      },
      fontFamily: {
        theme: 'var(--font)',
      },
    },
  },
  plugins: [],
} satisfies Config;
