'use client';

import { useTranslations } from 'next-intl';
import AnimatedSection from '@/components/ui/AnimatedSection';

const PLAN_META = [
  { id: 'vetrina',      popular: false },
  { id: 'prenotazioni', popular: true  },
  { id: 'misura',       popular: false },
];

export default function Pricing() {
  const t = useTranslations('pricing');

  const plans = PLAN_META.map((meta, i) => ({
    ...meta,
    name:     t(`plans.${i}.name`),
    setup:    t(`plans.${i}.setup`),
    monthly:  t(`plans.${i}.monthly`),
    desc:     t(`plans.${i}.desc`),
    features: t.raw(`plans.${i}.features`) as string[],
    note:     t(`plans.${i}.note`),
    cta:      t(`plans.${i}.cta`),
  }));

  return (
    <section
      id="pricing"
      className="py-16 md:py-[120px]"
      style={{ background: 'var(--dark-bg)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Glow ambientali, coerenti con la scena 3D */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '560px', height: '560px',
        background: 'radial-gradient(circle, rgba(200,160,64,0.09) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-8%',
        width: '480px', height: '480px',
        background: 'radial-gradient(circle, rgba(138,100,32,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>

        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            color: 'var(--dark-text-1)',
            marginBottom: '16px',
            lineHeight: 1.1,
          }}>
            {t('headline')}
          </h2>
          <p style={{ color: 'var(--dark-text-2)', fontSize: '18px', maxWidth: '500px' }}>
            {t('sub')}
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <AnimatedSection delay={i * 0.1} key={plan.id} className="h-full">
              <div
                className="glass-card"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'clamp(20px, 4vw, 32px)',
                  position: 'relative',
                  ...(plan.popular && {
                    background: 'rgba(200,160,64,0.07)',
                    border: '1px solid rgba(200,160,64,0.50)',
                    boxShadow: '0 0 48px rgba(200,160,64,0.12)',
                  }),
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent-bright)', color: '#14120E', fontSize: '11px', fontWeight: 700,
                    padding: '4px 14px', borderRadius: '999px', whiteSpace: 'nowrap',
                  }}>
                    {t('popularBadge')}
                  </div>
                )}

                {/* Intestazione */}
                <div style={{ marginBottom: '28px' }}>
                  <div className="eyebrow" style={{ marginBottom: '16px', color: 'var(--dark-text-3)' }}>{plan.name}</div>

                  {/* Prezzo setup */}
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--dark-text-1)', lineHeight: 1 }}>
                      {plan.setup}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--dark-text-3)', marginLeft: '6px' }}>
                      {t('onetimeLabel')}
                    </span>
                  </div>

                  {/* Canone mensile */}
                  <div style={{ marginTop: '8px', fontSize: '15px', color: 'var(--dark-text-2)' }}>
                    +&nbsp;<span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>{plan.monthly}</span>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--dark-text-2)', lineHeight: 1.6, marginTop: '16px' }}>
                    {plan.desc}
                  </p>
                </div>

                {/* Feature list */}
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginBottom: '16px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--dark-text-2)' }}>
                      <span style={{ color: 'var(--accent-bright)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Nota */}
                <p style={{ fontSize: '12px', color: 'var(--dark-text-3)', marginBottom: '24px', lineHeight: 1.5 }}>
                  {plan.note}
                </p>

                {/* CTA */}
                <button
                  className={plan.popular ? 'btn-glow' : ''}
                  style={{
                    width: '100%',
                    background: plan.popular ? 'var(--accent-bright)' : 'rgba(255,255,255,0.04)',
                    border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.18)',
                    color: plan.popular ? '#14120E' : 'var(--dark-text-1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 200ms',
                    cursor: 'pointer',
                    marginTop: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {plan.cta}
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
