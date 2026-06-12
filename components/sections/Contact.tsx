'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Check } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';

const contactSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  email: z.string().email("Inserisci un'email valida"),
  message: z.string().min(10, "Il messaggio deve avere almeno 10 caratteri"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading');
    // Simula chiamata di rete
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(data);
    setStatus('success');
  };

  return (
    <section id="contact" style={{ padding: '120px 0' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <AnimatedSection className="mb-16">
          <p className="eyebrow" style={{ color: 'var(--accent)', marginBottom: '16px' }}>
            {t('headline')}
          </p>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            color: 'var(--text-1)',
            lineHeight: 1.1
          }}>
            {t('sub')}
          </h2>
        </AnimatedSection>

        <div className="grid lg:grid-cols-[60%_40%] gap-16">
          <AnimatedSection delay={0.1}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="name" className="eyebrow">Nome</label>
                <input
                  id="name"
                  {...register('name')}
                  placeholder="Il tuo nome"
                  style={{
                    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '12px 16px', color: 'var(--text-1)',
                    fontFamily: 'var(--font-sans)', fontSize: '15px', outline: 'none', transition: 'all 200ms'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(154,120,48,0.55)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(154,120,48,0.10)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {errors.name && <span style={{ color: 'var(--error)', fontSize: '13px' }}>{errors.name.message}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="email" className="eyebrow">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="tua@email.it"
                  style={{
                    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '12px 16px', color: 'var(--text-1)',
                    fontFamily: 'var(--font-sans)', fontSize: '15px', outline: 'none', transition: 'all 200ms'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(154,120,48,0.55)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(154,120,48,0.10)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {errors.email && <span style={{ color: 'var(--error)', fontSize: '13px' }}>{errors.email.message}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="message" className="eyebrow">Messaggio</label>
                <textarea
                  id="message"
                  {...register('message')}
                  placeholder="Parlami del tuo progetto..."
                  style={{
                    width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '12px 16px', color: 'var(--text-1)', minHeight: '120px', resize: 'vertical',
                    fontFamily: 'var(--font-sans)', fontSize: '15px', outline: 'none', transition: 'all 200ms'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(154,120,48,0.55)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(154,120,48,0.10)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {errors.message && <span style={{ color: 'var(--error)', fontSize: '13px' }}>{errors.message.message}</span>}
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={status === 'idle' ? 'btn-glow' : ''}
                style={{
                  width: '100%',
                  background: status === 'success' ? 'rgba(74,222,128,0.1)' : 'var(--accent)',
                  border: status === 'success' ? '1px solid rgba(74,222,128,0.3)' : 'none',
                  color: status === 'success' ? 'var(--success)' : '#F8F5F0',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: status === 'idle' ? 'pointer' : 'not-allowed',
                  transition: 'all 200ms',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: status === 'loading' ? 0.7 : 1
                }}
              >
                {status === 'loading' && <Loader2 size={18} className="animate-spin" />}
                {status === 'success' && <Check size={18} />}
                {status === 'success' ? t('form.success') : t('form.submit')}
              </button>
              {status === 'error' && <span style={{ color: 'var(--error)', fontSize: '14px', textAlign: 'center' }}>Si è verificato un errore, riprova.</span>}
            </form>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="eyebrow" style={{ marginBottom: '4px' }}>Email</div>
                <div style={{ color: 'var(--text-1)', fontSize: '15px' }}>{t('info.email')}</div>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="eyebrow" style={{ marginBottom: '4px' }}>Location</div>
                <div style={{ color: 'var(--text-1)', fontSize: '15px' }}>{t('info.location')}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: '4px' }}>Hours</div>
                <div style={{ color: 'var(--text-1)', fontSize: '15px' }}>{t('info.hours')}</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
