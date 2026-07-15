/**
 * Client del sistema prenotazioni, con doppia modalità:
 *
 * - `remote`: parla con il backend /api/* (Cloudflare Worker, worker/index.ts).
 *   È la modalità usata sul sito pubblicato su workers.dev.
 * - `demo`: fallback automatico quando il backend non è raggiungibile
 *   (sviluppo con `next dev`, hosting solo statico…): stessi comportamenti,
 *   ma i dati vivono in localStorage del browser.
 *
 * La UI chiama `detectBackend()` una volta e poi usa `createBookingClient(mode)`.
 */

import { bookingWindowDays, addDaysISO, getBookingService, isOpenDay, slotTimes, todayISO } from '@/config/bookings';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type BackendMode = 'remote' | 'demo';

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export interface NewBookingInput {
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}

export interface TakenSlot {
  service: string;
  time: string;
}

export interface BookingFilter {
  date?: string;
  status?: BookingStatus;
}

export interface BookingClient {
  mode: BackendMode;
  takenSlots(date: string): Promise<TakenSlot[]>;
  create(input: NewBookingInput): Promise<Booking>;
  list(adminKey: string, filter?: BookingFilter): Promise<Booking[]>;
  setStatus(adminKey: string, id: string, status: BookingStatus): Promise<Booking>;
  remove(adminKey: string, id: string): Promise<void>;
}

/** Codici errore restituiti dal backend, riusati come chiavi i18n. */
export class BookingApiError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(code);
    this.name = 'BookingApiError';
  }
}

/* ------------------------------------------------------------------ remote --- */

// Vuoto = stessa origine del sito. Impostare NEXT_PUBLIC_BOOKINGS_API per
// puntare a un backend esterno (es. la copia Firebase che parla col Worker).
const API_BASE = (process.env.NEXT_PUBLIC_BOOKINGS_API ?? '').replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new BookingApiError('backend_unavailable', 0);
  }
  // Su hosting solo statico /api/* può rispondere 200 con HTML (rewrite su
  // index.html): consideriamo "backend presente" solo le risposte JSON.
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) throw new BookingApiError('backend_unavailable', res.status);
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new BookingApiError(typeof data.error === 'string' ? data.error : 'unknown', res.status);
  return data as T;
}

function authHeaders(adminKey: string): HeadersInit {
  return { Authorization: `Bearer ${adminKey}` };
}

export async function detectBackend(): Promise<BackendMode> {
  try {
    const data = await request<{ ok: boolean }>('/api/health', { signal: AbortSignal.timeout(5000) });
    return data.ok ? 'remote' : 'demo';
  } catch {
    return 'demo';
  }
}

const remoteClient: BookingClient = {
  mode: 'remote',

  async takenSlots(date) {
    const data = await request<{ taken: TakenSlot[] }>(`/api/bookings/slots?date=${encodeURIComponent(date)}`);
    return data.taken;
  },

  async create(input) {
    const data = await request<{ booking: Booking }>('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return data.booking;
  },

  async list(adminKey, filter) {
    const params = new URLSearchParams();
    if (filter?.date) params.set('date', filter.date);
    if (filter?.status) params.set('status', filter.status);
    const qs = params.size > 0 ? `?${params}` : '';
    const data = await request<{ bookings: Booking[] }>(`/api/bookings${qs}`, { headers: authHeaders(adminKey) });
    return data.bookings;
  },

  async setStatus(adminKey, id, status) {
    const data = await request<{ booking: Booking }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(adminKey) },
      body: JSON.stringify({ status }),
    });
    return data.booking;
  },

  async remove(adminKey, id) {
    await request(`/api/bookings/${id}`, { method: 'DELETE', headers: authHeaders(adminKey) });
  },
};

/* -------------------------------------------------------------------- demo --- */

const DEMO_STORAGE_KEY = 'ag-demo-bookings';
const DEMO_ADMIN_KEY = process.env.NEXT_PUBLIC_BOOKINGS_ADMIN_KEY ?? 'antigravity';

function demoAll(): Booking[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Booking[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function demoSave(list: Booking[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function demoCheckAdmin(adminKey: string) {
  if (adminKey !== DEMO_ADMIN_KEY) throw new BookingApiError('unauthorized', 401);
}

function sortBookings(list: Booking[]): Booking[] {
  return [...list].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

const demoClient: BookingClient = {
  mode: 'demo',

  async takenSlots(date) {
    return demoAll()
      .filter((b) => b.date === date && b.status !== 'cancelled')
      .map((b) => ({ service: b.service, time: b.time }));
  },

  async create(input) {
    // Stesse regole del backend (worker/index.ts), così i test in modalità
    // demo si comportano come quelli sul server.
    const name = input.name.trim();
    const email = input.email.trim();
    if (name.length < 2 || name.length > 80) throw new BookingApiError('invalid_name', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BookingApiError('invalid_email', 400);
    if (!getBookingService(input.service)) throw new BookingApiError('invalid_service', 400);
    const today = todayISO();
    if (input.date < today || input.date > addDaysISO(today, bookingWindowDays)) {
      throw new BookingApiError('date_out_of_range', 400);
    }
    if (!isOpenDay(input.date)) throw new BookingApiError('closed_day', 400);
    if (!slotTimes.includes(input.time)) throw new BookingApiError('invalid_time', 400);

    const list = demoAll();
    const conflict = list.some(
      (b) => b.date === input.date && b.time === input.time && b.service === input.service && b.status !== 'cancelled'
    );
    if (conflict) throw new BookingApiError('slot_taken', 409);

    const booking: Booking = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: input.phone?.trim() ?? '',
      service: input.service,
      date: input.date,
      time: input.time,
      notes: input.notes?.trim() ?? '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    demoSave([...list, booking]);
    return booking;
  },

  async list(adminKey, filter) {
    demoCheckAdmin(adminKey);
    let list = sortBookings(demoAll());
    if (filter?.date) list = list.filter((b) => b.date === filter.date);
    if (filter?.status) list = list.filter((b) => b.status === filter.status);
    return list;
  },

  async setStatus(adminKey, id, status) {
    demoCheckAdmin(adminKey);
    const list = demoAll();
    const booking = list.find((b) => b.id === id);
    if (!booking) throw new BookingApiError('not_found', 404);
    booking.status = status;
    demoSave(list);
    return booking;
  },

  async remove(adminKey, id) {
    demoCheckAdmin(adminKey);
    demoSave(demoAll().filter((b) => b.id !== id));
  },
};

export function createBookingClient(mode: BackendMode): BookingClient {
  return mode === 'remote' ? remoteClient : demoClient;
}
