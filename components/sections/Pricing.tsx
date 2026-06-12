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
    <section id="pricing" style={{ padding: '120px 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <AnimatedSection className="flex flex-col items-center text-center mb-16">
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            color: 'var(--text-1)',
            marginBottom: '16px',
            lineHeight: 1.1,
          }}>
            {t('headline')}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '18px', maxWidth: '500px' }}>
            {t('sub')}
          </p>
        </AnimatedSection>

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
                  position: 'relative',
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#F8F5F0', fontSize: '11px', fontWeight: 700,
                    padding: '4px 14px', borderRadius: '999px', whiteSpace: 'nowrap',
                  }}>
                    {t('popularBadge')}
                  </div>
                )}

                {/* Intestazione */}
                <div style={{ marginBottom: '28px' }}>
                  <div className="eyebrow" style={{ marginBottom: '16px' }}>{plan.name}</div>

                  {/* Prezzo setup */}
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                      {plan.setup}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-3)', marginLeft: '6px' }}>
                      {t('onetimeLabel')}
                    </span>
                  </div>

                  {/* Canone mensile */}
                  <div style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-2)' }}>
                    +&nbsp;<span style={{ color: 'var(--accent)', fontWeight: 600 }}>{plan.monthly}</span>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginTop: '16px' }}>
                    {plan.desc}
                  </p>
                </div>

                {/* Feature list */}
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginBottom: '16px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Nota */}
                <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '24px', lineHeight: 1.5 }}>
                  {plan.note}
                </p>

                {/* CTA */}
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
                    cursor: 'pointer',
                    marginTop: 'auto',
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
