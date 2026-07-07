/**
 * Generatore di dati analytics demo, deterministico per sito e per data:
 * a parità di sito e giorno i numeri non cambiano tra un render e l'altro.
 *
 * Tutta l'interfaccia dei report legge SOLO da `getReport` / `getSiteSummary`:
 * per collegare una fonte reale (GA4, Plausible, Umami…) basta sostituire
 * l'implementazione di queste due funzioni mantenendo le stesse firme.
 */

import { SiteConfig } from '@/config/sites';

export type Period = 'day' | 'week' | 'month' | 'year';

export interface SeriesPoint {
  key: string;
  /** Etichetta breve per l'asse X */
  label: string;
  /** Etichetta estesa per tooltip e tabella */
  fullLabel: string;
  visits: number;
}

export interface Totals {
  visits: number;
  uniques: number;
  pageviews: number;
  /** 0–1 */
  bounceRate: number;
  /** secondi */
  avgSessionSec: number;
  /** quota visitatori nuovi, 0–1 */
  newShare: number;
}

export interface BreakdownItem {
  key: string;
  value: number;
  share: number;
}

export interface ReportData {
  series: SeriesPoint[];
  totals: Totals;
  prevTotals: Totals;
  sources: BreakdownItem[];
  devices: BreakdownItem[];
  countries: BreakdownItem[];
}

export interface SiteSummary {
  visits30: number;
  prevVisits30: number;
  /** visite per settimana, ultime 12 settimane */
  sparkline: number[];
}

const DAY_MS = 86_400_000;

