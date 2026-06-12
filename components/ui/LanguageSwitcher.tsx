'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Sostituisce il prefisso locale nel path
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const activeColor = light ? 'var(--dark-text-1)' : 'var(--text-1)';
  const idleColor = light ? 'var(--dark-text-3)' : 'var(--text-3)';

  return (
    <div className="flex items-center gap-1 text-sm font-medium" role="group" aria-label="Seleziona lingua">
      <motion.button
        whileHover={{ opacity: 1 }}
        onClick={() => switchLocale('it')}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: locale === 'it' ? activeColor : idleColor }}
        aria-label="Italiano"
        aria-pressed={locale === 'it'}
      >
        IT
      </motion.button>
      <span style={{ color: light ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} aria-hidden="true">|</span>
      <motion.button
        whileHover={{ opacity: 1 }}
        onClick={() => switchLocale('en')}
        className="px-2 py-1 rounded transition-colors"
        style={{ color: locale === 'en' ? activeColor : idleColor }}
        aria-label="English"
        aria-pressed={locale === 'en'}
      >
        EN
      </motion.button>
    </div>
  );
}
