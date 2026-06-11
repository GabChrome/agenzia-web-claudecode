'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { List, X } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const NAV_LINKS = ['about', 'portfolio', 'pricing', 'contact'] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-sticky"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`transition-all duration-300 ${
            scrolled
              ? 'bg-[rgba(10,10,10,0.85)] backdrop-blur-[12px] border-b border-[rgba(255,255,255,0.06)]'
              : 'bg-transparent'
          }`}
        >
          <nav
            className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between"
            aria-label="Navigazione principale"
          >
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-text-primary font-bold text-lg tracking-tight hover:text-accent transition-colors"
              aria-label="Anti Gravity - torna in cima"
            >
              Anti Gravity
            </button>

            {/* Desktop nav */}
            <ul className="hidden lg:flex items-center gap-8" role="list">
              {NAV_LINKS.map((key) => (
                <li key={key}>
                  <button
                    onClick={() => scrollTo(key)}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {t(key)}
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop right */}
            <div className="hidden lg:flex items-center gap-4">
              <LanguageSwitcher />
              <Button
                size="sm"
                onClick={() => scrollTo('contact')}
              >
                {t('cta')}
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-text-primary p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <motion.div
        id="mobile-menu"
        className="fixed inset-0 z-modal bg-[rgba(10,10,10,0.98)] backdrop-blur-[12px] lg:hidden flex flex-col pt-20 px-6"
        initial={false}
        animate={
          mobileOpen
            ? { opacity: 1, pointerEvents: 'auto' as const }
            : { opacity: 0, pointerEvents: 'none' as const }
        }
        transition={{ duration: reduce ? 0 : 0.25 }}
      >
        <ul className="flex flex-col gap-2" role="list">
          {NAV_LINKS.map((key, i) => (
            <motion.li
              key={key}
              initial={false}
              animate={
                mobileOpen
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: -12 }
              }
              transition={{
                duration: reduce ? 0 : 0.25,
                delay: reduce ? 0 : i * 0.05,
              }}
            >
              <button
                onClick={() => scrollTo(key)}
                className="w-full text-left text-2xl font-semibold text-text-primary py-3 border-b border-[rgba(255,255,255,0.06)] hover:text-accent transition-colors"
              >
                {t(key)}
              </button>
            </motion.li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between">
          <LanguageSwitcher />
          <Button onClick={() => scrollTo('contact')}>
            {t('cta')}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
