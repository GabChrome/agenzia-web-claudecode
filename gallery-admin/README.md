# Gallery Admin — pannello vetrina foto/video per i clienti

Pannello **centrale e multi-cliente** con cui ogni cliente dell'agenzia gestisce da solo la
vetrina foto/video del proprio sito: carica foto e video, aggiunge video da link
YouTube/Vimeo, scrive i testi in italiano e inglese, organizza tutto in album,
riordina col drag & drop e decide cosa è pubblicato e cosa resta in bozza.

Per **ogni elemento** (foto, video o link) il cliente può compilare, in entrambe le lingue:

| Campo | A cosa serve | Dove appare sul sito |
|---|---|---|
| **Titolo** | Il nome dell'elemento | In grassetto sotto la foto |
| **Didascalia** | Una riga breve | Sotto il titolo, nella griglia |
| **Testo esteso** | Informazioni aggiuntive | Quando si apre l'elemento a schermo intero |
| **Testo alternativo** | Descrive l'immagine a chi non può vederla, e aiuta Google | Attributo `alt` dell'immagine |

Il testo alternativo è facoltativo: se lasciato vuoto viene usata automaticamente la
didascalia (e in mancanza il titolo), così ogni immagine ha sempre un `alt` valido.

## Preparare oggi, pubblicare quando si vuole

Il cliente può caricare materiale con calma e mandarlo online solo quando è pronto:

- **Carica come bozza** — un interruttore accanto al pulsante di caricamento: i nuovi file
  entrano nascosti, senza comparire sul sito.
- **Pubblica tutto sul sito** — quando ci sono bozze pronte compare una barra con il
  conteggio e un unico tasto che le manda online tutte insieme.
- **Pubblica / Nascondi** sulla singola scheda, senza aprire nulla.
- Lo stesso vale per gli **album interi**: un album in bozza resta invisibile con tutto il
  suo contenuto.

L'endpoint pubblico non espone mai le bozze, quindi finché il cliente non pubblica il sito
resta esattamente com'era.

## Il lavoro interrotto non si perde

Se il cliente chiude il pannello (o il browser, o gli si scarica il telefono) mentre sta
scrivendo, **le modifiche vengono conservate automaticamente** e alla riapertura riprende
esattamente da dove aveva lasciato:

1. Mentre scrive, il pannello salva da solo il lavoro in corso — sotto ai campi compare
   *«Modifiche conservate: se chiudi ora, alla riapertura riprendi da qui»*.
2. La scheda dell'elemento mostra l'etichetta **In sospeso** finché il lavoro non è
   completato.
3. Riaprendo l'elemento, i campi ripartono da quanto scritto, con l'avviso *«Ripreso da
   dove avevi lasciato»* e la possibilità di **scartare** e tornare ai testi pubblicati.

Il punto importante: **le modifiche in sospeso restano separate dai testi pubblicati**. Il
sito continua a mostrare l'ultima versione salvata, quindi un testo scritto a metà non
finisce mai online. Il salvataggio avviene sul server, non nel browser: il cliente può
riprendere anche da un altro dispositivo.

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

## Come le foto e i video appaiono sui siti dei clienti

Le immagini **non vengono copiate dentro i siti**: restano su R2 e i siti le mostrano
leggendo un singolo indirizzo. Per ogni elemento il pannello serve due file:

- `thumb` — miniatura (lato lungo 640 px, JPEG) generata durante l'upload: è quella che
  la griglia carica, così la pagina resta leggera anche con foto da 20 MB;
- `url` — il file originale, caricato solo quando il visitatore apre l'elemento.

### Il design è personalizzabile al 100%, senza toccare il backend

Il backend serve **solo dati**: non impone mai un aspetto. La grafica si cambia su tre
livelli, dal più rapido al più libero, e si possono mescolare.

| Livello | Chi lo usa | Serve codice? | Cosa puoi cambiare |
|---|---|---|---|
| **1. Dal pannello** | Tu, in 30 secondi | No | Nome, logo, colori, font, disposizione, proporzioni, didascalie, effetti, angoli, spaziature |
| **2. CSS del sito** | Tu, nel foglio di stile del cliente | Solo CSS | Qualunque dettaglio visivo: forme, tipografia, animazioni, griglie su misura |
| **3. Markup tuo** | Tu, nel sito | JS del sito | Tutta la struttura HTML: lo script porta i dati, il resto lo disegni tu |

Nessuno dei tre richiede di modificare o ridistribuire il pannello: il Worker resta
identico per tutti i clienti.

