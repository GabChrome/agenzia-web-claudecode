'use client';

import { Period } from '@/lib/analytics';

interface Props {
  value: Period;
  onChange: (p: Period) => void;
  labels: Record<Period, string>;
}

const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

/** Controllo segmentato per l'intervallo temporale: una riga, sopra i grafici. */
export default function PeriodSelector({ value, onChange, labels }: Props) {
  return (
    <div
      role="tablist"
      aria-label={Object.values(labels).join(' / ')}
      className="inline-flex rounded-lg border border-border-default bg-surface-1 p-1"
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          role="tab"
          aria-selected={value === p}
          onClick={() => onChange(p)}
          className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            value === p
              ? 'bg-accent text-white'
              : 'text-text-2 hover:bg-[rgba(0,0,0,0.05)] hover:text-text-1'
          }`}
        >
          {labels[p]}
        </button>
      ))}
    </div>
  );
}
