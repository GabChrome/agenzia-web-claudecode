'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SeriesPoint } from '@/lib/analytics';
import { chart } from './chartTheme';

interface Props {
  points: SeriesPoint[];
  /** nome della serie mostrato nel tooltip (es. "Visite") */
  seriesLabel: string;
  formatValue: (n: number) => string;
  height?: number;
}

const PAD = { top: 18, right: 56, bottom: 26, left: 8 };
const Y_LABEL_W = 40;

function niceStep(rough: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1))));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= rough) return m * pow;
  }
  return 10 * pow;
}

/**
 * Grafico linea+area a serie singola: griglia hairline, linea 2px,
 * marker 8px con anello di superficie, crosshair con tooltip,
 * etichetta diretta solo sull'ultimo punto (serie singola: nessuna legenda).
 * Navigabile da tastiera con le frecce.
 */
export default function TimeSeriesChart({ points, seriesLabel, formatValue, height = 260 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxV = Math.max(1, ...points.map((p) => p.visits));
  const step = niceStep(maxV / 4);
  const top = step * Math.ceil(maxV / step);
  const ticks = useMemo(() => {
    const t: number[] = [];
    for (let v = 0; v <= top; v += step) t.push(v);
    return t;
  }, [top, step]);

  const plotW = Math.max(10, width - PAD.left - Y_LABEL_W - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x0 = PAD.left + Y_LABEL_W;
  const n = points.length;
  const x = (i: number) => (n <= 1 ? x0 + plotW / 2 : x0 + (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const baseline = PAD.top + plotH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.visits).toFixed(1)}`).join(' ');
  const areaPath = n > 1 ? `${linePath} L${x(n - 1).toFixed(1)},${baseline} L${x(0).toFixed(1)},${baseline} Z` : '';

  // etichette X: un sottoinsieme distanziato, mai una per punto
  const maxLabels = Math.max(2, Math.floor(plotW / 64));
  const labelStep = Math.max(1, Math.ceil(n / maxLabels));
  const showLabel = (i: number) => i % labelStep === 0 && (i === n - 1 || n - 1 - i >= labelStep / 2 || labelStep === 1);

  const nearestIndex = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const px = clientX - rect.left;
    if (n <= 1) return 0;
    const raw = ((px - x0) / plotW) * (n - 1);
    return Math.min(n - 1, Math.max(0, Math.round(raw)));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((a) => Math.max(0, (a ?? n) - 1));
    } else if (e.key === 'Escape') {
      setActive(null);
    }
  };

  const act = active !== null ? points[active] : null;
  const tooltipLeft = active !== null ? Math.min(Math.max(x(active), x0 + 60), x0 + plotW - 60) : 0;
  const last = n - 1;

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ height }}
      role="img"
      aria-label={seriesLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
      onPointerMove={(e) => setActive(nearestIndex(e.clientX))}
      onPointerLeave={() => setActive(null)}
    >
      {width > 0 && n > 0 && (
        <svg width={width} height={height} className="block">
          {/* griglia orizzontale hairline + etichette Y */}
          {ticks.map((v) => (
            <g key={v}>
              <line x1={x0} x2={x0 + plotW} y1={y(v)} y2={y(v)} stroke={v === 0 ? chart.axis : chart.grid} strokeWidth={1} />
              <text
                x={x0 - 8}
                y={y(v) + 3.5}
                textAnchor="end"
                fontSize={11}
                fill={chart.textMuted}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {v >= 1000 ? `${v / 1000}k` : v}
              </text>
            </g>
          ))}

          {/* etichette X */}
          {points.map((p, i) =>
            showLabel(i) ? (
              <text key={p.key} x={x(i)} y={baseline + 17} textAnchor="middle" fontSize={11} fill={chart.textMuted}>
                {p.label}
              </text>
            ) : null,
          )}

          {/* area + linea */}
          {areaPath && <path d={areaPath} fill={chart.accentWash} />}
          <path d={linePath} fill="none" stroke={chart.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* crosshair sul punto attivo */}
          {act && active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={baseline} stroke={chart.crosshair} strokeWidth={1} />
          )}

          {/* marker di fine serie con anello di superficie + etichetta diretta */}
          <circle cx={x(last)} cy={y(points[last].visits)} r={6} fill={chart.surface} />
          <circle cx={x(last)} cy={y(points[last].visits)} r={4} fill={chart.accent} />
          {active !== last && (
            <text
              x={x(last) + 10}
              y={y(points[last].visits) + 4}
              fontSize={12}
              fontWeight={600}
              fill={chart.textSecondary}
            >
              {formatValue(points[last].visits)}
            </text>
          )}

          {/* marker del punto attivo */}
          {act && active !== null && active !== last && (
            <>
              <circle cx={x(active)} cy={y(act.visits)} r={6} fill={chart.surface} />
              <circle cx={x(active)} cy={y(act.visits)} r={4} fill={chart.accent} />
            </>
          )}
        </svg>
      )}

      {/* tooltip: il valore guida, l'etichetta segue; chiave-linea del colore serie */}
      {act && (
        <div
          className="pointer-events-none absolute z-tooltip -translate-x-1/2 rounded-lg border border-border-default bg-bg px-3 py-2 shadow-sm"
          style={{ left: tooltipLeft, top: 0 }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ background: chart.accent }} />
            <span className="text-sm font-bold text-text-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(act.visits)}
            </span>
            <span className="text-xs text-text-2">{seriesLabel}</span>
          </div>
          <div className="mt-0.5 text-xs text-text-3">{act.fullLabel}</div>
        </div>
      )}
    </div>
  );
}
