'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';

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
  const projects = t.raw('projects') as Array<{
    name: string;
    desc: string;
    tags: string[];
    category: string;
  }>;

  // Estraiamo tutti i tag univoci dai progetti
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags)));
  // Prendiamo i 4 tag più frequenti o usiamo una lista fissa se preferito. 
  // Per ora usiamo tutti i tag univoci se sono pochi, altrimenti i primi 4.
  const filters = ['Tutti', ...allTags.slice(0, 4)];
  const [activeFilter, setActiveFilter] = useState('Tutti');

  const filteredProjects = activeFilter === 'Tutti' 
    ? projects 
    : projects.filter(p => p.tags.includes(activeFilter));

  return (
    <section id="portfolio" style={{ padding: '120px 0', background: 'var(--surface-1)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <AnimatedSection className="mb-12">
          <p className="eyebrow" style={{ marginBottom: '16px', color: 'var(--accent)' }}>
            {t('headline')}
          </p>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-1)',
            lineHeight: 1.1,
            marginBottom: '40px'
          }}>
            {t('sub')}
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
            {filters.map(filter => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    background: isActive ? 'rgba(154,120,48,0.10)' : 'var(--surface-1)',
                    border: isActive ? '1px solid rgba(154,120,48,0.40)' : '1px solid var(--border-subtle)',
                    color: isActive ? 'var(--accent)' : 'var(--text-3)',
                    borderRadius: '999px',
                    padding: '6px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease'
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </AnimatedSection>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, i) => (
              <motion.article
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={project.name}
                className="group relative overflow-hidden bg-[var(--surface-1)] cursor-pointer"
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  aspectRatio: '16/9'
                }}
              >
                <Image
                  src={PROJECT_IMAGES[i % PROJECT_IMAGES.length]}
                  alt={`${project.name} — ${project.desc}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 transition-all duration-300 flex flex-col justify-end p-6"
                     style={{
                       background: 'rgba(26,24,20,0)',
                     }}
                >
                  <div className="absolute inset-0 bg-[rgba(20,18,14,0.90)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 flex flex-col justify-end h-full">
                    <div className="flex flex-wrap gap-[6px] mb-3">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: 'rgba(154,120,48,0.18)',
                            border: '1px solid rgba(154,120,48,0.40)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--accent)',
                            padding: '3px 8px',
                            fontWeight: 600
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 style={{ color: 'var(--text-1)', fontSize: '18px', fontWeight: 600, marginTop: '10px' }}>
                      {project.name}
                    </h3>
                    <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
                      {project.desc}
                    </p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      color: 'var(--accent)', fontSize: '13px', fontWeight: 600, marginTop: '12px'
                    }}>
                      {t('viewProject')}
                      <ArrowUpRight size={16} strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
