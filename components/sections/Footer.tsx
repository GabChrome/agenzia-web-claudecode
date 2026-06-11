'use client';

export default function Footer() {
  return (
    <footer style={{
      position: 'relative',
      paddingTop: '64px',
      paddingBottom: '32px'
    }}>
      {/* Border top speciale con gradiente */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent) 70%, transparent 100%)',
        opacity: 0.25
      }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Top riga */}
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div className="flex flex-col items-start gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="tracking-tight hover:opacity-80 transition-opacity"
              aria-label="Anti Gravity - torna in cima"
            >
              <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '20px' }}>Anti</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '20px' }}>Gravity</span>
            </button>
            <p style={{ color: 'var(--text-3)', fontSize: '15px' }}>Siti web che convertono.</p>
          </div>

          <div className="flex gap-16 flex-wrap">
            <div className="flex flex-col gap-4">
              <span className="eyebrow">Azienda</span>
              <button style={{ color: 'var(--text-3)', fontSize: '14px', textAlign: 'left', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'} onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>Chi siamo</button>
              <button style={{ color: 'var(--text-3)', fontSize: '14px', textAlign: 'left', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'} onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}>Portfolio</button>
              <button style={{ color: 'var(--text-3)', fontSize: '14px', textAlign: 'left', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'} onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Prezzi</button>
            </div>
            <div className="flex flex-col gap-4">
              <span className="eyebrow">Social</span>
              <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}>Instagram</a>
              <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}>LinkedIn</a>
              <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}>GitHub</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="eyebrow">Legale</span>
              <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}>Privacy Policy</a>
              <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}>Cookie Policy</a>
              <a href="#" style={{ color: 'var(--text-3)', fontSize: '14px', transition: '150ms' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-2)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}>Termini e Condizioni</a>
            </div>
          </div>
        </div>

        {/* Bottom riga */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }} className="md:flex-row">
          <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>
            © {new Date().getFullYear()} Anti Gravity. P.IVA 0123456789. Tutti i diritti riservati.
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>
            Made with ♥ in Italia
          </div>
        </div>

      </div>
    </footer>
  );
}
