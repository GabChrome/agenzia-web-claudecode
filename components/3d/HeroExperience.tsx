'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronDown, Play } from 'lucide-react';
import Laptop from './Laptop';
import FloatingElements from './FloatingElements';
import SiteReveal from './SiteReveal';
import Loader from './Loader';
import { SceneFallback } from './SceneLoader';
import { usePrefersReducedMotion, useIsMobile, useWebGLSupport } from './hooks';
import {
  SECTION_HEIGHT_VH,
  SECTION_HEIGHT_VH_MOBILE,
  TEXT_FADE_START,
  TEXT_FADE_END,
  CTA_IN_START,
  ELEMENT_COUNT_DESKTOP,
  ELEMENT_COUNT_MOBILE,
  LAPTOP_SCALE,
  LAPTOP_Y,
  LAPTOP_SCALE_MOBILE,
  LAPTOP_Y_MOBILE,
} from './heroTimings';

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

/**
 * Orchestratore della hero scroll-driven:
 * - sezione alta SECTION_HEIGHT_VH con contenuto sticky a tutto schermo
 *   (il "pin"): lo scroll in eccesso alimenta il progress 0 → 1
 * - il progress vive in un ref e guida scena 3D (via useFrame nei figli)
 *   e overlay DOM (qui, nello scroll handler) senza re-render React
 * - al termine la sezione si "rilascia" da sola: finita l'altezza extra,
 *   lo scroll prosegue normalmente verso il resto del sito, con un
 *   crossfade in fondo verso lo sfondo chiaro della sezione successiva
 */
