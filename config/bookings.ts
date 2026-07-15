/**
 * Configurazione della modalità DEMO del sistema prenotazioni.
 *
 * In produzione servizi, orari e disponibilità arrivano dal backend
 * WebAgency_BookingSystem (proxy in worker/index.ts): questo file alimenta
 * solo il fallback demo usato quando il backend non è raggiungibile
 * (es. `next dev` in locale o hosting solo statico).
 */

/** Stessa forma di ServiceResponse del backend (camelCase). */
export interface DemoService {
  id: string;
  name: string;
  category: string | null;
  durationMin: number;
  price: number | null;
  description: string | null;
  staffIds: string[];
  active: boolean;
}

export const demoServices: DemoService[] = [
  {
    id: 'demo-discovery-call',
    name: 'Call conoscitiva',
    category: 'Consulenza',
    durationMin: 30,
    price: null,
    description: 'Parliamo del tuo progetto e capiamo insieme come possiamo aiutarti.',
    staffIds: [],
    active: true,
  },
  {
    id: 'demo-project-kickoff',
    name: 'Kickoff di progetto',
    category: 'Consulenza',
    durationMin: 60,
    price: null,
    description: 'Definiamo obiettivi, tempi e budget per far partire il tuo nuovo sito.',
    staffIds: [],
    active: true,
  },
  {
    id: 'demo-site-review',
    name: 'Revisione del sito',
    category: 'Consulenza',
    durationMin: 45,
    price: null,
    description: 'Analizziamo il tuo sito attuale: performance, SEO e conversioni.',
    staffIds: [],
    active: true,
  },
];

export function getDemoService(id: string): DemoService | undefined {
  return demoServices.find((s) => s.id === id);
}

/** Orari prenotabili demo: ogni mezz'ora dalle 9:00 alle 17:30. */
export const demoSlotTimes: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

/** Quanti giorni in avanti si può prenotare (limite del date picker). */
export const bookingWindowDays = 60;

/** In demo si è aperti dal lunedì al venerdì. */
export function isDemoOpenDay(dateStr: string): boolean {
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const dow = d.getUTCDay();
  return dow >= 1 && dow <= 5;
}

/** Data odierna (YYYY-MM-DD) nel fuso orario dell'agenzia. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}

/** Sposta una data ISO di `days` giorni (positivi o negativi). */
export function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Primo giorno utile a partire da oggi (per il default del date picker). */
export function firstOpenDay(): string {
  let day = todayISO();
  for (let i = 0; i < 7; i++) {
    if (isDemoOpenDay(day)) return day;
    day = addDaysISO(day, 1);
  }
  return day;
}
