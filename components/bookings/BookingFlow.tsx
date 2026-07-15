'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, ArrowLeft, XCircle } from 'lucide-react';
import { bookingWindowDays, addDaysISO, firstOpenDay, todayISO } from '@/config/bookings';
import {
  BookingApiError,
  BookingClient,
  CreatedBooking,
  Service,
  Slot,
  createBookingClient,
  detectBackend,
} from '@/lib/bookings';
import BackendBadge from './BackendBadge';

type FormData = { name: string; email: string; phone: string; notes?: string; gdpr: boolean };

/** Codici errore con una traduzione dedicata in booking.errors.* */
const TRANSLATED_ERRORS = new Set([
  'slot_taken',
  'invalid_data',
  'backend_unavailable',
  'too_many_requests',
]);

const inputClass =
  'w-full rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-[15px] text-text-1 outline-none transition-colors focus:border-accent';

export default function BookingFlow() {
  const t = useTranslations('booking');
  const locale = useLocale();

  const [client, setClient] = useState<BookingClient | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [created, setCreated] = useState<(CreatedBooking & { service: Service; date: string; time: string }) | null>(
    null
  );
  const [cancelState, setCancelState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  // Incrementato per forzare il ricaricamento degli slot (es. dopo "Nuova prenotazione")
  const [refreshTick, setRefreshTick] = useState(0);

  const [today, setToday] = useState('');

  // Rileva il backend e carica i servizi (solo lato client)
  useEffect(() => {
    setToday(todayISO());
    setDate(firstOpenDay());
    let alive = true;
    detectBackend().then(async (mode) => {
      if (!alive) return;
      const c = createBookingClient(mode);
      setClient(c);
      try {
        const list = await c.services();
        if (!alive) return;
        setServices(list);
        setServiceId((cur) => cur ?? list[0]?.id ?? null);
      } catch {
        if (alive) setServices([]);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Ricarica la disponibilità quando cambiano servizio o data
  useEffect(() => {
    if (!client || !serviceId || !date) return;
    let alive = true;
    setSlots(null);
    client
      .availability(serviceId, date)
      .then((s) => alive && setSlots(s))
      .catch(() => alive && setSlots([]));
    return () => {
      alive = false;
    };
  }, [client, serviceId, date, refreshTick]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('form.errors.nameMin')).max(80),
        email: z.string().email(t('form.errors.emailInvalid')).max(120),
        phone: z.string().min(6, t('form.errors.phoneRequired')).max(30),
        notes: z.string().max(500, t('form.errors.notesMax')).optional(),
        gdpr: z.boolean().refine((v) => v, t('form.errors.gdprRequired')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { gdpr: false } });

  const selectedService = useMemo(
    () => services?.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const fmtDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  );

  const fmtPrice = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }), [locale]);

  const errorMessage = (code: string) =>
    TRANSLATED_ERRORS.has(code) ? t(`errors.${code}`) : t('errors.generic');

  const onSubmit = async (data: FormData) => {
    if (!client || !serviceId || !selectedService) return;
    if (!time) {
      setErrorCode('no_slot');
      return;
    }
    setSending(true);
    setErrorCode(null);
    try {
      const booking = await client.create({
        serviceId,
        date,
        time,
        customer: { name: data.name, phone: data.phone, email: data.email, notes: data.notes },
        gdprConsent: data.gdpr,
      });
      setCreated({ ...booking, service: selectedService, date, time });
      setCancelState('idle');
    } catch (err) {
      const code = err instanceof BookingApiError ? err.code : 'generic';
      setErrorCode(code);
      if (code === 'slot_taken') {
        setTime(null);
        client.availability(serviceId, date).then(setSlots).catch(() => {});
      }
    } finally {
      setSending(false);
    }
  };

  const cancelBooking = async () => {
    if (!client || !created) return;
    setCancelState('working');
    try {
      await client.cancel(created.bookingId, created.cancellationToken);
      setCancelState('done');
    } catch {
      setCancelState('error');
    }
  };

  const restart = () => {
    setCreated(null);
    setTime(null);
    setErrorCode(null);
    setCancelState('idle');
    setRefreshTick((n) => n + 1);
    reset();
  };

  /* ------------------------------------------------------------ successo --- */

  if (created) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
        <div className="border-gradient rounded-2xl p-8 animate-fade-in">
          {cancelState === 'done' ? (
            <>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(220,80,80,0.10)', color: 'var(--error)' }}
              >
                <XCircle size={26} />
              </div>
              <h1 className="mt-4 font-serif text-3xl text-text-1">{t('success.cancelledTitle')}</h1>
              <p className="mt-2 text-text-2">{t('success.cancelledDesc')}</p>
            </>
          ) : (
            <>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(74,222,128,0.12)', color: 'var(--success)' }}
              >
                <Check size={26} />
              </div>
              <h1 className="mt-4 font-serif text-3xl text-text-1">{t('success.title')}</h1>
              <p className="mt-2 text-text-2">{t('success.desc')}</p>
            </>
          )}

          <dl className="mt-6 space-y-3 rounded-xl border border-border-subtle bg-surface-1 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">{t('success.service')}</dt>
              <dd className="font-semibold text-text-1">
                {created.service.name}
                <span className="ml-1 font-normal text-text-3">· {created.service.durationMin} min</span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">{t('success.when')}</dt>
              <dd className="font-semibold text-text-1">
                {fmtDate.format(new Date(`${created.date}T12:00:00`))} · {created.time}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">{t('success.code')}</dt>
              <dd className="font-mono text-xs text-text-2">{created.bookingId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">{t('success.cancelToken')}</dt>
              <dd className="font-mono text-xs text-text-2">{created.cancellationToken}</dd>
            </div>
          </dl>

          {cancelState !== 'done' && <p className="mt-4 text-xs text-text-3">{t('success.note')}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={restart}
              className="btn-glow rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t('success.again')}
            </button>
            <Link
              href={`/${locale}/`}
              className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-semibold text-text-2 transition-colors hover:text-text-1"
            >
              {t('success.home')}
            </Link>
            {cancelState !== 'done' && (
              <button
                onClick={cancelBooking}
                disabled={cancelState === 'working'}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold transition-colors hover:border-border-default disabled:opacity-60"
                style={{ color: 'var(--error)' }}
              >
                {cancelState === 'working' && <Loader2 size={14} className="animate-spin" />}
                {t('success.cancel')}
              </button>
            )}
          </div>
          {cancelState === 'error' && (
            <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--error)' }}>
              {t('success.cancelError')}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- form --- */

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header>
        <Link
          href={`/${locale}/`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-3 transition-colors hover:text-text-1"
        >
          <ArrowLeft size={15} /> {t('backHome')}
        </Link>
        <div className="eyebrow mt-6">Anti Gravity</div>
        <h1 className="mt-1 font-serif text-display-sm text-text-1">{t('title')}</h1>
        <p className="mt-2 max-w-xl text-text-2">{t('subtitle')}</p>
        <BackendBadge mode={client?.mode ?? null} />
      </header>

      <div className="gold-divider mt-6" />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        {/* 1. Servizio */}
        <section>
          <h2 className="eyebrow">{t('steps.service')}</h2>
          {services === null ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-text-3">
              <Loader2 size={15} className="animate-spin" /> {t('loadingServices')}
            </p>
          ) : services.length === 0 ? (
            <p className="mt-3 text-sm text-text-3">{t('noServices')}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t('steps.service')}>
              {services.map((s) => {
                const active = s.id === serviceId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setServiceId(s.id);
                      setTime(null);
                    }}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 ease-out-expo ${
                      active
                        ? 'border-accent bg-surface-1 shadow-lg shadow-accent-glow'
                        : 'border-border-subtle bg-surface-1 hover:border-border-default'
                    }`}
                  >
                    <div className="text-sm font-bold text-text-1">{s.name}</div>
                    <div className="mt-0.5 text-xs font-semibold text-accent">
                      {s.durationMin} min
                      {s.price != null && ` · ${fmtPrice.format(s.price)}`}
                    </div>
                    {s.description && (
                      <div className="mt-1.5 text-xs leading-relaxed text-text-3">{s.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Data */}
        <section>
          <h2 className="eyebrow">{t('steps.date')}</h2>
          <input
            type="date"
            value={date}
            min={today}
            max={today ? addDaysISO(today, bookingWindowDays) : undefined}
            onChange={(e) => {
              setDate(e.target.value);
              setTime(null);
            }}
            className={`mt-3 ${inputClass} sm:max-w-xs`}
            aria-label={t('steps.date')}
          />
        </section>

        {/* 3. Orario */}
        {date && serviceId && (
          <section>
            <h2 className="eyebrow">{t('steps.time')}</h2>
            {!client || slots === null ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-text-3">
                <Loader2 size={15} className="animate-spin" /> {t('loadingSlots')}
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-3 text-sm text-text-3">{t('noSlots')}</p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots.map((slot) => {
                  const active = time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setTime(slot.time)}
                      aria-pressed={active}
                      className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-all duration-150 ${
                        active
                          ? 'border-accent bg-accent text-white'
                          : !slot.available
                            ? 'cursor-not-allowed border-border-subtle text-text-3 line-through opacity-50'
                            : 'border-border-subtle bg-surface-1 text-text-2 hover:border-accent hover:text-text-1'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 4. Dati di contatto */}
        <section>
          <h2 className="eyebrow">{t('steps.details')}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-name" className="block text-sm font-semibold text-text-1">
                {t('form.name')}
              </label>
              <input id="bk-name" {...register('name')} placeholder={t('form.namePlaceholder')} className={`mt-1.5 ${inputClass}`} />
              {errors.name && (
                <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="bk-email" className="block text-sm font-semibold text-text-1">
                {t('form.email')}
              </label>
              <input id="bk-email" type="email" {...register('email')} placeholder={t('form.emailPlaceholder')} className={`mt-1.5 ${inputClass}`} />
              {errors.email && (
                <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="bk-phone" className="block text-sm font-semibold text-text-1">
                {t('form.phone')}
              </label>
              <input id="bk-phone" type="tel" {...register('phone')} placeholder="+39 …" className={`mt-1.5 ${inputClass}`} />
              {errors.phone && (
                <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{errors.phone.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bk-notes" className="block text-sm font-semibold text-text-1">
                {t('form.notes')} <span className="font-normal text-text-3">({t('form.optional')})</span>
              </label>
              <textarea
                id="bk-notes"
                {...register('notes')}
                placeholder={t('form.notesPlaceholder')}
                className={`mt-1.5 min-h-[90px] resize-y ${inputClass}`}
              />
              {errors.notes && (
                <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{errors.notes.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-2.5 text-sm text-text-2">
                <input
                  type="checkbox"
                  {...register('gdpr')}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                {t('form.gdpr')}
              </label>
              {errors.gdpr && (
                <p className="mt-1 text-[13px]" style={{ color: 'var(--error)' }}>{errors.gdpr.message}</p>
              )}
            </div>
          </div>
        </section>

        {errorCode && (
          <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
            {errorCode === 'no_slot' ? t('errors.noSlot') : errorMessage(errorCode)}
          </p>
        )}

        <button
          type="submit"
          disabled={sending || !client || !serviceId}
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {sending && <Loader2 size={17} className="animate-spin" />}
          {t('form.submit')}
        </button>
      </form>
    </div>
  );
}
