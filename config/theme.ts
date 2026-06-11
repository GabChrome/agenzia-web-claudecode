export const siteConfig = {
  name: 'Anti Gravity',
  tagline: 'Siti web che convertono.',
  email: '[EMAIL_CLIENTE]',
  location: '[CITTÀ_CLIENTE]',
  vat: '[P.IVA_CLIENTE]',
  hours: 'Lun–Ven, 9:00–18:00 CET',
  social: {
    github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB ?? '#',
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? '#',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? '#',
  },
}

export const theme = {
  colors: {
    bg:              '#080808',
    surface1:        '#0F0F0F',
    surface2:        '#161616',
    borderSubtle:    'rgba(255,255,255,0.06)',
    borderDefault:   'rgba(255,255,255,0.10)',
    borderStrong:    'rgba(255,255,255,0.18)',
    accent:          '#7C6EF8',
    accentGlow:      'rgba(124,110,248,0.15)',
    textPrimary:     '#EDEDED',
    textSecondary:   '#888888',
    textTertiary:    '#555555',
    success:         '#4ADE80',
    error:           '#F87171',
  },
  fonts: {
    sans:  '"Plus Jakarta Sans", sans-serif',
    serif: '"Instrument Serif", serif',
  },
}
