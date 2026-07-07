/**
 * Palette dei grafici, validata con dataviz/scripts/validate_palette.js
 * sulla superficie chiara del sito (#EFEAE3):
 * banda di luminosità, soglia di croma, separazione CVD (ΔE peggiore 17.2)
 * e contrasto ≥ 3:1 — tutti PASS.
 *
 * Gli slot sono in ordine fisso: l'ordine è il meccanismo di sicurezza
 * per il daltonismo, non va cambiato né "ciclato" oltre gli slot definiti.
 */
export const series = ['#A87A16', '#2a78d6', '#0E8A5B', '#C0392B', '#6b5bd2'] as const;

export const chart = {
  /** slot 1 (oro brand): serie singole, barre nominali, sparkline attive */
  accent: series[0],
  /** wash per aree: slot 1 al ~10% */
  accentWash: 'rgba(168, 122, 22, 0.10)',
  grid: 'rgba(26, 24, 20, 0.08)',
  axis: 'rgba(26, 24, 20, 0.22)',
  crosshair: 'rgba(26, 24, 20, 0.30)',
  /** superficie delle card grafico (il colore dei gap e degli anelli) */
  surface: '#EFEAE3',
  deEmphasis: '#B4ACA2',
  textMuted: '#8A837D',
  textSecondary: '#5E5850',
  textPrimary: '#1A1814',
  /** testo delta: verde/rosso con contrasto testo sufficiente sulla superficie */
  deltaGood: '#1E6B3C',
  deltaBad: '#A93226',
} as const;
