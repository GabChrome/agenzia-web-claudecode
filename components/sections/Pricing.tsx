'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AnimatedSection from '@/components/ui/AnimatedSection';

export default function Pricing() {
  const t = useTranslations('pricing');
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      id: 'base',
      name: t('plans.0.name'),
      price: isAnnual ? Math.round(499 * 0.8) : 499,
      desc: t('plans.0.desc'),
      features: t.raw('plans.0.features') as string[],
    },
    {
      id: 'pro',
      name: t('plans.1.name'),
      price: isAnnual ? Math.round(999 * 0.8) : 999,
      desc: t('plans.1.desc'),
      features: t.raw('plans.1.features') as string[],
      popular: true,
    },
    {
      id: 'premium',
      name: t('plans.2.name'),
      price: isAnnual ? Math.round(1999 * 0.8) : 1999,
      desc: t('plans.2.desc'),
      features: t.raw('plans.2.features') as string[],
    },
  ];

  return (
    <section id="pricing" style={{ padding: '120px 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            color: 'var(--text-1)',
            marginBottom: '16px',
            lineHeight: 1.1
          }}>
            {t('headline')}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '18px', maxWidth: '500px', marginBottom: '40px' }}>
            {t('sub')}
          </p>

          {/* Toggle Mensile/Annuale */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
            padding: '4px',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsAnnual(false)}
              style={{
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 600,
                color: !isAnnual ? '#F8F5F0' : 'var(--text-3)',
                background: !isAnnual ? 'var(--accent)' : 'transparent',
                transition: 'all 200ms'
              }}
            >
              Progetto singolo
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              style={{
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 600,
                color: isAnnual ? '#F8F5F0' : 'var(--text-3)',
                background: isAnnual ? 'var(--accent)' : 'transparent',
                transition: 'all 200ms',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Partnership annuale
              {isAnnual && <span style={{ color: 'var(--success)', fontSize: '11px', background: 'rgba(74,222,128,0.1)', padding: '2px 6px', borderRadius: '4px' }}>-20%</span>}
            </button>
          </div>
        </AnimatedSection>

        {/* 3 card in griglia */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <AnimatedSection delay={i * 0.1} key={plan.id} className="h-full">
              <div
                className={plan.popular ? 'border-gradient' : ''}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: plan.popular ? 'var(--surface-2)' : 'var(--surface-1)',
                  border: plan.popular ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '32px',
                  position: 'relative'
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#F8F5F0', fontSize: '11px', fontWeight: 700,
                    padding: '4px 14px', borderRadius: '999px'
                  }}>
                    {t('popularBadge')}
                  </div>
                )}

                <div style={{ marginBottom: '32px' }}>
                  <div className="eyebrow" style={{ marginBottom: '8px' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: plan.popular ? 'var(--accent)' : 'var(--text-1)', lineHeight: 1 }}>
                      €{plan.price}
                    </span>
                    {isAnnual && <span style={{ color: 'var(--text-3)', fontSize: '14px' }}>/mese</span>}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>{plan.desc}</p>
                </div>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginBottom: '32px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={plan.popular ? 'btn-glow' : ''}
                  style={{
                    width: '100%',
                    background: plan.popular ? 'var(--accent)' : 'transparent',
                    border: plan.popular ? 'none' : '1px solid var(--border-default)',
                    color: plan.popular ? '#F8F5F0' : 'var(--text-1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 200ms',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('cta')}
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
