'use client';

/**
 * Fallback statico per la hero: usato durante il caricamento del bundle 3D,
 * su dispositivi senza WebGL e come sfondo di sicurezza.
 */
export function SceneFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 70% 35%, rgba(200,160,64,0.14) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 20% 80%, rgba(138,100,32,0.10) 0%, transparent 70%),
          var(--dark-bg)
        `,
      }}
    />
  );
}

export default function SceneLoader() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <SceneFallback />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid rgba(200,160,64,0.2)',
            borderTopColor: 'var(--accent-bright)',
          }}
        />
      </div>
    </div>
  );
}
