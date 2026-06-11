'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Lightning, Palette, Headset } from '@phosphor-icons/react';
import AnimatedSection from '@/components/ui/AnimatedSection';

const FEATURES = [
  { key: 'speed', Icon: Lightning },
  { key: 'design', Icon: Palette },
  { key: 'support', Icon: Headset },
] as const;

export default function About() {
  const t = useTranslations('about');
  const reduce = useReducedMotion();

  return (
    <section id="about" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header — no eyebrow (sezione 2, policy: max 1 ogni 3) */}
        <AnimatedSection className="max-w-2xl mb-16 lg:mb-20">
          <h2 className="text-display-md font-bold text-text-primary mb-6 text-balance">
            {t('headline')}
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed text-pretty">
            {t('body')}
          </p>
        </AnimatedSection>

        {/* Feature cards — variazione di dimensione per non essere identiche */}
        <div className="grid md:grid-cols-3 gap-px bg-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          {FEATURES.map(({ key, Icon }, i) => (
            <motion.div
              key={key}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-surface p-8 lg:p-10 group hover:bg-surface-high transition-colors duration-200"
            >
              {/* Icon con sfondo accent muted */}
              <div className="w-11 h-11 rounded-xl bg-[rgba(108,99,255,0.12)] flex items-center justify-center mb-6 group-hover:bg-[rgba(108,99,255,0.2)] transition-colors duration-200">
                <Icon
                  size={22}
                  weight="bold"
                  className="text-accent"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                {t(`${key}.title`)}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {t(`${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
