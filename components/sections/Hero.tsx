'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ArrowRight, Play } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden="true" />,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Hero() {
  const t = useTranslations('hero');
  const reduce = useReducedMotion();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
    >
      {/* Gradient glow di sfondo — accent verso trasparente, non arcobaleno */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — copy */}
          <motion.div
            variants={container}
            initial={reduce ? false : 'hidden'}
            animate="show"
            className="flex flex-col gap-6 lg:gap-8"
          >
            {/* Badge — solo uno, non eyebrow su ogni sezione */}
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                {t('badge')}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="text-display-lg font-bold text-text-primary text-balance leading-none"
            >
              {t('headline')}
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={item}
              className="text-lg text-text-secondary max-w-[52ch] text-pretty leading-relaxed"
            >
              {t('sub')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={item}
              className="flex flex-wrap gap-3"
            >
              <Button
                size="lg"
                onClick={() => scrollTo('contact')}
              >
                {t('cta1')}
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => scrollTo('portfolio')}
              >
                <Play size={16} weight="fill" aria-hidden="true" />
                {t('cta2')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — 3D scene */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[340px] lg:h-[520px]"
            aria-hidden="true"
          >
            <HeroScene />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-text-muted to-transparent" />
      </motion.div>
    </section>
  );
}
