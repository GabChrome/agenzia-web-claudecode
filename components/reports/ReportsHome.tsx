'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { sites } from '@/config/sites';
import { delta, formatCompact, getSiteSummary } from '@/lib/analytics';
import Sparkline from './Sparkline';
import { chart } from './chartTheme';
import { logoutReports } from './AccessGate';

/** Indice dei report: una card per ogni sito configurato in config/sites.ts. */
export default function ReportsHome() {
  const t = useTranslations('reports');
  const locale = useLocale();

  // AccessGate monta i figli solo lato client: qui new Date() è sicuro
  const rows = useMemo(() => {
    const now = new Date();
    const fmtDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    return sites.map((site) => {
      const s = getSiteSummary(site, now);
      return { site, summary: s, d: delta(s.visits30, s.prevVisits30), launched: fmtDate.format(new Date(site.launchDate)) };
    });
  }, [locale]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Anti Gravity</div>
          <h1 className="mt-1 font-serif text-display-sm text-text-1">{t('title')}</h1>
          <p className="mt-2 max-w-xl text-text-2">{t('subtitle')}</p>
        </div>
        <button
          onClick={logoutReports}
          className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-2 transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-text-1"
        >
          {t('logout')}
        </button>
      </header>

      <div className="gold-divider mt-6" />

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {rows.map(({ site, summary, d, launched }) => (
          <li key={site.id}>
            <Link
              href={`/${locale}/reports/${site.id}/`}
              className="group block rounded-2xl border border-border-subtle bg-surface-1 p-6 transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-border-default hover:shadow-lg hover:shadow-accent-glow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="eyebrow">{site.sector}</div>
                  <h2 className="mt-1 truncate text-xl font-bold text-text-1">{site.name}</h2>
                  <p className="mt-0.5 truncate text-sm text-text-3">{site.domain}</p>
                </div>
                <Sparkline values={summary.sparkline} width={110} height={36} />
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <div className="text-xs text-text-3">{t('visits30')}</div>
                  <div className="mt-0.5 text-2xl font-bold leading-none text-text-1">
                    {formatCompact(summary.visits30, locale)}
                    {d !== null && (
                      <span
                        className="ml-2 align-middle text-xs font-semibold"
                        style={{ color: d >= 0 ? chart.deltaGood : chart.deltaBad }}
                      >
                        {d >= 0 ? '▲' : '▼'}{' '}
                        {new Intl.NumberFormat(locale, {
                          style: 'percent',
                          maximumFractionDigits: 1,
                          signDisplay: 'never',
                        }).format(Math.abs(d))}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-accent transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5">
                  {t('openReport')} →
                </span>
              </div>

              <p className="mt-4 text-xs text-text-3">{t('launched', { date: launched })}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-text-3">{t('demoNote')}</p>
    </div>
  );
}
