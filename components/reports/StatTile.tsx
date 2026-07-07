'use client';

import Sparkline from './Sparkline';
import { chart } from './chartTheme';

interface Props {
  label: string;
  value: string;
  /** variazione relativa vs periodo precedente (0.12 = +12%), null = n/d */
  delta: number | null;
  /** testo tipo "vs 7 giorni precedenti" */
  deltaLabel: string;
  /** true quando un aumento è negativo (es. frequenza di rimbalzo) */
  invertGood?: boolean;
  spark?: number[];
  locale: string;
}

/** Tile statistica: etichetta, valore (cifre proporzionali), delta firmato, sparkline. */
export default function StatTile({ label, value, delta, deltaLabel, invertGood = false, spark, locale }: Props) {
  const good = delta !== null && (invertGood ? delta < 0 : delta > 0);
  const flat = delta !== null && Math.abs(delta) < 0.0005;
  const deltaText =
    delta === null
      ? '—'
      : `${delta > 0 ? '▲' : delta < 0 ? '▼' : '＝'} ${new Intl.NumberFormat(locale, {
          style: 'percent',
          maximumFractionDigits: 1,
          signDisplay: 'never',
        }).format(Math.abs(delta))}`;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-3xl font-bold leading-none text-text-1">{value}</div>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-xs font-semibold"
          style={{ color: delta === null || flat ? chart.textMuted : good ? chart.deltaGood : chart.deltaBad }}
        >
          {deltaText}
        </span>
        <span className="text-xs text-text-3">{deltaLabel}</span>
      </div>
    </div>
  );
}