/* ---------------------------------------------------------------- PRNG --- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Valore pseudo-casuale [0,1) deterministico per (seme sito, a, b). */
function rnd(seed: number, a: number, b = 0): number {
  let t = (seed ^ Math.imul(a + 1, 2654435761) ^ Math.imul(b + 1, 40503)) >>> 0;
  t = (t + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/* ------------------------------------------------------ visite per giorno --- */

const WEEKDAY_FACTORS: Record<SiteConfig['profile'], number[]> = {
  // indice = getDay(): 0 domenica … 6 sabato
  business: [0.5, 1.1, 1.18, 1.18, 1.12, 1.0, 0.55],
  leisure: [1.32, 0.82, 0.85, 0.9, 0.98, 1.18, 1.42],
  flat: [0.95, 1.0, 1.05, 1.05, 1.05, 1.0, 0.95],
};

function dayIndex(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dailyVisits(site: SiteConfig, seed: number, date: Date): number {
  const launch = startOfDay(new Date(site.launchDate));
  const d = startOfDay(date);
  const daysSince = Math.floor((d.getTime() - launch.getTime()) / DAY_MS);
  if (daysSince < 0) return 0;

  const di = dayIndex(d);
  // crescita mensile composta, con saturazione dopo 24 mesi
  const months = Math.min(daysSince / 30.44, 24);
  const growth = Math.pow(1 + site.monthlyGrowth, months);
  // rampa di lancio: le prime due settimane salgono da ~35% a 100%
  const ramp = daysSince < 14 ? 0.35 + (0.65 * daysSince) / 14 : 1;
  const weekday = WEEKDAY_FACTORS[site.profile][d.getDay()];
  // stagionalità annuale con fase specifica del sito
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / DAY_MS);
  const phase = rnd(seed, 7, 7) * Math.PI * 2;
  const seasonal = 1 + 0.15 * Math.sin((dayOfYear / 365) * Math.PI * 2 + phase);
  const noise = 0.82 + 0.36 * rnd(seed, di, 1);
  // picchi occasionali (campagne, articoli virali)
  const spike = rnd(seed, di, 2) > 0.985 ? 1.6 + 1.3 * rnd(seed, di, 3) : 1;

  return Math.max(0, Math.round(site.baseDailyVisits * growth * ramp * weekday * seasonal * noise * spike));
}

/** Curva oraria tipica (somma = 1): notte bassa, picchi a fine mattina e sera. */
const HOUR_CURVE = [
  0.008, 0.005, 0.004, 0.004, 0.005, 0.009, 0.018, 0.032, 0.048, 0.06, 0.068, 0.072,
  0.066, 0.058, 0.056, 0.06, 0.065, 0.068, 0.064, 0.058, 0.052, 0.046, 0.036, 0.018,
];

function hourlyVisits(site: SiteConfig, seed: number, date: Date, hour: number): number {
  const total = dailyVisits(site, seed, date);
  const di = dayIndex(date);
  const noise = 0.75 + 0.5 * rnd(seed, di, 100 + hour);
  return Math.round(total * HOUR_CURVE[hour] * noise);
}

/* -------------------------------------------------------- metriche derivate --- */

function bucketTotals(site: SiteConfig, seed: number, visits: number, bucketId: number): Totals {
  // caratteristiche di base del sito + piccola oscillazione per bucket
  const uniqShare = 0.72 + 0.1 * rnd(seed, 11, 1) + 0.04 * (rnd(seed, bucketId, 11) - 0.5);
  const pagesPerSession = 2.0 + 1.2 * rnd(seed, 12, 1) + 0.3 * (rnd(seed, bucketId, 12) - 0.5);
  const bounce = 0.34 + 0.18 * rnd(seed, 13, 1) + 0.06 * (rnd(seed, bucketId, 13) - 0.5);
  const session = 90 + 150 * rnd(seed, 14, 1) + 30 * (rnd(seed, bucketId, 14) - 0.5);
  const newShare = 0.52 + 0.24 * rnd(seed, 15, 1) + 0.08 * (rnd(seed, bucketId, 15) - 0.5);

  return {
    visits,
    uniques: Math.round(visits * uniqShare),
    pageviews: Math.round(visits * pagesPerSession),
    bounceRate: bounce,
    avgSessionSec: session,
    newShare,
  };
}

function sumTotals(parts: Totals[]): Totals {
  const visits = parts.reduce((a, p) => a + p.visits, 0);
  const w = (f: (p: Totals) => number) =>
    visits > 0 ? parts.reduce((a, p) => a + f(p) * p.visits, 0) / visits : 0;
  return {
    visits,
    uniques: parts.reduce((a, p) => a + p.uniques, 0),
    pageviews: parts.reduce((a, p) => a + p.pageviews, 0),
    bounceRate: w((p) => p.bounceRate),
    avgSessionSec: w((p) => p.avgSessionSec),
    newShare: w((p) => p.newShare),
  };
}

/* --------------------------------------------------------------- breakdown --- */

const SOURCE_KEYS = ['organic', 'direct', 'social', 'referral', 'email'] as const;
const DEVICE_KEYS = ['mobile', 'desktop', 'tablet'] as const;
const COUNTRY_KEYS = ['it', 'ch', 'de', 'fr', 'us', 'other'] as const;

export type SourceKey = (typeof SOURCE_KEYS)[number];
export type DeviceKey = (typeof DEVICE_KEYS)[number];
export type CountryKey = (typeof COUNTRY_KEYS)[number];

function breakdown(
  keys: readonly string[],
  baseShares: number[],
  seed: number,
  salt: number,
  bucketId: number,
  totalVisits: number,
): BreakdownItem[] {
  // perturba leggermente le quote di base a seconda del periodo, poi normalizza
  const perturbed = baseShares.map(
    (s, i) => Math.max(0.005, s * (0.86 + 0.28 * rnd(seed, bucketId, salt * 31 + i))),
  );
  const tot = perturbed.reduce((a, b) => a + b, 0);
  return keys.map((key, i) => {
    const share = perturbed[i] / tot;
    return { key, share, value: Math.round(totalVisits * share) };
  });
}

function baseSourceShares(site: SiteConfig, seed: number): number[] {
  const socialBoost = site.profile === 'leisure' ? 0.12 : 0;
  return [
    0.3 + 0.15 * rnd(seed, 21, 1), // organic
    0.16 + 0.08 * rnd(seed, 22, 1), // direct
    0.1 + 0.1 * rnd(seed, 23, 1) + socialBoost, // social
    0.08 + 0.07 * rnd(seed, 24, 1), // referral
    0.03 + 0.05 * rnd(seed, 25, 1), // email
  ];
}

function baseDeviceShares(site: SiteConfig, seed: number): number[] {
  const mobileBoost = site.profile === 'leisure' ? 0.1 : 0;
  const mobile = 0.5 + 0.14 * rnd(seed, 26, 1) + mobileBoost;
  const tablet = 0.04 + 0.04 * rnd(seed, 27, 1);
  return [mobile, Math.max(0.1, 1 - mobile - tablet), tablet];
}

function baseCountryShares(seed: number): number[] {
  return [
    0.74 + 0.1 * rnd(seed, 28, 1), // it
    0.04 + 0.03 * rnd(seed, 29, 1), // ch
    0.03 + 0.03 * rnd(seed, 30, 1), // de
    0.02 + 0.03 * rnd(seed, 31, 1), // fr
    0.02 + 0.02 * rnd(seed, 32, 1), // us
    0.03 + 0.02 * rnd(seed, 33, 1), // other
  ];
}

/* ------------------------------------------------------------------ report --- */

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dateKey(d: Date): string {
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeTotals(site: SiteConfig, seed: number, from: Date, days: number): Totals {
  const parts: Totals[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * DAY_MS);
    parts.push(bucketTotals(site, seed, dailyVisits(site, seed, d), dayIndex(d)));
  }
  return sumTotals(parts);
}

export function getReport(site: SiteConfig, period: Period, locale: string, now = new Date()): ReportData {
  const seed = hashStr(site.id);
  const today = startOfDay(now);
  const fmtDay = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const fmtFull = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long' });
  const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'short' });
  const fmtMonthFull = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });

  const series: SeriesPoint[] = [];
  let totals: Totals;
  let prevTotals: Totals;
  // identificatore del periodo corrente, per la variazione dei breakdown
  let bucketId: number;

  if (period === 'day') {
    const hours = now.getHours();
    const dayParts: Totals[] = [];
    const prevParts: Totals[] = [];
    for (let h = 0; h <= hours; h++) {
      const v = hourlyVisits(site, seed, today, h);
      series.push({
        key: `${dateKey(today)}T${h}`,
        label: `${String(h).padStart(2, '0')}`,
        fullLabel: `${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59`,
        visits: v,
      });
      dayParts.push(bucketTotals(site, seed, v, dayIndex(today) * 24 + h));
      prevParts.push(
        bucketTotals(
          site,
          seed,
          hourlyVisits(site, seed, new Date(today.getTime() - DAY_MS), h),
          (dayIndex(today) - 1) * 24 + h,
        ),
      );
    }
    totals = sumTotals(dayParts);
    prevTotals = sumTotals(prevParts);
    bucketId = dayIndex(today);
  } else if (period === 'week' || period === 'month') {
    const days = period === 'week' ? 7 : 30;
    const from = new Date(today.getTime() - (days - 1) * DAY_MS);
    const parts: Totals[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * DAY_MS);
      const v = dailyVisits(site, seed, d);
      series.push({ key: dateKey(d), label: fmtDay.format(d), fullLabel: fmtFull.format(d), visits: v });
      parts.push(bucketTotals(site, seed, v, dayIndex(d)));
    }
    totals = sumTotals(parts);
    prevTotals = rangeTotals(site, seed, new Date(from.getTime() - days * DAY_MS), days);
    bucketId = Math.floor(dayIndex(today) / days);
  } else {
    // ultimi 12 mesi di calendario, mese corrente incluso (parziale)
    const parts: Totals[] = [];
    for (let m = 11; m >= 0; m--) {
      const first = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const lastExcl = new Date(today.getFullYear(), today.getMonth() - m + 1, 1);
      const end = Math.min(lastExcl.getTime(), today.getTime() + DAY_MS);
      const days = Math.round((end - first.getTime()) / DAY_MS);
      const monthTotals = rangeTotals(site, seed, first, days);
      series.push({
        key: monthKey(first),
        label: fmtMonth.format(first),
        fullLabel: fmtMonthFull.format(first),
        visits: monthTotals.visits,
      });
      parts.push(monthTotals);
    }
    totals = sumTotals(parts);
    const prevFirst = new Date(today.getFullYear(), today.getMonth() - 23, 1);
    const prevEnd = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    prevTotals = rangeTotals(site, seed, prevFirst, Math.round((prevEnd.getTime() - prevFirst.getTime()) / DAY_MS));
    bucketId = today.getFullYear() * 12 + today.getMonth();
  }

  const periodSalt = { day: 1, week: 2, month: 3, year: 4 }[period];
  return {
    series,
    totals,
    prevTotals,
    sources: breakdown(SOURCE_KEYS, baseSourceShares(site, seed), seed, periodSalt, bucketId, totals.visits),
    devices: breakdown(DEVICE_KEYS, baseDeviceShares(site, seed), seed, periodSalt + 10, bucketId, totals.visits),
    countries: breakdown(COUNTRY_KEYS, baseCountryShares(seed), seed, periodSalt + 20, bucketId, totals.visits),
  };
}

