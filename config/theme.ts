// config/theme.ts — UNICA fonte di verità per colori, font e spacing
// Usato ovunque via CSS variables definite in globals.css

export const theme = {
  colors: {
    background: '#0A0A0A',
    surface: '#111111',
    surfaceHigh: '#161616',
    border: '#1F1F1F',
    borderSubtle: 'rgba(255,255,255,0.08)',
    accent: '#6C63FF',
    accentHover: '#857DFF',
    accentMuted: 'rgba(108,99,255,0.12)',
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textMuted: '#666666',
    success: '#22C55E',
    error: '#EF4444',
  },
  font: {
    sans: 'Inter, system-ui, sans-serif',
  },
  // Type scale in px
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
    '5xl': '80px',
  },
  // Z-index scale semantico
  zIndex: {
    dropdown: 10,
    sticky: 20,
    modalBackdrop: 30,
    modal: 40,
    toast: 50,
    tooltip: 60,
  },
  // Animazioni
  transition: {
    fast: '150ms ease-out',
    base: '250ms ease-out',
    slow: '500ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type Theme = typeof theme;
