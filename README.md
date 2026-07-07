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

## Sviluppo locale

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) per vedere il risultato.

## Report siti (`/reports`)

Area riservata (non linkata dal menu pubblico) con report interattivi per ogni sito cliente:

- **Accesso:** `/{locale}/reports/` — password condivisibile, configurabile con `NEXT_PUBLIC_REPORTS_PASSWORD` (default `antigravity`). Nota: con l'export statico è un filtro d'accesso leggero, non una protezione forte.
- **Siti:** elenco configurabile in `config/sites.ts` (una voce per sito: nome, dominio, data di lancio…).
- **Metriche:** visite per giorno/settimana/mese/anno, visitatori unici, engagement, sorgenti di traffico, dispositivi e geografia, con grafici interattivi ed export CSV/PDF.
- **Dati:** demo realistici e deterministici, generati in `lib/analytics.ts`; per collegare una fonte reale (GA4, Plausible, Umami…) basta reimplementare `getReport` / `getSiteSummary` mantenendo le stesse firme.

## Deploy

Il sito è configurato per l'export statico (`output: 'export'`) in Next.js e il deploy tramite Firebase Hosting. L'azione GitHub inclusa effettua il build e il deploy ad ogni push sul branch `main`.
