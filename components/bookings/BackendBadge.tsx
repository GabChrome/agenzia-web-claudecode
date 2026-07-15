'use client';

import { useTranslations } from 'next-intl';
import { BackendMode } from '@/lib/bookings';

/**
 * Mostra se la pagina sta parlando col backend reale (Worker su Cloudflare)
 * o se è in modalità demo con dati salvati solo nel browser. Utile in fase
 * di test per capire subito dove finiscono i dati.
 */
export default function BackendBadge({ mode }: { mode: BackendMode | null }) {
  const t = useTranslations('booking.mode');

  if (mode === null) {
    return (
      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border-subtle px-3.5 py-1.5 text-xs font-semibold text-text-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-border-strong" aria-hidden="true" />
        {t('checking')}
      </p>
    );
  }

  const remote = mode === 'remote';
  return (
    <p
      className="mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
      style={{
        borderColor: remote ? 'rgba(74,222,128,0.35)' : 'rgba(154,120,48,0.4)',
        color: remote ? 'var(--success)' : 'var(--accent)',
        background: remote ? 'rgba(74,222,128,0.07)' : 'rgba(154,120,48,0.07)',
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: remote ? 'var(--success)' : 'var(--accent)' }}
        aria-hidden="true"
      />
      {remote ? t('remote') : t('demo')}
    </p>
  );
}