export default function HeroExperience() {
  const t = useTranslations('hero');
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const webgl = useWebGLSupport();

  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const textRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // prefers-reduced-motion o WebGL assente → stato finale statico, niente pin
  const staticMode = reduced || webgl === false;

  useEffect(() => {
    if (staticMode) {
      progressRef.current = 1;
      if (textRef.current) textRef.current.style.opacity = '1';
      if (hintRef.current) hintRef.current.style.opacity = '0';
      if (ctaRef.current) {
        ctaRef.current.style.opacity = '1';
        ctaRef.current.style.pointerEvents = 'auto';
      }
      return;
    }

    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? clamp(-el.getBoundingClientRect().top / total, 0, 1) : 1;
      progressRef.current = p;

      if (textRef.current) {
        textRef.current.style.opacity = String(1 - smooth(TEXT_FADE_START, TEXT_FADE_END, p));
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(1 - smooth(0.01, 0.06, p));
      }
      if (ctaRef.current) {
        const o = smooth(CTA_IN_START, CTA_IN_START + 0.06, p);
        ctaRef.current.style.opacity = String(o);
        ctaRef.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [staticMode]);

  const heightVh = staticMode ? 100 : isMobile ? SECTION_HEIGHT_VH_MOBILE : SECTION_HEIGHT_VH;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Testi del mockup che si compone sul display (il contesto next-intl
  // non attraversa il renderer di R3F: vanno passati come props)
  const siteTexts = {
    title: `${t('headlineEm')} ${t('headlineStrong')}`,
    sub: t('sub'),
    cta: t('cta1'),
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{ height: `${heightVh}vh`, position: 'relative', background: 'var(--dark-bg)' }}
    >
      {/* Contenuto pinnato: resta a schermo finché lo scroll alimenta l'animazione */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {webgl === false ? (
          <SceneFallback />
        ) : (
          <Canvas
            camera={{ position: [0, 1.05, 5.2], fov: 40 }}
            onCreated={({ camera }) => camera.lookAt(0, 0.2, 0)}
            dpr={[1, 1.5]}
            frameloop={staticMode ? 'demand' : 'always'}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <color attach="background" args={['#0E0D0B']} />
            <fog attach="fog" args={['#0E0D0B', 8, 15]} />

            <ambientLight intensity={0.5} color="#F5E8C0" />
            <directionalLight position={[3, 5, 4]} intensity={1.0} color="#FFF4D8" />
            <pointLight position={[-4, 1.5, 2]} intensity={0.45} color="#C8A040" />

            <Suspense fallback={null}>
              <group
                scale={isMobile ? LAPTOP_SCALE_MOBILE : LAPTOP_SCALE}
                position={[0, isMobile ? LAPTOP_Y_MOBILE : LAPTOP_Y, 0]}
              >
                <Laptop progressRef={progressRef} />
                <SiteReveal progressRef={progressRef} texts={siteTexts} />
              </group>
              {!staticMode && (
                <FloatingElements
                  progressRef={progressRef}
                  count={isMobile ? ELEMENT_COUNT_MOBILE : ELEMENT_COUNT_DESKTOP}
                  laptopScale={isMobile ? LAPTOP_SCALE_MOBILE : LAPTOP_SCALE}
                  laptopY={isMobile ? LAPTOP_Y_MOBILE : LAPTOP_Y}
                />
              )}
              {!isMobile && (
                <EffectComposer multisampling={0}>
                  <Bloom luminanceThreshold={0.9} intensity={0.7} mipmapBlur />
                </EffectComposer>
              )}
            </Suspense>
          </Canvas>
        )}

        <Loader />

        {/* Overlay testo — fase 1, svanisce all'inizio della convergenza */}
        <div
          ref={textRef}
          className="absolute inset-x-0 top-0 z-10 flex flex-col items-center text-center px-6"
          style={{
            paddingTop: '13vh',
            paddingBottom: '10vh',
            pointerEvents: 'none',
            // scrim per la leggibilità del testo sopra la scena
            background: 'radial-gradient(ellipse 65% 100% at 50% 20%, rgba(10,9,8,0.62) 0%, transparent 72%)',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(200,160,64,0.35)',
            background: 'rgba(200,160,64,0.10)',
            borderRadius: 999, padding: '5px 14px',
            fontSize: 12, color: 'var(--dark-text-2)', marginBottom: 20,
          }}>
            <span style={{ color: 'var(--accent-bright)' }}>✦</span>
            {t('badge')}
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 60px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--dark-text-1)' }}>
            <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>
              {t('headlineEm')}{' '}
            </em>
            <span style={{ fontWeight: 800 }}>{t('headlineStrong')}</span>
          </h1>
          <p style={{ color: 'var(--dark-text-2)', maxWidth: '520px', fontSize: '15px', lineHeight: 1.7, marginTop: '14px' }}>
            {t('sub')}
          </p>
        </div>

        {/* Hint di scroll */}
        <div
          ref={hintRef}
          className="absolute bottom-6 inset-x-0 z-10 flex flex-col items-center gap-1"
          style={{ color: 'var(--dark-text-3)', fontSize: 12, pointerEvents: 'none' }}
        >
          {t('scrollHint')}
          <ChevronDown size={16} className="animate-bounce" style={{ color: 'var(--accent-bright)' }} />
        </div>

        {/* CTA finali — appaiono a sito composto */}
        <div
          ref={ctaRef}
          className="absolute inset-x-0 z-20 flex flex-col sm:flex-row items-center justify-center gap-3 px-6"
          style={{ bottom: '9vh', opacity: 0, pointerEvents: 'none' }}
        >
          <button
            onClick={() => scrollTo('contact')}
            className="btn-glow w-full sm:w-auto"
            style={{
              background: 'var(--accent-bright)', color: '#14120E',
              padding: '13px 26px', borderRadius: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', fontSize: '15px', transition: 'all 200ms ease',
            }}
          >
            {t('cta1')}
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => scrollTo('portfolio')}
            className="w-full sm:w-auto"
            style={{
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              color: 'var(--dark-text-2)',
              padding: '13px 26px', borderRadius: '10px', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', fontSize: '15px', transition: 'all 200ms ease',
            }}
          >
            <Play size={16} fill="currentColor" />
            {t('cta2')}
          </button>
        </div>
      </div>

      {/* Crossfade di rilascio verso lo sfondo chiaro della sezione successiva */}
      {!staticMode && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '10vh',
            background: 'linear-gradient(to bottom, transparent, var(--bg) 95%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </section>
  );
}