**Livello 1 — dal pannello.** Nella scheda cliente c'è la sezione *Vetrina sul sito*, con
anteprima dal vivo: disposizione (griglia, muratura, carosello, elenco), proporzioni delle
foto, posizione delle didascalie (sotto, sovrapposte, al passaggio del mouse, nascoste),
effetto al passaggio, larghezza colonna, spaziatura, angoli, intestazione con nome e logo
del cliente, ed eventuali colori e font dedicati. Salvi e il sito cambia aspetto **senza
ripubblicare nulla**: sono dati, non codice.

**Livello 2 — con i CSS del sito.** Lo script espone classi stabili e variabili CSS. Basta
scrivere regole più specifiche nel foglio di stile del cliente:

```css
/* stesso script, aspetto completamente diverso */
#vetrina .vt-list  { display: flex; flex-wrap: wrap; gap: 10px; }
#vetrina .vt-frame { border-radius: 50%; aspect-ratio: 1; border: 3px solid #c9a24b; }
#vetrina .vt-cap   { text-align: center; }
```

Variabili disponibili: `--vt-gap`, `--vt-radius`, `--vt-col`, `--vt-ratio`, `--vt-accent`,
`--vt-bg`, `--vt-text`, `--vt-muted`, `--vt-font`, `--vt-cap-align`.
Classi: `.vt-root`, `.vt-header`, `.vt-logo`, `.vt-name`, `.vt-album`, `.vt-album-title`,
`.vt-album-desc`, `.vt-list`, `.vt-item`, `.vt-btn`, `.vt-frame`, `.vt-play`, `.vt-cap`,
`.vt-cap-title`, `.vt-cap-text`, e per lo schermo intero `.vt-lb`, `.vt-lb-media`,
`.vt-lb-title`, `.vt-lb-caption`, `.vt-lb-desc`, `.vt-nav`, `.vt-close`.
Con `data-styles="off"` lo script non inietta **nessuno** stile: ricevi solo markup
semantico da vestire da zero.

**Livello 3 — con il tuo markup.** Con `data-render="off"` lo script si limita a portare i
dati e li consegna con un evento: la struttura HTML la scrivi tu.

```html
<div id="galleria"></div>
<script>
  document.getElementById('galleria').addEventListener('vetrina:data', (e) => {
    const { albums, tenant } = e.detail;      // dati già filtrati e pubblicati
    // …costruisci qui la tua vetrina come preferisci
  });
</script>
<script src="https://pannello.tuaagenzia.it/embed/vetrina.js"
        data-slug="da-mario" data-target="#galleria"
        data-render="off" data-styles="off" defer></script>
```

In alternativa puoi tenere layout e apertura a schermo intero dello script e sostituire
solo il contenuto delle schede:

```html
<script>
  window.Vetrina = {
    renderItem(m, ctx) {                       // ritorna HTML o un nodo
      return `<figure onclick="…"><img src="${m.thumb}" alt="${m.alt.it}"><figcaption>${m.title.it}</figcaption></figure>`;
    },
    onOpen(m, ctx) { /* ritorna false per usare la tua lightbox */ }
  };
</script>
```

Ordine di precedenza: **attributo sul tag `<script>` → impostazione del pannello →
predefinito**. Così il sito ha sempre l'ultima parola su una singola pagina, senza
cambiare la configurazione del cliente.

---

Hai due modi per integrarla. Il primo non richiede di scrivere codice.

### Opzione A — componente pronto (una riga di codice)

Funziona su qualsiasi sito: HTML statico, WordPress, Next.js, Shopify…

```html
<div id="vetrina"></div>
<script src="https://pannello.tuaagenzia.it/embed/vetrina.js"
        data-slug="da-mario" data-target="#vetrina" data-locale="it" defer></script>
```

Fa tutto da solo: griglia adattiva, caricamento pigro delle immagini, titoli e
didascalie, apertura a schermo intero con il testo esteso, navigazione con le frecce,
video riprodotti in pagina e video YouTube/Vimeo in `iframe`.

Attributi disponibili sul tag `<script>`:

