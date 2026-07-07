import { unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import AccessGate from '@/components/reports/AccessGate';
import ReportsHome from '@/components/reports/ReportsHome';

export const metadata: Metadata = {
  title: 'Report | Anti Gravity',
  robots: { index: false, follow: false },
};

export default function ReportsPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <AccessGate>
      <ReportsHome />
    </AccessGate>
  );
}
