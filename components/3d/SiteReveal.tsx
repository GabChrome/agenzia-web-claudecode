'use client';

import { useRef, type CSSProperties, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { DISPLAY_CENTER, LAPTOP_TILT } from './Laptop';
import { SITE_REVEAL_START, SITE_REVEAL_STAGGER, SITE_SECTION_DURATION } from './heroTimings';

// Scala del mockup HTML rispetto al display 3D (distanceFactor di drei <Html transform>).
// Aumenta/diminuisci per far combaciare il mockup con la cornice dello schermo.
export const HTML_SCALE = 1.9;

// Dimensioni del mockup in px (proporzioni ≈ display 3.0 × 1.8)
const MOCK_W = 560;
const MOCK_H = 336;

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

const bar = (w: string, h: number, color: string, radius = 3): CSSProperties => ({
  width: w,
  height: h,
  background: color,
  borderRadius: radius,
});

export type SiteTexts = { title: string; sub: string; cta: string };

/**
 * Il "sito finito" che si compone sul display del laptop: un mockup HTML
 * reale (drei Html in transform mode) le cui sezioni appaiono in sequenza
 * (nav → hero → cards → footer) guidate dal progress di scroll.
 * Per usare uno screenshot vero al posto del mockup, sostituisci il
 * contenuto del div root con <img src="/mockups/sito.png" />.
 */
export default function SiteReveal({
  progressRef,
  texts,
}: {
  progressRef: MutableRefObject<number>;
  texts: SiteTexts;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useFrame(() => {
    const p = progressRef.current;
    const root = rootRef.current;
    if (!root) return;

    // Il mockup appare solo dopo il flash dello schermo
    root.style.opacity = String(smooth(SITE_REVEAL_START - 0.02, SITE_REVEAL_START + 0.04, p));

    // Sezioni in sequenza (stagger)
    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      const a = SITE_REVEAL_START + i * SITE_REVEAL_STAGGER;
      const k = smooth(a, a + SITE_SECTION_DURATION, p);
      el.style.opacity = String(k);
      el.style.transform = `translateY(${(1 - k) * 14}px)`;
    });
  });

  const setSection = (i: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[i] = el;
  };

  return (
    <group
      position={[DISPLAY_CENTER.x, DISPLAY_CENTER.y, DISPLAY_CENTER.z + 0.02]}
      rotation={[-LAPTOP_TILT, 0, 0]}
    >
      <Html transform distanceFactor={HTML_SCALE} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={rootRef}
          style={{
            width: MOCK_W,
            height: MOCK_H,
            background: '#F8F5F0',
            overflow: 'hidden',
            opacity: 0,
            fontFamily: 'var(--font-sans), sans-serif',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Nav */}
          <div
            ref={setSection(0)}
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              opacity: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9A7830' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1A1814' }}>
                Anti<span style={{ color: '#9A7830' }}>Gravity</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[28, 34, 24].map((w, i) => (
                <div key={i} style={bar(`${w}px`, 5, 'rgba(0,0,0,0.18)')} />
              ))}
            </div>
          </div>

          {/* Hero del mockup */}
          <div
            ref={setSection(1)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '12px 40px',
              gap: 8,
              opacity: 0,
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9A7830' }}>
              ✦ Web Agency
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1814', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {texts.title}
            </div>
            <div
              style={{
                fontSize: 9.5,
                color: '#5E5850',
                lineHeight: 1.5,
                maxWidth: 340,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {texts.sub}
            </div>
            <div
              style={{
                marginTop: 4,
                background: '#9A7830',
                color: '#F8F5F0',
                fontSize: 9,
                fontWeight: 700,
                padding: '5px 14px',
                borderRadius: 5,
              }}
            >
              {texts.cta}
            </div>
          </div>

          {/* Cards */}
          <div
            ref={setSection(2)}
            style={{ display: 'flex', gap: 10, padding: '0 18px 12px', opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: '#EFEAE3',
                  borderRadius: 6,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#C8A040' }} />
                <div style={bar('70%', 5, 'rgba(0,0,0,0.22)')} />
                <div style={bar('92%', 4, 'rgba(0,0,0,0.10)')} />
                <div style={bar('80%', 4, 'rgba(0,0,0,0.10)')} />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            ref={setSection(3)}
            style={{
              height: 26,
              background: '#1A1814',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
              opacity: 0,
            }}
          >
            <div style={bar('52px', 4, 'rgba(255,255,255,0.35)')} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={bar('18px', 4, 'rgba(255,255,255,0.2)')} />
              ))}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
