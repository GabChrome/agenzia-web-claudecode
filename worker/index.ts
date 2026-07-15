/**
 * Backend prenotazioni del sito Anti Gravity.
 *
 * Un unico Worker serve sia le pagine statiche (binding ASSETS → out/)
 * sia le API sotto /api/*. Le prenotazioni vivono in un Durable Object
 * (BookingStore) con storage persistente: nessun database da creare a mano.
 *
 * Endpoint pubblici:
 *   GET  /api/health                     stato del backend
 *   GET  /api/bookings/slots?date=…      orari già occupati per una data
 *   POST /api/bookings                   crea una prenotazione
 *
 * Endpoint admin (header `Authorization: Bearer <BOOKINGS_ADMIN_KEY>`):
 *   GET    /api/bookings?date=…&status=…  elenco prenotazioni
 *   PATCH  /api/bookings/:id              cambia stato (pending/confirmed/cancelled)
 *   DELETE /api/bookings/:id              elimina una prenotazione
 *
 * CORS aperto su /api/* per poter testare il backend anche da localhost
 * o da una copia del sito ospitata altrove (es. Firebase Hosting).
 */

import {
  bookingWindowDays,
  addDaysISO,
  getBookingService,
  isOpenDay,
  slotTimes,
  todayISO,
} from '../config/bookings';

export interface Env {
  ASSETS: Fetcher;
  BOOKINGS: DurableObjectNamespace;
  BOOKINGS_ADMIN_KEY?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes: string;
  status: BookingStatus;
  createdAt: string; // ISO 8601
}

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'cancelled'];
const MAX_BOOKINGS = 1000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function isAdmin(request: Request, env: Env): boolean {
  const key = env.BOOKINGS_ADMIN_KEY || 'antigravity';
  const header = request.headers.get('Authorization') ?? '';
  return header === `Bearer ${key}`;
}

/* ------------------------------------------------------------ validazione --- */

type ValidationResult =
  | { ok: true; value: Omit<Booking, 'id' | 'status' | 'createdAt'> }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function validateBooking(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid_json' };
  const b = body as Record<string, unknown>;

  const name = str(b.name);
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'invalid_name' };

  const email = str(b.email);
  if (!EMAIL_RE.test(email) || email.length > 120) return { ok: false, error: 'invalid_email' };

  const phone = str(b.phone);
  if (phone.length > 30) return { ok: false, error: 'invalid_phone' };

  const service = str(b.service);
  if (!getBookingService(service)) return { ok: false, error: 'invalid_service' };

  const date = str(b.date);
  if (!DATE_RE.test(date)) return { ok: false, error: 'invalid_date' };
  const today = todayISO();
  if (date < today || date > addDaysISO(today, bookingWindowDays)) {
    return { ok: false, error: 'date_out_of_range' };
  }
  if (!isOpenDay(date)) return { ok: false, error: 'closed_day' };

  const time = str(b.time);
  if (!slotTimes.includes(time)) return { ok: false, error: 'invalid_time' };

  const notes = str(b.notes);
  if (notes.length > 500) return { ok: false, error: 'invalid_notes' };

  return { ok: true, value: { name, email, phone, service, date, time, notes } };
}

/* -------------------------------------------------------------- Durable Object --- */

export class BookingStore {
  constructor(private state: DurableObjectState) {}

  private async all(): Promise<Booking[]> {
    const map = await this.state.storage.list<Booking>({ prefix: 'booking:' });
    return [...map.values()].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method;

    if (path === '/api/bookings/slots' && method === 'GET') {
      const date = url.searchParams.get('date') ?? '';
      if (!DATE_RE.test(date)) return json({ error: 'invalid_date' }, 400);
      const taken = (await this.all())
        .filter((b) => b.date === date && b.status !== 'cancelled')
        .map((b) => ({ service: b.service, time: b.time }));
      return json({ date, taken });
    }

    if (path === '/api/bookings' && method === 'GET') {
      const date = url.searchParams.get('date');
      const status = url.searchParams.get('status');
      let list = await this.all();
      if (date) list = list.filter((b) => b.date === date);
      if (status) list = list.filter((b) => b.status === status);
      return json({ bookings: list });
    }

    if (path === '/api/bookings' && method === 'POST') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'invalid_json' }, 400);
      }
      const result = validateBooking(body);
      if (!result.ok) return json({ error: result.error }, 400);

      const list = await this.all();
      if (list.length >= MAX_BOOKINGS) return json({ error: 'too_many_bookings' }, 429);

      const { date, time, service } = result.value;
      const conflict = list.some(
        (b) => b.date === date && b.time === time && b.service === service && b.status !== 'cancelled'
      );
      if (conflict) return json({ error: 'slot_taken' }, 409);

      const booking: Booking = {
        id: crypto.randomUUID(),
        ...result.value,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await this.state.storage.put(`booking:${booking.id}`, booking);
      return json({ booking }, 201);
    }

    const idMatch = path.match(/^\/api\/bookings\/([0-9a-f-]{36})$/);
    if (idMatch) {
      const key = `booking:${idMatch[1]}`;
      const booking = await this.state.storage.get<Booking>(key);
      if (!booking) return json({ error: 'not_found' }, 404);

      if (method === 'PATCH') {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid_json' }, 400);
        }
        const status = str((body as Record<string, unknown>)?.status) as BookingStatus;
        if (!STATUSES.includes(status)) return json({ error: 'invalid_status' }, 400);
        const updated: Booking = { ...booking, status };
        await this.state.storage.put(key, updated);
        return json({ booking: updated });
      }

      if (method === 'DELETE') {
        await this.state.storage.delete(key);
        return json({ deleted: true });
      }
    }

    return json({ error: 'not_found' }, 404);
  }
}

/* ------------------------------------------------------------------- Worker --- */

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const path = url.pathname.replace(/\/+$/, '');

  if (path === '/api/health') {
    return json({ ok: true, service: 'bookings', storage: 'durable-object', time: new Date().toISOString() });
  }

  if (path === '/api/bookings' || path.startsWith('/api/bookings/')) {
    const needsAdmin =
      (path === '/api/bookings' && request.method === 'GET') ||
      request.method === 'PATCH' ||
      request.method === 'DELETE';
    if (needsAdmin && !isAdmin(request, env)) return json({ error: 'unauthorized' }, 401);

    const stub = env.BOOKINGS.get(env.BOOKINGS.idFromName('default'));
    return stub.fetch(request);
  }

  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
