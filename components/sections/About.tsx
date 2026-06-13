'use client';

import { useTranslations } from 'next-intl';
import AnimatedSection from '@/components/ui/AnimatedSection';

export default function About() {
  const t = useTranslations('about');
  const stats = t.raw('stats') as Array<{ num: string; label: string }>;

  return (
    <section id="about" className="py-16 md:py-[120px]" style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--accent) 35%, var(--accent) 65%, transparent 100%)',
        opacity: 0.25
      }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <AnimatedSection className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-8 md:gap-20 items-start">

          {/* Colonna Sinistra */}
          <div className="flex flex-col items-start">
            <span className="eyebrow" style={{ marginBottom: '16px' }}>
              {t('eyebrow')}
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-1)',
              lineHeight: 1.1
            }}>
              {t('headline1')}<br />{t('headline2')}
            </h2>
            <p style={{
              color: 'var(--text-2)',
              fontSize: '16px',
              lineHeight: 1.8,
              maxWidth: '480px',
              marginTop: '20px'
            }}>
              {t('body')}
            </p>
            <button
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: '14px',
                marginTop: '28px',
                transition: 'opacity 200ms',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('link')}
            </button>
          </div>

          {/* Colonna Destra (Stats) — orizzontale su mobile, verticale da md */}
          <div className="grid grid-cols-3 md:flex md:flex-col">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`flex flex-col items-center text-center md:items-start md:text-left py-4 md:py-[24px] px-2 md:px-0${
                  i !== stats.length - 1
                    ? ' border-r md:border-r-0 md:border-b border-black/[.07] border-solid'
                    : ''
                }`}
              >
                <div style={{ fontSize: 'clamp(28px, 7vw, 52px)', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                  {stat.num}
                </div>
                <div style={{ color: 'var(--text-3)', fontSize: '12px', marginTop: '6px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </AnimatedSection>
      </div>
    </section>
  );
}
