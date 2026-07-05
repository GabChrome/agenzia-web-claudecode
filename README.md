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

## Deploy

Il sito è configurato per l'export statico (`output: 'export'`) in Next.js e il deploy tramite Firebase Hosting. L'azione GitHub inclusa effettua il build e il deploy ad ogni push sul branch `main`.
