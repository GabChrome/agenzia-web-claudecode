'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Preloader della hero: brand + barra di avanzamento, su fondo scuro.
 * Si dissolve da solo quando gli asset della scena sono pronti.
 */
export default function Loader() {
  const { active, progress } = useProgress();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!active) {
      const t = setTimeout(() => setHidden(true), 450);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        background: 'var(--dark-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        opacity: active ? 1 : 0,
        transition: 'opacity 400ms ease',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em' }}>
        <span style={{ color: 'var(--dark-text-1)' }}>Anti</span>
        <span style={{ color: 'var(--accent-bright)' }}>Gravity</span>
      </div>
      <div
        style={{
          width: '160px',
          height: '2px',
          background: 'rgba(255,255,255,0.10)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--accent-bright)',
            transition: 'width 200ms ease',
          }}
        />
      </div>
    </div>
  );
}
