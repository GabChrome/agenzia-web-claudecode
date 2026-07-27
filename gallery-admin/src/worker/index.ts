import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import { authRoutes } from './routes/auth';
import { tenantRoutes } from './routes/tenants';
import { articleRoutes } from './routes/articlePages';
import { galleryRoutes } from './routes/gallery';
import { newsRoutes } from './routes/news';
import { publicRoutes } from './routes/public';

const app = new Hono<AppEnv>();

// Difesa in profondità contro il CSRF (oltre al cookie SameSite=Lax): le
// richieste che modificano dati devono arrivare dalla stessa origine.
// L'endpoint pubblico è escluso perché è in sola lettura (GET).
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (
    url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/api/public/') &&
    !SAFE_METHODS.has(c.req.method)
  ) {
    const origin = c.req.header('origin');
    if (origin && origin !== url.origin) {
      return c.json({ error: 'Origine della richiesta non consentita' }, 403);
    }
  }

  await next();

  // Header di sicurezza su tutte le risposte.
  const headers = new Headers(c.res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  if (url.pathname.startsWith('/files/')) {
    // I file sono caricati dagli utenti: la sandbox impedisce l'esecuzione di
    // script se un file (es. SVG) venisse aperto direttamente nel browser.
    headers.set('Content-Security-Policy', 'sandbox');
  } else if ((headers.get('content-type') ?? '').includes('text/html')) {
    // Solo le pagine del pannello: lo script di embed servito ai siti dei
    // clienti non deve ereditare queste restrizioni.
    headers.set('X-Frame-Options', 'DENY');
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: https://i.ytimg.com; media-src 'self' blob:; " +
        'frame-src https://www.youtube-nocookie.com https://player.vimeo.com; ' +
        "connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    );
  }
  c.res = new Response(c.res.body, {
    status: c.res.status,
    statusText: c.res.statusText,
    headers,
  });
});

// L'endpoint pubblico è pensato per essere chiamato dai siti dei clienti,
// che vivono su altri domini: serve CORS aperto in sola lettura.
app.use('/api/public/*', cors());

app.route('/api/auth', authRoutes);
app.route('/api/tenants', tenantRoutes);
app.route('/api/gallery', galleryRoutes);
app.route('/api/news', newsRoutes);
app.route('/api/public', publicRoutes);

app.all('/api/*', (c) => c.json({ error: 'Endpoint non trovato' }, 404));

// Pagine pubbliche degli articoli (SEO, condivisione): navigazione diretta,
// non protette da autenticazione.
app.route('/n', articleRoutes);

// Servizio dei file da R2, con supporto alle richieste Range (necessario
// perché Safari riproduca i video) e cache lunga: le chiavi sono immutabili.
app.get('/files/*', async (c) => {
  const key = decodeURIComponent(new URL(c.req.url).pathname.slice('/files/'.length));
  if (!key) return c.notFound();

  const rangeHeader = c.req.header('range');
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (match && (match[1] !== '' || match[2] !== '')) {
      const head = await c.env.MEDIA.head(key);
      if (!head) return c.notFound();
      const size = head.size;
      let start: number;
      let end: number;
      if (match[1] !== '') {
        start = Number.parseInt(match[1], 10);
        end = match[2] !== '' ? Math.min(Number.parseInt(match[2], 10), size - 1) : size - 1;
      } else {
        const suffix = Number.parseInt(match[2], 10);
        start = Math.max(0, size - suffix);
        end = size - 1;
      }
      if (start >= size || start > end) {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        });
      }
      const object = await c.env.MEDIA.get(key, {
        range: { offset: start, length: end - start + 1 },
      });
      if (!object) return c.notFound();
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
      headers.set('Content-Length', String(end - start + 1));
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(object.body, { status: 206, headers });
    }
  }

  const object = await c.env.MEDIA.get(key);
  if (!object) return c.notFound();
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
});

// Tutto il resto è la SPA: gli asset statici vengono serviti prima del Worker,
// quindi qui arrivano solo le rotte client-side → fallback su index.html.
app.all('*', async (c) => {
  const asset = await c.env.ASSETS.fetch(c.req.raw);
  if (asset.status !== 404) return asset;
  return c.env.ASSETS.fetch(new URL('/', c.req.url));
});

export default app;
