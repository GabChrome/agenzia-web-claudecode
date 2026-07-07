'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { SiteConfig } from '@/config/sites';
import {
  buildCsv,
  delta,
  formatCompact,
  formatDuration,
  formatNumber,
  formatPercent,
  getReport,
  Period,
} from '@/lib/analytics';
import BreakdownBar from './BreakdownBar';
import HBarList from './HBarList';
import PeriodSelector from './PeriodSelector';
import StatTile from './StatTile';
import TimeSeriesChart from './TimeSeriesChart';
import { logoutReports } from './AccessGate';

/** Report interattivo di un singolo sito: KPI, andamento visite, breakdown. */
export default function SiteReport({ site }: { site: SiteConfig }) {
  const t = useTranslations('reports');
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>('month');
  const [view, setView] = useState<'chart' | 'table'>('chart');

  // AccessGate monta i figli solo lato client: new Date() qui è sicuro
  const data = useMemo(() => getReport(site, period, locale), [site, period, locale]);

  const periodLabels: Record<Period, string> = {
    day: t('periods.day'),
    week: t('periods.week'),
    month: t('periods.month'),
    year: t('periods.year'),
  };
  const vsPrev = t(`vsPrev.${period}`);
  const num = (n: number) => formatNumber(n, locale);
  const share = (n: number) => formatPercent(n, locale, 1);

  const sourceLabels: Record<string, string> = {
    organic: t('sources.organic'),
    direct: t('sources.direct'),
    social: t('sources.social'),
    referral: t('sources.referral'),
    email: t('sources.email'),
  };
  const deviceLabels: Record<string, string> = {
    mobile: t('devices.mobile'),
    desktop: t('devices.desktop'),
    tablet: t('devices.tablet'),
  };
  const countryLabels: Record<string, string> = {
    it: t('countries.it'),
    ch: t('countries.ch'),
    de: t('countries.de'),
    fr: t('countries.fr'),
    us: t('countries.us'),
    other: t('countries.other'),
  };

  const visitors = useMemo(() => {
    const newV = Math.round(data.totals.uniques * data.totals.newShare);
    return [
      { key: 'new', value: newV, share: data.totals.newShare },
      { key: 'returning', value: data.totals.uniques - newV, share: 1 - data.totals.newShare },
    ];
  }, [data]);
  const visitorLabels: Record<string, string> = {
    new: t('engagement.newVisitors'),
    returning: t('engagement.returning'),
  };

  const downloadCsv = () => {
    const csv = buildCsv(site, period, data, {
      period: t('export.period'),
      bucket: t('chart.bucket'),
      visits: t('kpi.visits'),
      totals: {
        visits: t('kpi.visits'),
        uniques: t('kpi.uniques'),
        pageviews: t('engagement.pageviews'),
        bounceRate: t('kpi.bounce'),
        avgSessionSec: t('export.sessionSeconds'),
        newShare: t('export.newShare'),
      },
      sources: t('sources.title'),
      devices: t('devices.title'),
      countries: t('countries.title'),
      itemLabels: { ...sourceLabels, ...deviceLabels, ...countryLabels },
    });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.id}-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pagesPerSession = data.totals.visits > 0 ? data.totals.pageviews / data.totals.visits : 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      {/* intestazione */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/${locale}/reports/`}
            className="no-print text-sm font-semibold text-text-3 transition-colors hover:text-accent"
          >
            ← {t('backToSites')}
          </Link>
          <div className="eyebrow mt-3">{site.sector}</div>
          <h1 className="mt-1 font-serif text-display-sm text-text-1">{site.name}</h1>
          <p className="mt-1 text-text-3">{site.domain}</p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCsv}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-1 transition-colors hover:bg-[rgba(0,0,0,0.04)]"
          >
            {t('export.csv')}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-1 transition-colors hover:bg-[rgba(0,0,0,0.04)]"
          >
            {t('export.pdf')}
          </button>
          <button
            onClick={logoutReports}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-text-3 transition-colors hover:text-text-1"
          >
            {t('logout')}
          </button>
        </div>
      </header>

      {/* riga filtri: unica, sopra tutti i grafici — scopa tutto ciò che segue */}
      <div className="no-print sticky top-0 z-sticky -mx-6 mt-6 border-y border-border-subtle bg-bg/90 px-6 py-3 backdrop-blur-nav">
        <PeriodSelector value={period} onChange={setPeriod} labels={periodLabels} />
      </div>

      {/* riga KPI */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('kpi.visits')}
          value={formatCompact(data.totals.visits, locale)}
          delta={delta(data.totals.visits, data.prevTotals.visits)}
          deltaLabel={vsPrev}
          spark={data.series.slice(-12).map((p) => p.visits)}
          locale={locale}
        />
        <StatTile
          label={t('kpi.uniques')}
          value={formatCompact(data.totals.uniques, locale)}
          delta={delta(data.totals.uniques, data.prevTotals.uniques)}
          deltaLabel={vsPrev}
          locale={locale}
        />
        <StatTile
          label={t('kpi.bounce')}
          value={formatPercent(data.totals.bounceRate, locale, 1)}
          delta={delta(data.totals.bounceRate, data.prevTotals.bounceRate)}
          deltaLabel={vsPrev}
          invertGood
          locale={locale}
        />
        <StatTile
          label={t('kpi.session')}
          value={formatDuration(data.totals.avgSessionSec)}
          delta={delta(data.totals.avgSessionSec, data.prevTotals.avgSessionSec)}
          deltaLabel={vsPrev}
          locale={locale}
        />
      </div>

      {/* andamento visite */}
      <section className="mt-5 rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-text-1">
            {t('chart.title')} · {periodLabels[period]}
          </h2>
          <div className="no-print inline-flex rounded-lg border border-border-subtle p-0.5 text-sm">
            {(['chart', 'table'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                  view === v ? 'bg-surface-2 text-text-1' : 'text-text-3 hover:text-text-1'
                }`}
              >
                {v === 'chart' ? t('chart.chartView') : t('chart.tableView')}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {view === 'chart' ? (
            <TimeSeriesChart
              points={data.series}
              seriesLabel={t('kpi.visits')}
              formatValue={(n) => formatCompact(n, locale)}
            />
          ) : (
            <div className="max-h-[260px] overflow-y-auto rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-text-2">{t('chart.bucket')}</th>
                    <th className="px-4 py-2 text-right font-semibold text-text-2">{t('kpi.visits')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((p) => (
                    <tr key={p.key} className="border-t border-border-subtle">
                      <td className="px-4 py-1.5 text-text-2">{p.fullLabel}</td>
                      <td className="px-4 py-1.5 text-right text-text-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {num(p.visits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* breakdown */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <h2 className="text-lg font-bold text-text-1">{t('sources.title')}</h2>
          <div className="mt-5">
            <BreakdownBar items={data.sources} labels={sourceLabels} formatValue={num} formatShare={share} />
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <h2 className="text-lg font-bold text-text-1">{t('devices.title')}</h2>
          <div className="mt-5">
            <BreakdownBar items={data.devices} labels={deviceLabels} formatValue={num} formatShare={share} />
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <h2 className="text-lg font-bold text-text-1">{t('countries.title')}</h2>
          <div className="mt-5">
            <HBarList items={data.countries} labels={countryLabels} formatValue={num} />
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <h2 className="text-lg font-bold text-text-1">{t('engagement.title')}</h2>
          <div className="mt-5">
            <BreakdownBar items={visitors} labels={visitorLabels} formatValue={num} formatShare={share} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-5">
            <div>
              <div className="eyebrow">{t('engagement.pagesPerSession')}</div>
              <div className="mt-1 text-2xl font-bold text-text-1">
                {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(pagesPerSession)}
              </div>
            </div>
            <div>
              <div className="eyebrow">{t('engagement.pageviews')}</div>
              <div className="mt-1 text-2xl font-bold text-text-1">{formatCompact(data.totals.pageviews, locale)}</div>
            </div>
          </div>
        </section>
      </div>

      <p className="mt-10 text-xs text-text-3">{t('demoNote')}</p>
    </div>
  );
}