/** Riepilogo per le card dell'indice: ultimi 30 giorni + sparkline settimanale. */
export function getSiteSummary(site: SiteConfig, now = new Date()): SiteSummary {
  const seed = hashStr(site.id);
  const today = startOfDay(now);
  const sum = (from: Date, days: number) => {
    let t = 0;
    for (let i = 0; i < days; i++) t += dailyVisits(site, seed, new Date(from.getTime() + i * DAY_MS));
    return t;
  };
  const sparkline: number[] = [];
  for (let w = 11; w >= 0; w--) {
    sparkline.push(sum(new Date(today.getTime() - (w * 7 + 6) * DAY_MS), 7));
  }
  return {
    visits30: sum(new Date(today.getTime() - 29 * DAY_MS), 30),
    prevVisits30: sum(new Date(today.getTime() - 59 * DAY_MS), 30),
    sparkline,
  };
}

/* --------------------------------------------------------------------- CSV --- */

export function buildCsv(
  site: SiteConfig,
  period: Period,
  data: ReportData,
  labels: {
    period: string;
    bucket: string;
    visits: string;
    totals: Record<keyof Totals, string>;
    sources: string;
    devices: string;
    countries: string;
    itemLabels: Record<string, string>;
  },
): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const row = (...cells: (string | number)[]) => cells.map(esc).join(';');
  const lines: string[] = [];

  lines.push(row(site.name, site.domain));
  lines.push(row(labels.period, period));
  lines.push('');
  lines.push(row(labels.bucket, labels.visits));
  for (const p of data.series) lines.push(row(p.fullLabel, p.visits));
  lines.push('');
  lines.push(row(labels.totals.visits, data.totals.visits));
  lines.push(row(labels.totals.uniques, data.totals.uniques));
  lines.push(row(labels.totals.pageviews, data.totals.pageviews));
  lines.push(row(labels.totals.bounceRate, `${(data.totals.bounceRate * 100).toFixed(1)}%`));
  lines.push(row(labels.totals.avgSessionSec, Math.round(data.totals.avgSessionSec)));
  lines.push(row(labels.totals.newShare, `${(data.totals.newShare * 100).toFixed(1)}%`));

  const section = (title: string, items: BreakdownItem[]) => {
    lines.push('');
    lines.push(row(title));
    for (const b of items) {
      lines.push(row(labels.itemLabels[b.key] ?? b.key, b.value, `${(b.share * 100).toFixed(1)}%`));
    }
  };
  section(labels.sources, data.sources);
  section(labels.devices, data.devices);
  section(labels.countries, data.countries);

  // BOM per compatibilità con Excel
  return '﻿' + lines.join('\n');
}

/* ------------------------------------------------------------ formattazione --- */

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatCompact(n: number, locale: string): string {
  if (n < 10000) return new Intl.NumberFormat(locale).format(n);
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPercent(v: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

/** Variazione relativa vs periodo precedente; null se non calcolabile. */
export function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return current / previous - 1;
}
