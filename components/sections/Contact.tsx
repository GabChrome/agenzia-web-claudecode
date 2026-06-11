'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { EnvelopeSimple, MapPin, Clock } from '@phosphor-icons/react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Button from '@/components/ui/Button';

// Schema di validazione
const getContactSchema = (t: ReturnType<typeof useTranslations<'contact'>>) =>
  z.object({
    name: z.string().min(1, { message: t('form.errors.nameRequired') }),
    email: z.string().email({ message: t('form.errors.emailInvalid') }),
    projectType: z.string(),
    message: z.string().min(10, { message: t('form.errors.messageMin') }),
  });

type ContactFormData = z.infer<ReturnType<typeof getContactSchema>>;

export default function Contact() {
  const t = useTranslations('contact');
  const [isSuccess, setIsSuccess] = useState(false);
  const reduce = useReducedMotion();

  const formSchema = getContactSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: t.raw('form.projectTypes')[0],
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    // Simula invio form
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Form data:', data);
    setIsSuccess(true);
    reset();
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header con eyebrow — sezione 6, secondo eyebrow consentito */}
        <AnimatedSection className="mb-16">
          <p className="text-xs font-medium text-accent uppercase tracking-[0.14em] mb-4">
            {t('headline')}
          </p>
          <h2 className="text-display-md font-bold text-text-primary text-balance">
            {t('sub')}
          </h2>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Form */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
              {/* Nome */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-text-primary">
                  {t('form.name')}
                </label>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  placeholder={t('form.namePlaceholder')}
                  className={`bg-surface border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent transition-colors ${
                    errors.name ? 'border-error' : 'border-[rgba(255,255,255,0.08)]'
                  }`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-error" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-text-primary">
                  {t('form.email')}
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder={t('form.emailPlaceholder')}
                  className={`bg-surface border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent transition-colors ${
                    errors.email ? 'border-error' : 'border-[rgba(255,255,255,0.08)]'
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-error" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Tipo Progetto */}
              <div className="flex flex-col gap-2">
                <label htmlFor="projectType" className="text-sm font-medium text-text-primary">
                  {t('form.projectType')}
                </label>
                <div className="relative">
                  <select
                    {...register('projectType')}
                    id="projectType"
                    className="w-full appearance-none bg-surface border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent transition-colors"
                  >
                    {(t.raw('form.projectTypes') as string[]).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {/* Custom select arrow */}
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Messaggio */}
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-text-primary">
                  {t('form.message')}
                </label>
                <textarea
                  {...register('message')}
                  id="message"
                  rows={4}
                  placeholder={t('form.messagePlaceholder')}
                  className={`bg-surface border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent transition-colors resize-y min-h-[120px] ${
                    errors.message ? 'border-error' : 'border-[rgba(255,255,255,0.08)]'
                  }`}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="text-sm text-error" role="alert">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button type="submit" loading={isSubmitting} className="mt-2 w-full sm:w-auto self-start">
                {isSubmitting ? t('form.submitting') : t('form.submit')}
              </Button>

              {/* Success message */}
              {isSuccess && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-success bg-success/10 border border-success/20 rounded-lg p-3"
                  role="status"
                >
                  {t('form.success')}
                </motion.p>
              )}
            </form>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-10"
          >
            {/* Contatti diretti */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-6">Contatti diretti</h3>
              <ul className="flex flex-col gap-6" role="list">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <EnvelopeSimple size={20} className="text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block text-sm text-text-secondary mb-1">Email</span>
                    <a href={`mailto:${t('info.email')}`} className="text-text-primary hover:text-accent transition-colors font-medium">
                      {t('info.email')}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block text-sm text-text-secondary mb-1">Orari</span>
                    <span className="text-text-primary font-medium">{t('info.hours')}</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block text-sm text-text-secondary mb-1">Sede</span>
                    <span className="text-text-primary font-medium">{t('info.location')}</span>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Decorative element o mappa */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-surface border border-[rgba(255,255,255,0.06)] mt-auto hidden lg:block">
               {/* Simula una mappa scura o pattern */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 rounded-full bg-accent"></div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
