import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';

export const metadata = {
  title: 'Anti Gravity | Siti web che convertono',
  description: 'Agenzia web specializzata in siti web, e-commerce e web app ad alte prestazioni per PMI e startup.',
};

export function generateStaticParams() {
  return [{ locale: 'it' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { unstable_setRequestLocale } = await import('next-intl/server');
  unstable_setRequestLocale(locale);

  let messages;
  try {
    messages = await getMessages();
  } catch {
    notFound();
  }

  return (
    <html lang={locale} className="scroll-smooth">
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Anti Gravity",
              "image": "https://agenzia-web-claudecode.gabrielefornabaio.workers.dev/og-image.jpg",
              "@id": "https://agenzia-web-claudecode.gabrielefornabaio.workers.dev",
              "url": "https://agenzia-web-claudecode.gabrielefornabaio.workers.dev",
              "telephone": "",
              "priceRange": "€€",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Italia",
                "addressCountry": "IT"
              }
            })
          }}
        />
      </body>
    </html>
  );
}
