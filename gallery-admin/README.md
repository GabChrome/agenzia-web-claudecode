# Gallery Admin — pannello vetrina foto/video per i clienti

Pannello **centrale e multi-cliente** con cui ogni cliente dell'agenzia gestisce da solo la
vetrina foto/video del proprio sito: carica foto e video, aggiunge video da link
YouTube/Vimeo, scrive didascalie in italiano e inglese, organizza tutto in album,
riordina col drag & drop e decide cosa è pubblicato e cosa resta in bozza.

Un unico deploy serve tutti i clienti: ognuno accede con le proprie credenziali e vede
**solo** la propria galleria, con il **proprio tema** (colori, logo, font) impostato
dall'agenzia. I dati sono isolati per cliente a livello di API: ogni query filtra per il
tenant ricavato dalla sessione.

## Stack (tutto Cloudflare)

| Componente | Servizio |
|---|---|
| API + interfaccia | Cloudflare Worker (Hono) con static assets |
| Database (clienti, album, didascalie, utenti) | D1 (SQLite) |
| File foto/video | R2 (zero costi di egress) |
| Interfaccia | React + Vite + Tailwind, drag & drop con dnd-kit |

Le miniature vengono generate **nel browser** al momento dell'upload (canvas), quindi non
serve alcun servizio di image processing lato server.

## Messa in produzione

```bash
cd gallery-admin
npm install
npx wrangler login

# 1. Crea database e bucket
npx wrangler d1 create gallery-admin-db     # copia il database_id in wrangler.toml
npx wrangler r2 bucket create gallery-admin-media

# 2. Applica lo schema
npm run db:schema

# 3. Build + deploy
npm run deploy
```

Alla prima visita l'app chiede di creare l'**account amministratore dell'agenzia**
(funziona solo finché non esiste alcun utente). Da lì in poi:

1. **Nuovo cliente** → nome, slug e tema (colori, angoli, font, logo).
2. **Accessi** → crea email + password da consegnare al cliente.
3. Il cliente entra su `https://<worker>.<account>.workers.dev` (o sul dominio custom,
   es. `pannello.tuaagenzia.it`) e gestisce solo la sua galleria.

Consiglio: collega un dominio custom al Worker da dashboard Cloudflare
(Workers → Settings → Domains & Routes).

## Sviluppo locale

```bash
npm install
npm run db:schema:local     # schema sul D1 locale
npm run build               # prima build degli asset
npm run dev:worker          # Worker su http://localhost:8787

# in un secondo terminale, per lavorare sull'interfaccia con hot reload:
npm run dev                 # Vite su http://localhost:5173 (proxy API → 8787)
```

## Come i siti dei clienti mostrano la galleria

Endpoint pubblico (CORS aperto, cache 60 s, restituisce **solo** contenuti pubblicati):

```
GET https://<dominio-pannello>/api/public/<slug-cliente>
```

Risposta:

```json
{
  "tenant": { "slug": "da-mario", "name": "Ristorante Da Mario", "theme": { "accent": "#9a7830" } },
  "albums": [
    {
      "id": "…",
      "title": { "it": "La sala", "en": "The dining room" },
      "description": { "it": "…", "en": "…" },
      "media": [
        {
          "kind": "image",
          "url": "https://…/files/…/original",
          "thumb": "https://…/files/…/thumb",
          "embed_url": null,
          "caption": { "it": "…", "en": "…" }
        }
      ]
    }
  ]
}
```

`kind` è `image`, `video` (file caricato, da mostrare con `<video src=…>`) oppure
`embed` (YouTube/Vimeo, da mostrare in un `<iframe src={embed_url}>`).

Esempio di componente per i siti Next.js dei clienti:

```tsx
'use client';
import { useEffect, useState } from 'react';

const API = 'https://pannello.tuaagenzia.it/api/public/da-mario';

export function Vetrina({ locale = 'it' }: { locale?: 'it' | 'en' }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(API).then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return null;
  return (
    <div>
      {data.albums.map((album: any) => (
        <section key={album.id}>
          <h2>{album.title[locale] || album.title.it}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {album.media.map((m: any) => (
              <figure key={m.id}>
                {m.kind === 'image' && <img src={m.url} alt={m.caption[locale]} loading="lazy" />}
                {m.kind === 'video' && <video src={m.url} poster={m.thumb ?? undefined} controls />}
                {m.kind === 'embed' && (
                  <iframe src={m.embed_url} allowFullScreen style={{ aspectRatio: '16/9', width: '100%', border: 0 }} />
                )}
                {m.caption[locale] && <figcaption>{m.caption[locale]}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

## Limiti e note

- **Upload**: foto fino a 25 MB, video fino a 100 MB (limite del piano Workers Free;
  alzabile su piano a pagamento), miniature generate client-side. Per video lunghi o
  pesanti il cliente può usare «Video da link» (YouTube/Vimeo), senza costi di storage.
- **Video**: i file caricati vengono serviti da R2 con supporto Range (necessario per
  Safari). Non c'è transcodifica: consigliare ai clienti file MP4 (H.264/AAC).
- **Sicurezza**: sessioni HttpOnly (7 giorni), password PBKDF2-SHA256, cookie SameSite=Lax.
  Gli utenti «client» non possono in alcun modo leggere o modificare dati di altri tenant.
- **Bozza/pubblicato** vale sia per i singoli elementi sia per interi album; l'endpoint
  pubblico non espone mai le bozze.
- L'endpoint pubblico è cacheato 60 s: le modifiche del cliente compaiono sul sito al
  massimo dopo un minuto.
