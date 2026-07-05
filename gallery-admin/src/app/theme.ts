import type { TenantTheme } from './types';

export const DEFAULT_THEME: Required<Omit<TenantTheme, 'logo'>> = {
  accent: '#9a7830',
  bg: '#f8f5f0',
  surface: '#ffffff',
  surface2: '#efeae3',
  text: '#1a1814',
  textSoft: '#6b655d',
  border: 'rgba(0, 0, 0, 0.10)',
  radius: '14px',
  font: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export function hexToSoft(hex: string, alpha = 0.14): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return 'rgba(0, 0, 0, 0.08)';
  const n = Number.parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Applica il tema del cliente impostando le variabili CSS globali.
// Con null si torna al tema di default dell'agenzia.
export function applyTheme(theme?: TenantTheme | null): void {
  const t = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const root = document.documentElement.style;
  root.setProperty('--accent', t.accent);
  root.setProperty('--accent-soft', hexToSoft(t.accent));
  root.setProperty('--bg', t.bg);
  root.setProperty('--surface', t.surface);
  root.setProperty('--surface2', t.surface2);
  root.setProperty('--text', t.text);
  root.setProperty('--text-soft', t.textSoft);
  root.setProperty('--border', t.border);
  root.setProperty('--radius', t.radius);
  root.setProperty('--font', t.font);
}
