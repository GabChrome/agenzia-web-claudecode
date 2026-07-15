/**
 * Proxy verso il backend prenotazioni WebAgency_BookingSystem
 * (https://github.com/SadSonny/WebAgency_BookingSystem, deploy su Railway).
 *
 * Un unico Worker serve le pagine statiche (binding ASSETS → out/) e inoltra
 * le richieste /api/* al backend. Il proxy esiste per due motivi:
 *
 * 1. la X-Api-Key del tenant resta un secret lato server (mai nel bundle JS);
 * 2. il CORS del backend consente solo GET/POST/DELETE e gli header
 *    X-Api-Key/Content-Type: le chiamate admin (Authorization + PATCH)
 *    dal browser sarebbero bloccate, mentre da Worker a backend il CORS
 *    non si applica.
 *
 * Rotte esposte al sito (stessa origine):
 *   GET    /api/health                 stato del collegamento col backend
 *   GET    /api/services               → GET  /api/v1/services
 *   GET    /api/availability?…         → GET  /api/v1/availability?…
 *   POST   /api/bookings               → POST /api/v1/bookings
 *   GET    /api/bookings/:id?token=…   → GET  /api/v1/bookings/:id?token=…
 *   DELETE /api/bookings/:id?token=…   → DELETE /api/v1/bookings/:id?token=…
 *   POST   /api/admin/token            → POST /api/v1/admin/auth/token
 *   GET    /api/admin/bookings?…       → GET  /api/v1/admin/bookings?…      (Bearer)
 *   PATCH  /api/admin/bookings/:id     → PATCH /api/v1/admin/bookings/:id  (Bearer)
 *
 * Config (wrangler.toml / dashboard):
 *   BOOKING_API_URL  base URL del backend (default: deploy Railway)
 *   BOOKING_API_KEY  secret → `npx wrangler secret put BOOKING_API_KEY`
 *                    Senza chiave /api/health risponde ok:false e il sito
 *                    resta in modalità demo.
 */

export interface Env {
  ASSETS: Fetcher;
  BOOKING_API_URL?: string;
  BOOKING_API_KEY?: string;
}

const DEFAULT_API_URL = 'https://webagencybookingsystem-production.up.railway.app';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function apiBase(env: Env): string {
  return (env.BOOKING_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
}

/** Inoltra la richiesta al backend e restituisce la risposta con CORS aperto. */
async function forward(
  request: Request,
  env: Env,
  upstreamPath: string,
  opts: { withApiKey?: boolean; withAuth?: boolean } = {}
): Promise<Response> {
  const url = new URL(request.url);
  const target = `${apiBase(env)}${upstreamPath}${url.search}`;

  const headers = new Headers();
  const ct = request.headers.get('Content-Type');
  if (ct) headers.set('Content-Type', ct);
  if (opts.withApiKey) headers.set('X-Api-Key', env.BOOKING_API_KEY ?? '');
  if (opts.withAuth) {
    const auth = request.headers.get('Authorization');
    if (auth) headers.set('Authorization', auth);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    });
  } catch {
    return json({ error: 'backend_unavailable' }, 502);
  }

  const respHeaders = new Headers(CORS_HEADERS);
  respHeaders.set('Content-Type', upstream.headers.get('Content-Type') ?? 'application/json; charset=utf-8');
  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}

const UUID_RE = '[0-9a-fA-F-]{36}';

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method;

  if (path === '/api/health' && method === 'GET') {
    const hasApiKey = Boolean(env.BOOKING_API_KEY);
    let upstreamOk = false;
    try {
      const res = await fetch(`${apiBase(env)}/api/v1/health/live`, {
        signal: AbortSignal.timeout(5000),
      });
      upstreamOk = res.ok;
    } catch {}
    return json({
      ok: hasApiKey && upstreamOk,
      backend: apiBase(env),
      upstream: upstreamOk,
      apiKeyConfigured: hasApiKey,
    });
  }

  if (path === '/api/services' && method === 'GET') {
    return forward(request, env, '/api/v1/services', { withApiKey: true });
  }

  if (path === '/api/availability' && method === 'GET') {
    return forward(request, env, '/api/v1/availability', { withApiKey: true });
  }

  if (path === '/api/bookings' && method === 'POST') {
    return forward(request, env, '/api/v1/bookings', { withApiKey: true });
  }

  const bookingMatch = path.match(new RegExp(`^/api/bookings/(${UUID_RE})$`));
  if (bookingMatch && (method === 'GET' || method === 'DELETE')) {
    return forward(request, env, `/api/v1/bookings/${bookingMatch[1]}`, { withApiKey: true });
  }

  if (path === '/api/admin/token' && method === 'POST') {
    return forward(request, env, '/api/v1/admin/auth/token');
  }

  if (path === '/api/admin/bookings' && method === 'GET') {
    return forward(request, env, '/api/v1/admin/bookings', { withAuth: true });
  }

  const adminMatch = path.match(new RegExp(`^/api/admin/bookings/(${UUID_RE})$`));
  if (adminMatch && method === 'PATCH') {
    return forward(request, env, `/api/v1/admin/bookings/${adminMatch[1]}`, { withAuth: true });
  }

  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
