'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from '@phosphor-icons/react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Button from '@/components/ui/Button';

export default function Pricing() {
  const t = useTranslations('pricing');
  const reduce = useReducedMotion();

  const plans = t.raw('plans') as Array<{
    name: string;
    price: string;
    desc: string;
    features: string[];
  }>;

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header — no eyebrow (sezione 4) */}
        <AnimatedSection className="max-w-xl mb-16 lg:mb-20">
          <h2 className="text-display-md font-bold text-text-primary mb-4 text-balance">
            {t('headline')}
          </h2>
          <p className="text-lg text-text-secondary text-pretty">
            {t('sub')}
          </p>
        </AnimatedSection>

        {/* Piani */}
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          {plans.map((plan, i) => {
            const isPro = i === 1;
            return (
              <motion.div
                key={plan.name}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`relative flex flex-col rounded-2xl p-8 ${
                  isPro
                    ? 'bg-surface-high border border-accent/40'
                    : 'bg-surface border border-[rgba(255,255,255,0.06)]'
                }`}
              >
                {/* Badge "Più scelto" solo sul Pro */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold text-white bg-accent px-3 py-1 rounded-full">
                      {t('popular')}
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-base font-semibold text-text-primary mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className={`text-4xl font-bold ${
                        isPro ? 'text-accent' : 'text-text-primary'
                      }`}
                    >
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {plan.desc}
                  </p>
                </div>

                <ul className="flex flex-col gap-3 flex-1 mb-8" role="list">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm">
                      <Check
                        size={16}
                        weight="bold"
                        className="text-accent mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-text-secondary">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isPro ? 'primary' : 'secondary'}
                  className="w-full justify-center"
                  onClick={scrollToContact}
                >
                  {t('cta')}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
