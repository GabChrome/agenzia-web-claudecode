'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from '@phosphor-icons/react';
import AnimatedSection from '@/components/ui/AnimatedSection';

// Immagini placeholder con seed descrittivi (picsum)
const PROJECT_IMAGES = [
  'https://picsum.photos/seed/olio-meridiano-product/800/600',
  'https://picsum.photos/seed/studio-legale-desk/800/600',
  'https://picsum.photos/seed/fintech-startup-office/800/600',
  'https://picsum.photos/seed/artisans-market/800/600',
  'https://picsum.photos/seed/medical-clinic-dashboard/800/600',
  'https://picsum.photos/seed/rooftop-venue-rome/800/600',
];

export default function Portfolio() {
  const t = useTranslations('portfolio');
  const reduce = useReducedMotion();

  const projects = t.raw('projects') as Array<{
    name: string;
    desc: string;
    tags: string[];
  }>;

  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header con eyebrow — sezione 3, primo eyebrow consentito */}
        <AnimatedSection className="mb-16">
          <p className="text-xs font-medium text-accent uppercase tracking-[0.14em] mb-4">
            {t('headline')}
          </p>
          <h2 className="text-display-md font-bold text-text-primary text-balance">
            {t('sub')}
          </h2>
        </AnimatedSection>

        {/* Griglia 3×2 desktop */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {projects.map((project, i) => (
            <motion.article
              key={project.name}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: (i % 3) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative rounded-xl overflow-hidden bg-[#0F0F0F] aspect-[4/3] cursor-pointer"
            >
              {/* Immagine */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PROJECT_IMAGES[i]}
                alt={`${project.name} — ${project.desc}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Overlay su hover */}
              <div className="absolute inset-0 bg-[rgba(10,10,10,0)] group-hover:bg-[rgba(10,10,10,0.82)] transition-all duration-300 flex flex-col justify-end p-6">
                <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium text-accent bg-[rgba(108,99,255,0.18)] px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {project.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {t('viewProject')}
                    <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                  </span>
                </div>
              </div>

              {/* Border sottile visibile anche senza hover */}
              <div className="absolute inset-0 rounded-xl border border-[rgba(255,255,255,0.06)] pointer-events-none" aria-hidden="true" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
