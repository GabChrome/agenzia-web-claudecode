/**
 * Configurazione del sistema prenotazioni, condivisa tra il sito (pagina
 * /prenotazioni) e il backend (worker/index.ts): modificando questo file
 * client e server restano automaticamente allineati.
 *
 * I nomi e le descrizioni dei servizi vivono in messages/<locale>.json
 * sotto `booking.services.<id>`, così restano tradotti in IT/EN.
 */

export interface BookingService {
  /** Slug univoco, usato anche come chiave di traduzione */
  id: string;
  durationMin: number;
}

export const bookingServices: BookingService[] = [
  { id: 'discovery-call', durationMin: 30 },
  { id: 'project-kickoff', durationMin: 60 },
  { id: 'site-review', durationMin: 45 },
];

export function getBookingService(id: string): BookingService | undefined {
  return bookingServices.find((s) => s.id === id);
}

/** Orari prenotabili: ogni mezz'ora dalle 9:00 alle 17:30. */
export const slotTimes: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

/** Quanti giorni in avanti si può prenotare. */
export const bookingWindowDays = 60;

/** Aperto dal lunedì al venerdì. */
export function isOpenDay(dateStr: string): boolean {
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

/** Primo giorno prenotabile a partire da oggi. */
export function firstOpenDay(): string {
  let day = todayISO();
  for (let i = 0; i < 7; i++) {
    if (isOpenDay(day)) return day;
    day = addDaysISO(day, 1);
  }
  return day;
}
