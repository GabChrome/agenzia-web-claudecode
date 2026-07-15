# Anti Gravity Agency

Sito istituzionale per l'agenzia web "Anti Gravity", sviluppato con Next.js 14, Tailwind CSS, Framer Motion e React Three Fiber.

## Caratteristiche principali

- **Next.js 14 App Router:** Performance e routing moderno.
- **Multilingua (i18n):** Supporto nativo IT/EN tramite `next-intl`.
- **Design System:** Tema dark-premium coerente basato sulle direttive di taste-skill e ui-styling.
- **Animazioni:** Framer Motion per micro-interazioni e reveal al passaggio (rispetta `prefers-reduced-motion`).
- **3D Hero:** Integrazione leggera di React Three Fiber per l'elemento visivo in hero.
- **Form Contatti:** React Hook Form + Zod per validazione real-time accessibile.
- **Deploy:** Firebase Hosting tramite CI/CD (GitHub Actions).

## Pannello gallerie per i clienti

Nella cartella [`gallery-admin/`](./gallery-admin) c'è il pannello multi-cliente con cui
ogni cliente gestisce da solo la vetrina foto/video del proprio sito (album, didascalie
IT/EN, drag & drop, bozze). È un progetto separato che si deploya su Cloudflare Workers
(D1 + R2): vedi il suo [README](./gallery-admin/README.md) per setup e integrazione.

## Sviluppo locale

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) per vedere il risultato.

## Prenotazioni (`/prenotazioni`) — pagina + backend

Sistema di prenotazioni completo, pensato anche come demo del pacchetto «Vetrina + Prenotazioni»:

- **Pagina pubblica:** `/{locale}/prenotazioni/` — scelta di servizio, giorno e orario (slot da 30 min, lun–ven 9:00–17:30), dati di contatto e conferma. Gli orari già occupati risultano disabilitati.
- **Pannello di gestione:** `/{locale}/prenotazioni/gestione/` — elenco prenotazioni con filtri per giorno e stato; conferma, annulla, elimina. Accesso con la chiave admin (`BOOKINGS_ADMIN_KEY` in `wrangler.toml`, default `antigravity`).
- **Backend:** Cloudflare Worker in `worker/index.ts`, servito sullo **stesso dominio del sito** sotto `/api/*` (health check: `GET /api/health`). Le prenotazioni vivono in un Durable Object con storage persistente: nessun database da creare a mano, al primo deploy è già operativo (richiede wrangler ≥ 3.79).
- **Modalità demo:** se il backend non è raggiungibile (es. `next dev` in locale o hosting solo statico come Firebase) la pagina lo segnala e continua a funzionare salvando i dati in `localStorage`. Un badge in cima alla pagina indica sempre la modalità attiva.
- **API:** `POST /api/bookings` (crea), `GET /api/bookings/slots?date=YYYY-MM-DD` (orari occupati), e con header `Authorization: Bearer <chiave>`: `GET /api/bookings`, `PATCH /api/bookings/:id` (stato), `DELETE /api/bookings/:id`. CORS aperto per testare anche da localhost.
- La configurazione (servizi, orari, finestra di prenotazione) è condivisa tra client e Worker in `config/bookings.ts`.

## Report siti (`/reports`)

Area riservata (non linkata dal menu pubblico) con report interattivi per ogni sito cliente:

- **Accesso:** `/{locale}/reports/` — password condivisibile, configurabile con `NEXT_PUBLIC_REPORTS_PASSWORD` (default `antigravity`). Nota: con l'export statico è un filtro d'accesso leggero, non una protezione forte.
- **Siti:** elenco configurabile in `config/sites.ts` (una voce per sito: nome, dominio, data di lancio…).
- **Metriche:** visite per giorno/settimana/mese/anno, visitatori unici, engagement, sorgenti di traffico, dispositivi e geografia, con grafici interattivi ed export CSV/PDF.
- **Dati:** demo realistici e deterministici, generati in `lib/analytics.ts`; per collegare una fonte reale (GA4, Plausible, Umami…) basta reimplementare `getReport` / `getSiteSummary` mantenendo le stesse firme.

## Deploy

Il sito usa l'export statico di Next.js (`output: 'export'` → cartella `out/`) e viene pubblicato su due destinazioni:

- **Cloudflare Workers** (deploy principale, `wrangler.toml`): un unico Worker serve le pagine statiche come assets **e** il backend prenotazioni sotto `/api/*`. È l'unica destinazione in cui il backend è attivo. Deploy manuale: `npx wrangler deploy`.
- **Firebase Hosting** (GitHub Actions su push a `main`): solo le pagine statiche; la pagina prenotazioni funziona in modalità demo, oppure può puntare al Worker impostando `NEXT_PUBLIC_BOOKINGS_API` al momento della build.

Il pannello `gallery-admin/` è un Worker separato con risorse proprie (D1 + R2) e si deploya a parte: vedi [gallery-admin/README.md](./gallery-admin/README.md).
