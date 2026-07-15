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

## Prenotazioni (`/prenotazioni`) — collegate a WebAgency_BookingSystem

Il sistema di prenotazioni del sito è collegato al backend
[WebAgency_BookingSystem](https://github.com/SadSonny/WebAgency_BookingSystem)
(ASP.NET Core + PostgreSQL, deploy su Railway):

- **Pagina pubblica:** `/{locale}/prenotazioni/` — servizi, giorni e orari arrivano in tempo reale dal backend (`/api/v1/services` e `/api/v1/availability`, slot da 15 min calcolati con orari di apertura, ferie e capienza staff). Prenotazione con nome, email, telefono, note e consenso GDPR; alla conferma si ricevono **codice prenotazione** e **codice di annullamento** (disdetta self-service senza registrazione).
- **Pannello di gestione:** `/{locale}/prenotazioni/gestione/` — login con **email e password dell'account admin del tenant** (JWT), elenco prenotazioni con filtri per giorno e stato, cambio stato: confermata / completata / no-show / annullata.
- **Proxy:** il Worker in `worker/index.ts` espone le API sotto `/api/*` sulla **stessa origine del sito** e le inoltra al backend. Serve a due cose: la `X-Api-Key` del tenant resta un secret lato server (mai nel bundle JS) e si aggirano i limiti CORS del backend (che non consente `Authorization`/`PATCH` dal browser). Health check: `GET /api/health`.
- **Configurazione del Worker:** `BOOKING_API_URL` (base URL del backend, default il deploy Railway) e il secret `BOOKING_API_KEY` (chiave API del tenant): `npx wrangler secret put BOOKING_API_KEY`. **Senza chiave il sito resta in modalità demo.**
- **Modalità demo:** se il backend non è raggiungibile o la chiave manca, la pagina lo segnala con un badge e continua a funzionare salvando i dati in `localStorage` (servizi e orari finti da `config/bookings.ts`; pannello di gestione: qualsiasi email + password `antigravity`).

## Report siti (`/reports`)

Area riservata (non linkata dal menu pubblico) con report interattivi per ogni sito cliente:

- **Accesso:** `/{locale}/reports/` — password condivisibile, configurabile con `NEXT_PUBLIC_REPORTS_PASSWORD` (default `antigravity`). Nota: con l'export statico è un filtro d'accesso leggero, non una protezione forte.
- **Siti:** elenco configurabile in `config/sites.ts` (una voce per sito: nome, dominio, data di lancio…).
- **Metriche:** visite per giorno/settimana/mese/anno, visitatori unici, engagement, sorgenti di traffico, dispositivi e geografia, con grafici interattivi ed export CSV/PDF.
- **Dati:** demo realistici e deterministici, generati in `lib/analytics.ts`; per collegare una fonte reale (GA4, Plausible, Umami…) basta reimplementare `getReport` / `getSiteSummary` mantenendo le stesse firme.

## Deploy

Il sito usa l'export statico di Next.js (`output: 'export'` → cartella `out/`) e viene pubblicato su due destinazioni:

- **Cloudflare Workers** (deploy principale, `wrangler.toml`): un unico Worker serve le pagine statiche come assets **e** il proxy prenotazioni sotto `/api/*` verso il backend su Railway. Deploy manuale: `npx wrangler deploy`, poi una tantum `npx wrangler secret put BOOKING_API_KEY` con la chiave API del tenant.
- **Firebase Hosting** (GitHub Actions su push a `main`): solo le pagine statiche; la pagina prenotazioni funziona in modalità demo, oppure può puntare al Worker impostando `NEXT_PUBLIC_BOOKINGS_API` al momento della build.

Il pannello `gallery-admin/` è un Worker separato con risorse proprie (D1 + R2) e si deploya a parte: vedi [gallery-admin/README.md](./gallery-admin/README.md).
