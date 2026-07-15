/**
 * Client del sistema prenotazioni, con doppia modalità:
 *
 * - `remote`: parla con /api/* sulla stessa origine del sito. Il Worker
 *   (worker/index.ts) inoltra le chiamate al backend WebAgency_BookingSystem
 *   su Railway aggiungendo la X-Api-Key lato server.
 * - `demo`: fallback automatico quando il backend non è raggiungibile
 *   (sviluppo con `next dev`, hosting solo statico…): stessa interfaccia,
 *   ma i dati vivono in localStorage del browser.
 *
 * La UI chiama `detectBackend()` una volta e poi usa `createBookingClient(mode)`.
 */

import {
  demoServices,
  demoSlotTimes,
  getDemoService,
  isDemoOpenDay,
  todayISO,
} from '@/config/bookings';

export type BackendMode = 'remote' | 'demo';

/** Stati prenotazione del backend (una nuova prenotazione nasce confirmed). */
export type BookingStatus = 'confirmed' | 'cancelled' | 'no_show' | 'completed';
export const BOOKING_STATUSES: BookingStatus[] = ['confirmed', 'cancelled', 'no_show', 'completed'];

export interface Service {
  id: string;
  name: string;
  category: string | null;
  durationMin: number;
  price: number | null;
  description: string | null;
  staffIds: string[];
  active: boolean;
}

export interface Slot {
  time: string; // HH:mm
  staffId: string | null;
  available: boolean;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface CreateBookingInput {
  serviceId: string;
  staffId?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customer: CustomerInput;
  gdprConsent: boolean;
}

export interface CreatedBooking {
  bookingId: string;
  status: string;
  cancellationToken: string;
}

export interface AdminBooking {
  id: string;
  date: string;
  time: string;
  durationMin: number;
  status: BookingStatus;
  service: { id: string; name: string } | null;
  staff: { id: string; name: string } | null;
  customer: { name: string; phone: string; email: string; notes: string | null };
  price: number | null;
  createdAt: string;
}

export interface AdminFilter {
  date?: string;
  status?: BookingStatus;
}

export interface BookingClient {
  mode: BackendMode;
  services(): Promise<Service[]>;
  availability(serviceId: string, date: string): Promise<Slot[]>;
  create(input: CreateBookingInput): Promise<CreatedBooking>;
  cancel(bookingId: string, token: string): Promise<void>;
  adminLogin(email: string, password: string): Promise<string>;
  adminList(token: string, filter?: AdminFilter): Promise<AdminBooking[]>;
  adminSetStatus(token: string, id: string, status: BookingStatus): Promise<AdminBooking>;
}

/** Codici errore usati come chiavi i18n (booking.errors.*). */
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
// puntare al Worker da un hosting diverso (es. la copia su Firebase).
const API_BASE = (process.env.NEXT_PUBLIC_BOOKINGS_API ?? '').replace(/\/+$/, '');

function codeForStatus(status: number): string {
  if (status === 401) return 'unauthorized';
  if (status === 409) return 'slot_taken';
  if (status === 422 || status === 400) return 'invalid_data';
  if (status === 429) return 'too_many_requests';
  if (status >= 500) return 'backend_unavailable';
  return 'unknown';
}

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
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const code =
      typeof data.error === 'string'
        ? data.error
        : typeof data.type === 'string'
          ? data.type
          : codeForStatus(res.status);
    throw new BookingApiError(code, res.status);
  }
  return data as T;
}

function bearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function detectBackend(): Promise<BackendMode> {
  try {
    const data = await request<{ ok: boolean }>('/api/health', { signal: AbortSignal.timeout(6000) });
    return data.ok ? 'remote' : 'demo';
  } catch {
    return 'demo';
  }
}

