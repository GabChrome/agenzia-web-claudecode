'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
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
      style={{ padding: '120px 0', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Glow di sfondo */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(124,110,248,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '64px',
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(124,110,248,0.3)',
            background: 'rgba(124,110,248,0.08)',
            borderRadius: '999px',
            padding: '5px 16px',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Testimonials
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
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
            Più di 20 clienti ci hanno scelto per costruire la loro presenza online.
          </p>
        </motion.div>

        {/* Colonne scrollanti */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          maxHeight: '720px',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
        }}>
          <TestimonialsColumn testimonials={col1} duration={18} />
          <TestimonialsColumn testimonials={col2} duration={22} className="col-md" />
          <TestimonialsColumn testimonials={col3} duration={16} className="col-lg" />
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) { .col-md, .col-lg { display: none !important; } }
        @media (min-width: 768px) and (max-width: 1023px) { .col-lg { display: none !important; } }
      `}</style>
    </section>
  );
}
