'use client';

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const NAV_LINKS = ['about', 'portfolio', 'pricing', 'contact'] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: '60px',
          background: scrolled ? 'rgba(248,245,240,0.93)' : 'rgba(248,245,240,0)',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent'
        }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="tracking-tight hover:opacity-80 transition-opacity"
            aria-label="Anti Gravity - torna in cima"
          >
            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>Anti</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Gravity</span>
          </button>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((key) => (
              <li key={key}>
                <button
                  onClick={() => scrollTo(key)}
                  style={{
                    color: 'var(--text-3)',
                    fontSize: '14px',
                    transition: 'color 150ms ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-1)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
                >
                  {t(key)}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-5">
            <LanguageSwitcher />
            <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
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
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.12)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {t('cta')}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-1)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
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
