'use client';

import dynamic from 'next/dynamic';

// L'esperienza 3D scroll-driven è interamente client-side (niente SSR):
// orchestrazione, soglie e timing in components/3d/HeroExperience.tsx
// e components/3d/heroTimings.ts
const HeroExperience = dynamic(() => import('@/components/3d/HeroExperience'), {
  ssr: false,
  loading: () => (
    <section id="hero" className="min-h-[100dvh]" style={{ background: 'var(--dark-bg)' }} />
  ),
});

export default function Hero() {
  return <HeroExperience />;
}
