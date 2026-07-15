import { unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import BookingAdmin from '@/components/bookings/BookingAdmin';

export const metadata: Metadata = {
  title: 'Gestione prenotazioni | Anti Gravity',
  robots: { index: false, follow: false },
};

export default function BookingAdminPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <BookingAdmin />;
}
