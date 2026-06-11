'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from '@phosphor-icons/react';
import AnimatedSection from '@/components/ui/AnimatedSection';

// Avatar placeholder con seed unici
const AVATAR_SEEDS = ['giulia-ferretti', 'marco-benedetti', 'salvatore-amato', 'chiara-russo'];

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const reduce = useReducedMotion();

  const items = t.raw('items') as Array<{
    quote: string;
    name: string;
    role: string;
    company: string;
  }>;

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header — no eyebrow (sezione 5) */}
        <AnimatedSection className="max-w-lg mb-16">
          <h2 className="text-display-md font-bold text-text-primary text-balance">
            {t('headline')}
          </h2>
        </AnimatedSection>

        {/* Griglia 2×2 */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
          {items.map((item, i) => (
            <motion.blockquote
              key={item.name}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: (i % 2) * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-[#0F0F0F] rounded-2xl p-8 border border-[rgba(255,255,255,0.06)] flex flex-col gap-6"
            >
              {/* Stelle */}
              <div className="flex gap-1" aria-label="5 stelle su 5">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    size={16}
                    weight="fill"
                    className="text-accent"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Quote — max 3 righe, virgolette tipografiche */}
              <p className="text-text-primary leading-relaxed flex-1">
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Attribuzione */}
              <footer className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${AVATAR_SEEDS[i]}/80/80`}
                  alt={`${item.name}, ${item.role} presso ${item.company}`}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div>
                  <cite className="not-italic text-sm font-semibold text-text-primary block">
                    {item.name}
                  </cite>
                  <span className="text-xs text-text-muted">
                    {item.role}, {item.company}
                  </span>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
