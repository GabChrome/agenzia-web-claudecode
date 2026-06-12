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
    bg:              '#F8F5F0',
    surface1:        '#EFEAE3',
    surface2:        '#E6DFD6',
    borderSubtle:    'rgba(0,0,0,0.07)',
    borderDefault:   'rgba(0,0,0,0.12)',
    borderStrong:    'rgba(0,0,0,0.22)',
    accent:          '#9A7830',
    accentGlow:      'rgba(154,120,48,0.12)',
    textPrimary:     '#1A1814',
    textSecondary:   '#5E5850',
    textTertiary:    '#8A837D',
    success:         '#2D8A4E',
    error:           '#C0392B',
  },
  fonts: {
    sans:  '"Plus Jakarta Sans", sans-serif',
    serif: '"Instrument Serif", serif',
  },
}
