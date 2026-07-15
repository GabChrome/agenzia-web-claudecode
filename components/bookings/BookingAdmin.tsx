'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, RefreshCw, Check, X, ArrowLeft, UserX } from 'lucide-react';
import {
  AdminBooking,
  BookingApiError,
  BookingClient,
  BookingStatus,
  createBookingClient,
  detectBackend,
} from '@/lib/bookings';
import BackendBadge from './BackendBadge';

const TOKEN_STORAGE = 'ag-bookings-admin-jwt';

const statusStyle: Record<BookingStatus, { color: string; bg: string }> = {
  confirmed: { color: 'var(--success)', bg: 'rgba(74,222,128,0.10)' },
  completed: { color: 'var(--accent)', bg: 'rgba(154,120,48,0.10)' },
  no_show: { color: '#c2660a', bg: 'rgba(194,102,10,0.10)' },
  cancelled: { color: 'var(--error)', bg: 'rgba(220,80,80,0.10)' },
};

/**
 * Pannello di gestione prenotazioni, collegato al backend
 * WebAgency_BookingSystem: login con email e password dell'account admin
 * del tenant (JWT), elenco filtrabile e cambio stato
 * (confermata / completata / no-show / annullata).
 */
export default function BookingAdmin() {
  const t = useTranslations('booking.admin');
  const locale = useLocale();

  const [client, setClient] = useState<BookingClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gateError, setGateError] = useState(false);
  const [checking, setChecking] = useState(false);

  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | BookingStatus>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    detectBackend().then((mode) => setClient(createBookingClient(mode)));
    try {
      const saved = sessionStorage.getItem(TOKEN_STORAGE);
      if (saved) setToken(saved);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE);
    } catch {}
    setToken(null);
    setPassword('');
    setBookings(null);
  }, []);

  const load = useCallback(async () => {
    if (!client || !token) return;
    setBookings(null);
    setLoadError(false);
    try {
      const list = await client.adminList(token, {
        date: filterDate || undefined,
        status: filterStatus || undefined,
      });
      setBookings(list);
    } catch (err) {
      if (err instanceof BookingApiError && err.status === 401) {
        // Token scaduto o non valido: torna al login
        logout();
        setGateError(true);
      } else {
        setLoadError(true);
        setBookings([]);
      }
    }
  }, [client, token, filterDate, filterStatus, logout]);

  useEffect(() => {
    load();
  }, [load]);

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!client || !email || !password) return;
    setChecking(true);
    setGateError(false);
    try {
      const jwt = await client.adminLogin(email, password);
      try {
        sessionStorage.setItem(TOKEN_STORAGE, jwt);
      } catch {}
      setToken(jwt);
    } catch {
      setGateError(true);
    } finally {
      setChecking(false);
    }
  };

  const changeStatus = async (id: string, status: BookingStatus) => {
    if (!client || !token) return;
    setBusyId(id);
    try {
      const updated = await client.adminSetStatus(token, id, status);
      setBookings((list) => (list ?? []).map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      if (err instanceof BookingApiError && err.status === 401) {
        logout();
        setGateError(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setBusyId(null);
    }
  };

  /* ------------------------------------------------------------------ gate --- */

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="border-gradient w-full max-w-sm rounded-2xl p-8 animate-fade-in">
          <div className="eyebrow">Anti Gravity</div>
          <h1 className="mt-2 font-serif text-3xl text-text-1">{t('gateTitle')}</h1>
          <p className="mt-2 text-sm text-text-2">{t('gateDesc')}</p>
          <BackendBadge mode={client?.mode ?? null} />
          <form onSubmit={submitLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-text-1">
                {t('gateEmail')}
              </label>
              <input
                id="admin-email"
                type="email"
                autoFocus
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setGateError(false);
                }}
                className="mt-1.5 w-full rounded-lg border border-border-default bg-bg px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-text-1">
                {t('gatePassword')}
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setGateError(false);
                }}
                className="mt-1.5 w-full rounded-lg border border-border-default bg-bg px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-accent"
                aria-invalid={gateError}
              />
            </div>
            {gateError && (
              <p role="alert" className="text-sm" style={{ color: 'var(--error)' }}>
                {t('gateError')}
              </p>
            )}
            <button
              type="submit"
              disabled={checking || !client}
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {checking && <Loader2 size={15} className="animate-spin" />}
              {t('gateSubmit')}
            </button>
          </form>
          <p className="mt-4 text-xs text-text-3">
            {client?.mode === 'demo' ? t('gateNoteDemo') : t('gateNote')}
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- dashboard --- */

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/prenotazioni/`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-3 transition-colors hover:text-text-1"
          >
            <ArrowLeft size={15} /> {t('backToBooking')}
          </Link>
          <div className="eyebrow mt-4">Anti Gravity</div>
          <h1 className="mt-1 font-serif text-display-sm text-text-1">{t('title')}</h1>
          <p className="mt-2 max-w-xl text-text-2">{t('subtitle')}</p>
          <BackendBadge mode={client?.mode ?? null} />
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          {t('logout')}
        </button>
      </header>

      <div className="gold-divider mt-6" />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-date" className="block text-xs font-semibold text-text-3">
            {t('filterDate')}
          </label>
          <input
            id="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="mt-1 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-1 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="filter-status" className="block text-xs font-semibold text-text-3">
            {t('filterStatus')}
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as '' | BookingStatus)}
            className="mt-1 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-1 outline-none focus:border-accent"
          >
            <option value="">{t('statusAll')}</option>
            <option value="confirmed">{t('status.confirmed')}</option>
            <option value="completed">{t('status.completed')}</option>
            <option value="no_show">{t('status.no_show')}</option>
            <option value="cancelled">{t('status.cancelled')}</option>
          </select>
        </div>
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-3 transition-colors hover:text-text-1"
          >
            {t('clearDate')}
          </button>
        )}
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-2 transition-colors hover:text-text-1"
        >
          <RefreshCw size={14} /> {t('refresh')}
        </button>
      </div>

      {loadError && (
        <p role="alert" className="mt-4 text-sm font-semibold" style={{ color: 'var(--error)' }}>
          {t('loadError')}
        </p>
      )}

      {bookings === null ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-text-3">
          <Loader2 size={15} className="animate-spin" /> {t('loading')}
        </p>
      ) : bookings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border-subtle bg-surface-1 p-10 text-center text-text-3">
          {t('empty')}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-text-3">{t('count', { count: bookings.length })}</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border-subtle bg-surface-1">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-3">
                  <th className="px-4 py-3 font-semibold">{t('col.when')}</th>
                  <th className="px-4 py-3 font-semibold">{t('col.service')}</th>
                  <th className="px-4 py-3 font-semibold">{t('col.client')}</th>
                  <th className="px-4 py-3 font-semibold">{t('col.notes')}</th>
                  <th className="px-4 py-3 font-semibold">{t('col.status')}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t('col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const busy = busyId === b.id;
                  const s = statusStyle[b.status] ?? statusStyle.confirmed;
                  return (
                    <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-text-1">
                        {b.date} · {b.time}
                        <span className="ml-1 text-xs font-normal text-text-3">({b.durationMin} min)</span>
                      </td>
                      <td className="px-4 py-3 text-text-2">{b.service?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-1">{b.customer.name}</div>
                        <div className="text-xs text-text-3">
                          {b.customer.email}
                          {b.customer.phone && ` · ${b.customer.phone}`}
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-xs text-text-3">
                        <span className="line-clamp-2">{b.customer.notes || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ color: s.color, background: s.bg }}
                        >
                          {t(`status.${b.status}`)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {busy ? (
                          <Loader2 size={15} className="ml-auto animate-spin text-text-3" />
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            {b.status !== 'completed' && (
                              <button
                                onClick={() => changeStatus(b.id, 'completed')}
                                title={t('actionComplete')}
                                className="rounded-md border border-border-subtle p-1.5 transition-colors hover:border-border-default"
                                style={{ color: 'var(--success)' }}
                              >
                                <Check size={14} />
                              </button>
                            )}
                            {b.status !== 'no_show' && (
                              <button
                                onClick={() => changeStatus(b.id, 'no_show')}
                                title={t('actionNoShow')}
                                className="rounded-md border border-border-subtle p-1.5 transition-colors hover:border-border-default"
                                style={{ color: '#c2660a' }}
                              >
                                <UserX size={14} />
                              </button>
                            )}
                            {b.status !== 'cancelled' && (
                              <button
                                onClick={() => changeStatus(b.id, 'cancelled')}
                                title={t('actionCancel')}
                                className="rounded-md border border-border-subtle p-1.5 transition-colors hover:border-border-default"
                                style={{ color: 'var(--error)' }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
