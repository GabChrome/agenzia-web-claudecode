'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, Check } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';

type ContactFormData = { name: string; email: string; message: string };

const inputStyle = {
  width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
  borderRadius: '8px', padding: '12px 16px', color: 'var(--text-1)',
  fontFamily: 'var(--font-sans)', fontSize: '15px', outline: 'none', transition: 'all 200ms',
} as const;

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(154,120,48,0.55)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(154,120,48,0.10)';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'var(--border-subtle)';
  e.currentTarget.style.boxShadow = 'none';
};

export default function Contact() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const schema = useMemo(() => z.object({
    name:    z.string().min(2, t('form.errors.nameMin')),
    email:   z.string().email(t('form.errors.emailInvalid')),
    message: z.string().min(10, t('form.errors.messageMin')),
  }), [t]);

  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(data);
    setStatus('success');
  };

  return (
    <section id="contact" className="py-16 md:py-[120px]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <AnimatedSection className="mb-16">
          <p className="eyebrow" style={{ color: 'var(--accent)', marginBottom: '16px' }}>
            {t('headline')}
          </p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.1 }}>
            {t('sub')}
          </h2>
        </AnimatedSection>

        <div className="grid lg:grid-cols-[60%_40%] gap-16">
          <AnimatedSection delay={0.1}>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="name" className="eyebrow">{t('form.name')}</label>
                <input id="name" {...register('name')} placeholder={t('form.namePlaceholder')}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                {errors.name && <span style={{ color: 'var(--error)', fontSize: '13px' }}>{errors.name.message}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="email" className="eyebrow">{t('form.email')}</label>
                <input id="email" type="email" {...register('email')} placeholder={t('form.emailPlaceholder')}
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                {errors.email && <span style={{ color: 'var(--error)', fontSize: '13px' }}>{errors.email.message}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="message" className="eyebrow">{t('form.message')}</label>
                <textarea id="message" {...register('message')} placeholder={t('form.messagePlaceholder')}
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  onFocus={onFocus} onBlur={onBlur} />
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
                  padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                  cursor: status === 'idle' ? 'pointer' : 'not-allowed',
                  transition: 'all 200ms', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', opacity: status === 'loading' ? 0.7 : 1,
                }}
              >
                {status === 'loading' && <Loader2 size={18} className="animate-spin" />}
                {status === 'success' && <Check size={18} />}
                {status === 'success' ? t('form.success') : t('form.submit')}
              </button>

              {status === 'error' && (
                <span style={{ color: 'var(--error)', fontSize: '14px', textAlign: 'center' }}>
                  {t('form.error')}
                </span>
              )}
            </form>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div style={{
              background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="eyebrow" style={{ marginBottom: '4px' }}>{t('infoEmail')}</div>
                <div style={{ color: 'var(--text-1)', fontSize: '15px' }}>{t('info.email')}</div>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="eyebrow" style={{ marginBottom: '4px' }}>{t('infoLocation')}</div>
                <div style={{ color: 'var(--text-1)', fontSize: '15px' }}>{t('info.location')}</div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: '4px' }}>{t('infoHours')}</div>
                <div style={{ color: 'var(--text-1)', fontSize: '15px' }}>{t('info.hours')}</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
