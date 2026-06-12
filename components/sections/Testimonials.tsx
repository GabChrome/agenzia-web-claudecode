'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';

const AUTOPLAY_MS = 6000;

export default function Testimonials() {
  const t = useTranslations('testimonials');

  const items = t.raw('items') as Array<{
    quote: string;
    name: string;
    role: string;
    image: string;
  }>;

  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const update = () => {
      setPerView(window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener('resize', update);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onMq);

    return () => {
      window.removeEventListener('resize', update);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  const pages = Math.max(1, Math.ceil(items.length / perView));

  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion, pages]);

  // Ultima pagina allineata al bordo destro anche se parziale
  const start = Math.min(page * perView, Math.max(0, items.length - perView));
  const translate = start * (100 / perView);

  return (
    <section
      id="testimonials"
      className="py-16 md:py-[120px]"
      style={{ background: 'var(--dark-bg)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Divisore dorato di raccordo con il pricing */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--accent-bright) 35%, var(--accent-bright) 65%, transparent 100%)',
        opacity: 0.25,
      }} aria-hidden="true" />

      {/* Glow ambientale */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '700px', height: '460px',
        background: 'radial-gradient(ellipse at center, rgba(200,160,64,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>

        <AnimatedSection className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(200,160,64,0.35)',
            background: 'rgba(200,160,64,0.10)',
            borderRadius: '999px',
            padding: '5px 16px',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-bright)' }}>
              Testimonials
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--dark-text-1)',
            lineHeight: 1.1,
            maxWidth: '540px',
          }}>
            {t('headline')}
          </h2>
          <p style={{
            color: 'var(--dark-text-2)',
            fontSize: '16px',
            lineHeight: 1.6,
            marginTop: '16px',
            maxWidth: '400px',
          }}>
            {t('subtitle')}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimonials"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  margin: '0 -10px',
                  transform: `translateX(-${translate}%)`,
                  transition: reducedMotion ? 'none' : 'transform 600ms cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
              >
                {items.map((item, i) => (
                  <div
                    key={i}
                    style={{ flex: `0 0 ${100 / perView}%`, padding: '0 10px', boxSizing: 'border-box' }}
                  >
                    <div
                      className="glass-card"
                      style={{
                        height: '100%',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Virgoletta decorativa */}
                      <div style={{
                        position: 'absolute', top: '8px', right: '16px',
                        fontFamily: 'var(--font-serif)', fontSize: '56px', lineHeight: 1,
                        color: 'var(--accent-bright)', opacity: 0.14, userSelect: 'none',
                        pointerEvents: 'none',
                      }} aria-hidden="true">
                        &quot;
                      </div>

                      <p style={{
                        color: 'var(--dark-text-2)',
                        fontSize: '14px',
                        lineHeight: 1.75,
                        fontStyle: 'italic',
                        position: 'relative',
                        zIndex: 1,
                        margin: 0,
                        flex: 1,
                      }}>
                        {item.quote}
                      </p>

                      <div style={{
                        borderTop: '1px solid var(--dark-border)',
                        paddingTop: '16px',
                        marginTop: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          width={42}
                          height={42}
                          loading="lazy"
                          style={{
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(200,160,64,0.55)',
                            width: '42px',
                            height: '42px',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            color: 'var(--dark-text-1)',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {item.name}
                          </div>
                          <div style={{ color: 'var(--dark-text-3)', fontSize: '12px', lineHeight: 1.4 }}>
                            {item.role}
                          </div>
                        </div>
                        <div style={{
                          marginLeft: 'auto',
                          color: 'var(--accent-bright)',
                          fontSize: '10px',
                          letterSpacing: '1px',
                          flexShrink: 0,
                        }} aria-label="5 stelle su 5">
                          ★★★★★
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controlli */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '32px',
            }}>
              <button
                onClick={() => setPage((p) => (p - 1 + pages) % pages)}
                aria-label={t('ariaPrev')}
                className="glass-card"
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--dark-text-1)', cursor: 'pointer', transition: 'border-color 200ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(200,160,64,0.55)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--dark-border)')}
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }} role="tablist" aria-label="Slide">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    aria-label={`${i + 1} / ${pages}`}
                    aria-current={i === page}
                    style={{
                      width: i === page ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      background: i === page ? 'var(--accent-bright)' : 'rgba(255,255,255,0.20)',
                      transition: 'all 300ms ease',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setPage((p) => (p + 1) % pages)}
                aria-label={t('ariaNext')}
                className="glass-card"
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--dark-text-1)', cursor: 'pointer', transition: 'border-color 200ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(200,160,64,0.55)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--dark-border)')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
