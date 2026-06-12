'use client';

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import PillNav, { PillNavItem } from '@/components/ui/PillNav';

const NAV_LINKS = ['about', 'portfolio', 'pricing', 'contact'] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const pillItems: PillNavItem[] = NAV_LINKS.map((key) => ({
    label: t(key),
    href: `#${key}`,
  }));

  const brand = (
    <>
      <span className="brand-anti">Anti</span>
      <span className="brand-gravity">Gravity</span>
    </>
  );

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: '60px',
          background: scrolled ? 'rgba(248,245,240,0.93)' : 'rgba(248,245,240,0)',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo testuale — solo mobile (chiaro sopra la hero scura, scuro dopo lo scroll) */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="tracking-tight hover:opacity-80 transition-opacity lg:hidden"
            aria-label={t('ariaScrollTop')}
          >
            <span style={{ fontWeight: 700, color: scrolled || mobileOpen ? 'var(--text-1)' : 'var(--dark-text-1)' }}>Anti</span>
            <span style={{ fontWeight: 700, color: scrolled || mobileOpen ? 'var(--accent)' : 'var(--accent-bright)' }}>Gravity</span>
          </button>

          {/* Pill nav — solo desktop */}
          <div className="hidden lg:block">
            <PillNav
              items={pillItems}
              brand={brand}
              brandAriaLabel={t('ariaScrollTop')}
              onBrandClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              onItemClick={(href) => scrollTo(href.replace('#', ''))}
              baseColor="#1A1814"
              pillColor="#F8F5F0"
              pillTextColor="#1A1814"
              hoveredPillTextColor="#F8F5F0"
              activeDotColor="#9A7830"
            />
          </div>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-5">
            <LanguageSwitcher light={!scrolled} />
            <div style={{ width: '1px', height: '14px', background: scrolled ? 'var(--border-subtle)' : 'rgba(255,255,255,0.15)' }} />
            <button
              className="btn-glow"
              onClick={() => scrollTo('contact')}
              style={{
                background: 'var(--accent)',
                color: '#F8F5F0',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'filter 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {t('cta')}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ color: scrolled || mobileOpen ? 'var(--text-1)' : 'var(--dark-text-1)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('ariaCloseMenu') : t('ariaOpenMenu')}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-[rgba(248,245,240,0.98)] backdrop-blur-[12px] lg:hidden flex flex-col pt-24 px-6 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ul className="flex flex-col gap-4">
          {NAV_LINKS.map((key) => (
            <li key={key}>
              <button
                onClick={() => scrollTo(key)}
                className="text-2xl font-semibold text-left w-full py-2 border-b border-[var(--border-subtle)]"
                style={{ color: 'var(--text-1)' }}
              >
                {t(key)}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between">
          <LanguageSwitcher />
          <button
            className="btn-glow"
            onClick={() => scrollTo('contact')}
            style={{
              background: 'var(--accent)',
              color: '#F8F5F0',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {t('cta')}
          </button>
        </div>
      </div>
    </>
  );
}
