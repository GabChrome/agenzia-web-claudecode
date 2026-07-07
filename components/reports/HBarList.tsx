'use client';

import { BreakdownItem } from '@/lib/analytics';
import { chart } from './chartTheme';

interface Props {
  items: BreakdownItem[];
  labels: Record<string, string>;
  formatValue: (n: number) => string;
}

/**
 * Barre orizzontali nominali (una serie → un solo colore, slot 1):
 * barra sottile con estremità dati arrotondata e base squadrata,
 * valore all'estremità. I valori sono sempre visibili: la lista
 * è al tempo stesso grafico e tabella.
 */
export default function HBarList({ items, labels, formatValue }: Props) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...sorted.map((i) => i.value));

  return (
    <ul className="space-y-2.5">
      {sorted.map((it) => (
        <li key={it.key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-text-2">{labels[it.key] ?? it.key}</span>
          <div className="relative h-3 flex-1">
            <div
              className="h-full rounded-r-[4px]"
              style={{ width: `${((it.value / max) * 100).toFixed(2)}%`, background: chart.accent, minWidth: 2 }}
            />
          </div>
          <span
            className="w-16 shrink-0 text-right text-sm font-semibold text-text-1"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatValue(it.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
