import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import { getSite, sites } from '@/config/sites';
import AccessGate from '@/components/reports/AccessGate';
import SiteReport from '@/components/reports/SiteReport';

export const metadata: Metadata = {
  title: 'Report sito | Anti Gravity',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return sites.map((s) => ({ siteId: s.id }));
}

export default function SiteReportPage({
  params: { locale, siteId },
}: {
  params: { locale: string; siteId: string };
}) {
  unstable_setRequestLocale(locale);
  const site = getSite(siteId);
  if (!site) notFound();

  return (
    <AccessGate>
      <SiteReport site={site} />
    </AccessGate>
  );
}
