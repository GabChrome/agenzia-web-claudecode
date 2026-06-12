'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ArrowRight, Play } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';

const HeroScene = dynamic(() => import('../three/HeroScene'), { ssr: false });

export default function Hero() {
  const t = useTranslations('hero');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-[100dvh] flex items-center overflow-hidden pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-8 items-center">
          
          <AnimatedSection className="flex flex-col items-start">
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid var(--border-default)',
              background: 'rgba(154,120,48,0.07)',
              borderRadius: 999, padding: '5px 14px',
              fontSize: 12, color: 'var(--text-2)', marginBottom: 28,
            }}>
              <span style={{ color: 'var(--accent)' }}>✦</span>
              Agenzia italiana · Consegna in 4 settimane
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(44px, 6.5vw, 84px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
              <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>
                Siti web{' '}
              </em>
              <span style={{ fontWeight: 800 }}>che convertono.</span>
            </h1>

            {/* Sottotitolo */}
            <p style={{
              color: 'var(--text-2)',
              maxWidth: '460px',
              fontSize: '17px',
              lineHeight: 1.75,
              marginTop: '24px'
            }}>
              {t('sub')}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '36px', flexWrap: 'wrap' }}>
              <button
                onClick={() => scrollTo('contact')}
                className="btn-glow"
                style={{
                  background: 'var(--accent)',
                  color: '#F8F5F0',
                  padding: '13px 26px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '15px'
                }}
              >
                Inizia il tuo progetto
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollTo('portfolio')}
                style={{
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-2)',
                  padding: '13px 26px',
                  borderRadius: '10px',
                  fontWeight: 500,
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '15px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-1)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-2)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
              >
                <Play size={16} fill="currentColor" />
                Guarda il portfolio
              </button>
            </div>

            {/* Social proof */}
            <div style={{
              marginTop: '48px',
              fontSize: '13px',
              color: 'var(--text-3)'
            }}>
              50+ progetti <span style={{ color: 'var(--accent)' }}>·</span> 98% soddisfazione <span style={{ color: 'var(--accent)' }}>·</span> Lighthouse 90+
            </div>
          </AnimatedSection>

          {/* Right — 3D scene (nascosta su mobile, ma su md flex) */}
          <AnimatedSection delay={0.2} className="hidden md:flex justify-center items-center w-full h-full relative">
             <HeroScene />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
