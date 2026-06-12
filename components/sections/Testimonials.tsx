'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import AnimatedSection from '@/components/ui/AnimatedSection';

// Placeholder avatar (se non forniti nel json)
const AVATARS = [
  'https://picsum.photos/seed/giulia-ferretti/80/80',
  'https://picsum.photos/seed/marco-benedetti/80/80',
  'https://picsum.photos/seed/salvatore-amato/80/80',
  'https://picsum.photos/seed/chiara-russo/80/80',
];

export default function Testimonials() {
  const t = useTranslations('testimonials');

  const testimonials = t.raw('items') as Array<{
    quote: string;
    name: string;
    role: string;
    company: string;
  }>;

  return (
    <section id="testimonials" style={{ padding: '120px 0', background: 'var(--surface-1)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <AnimatedSection className="max-w-lg mb-16">
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            color: 'var(--text-1)',
            lineHeight: 1.1
          }}>
            {t('headline')}
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-5">
          {testimonials.map((test, i) => (
            <AnimatedSection key={test.name} delay={i * 0.1}>
              <blockquote style={{
                background: '#0F0F0F',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '28px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                height: '100%'
              }}>
                {/* Decorazione virgolette */}
                <div style={{
                  position: 'absolute', top: '12px', right: '20px',
                  fontFamily: 'var(--font-serif)', fontSize: '80px', lineHeight: 1,
                  color: 'var(--accent)', opacity: 0.15, userSelect: 'none'
                }} aria-hidden="true">
                  &quot;
                </div>

                <p style={{
                  color: 'var(--text-2)',
                  fontSize: '15px',
                  lineHeight: 1.75,
                  fontStyle: 'italic',
                  flex: 1,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {test.quote}
                </p>

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Image
                    src={AVATARS[i % AVATARS.length]}
                    alt={test.name}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <cite style={{ fontStyle: 'normal', fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                      {test.name}
                    </cite>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {test.role} - {test.company}
                    </span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', color: 'var(--accent)' }} aria-label="5 stelle su 5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
              </blockquote>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
