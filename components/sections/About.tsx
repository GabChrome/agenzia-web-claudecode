'use client';

import AnimatedSection from '@/components/ui/AnimatedSection';

export default function About() {
  return (
    <section id="about" style={{ padding: '120px 0', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--accent) 35%, var(--accent) 65%, transparent 100%)',
        opacity: 0.25
      }} aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <AnimatedSection className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-20 items-start">
          
          {/* Colonna Sinistra */}
          <div className="flex flex-col items-start">
            <span className="eyebrow" style={{ marginBottom: '16px' }}>
              Chi siamo
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-1)',
              lineHeight: 1.1
            }}>
              Non una fabbrica<br />di siti.
            </h2>
            <p style={{
              color: 'var(--text-2)',
              fontSize: '16px',
              lineHeight: 1.8,
              maxWidth: '480px',
              marginTop: '20px'
            }}>
              Siamo un piccolo team ossessionato dalla qualità. 
              Non usiamo template, non esternalizziamo e non prendiamo più progetti di quanti ne possiamo curare. 
              Ogni riga di codice che scriviamo ha uno scopo preciso: far crescere il tuo business.
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
              Scopri il processo →
            </button>
          </div>

          {/* Colonna Destra (Stats) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            {[
              { num: '50+', label: 'Progetti' },
              { num: '4 sett.', label: 'Consegna media' },
              { num: '90+', label: 'Lighthouse' }
            ].map((stat, i, arr) => (
              <div key={i} style={{
                padding: '24px 0',
                borderBottom: i !== arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  fontSize: '52px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  lineHeight: 1
                }}>
                  {stat.num}
                </div>
                <div style={{
                  color: 'var(--text-3)',
                  fontSize: '13px',
                  marginTop: '4px'
                }}>
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
