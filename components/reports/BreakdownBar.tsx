'use client';

import { useState } from 'react';
import { BreakdownItem } from '@/lib/analytics';
import { chart, series } from './chartTheme';

interface Props {
  items: BreakdownItem[];
  /** etichette tradotte per chiave (organic → "Ricerca organica", …) */
  labels: Record<string, string>;
  formatValue: (n: number) => string;
  formatShare: (n: number) => string;
  /** slot di partenza nella palette categoriale (l'ordine resta fisso) */
  colorOffset?: number;
}

/**
 * Parte-su-tutto: barra impilata orizzontale con gap di superficie di 2px
 * tra i segmenti, più righe di legenda con valore e quota sempre visibili
 * (le righe fanno anche da vista-tabella del grafico).
 */
export default function BreakdownBar({ items, labels, formatValue, formatShare, colorOffset = 0 }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const color = (i: number) => series[(colorOffset + i) % series.length];

  return (
    <div>
      <div className="flex h-3.5 w-full overflow-hidden rounded-full" style={{ gap: 2 }} aria-hidden>
        {items.map((it, i) => (
          <div
            key={it.key}
            className="h-full transition-opacity duration-150 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(it.share * 100).toFixed(2)}%`,
              background: color(i),
              opacity: active === null || active === it.key ? 1 : 0.35,
            }}
            onPointerEnter={() => setActive(it.key)}
            onPointerLeave={() => setActive(null)}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((it, i) => (
          <li
            key={it.key}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150"
            style={{ background: active === it.key ? 'rgba(0,0,0,0.045)' : 'transparent' }}
            onPointerEnter={() => setActive(it.key)}
            onPointerLeave={() => setActive(null)}
          >
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color(i) }} />
            <span className="min-w-0 flex-1 truncate text-sm text-text-2">{labels[it.key] ?? it.key}</span>
            <span className="text-sm font-semibold text-text-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(it.value)}
            </span>
            <span
              className="w-14 text-right text-xs"
              style={{ fontVariantNumeric: 'tabular-nums', color: chart.textMuted }}
            >
              {formatShare(it.share)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