const remoteClient: BookingClient = {
  mode: 'remote',

  async services() {
    const list = await request<Service[]>('/api/services');
    return (Array.isArray(list) ? list : []).filter((s) => s.active !== false);
  },

  async availability(serviceId, date) {
    const params = new URLSearchParams({ serviceId, dateFrom: date, dateTo: date });
    const days = await request<{ date: string; slots: Slot[] }[]>(`/api/availability?${params}`);
    if (!Array.isArray(days)) return [];
    const day = days.find((d) => d.date === date);
    return day?.slots ?? [];
  },

  async create(input) {
    return request<CreatedBooking>('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: input.serviceId,
        staffId: input.staffId ?? null,
        date: input.date,
        time: input.time,
        customer: {
          name: input.customer.name,
          phone: input.customer.phone,
          email: input.customer.email,
          notes: input.customer.notes || null,
        },
        gdprConsent: input.gdprConsent,
        additionalServiceIds: [],
      }),
    });
  },

  async cancel(bookingId, token) {
    await request(`/api/bookings/${bookingId}?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
  },

  async adminLogin(email, password) {
    const data = await request<{ token: string }>('/api/admin/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!data.token) throw new BookingApiError('unauthorized', 401);
    return data.token;
  },

  async adminList(token, filter) {
    const params = new URLSearchParams({ pageSize: '200' });
    if (filter?.date) {
      params.set('dateFrom', filter.date);
      params.set('dateTo', filter.date);
    }
    if (filter?.status) params.set('status', filter.status);
    const data = await request<{ items: AdminBooking[] }>(`/api/admin/bookings?${params}`, {
      headers: bearer(token),
    });
    return data.items ?? [];
  },

  async adminSetStatus(token, id, status) {
    return request<AdminBooking>(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...bearer(token) },
      body: JSON.stringify({ status }),
    });
  },
};

/* -------------------------------------------------------------------- demo --- */

const DEMO_STORAGE_KEY = 'ag-demo-bookings';
const DEMO_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_BOOKINGS_ADMIN_KEY ?? 'antigravity';
const DEMO_TOKEN = 'demo-session';

interface DemoBooking extends AdminBooking {
  cancellationToken: string;
}

function demoAll(): DemoBooking[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoBooking[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function demoSave(list: DemoBooking[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const demoClient: BookingClient = {
  mode: 'demo',

  async services() {
    return demoServices;
  },

  async availability(serviceId, date) {
    if (!isDemoOpenDay(date)) return [];
    const taken = new Set(
      demoAll()
        .filter((b) => b.date === date && b.service?.id === serviceId && b.status !== 'cancelled')
        .map((b) => b.time)
    );
    const isToday = date === todayISO();
    return demoSlotTimes.map((time) => ({
      time,
      staffId: null,
      available: !taken.has(time) && !(isToday && time <= nowHHMM()),
    }));
  },

  async create(input) {
    const service = getDemoService(input.serviceId);
    if (!service) throw new BookingApiError('invalid_data', 422);
    if (!input.gdprConsent) throw new BookingApiError('invalid_data', 422);
    const slots = await demoClient.availability(input.serviceId, input.date);
    const slot = slots.find((s) => s.time === input.time);
    if (!slot) throw new BookingApiError('invalid_data', 422);
    if (!slot.available) throw new BookingApiError('slot_taken', 409);

    const booking: DemoBooking = {
      id: crypto.randomUUID(),
      date: input.date,
      time: input.time,
      durationMin: service.durationMin,
      status: 'confirmed',
      service: { id: service.id, name: service.name },
      staff: null,
      customer: {
        name: input.customer.name.trim(),
        phone: input.customer.phone.trim(),
        email: input.customer.email.trim(),
        notes: input.customer.notes?.trim() || null,
      },
      price: service.price,
      createdAt: new Date().toISOString(),
      cancellationToken: crypto.randomUUID(),
    };
    demoSave([...demoAll(), booking]);
    return { bookingId: booking.id, status: booking.status, cancellationToken: booking.cancellationToken };
  },

  async cancel(bookingId, token) {
    const list = demoAll();
    const booking = list.find((b) => b.id === bookingId && b.cancellationToken === token);
    if (!booking) throw new BookingApiError('unknown', 404);
    booking.status = 'cancelled';
    demoSave(list);
  },

  async adminLogin(email, password) {
    if (!email.includes('@') || password !== DEMO_ADMIN_PASSWORD) {
      throw new BookingApiError('unauthorized', 401);
    }
    return DEMO_TOKEN;
  },

  async adminList(token, filter) {
    if (token !== DEMO_TOKEN) throw new BookingApiError('unauthorized', 401);
    let list = [...demoAll()].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    if (filter?.date) list = list.filter((b) => b.date === filter.date);
    if (filter?.status) list = list.filter((b) => b.status === filter.status);
    return list;
  },

  async adminSetStatus(token, id, status) {
    if (token !== DEMO_TOKEN) throw new BookingApiError('unauthorized', 401);
    const list = demoAll();
    const booking = list.find((b) => b.id === id);
    if (!booking) throw new BookingApiError('unknown', 404);
    booking.status = status;
    demoSave(list);
    return booking;
  },
};

export function createBookingClient(mode: BackendMode): BookingClient {
  return mode === 'remote' ? remoteClient : demoClient;
}
