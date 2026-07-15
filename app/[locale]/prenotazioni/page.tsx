import { unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import BookingFlow from '@/components/bookings/BookingFlow';

export const metadata: Metadata = {
  title: 'Prenota una call | Anti Gravity',
  description: 'Prenota online una call con il team Anti Gravity: scegli servizio, giorno e orario.',
};

export default function BookingPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <BookingFlow />;
}
