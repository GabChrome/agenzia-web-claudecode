'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Sostituisce il prefisso locale nel path
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1 text-sm font-medium" role="group" aria-label="Seleziona lingua">
      <motion.button
        whileHover={{ opacity: 1 }}
        onClick={() => switchLocale('it')}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'it'
            ? 'text-text-primary'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        aria-label="Italiano"
        aria-pressed={locale === 'it'}
      >
        IT
      </motion.button>
      <span className="text-[#1F1F1F]" aria-hidden="true">|</span>
      <motion.button
        whileHover={{ opacity: 1 }}
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'en'
            ? 'text-text-primary'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        aria-label="English"
        aria-pressed={locale === 'en'}
      >
        EN
      </motion.button>
    </div>
  );
}
