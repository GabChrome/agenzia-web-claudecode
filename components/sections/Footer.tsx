'use client';

import { useTranslations } from 'next-intl';
import { TwitterLogo, LinkedinLogo, GithubLogo } from '@phosphor-icons/react';

export default function Footer() {
  const t = useTranslations('footer');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-surface border-t border-[rgba(255,255,255,0.06)] pt-16 pb-8 lg:pt-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 lg:gap-8 mb-16 lg:mb-24">
          
          {/* Brand & Tagline */}
          <div className="col-span-2 lg:col-span-2">
            <button
              onClick={scrollToTop}
              className="text-text-primary font-bold text-xl tracking-tight hover:text-accent transition-colors mb-4 block"
              aria-label="Anti Gravity - torna in cima"
            >
              Anti Gravity
            </button>
            <p className="text-text-secondary max-w-sm">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="text-text-muted hover:text-accent transition-colors" aria-label="Twitter">
                <TwitterLogo size={24} weight="fill" />
              </a>
              <a href="#" className="text-text-muted hover:text-accent transition-colors" aria-label="LinkedIn">
                <LinkedinLogo size={24} weight="fill" />
              </a>
              <a href="#" className="text-text-muted hover:text-accent transition-colors" aria-label="GitHub">
                <GithubLogo size={24} weight="fill" />
              </a>
            </div>
          </div>

          {/* Servizi */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t('services.title')}</h3>
            <ul className="flex flex-col gap-3" role="list">
              {(t.raw('services.links') as string[]).map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Azienda */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t('company.title')}</h3>
            <ul className="flex flex-col gap-3" role="list">
              {(t.raw('company.links') as string[]).map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legale */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t('legal.title')}</h3>
            <ul className="flex flex-col gap-3" role="list">
              {(t.raw('legal.links') as string[]).map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
          <p>{t('copyright')}</p>
          <p>{t('vat')}</p>
        </div>
      </div>
    </footer>
  );
}
