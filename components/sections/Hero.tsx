'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ArrowRight, Play } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import SceneLoader from '@/components/3d/SceneLoader';

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <SceneLoader />,
});

export default function Hero() {
  const t = useTranslations('hero');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
      style={{ background: 'var(--dark-bg)' }}
    >
      {/* Scena 3D ambientale di sfondo */}
      <div className="absolute inset-0" aria-hidden="true">
        <HeroScene />
      </div>

      {/* Scrim per leggibilità del testo sopra la scena */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(105deg, rgba(10,9,8,0.82) 0%, rgba(10,9,8,0.55) 45%, rgba(10,9,8,0.18) 72%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-20 sm:pt-24 pb-12 sm:pb-16">
        <AnimatedSection className="flex flex-col items-start max-w-2xl">
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(200,160,64,0.35)',
            background: 'rgba(200,160,64,0.10)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 999, padding: '5px 14px',
            fontSize: 12, color: 'var(--dark-text-2)', marginBottom: 28,
          }}>
            <span style={{ color: 'var(--accent-bright)' }}>✦</span>
            {t('badge')}
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 84px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--dark-text-1)' }}>
            <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>
              {t('headlineEm')}{' '}
            </em>
            <span style={{ fontWeight: 800 }}>{t('headlineStrong')}</span>
          </h1>

          {/* Sottotitolo */}
          <p style={{
            color: 'var(--dark-text-2)',
            maxWidth: '460px',
            fontSize: 'clamp(15px, 2vw, 17px)',
            lineHeight: 1.75,
            marginTop: '20px'
          }}>
            {t('sub')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3" style={{ marginTop: '28px' }}>
            <button
              onClick={() => scrollTo('contact')}
              className="btn-glow w-full sm:w-auto"
              style={{
                background: 'var(--accent-bright)',
                color: '#14120E',
                padding: '13px 26px',
                borderRadius: '10px',
                fontWeight: 700,
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '15px'
              }}
            >
              {t('cta1')}
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => scrollTo('portfolio')}
              className="w-full sm:w-auto"
              style={{
                border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'var(--dark-text-2)',
                padding: '13px 26px',
                borderRadius: '10px',
                fontWeight: 500,
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '15px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dark-text-1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--dark-text-2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
              }}
            >
              <Play size={16} fill="currentColor" />
              {t('cta2')}
            </button>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: '32px', fontSize: '13px', color: 'var(--dark-text-3)' }}>
            {t('socialProof').split('·').map((part, i, arr) => (
              <span key={i}>
                {part.trim()}
                {i < arr.length - 1 && (
                  <span style={{ color: 'var(--accent-bright)', margin: '0 6px' }}>·</span>
                )}
              </span>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
