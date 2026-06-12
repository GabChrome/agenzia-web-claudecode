'use client';

import { useTranslations } from 'next-intl';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { TestimonialsColumn, type TestimonialItem } from '@/components/ui/testimonials-columns-1';

export default function Testimonials() {
  const t = useTranslations('testimonials');

  const items = t.raw('items') as Array<{
    quote: string;
    name: string;
    role: string;
    image: string;
  }>;

  const testimonials: TestimonialItem[] = items.map((item) => ({
    text: item.quote,
    name: item.name,
    role: item.role,
    image: item.image,
  }));

  const col1 = testimonials.slice(0, 3);
  const col2 = testimonials.slice(3, 6);
  const col3 = testimonials.slice(6, 9);

  return (
    <section
      id="testimonials"
      className="py-16 md:py-[120px]"
      style={{ background: 'var(--surface-1)', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(154,120,48,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>

        <AnimatedSection className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(154,120,48,0.3)',
            background: 'rgba(154,120,48,0.07)',
            borderRadius: '999px',
            padding: '5px 16px',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Testimonials
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-1)',
            lineHeight: 1.1,
            maxWidth: '540px',
          }}>
            {t('headline')}
          </h2>
          <p style={{
            color: 'var(--text-2)',
            fontSize: '16px',
            lineHeight: 1.6,
            marginTop: '16px',
            maxWidth: '400px',
          }}>
            {t('subtitle')}
          </p>
        </AnimatedSection>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          maxHeight: '680px',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        }}>
          <TestimonialsColumn testimonials={col1} duration={18} />
          <TestimonialsColumn testimonials={col2} duration={22} className="hidden md:block" />
          <TestimonialsColumn testimonials={col3} duration={16} className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