| Attributo | Effetto |
|---|---|
| `data-slug` | **Obbligatorio.** Quale cliente mostrare |
| `data-target` | Selettore del contenitore (senza, si inserisce dov'è lo script) |
| `data-locale` | `it` (default) o `en` |
| `data-album` | Mostra un solo album, per titolo o per id |
| `data-layout` | `grid`, `masonry`, `carousel`, `list` |
| `data-columns` | Larghezza minima di ogni colonna in px (default 260) |
| `data-gap` `data-radius` `data-ratio` | Spaziatura, angoli, proporzioni |
| `data-captions` | `below`, `overlay`, `hover`, `off` |
| `data-hover` | `zoom`, `lift`, `fade`, `none` |
| `data-header` | `on` per mostrare nome e logo del cliente |
| `data-titles` | `off` per nascondere i titoli degli album |
| `data-styles` | `off` per non ricevere alcuno stile |
| `data-render` | `off` per la modalità headless (solo dati) |

Ogni attributo lasciato fuori eredita l'impostazione scelta nel pannello per quel cliente.

L'aspetto si adatta al design di ogni sito con sole variabili CSS, senza toccare lo script:

```css
#vetrina {
  --vt-gap: 20px;      /* spazio tra le foto      */
  --vt-radius: 14px;   /* arrotondamento          */
  --vt-ratio: 4 / 3;   /* proporzione dei riquadri (1/1, 16/9, …) */
  --vt-accent: #c0392b;
}
```

### Opzione B — leggi i dati e disegna tu la vetrina

Quando vuoi il pieno controllo del markup, leggi direttamente il JSON
(CORS aperto, solo contenuti pubblicati, cache ~30 s):

```
GET https://<dominio-pannello>/api/public/<slug-cliente>
```

```json
{
  "tenant": { "slug": "da-mario", "name": "Ristorante Da Mario", "theme": { "accent": "#c0392b" } },
  "albums": [
    {
      "id": "…",
      "title": { "it": "La sala", "en": "The dining room" },
      "description": { "it": "…", "en": "…" },
      "media": [
        {
          "id": "…",
          "kind": "image",
          "url": "https://…/files/…/original",
          "thumb": "https://…/files/…/thumb",
          "embed_url": null,
          "content_type": "image/jpeg",
          "title":       { "it": "Sala principale", "en": "Main hall" },
          "caption":     { "it": "40 coperti", "en": "Seats 40" },
          "description": { "it": "Restaurata nel 2024…", "en": "Restored in 2024…" },
          "alt":         { "it": "Sala da pranzo con travi a vista", "en": "…" }
        }
      ]
    }
  ]
}
```

`kind` vale `image`, `video` (file caricato, da mostrare con `<video>`) oppure `embed`
(YouTube/Vimeo, da mostrare in un `<iframe src={embed_url}>`).

Componente per i siti Next.js:

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
  const t = (f: any) => f?.[locale] || f?.it || '';

  return (
    <div>
      {data.albums.map((album: any) => (
        <section key={album.id}>
          <h2>{t(album.title)}</h2>
          {t(album.description) && <p>{t(album.description)}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {album.media.map((m: any) => (
              <figure key={m.id} style={{ margin: 0 }}>
                {m.kind === 'image' && (
                  /* miniatura nella griglia, originale al click */
                  <a href={m.url}><img src={m.thumb ?? m.url} alt={t(m.alt)} loading="lazy" style={{ width: '100%' }} /></a>
                )}
                {m.kind === 'video' && <video src={m.url} poster={m.thumb ?? undefined} controls style={{ width: '100%' }} />}
                {m.kind === 'embed' && (
                  <iframe src={m.embed_url} title={t(m.title)} allowFullScreen
                          style={{ aspectRatio: '16/9', width: '100%', border: 0 }} />
                )}
                <figcaption>
                  {t(m.title) && <b>{t(m.title)}</b>}
                  {t(m.caption) && <span>{t(m.caption)}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

> Nota per i siti in export statico (come Anti Gravity): la lettura avviene nel browser,
> quindi non serve alcun backend nel sito del cliente.

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
- L'endpoint pubblico è cacheato ~30 s (`stale-while-revalidate`): le modifiche del
  cliente compaiono sul sito entro mezzo minuto, senza rallentare le pagine.

## Aggiornare un pannello già in produzione

I testi per elemento (titolo, testo esteso, testo alternativo) aggiungono colonne al
database. Su un'installazione già attiva, prima del deploy:

```bash
npx wrangler d1 execute gallery-admin-db --remote --file=./migrations/002_media_texts.sql
npx wrangler d1 execute gallery-admin-db --remote --file=./migrations/003_media_draft.sql
npm run deploy
```

La `002` aggiunge i testi per elemento, la `003` la memoria del lavoro interrotto.
Chi parte da zero non deve fare nulla: `schema.sql` contiene già tutto.
