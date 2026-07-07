'use client';

import { chart } from './chartTheme';

interface Props {
  values: number[];
  width?: number;
  height?: number;
}

/** Sparkline nel grigio di de-enfasi, punto corrente nel colore accent. */
export default function Sparkline({ values, width = 96, height = 28 }: Props) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const x = (i: number) => (i / (values.length - 1)) * (width - 8) + 2;
  const y = (v: number) => height - 4 - ((v - min) / range) * (height - 8);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const li = values.length - 1;

  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke={chart.deEmphasis} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(li)} cy={y(values[li])} r={4.5} fill={chart.surface} />
      <circle cx={x(li)} cy={y(values[li])} r={3} fill={chart.accent} />
    </svg>
  );
}
