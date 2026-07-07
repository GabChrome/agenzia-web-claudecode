'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'ag-reports-access';
// NOTA: con l'export statico la password vive nel bundle client — è un filtro
// d'accesso leggero per uso interno, non una protezione di sicurezza reale.
const PASSWORD = process.env.NEXT_PUBLIC_REPORTS_PASSWORD ?? 'antigravity';

export function logoutReports() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  window.location.reload();
}

/**
 * Gate d'accesso per l'area report: chiede una password (condivisibile con
 * i clienti che ne fanno richiesta) e ricorda l'accesso per la sessione.
 * Il contenuto viene renderizzato solo lato client, dopo la verifica.
 */
export default function AccessGate({ children }: { children: ReactNode }) {
  const t = useTranslations('reports.login');
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let unlocked = false;
    try {
      unlocked = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {}
    setState(unlocked ? 'open' : 'locked');
  }, []);

  if (state === 'open') return <>{children}</>;

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="eyebrow animate-pulse">Anti Gravity</span>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {}
      setState('open');
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="border-gradient w-full max-w-sm rounded-2xl p-8 animate-fade-in">
        <div className="eyebrow">Anti Gravity</div>
        <h1 className="mt-2 font-serif text-3xl text-text-1">{t('title')}</h1>
        <p className="mt-2 text-sm text-text-2">{t('desc')}</p>
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="reports-password" className="block text-sm font-semibold text-text-1">
            {t('password')}
          </label>
          <input
            id="reports-password"
            type="password"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            className="mt-1.5 w-full rounded-lg border border-border-default bg-bg px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-accent"
            aria-invalid={error}
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-error">
              {t('error')}
            </p>
          )}
          <button
            type="submit"
            className="btn-glow mt-4 w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            {t('submit')}
          </button>
        </form>
        <p className="mt-4 text-xs text-text-3">{t('note')}</p>
      </div>
    </div>
  );
}
