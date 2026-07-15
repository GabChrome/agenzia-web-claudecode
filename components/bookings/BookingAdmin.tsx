'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, RefreshCw, Trash2, Check, X, ArrowLeft } from 'lucide-react';
import {
  Booking,
  BookingApiError,
  BookingClient,
  BookingStatus,
  createBookingClient,
  detectBackend,
} from '@/lib/bookings';
import BackendBadge from './BackendBadge';

const KEY_STORAGE = 'ag-bookings-admin-key';

const statusStyle: Record<BookingStatus, { color: string; bg: string }> = {
  pending: { color: 'var(--accent)', bg: 'rgba(154,120,48,0.10)' },
  confirmed: { color: 'var(--success)', bg: 'rgba(74,222,128,0.10)' },
  cancelled: { color: 'var(--error)', bg: 'rgba(220,80,80,0.10)' },
};

/**
 * Pannello di gestione prenotazioni: elenca, conferma, annulla ed elimina.
 * L'accesso richiede la chiave admin (BOOKINGS_ADMIN_KEY sul Worker,
 * default "antigravity"), inviata come Bearer token a ogni richiesta.
 */
export default function BookingAdmin() {
  const t = useTranslations('booking.admin');
  const tb = useTranslations('booking');
  const locale = useLocale();

  const [client, setClient] = useState<BookingClient | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [gateError, setGateError] = useState(false);
  const [checkingKey, setCheckingKey] = useState(false);

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | BookingStatus>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    detectBackend().then((mode) => setClient(createBookingClient(mode)));
    try {
      const saved = sessionStorage.getItem(KEY_STORAGE);
      if (saved) setAdminKey(saved);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    if (!client || !adminKey) return;
    setBookings(null);
    setLoadError(false);
    try {
      const list = await client.list(adminKey, {
        date: filterDate || undefined,
        status: filterStatus || undefined,
      });
      setBookings(list);
    } catch (err) {
      if (err instanceof BookingApiError && err.status === 401) {
        // Chiave non più valida: torna al gate
        try {
          sessionStorage.removeItem(KEY_STORAGE);
        } catch {}
        setAdminKey(null);
        setGateError(true);
      } else {
        setLoadError(true);
        setBookings([]);
      }
    }
  }, [client, adminKey, filterDate, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const submitKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!client || !keyInput) return;
    setCheckingKey(true);
    setGateError(false);
    try {
      await client.list(keyInput);
      try {
        sessionStorage.setItem(KEY_STORAGE, keyInput);
      } catch {}
      setAdminKey(keyInput);
    } catch {
      setGateError(true);
    } finally {
      setCheckingKey(false);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(KEY_STORAGE);
    } catch {}
    setAdminKey(null);
    setKeyInput('');
    setBookings(null);
  };

  const changeStatus = async (id: string, status: BookingStatus) => {
    if (!client || !adminKey) return;
    setBusyId(id);
    try {
      const updated = await client.setStatus(adminKey, id, status);
      setBookings((list) => (list ?? []).map((b) => (b.id === id ? updated : b)));
    } catch {
      setLoadError(true);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!client || !adminKey) return;
    if (!window.confirm(t('confirmDelete'))) return;
    setBusyId(id);
    try {
      await client.remove(adminKey, id);
      setBookings((list) => (list ?? []).filter((b) => b.id !== id));
    } catch {
      setLoadError(true);
    } finally {
      setBusyId(null);
    }
  };

  /* ------------------------------------------------------------------ gate --- */

  if (!adminKey) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="border-gradient w-full max-w-sm rounded-2xl p-8 animate-fade-in">
          <div className="eyebrow">Anti Gravity</div>
          <h1 className="mt-2 font-serif text-3xl text-text-1">{t('gateTitle')}</h1>
          <p className="mt-2 text-sm text-text-2">{t('gateDesc')}</p>
          <BackendBadge mode={client?.mode ?? null} />
          <form onSubmit={submitKey} className="mt-6">
            <label htmlFor="admin-key" className="block text-sm font-semibold text-text-1">
              {t('gateKey')}
            </label>
            <input
              id="admin-key"
              type="password"
              autoFocus
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setGateError(false);
              }}
              className="mt-1.5 w-full rounded-lg border border-border-default bg-bg px-3.5 py-2.5 text-text-1 outline-none transition-colors focus:border-accent"
              aria-invalid={gateError}
            />
            {gateError && (
              <p role="alert" className="mt-2 text-sm" style={{ color: 'var(--error)' }}>
                {t('gateError')}
              </p>
            )}
            <button
              type="submit"
              disabled={checkingKey || !client}
              className="btn-glow mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {checkingKey && <Loader2 size={15} className="animate-spin" />}
              {t('gateSubmit')}
            </button>
          </form>
          <p className="mt-4 text-xs text-text-3">{t('gateNote')}</p>
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
            <option value="pending">{t('status.pending')}</option>
            <option value="confirmed">{t('status.confirmed')}</option>
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
            <table className="w-full min-w-[860px] text-left text-sm">
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
                  const s = statusStyle[b.status];
                  return (
                    <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-text-1">
                        {b.date} · {b.time}
                      </td>
                      <td className="px-4 py-3 text-text-2">{tb(`services.${b.service}.name`)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-1">{b.name}</div>
                        <div className="text-xs text-text-3">
                          {b.email}
                          {b.phone && ` · ${b.phone}`}
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-xs text-text-3">
                        <span className="line-clamp-2">{b.notes || '—'}</span>
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
                            {b.status !== 'confirmed' && (
                              <button
                                onClick={() => changeStatus(b.id, 'confirmed')}
                                title={t('actionConfirm')}
                                className="rounded-md border border-border-subtle p-1.5 transition-colors hover:border-border-default"
                                style={{ color: 'var(--success)' }}
                              >
                                <Check size={14} />
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
                            <button
                              onClick={() => remove(b.id)}
                              title={t('actionDelete')}
                              className="rounded-md border border-border-subtle p-1.5 text-text-3 transition-colors hover:border-border-default hover:text-text-1"
                            >
                              <Trash2 size={14} />
                            </button>
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
