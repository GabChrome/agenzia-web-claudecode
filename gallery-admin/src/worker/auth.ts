import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv, TenantRow, UserRow } from './types';
import type { SanitizedTheme } from './util';

export const SESSION_COOKIE = 'gallery_session';
const SESSION_DAYS = 7;
const PBKDF2_ITERATIONS = 100_000;

const encoder = new TextEncoder();

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await pbkdf2(password, salt, iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export async function createSession(
  c: Context<AppEnv>,
  userId: string
): Promise<void> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const id = Array.from(raw, (b) => b.toString(16).padStart(2, '0')).join('');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(id, userId, expires.toISOString())
    .run();
  setCookie(c, SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    expires,
  });
}

export async function destroySession(c: Context<AppEnv>): Promise<void> {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const sid = getCookie(c, SESSION_COOKIE);
  if (!sid) return c.json({ error: 'Non autenticato' }, 401);
  const user = await c.env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?'
  )
    .bind(sid, new Date().toISOString())
    .first<UserRow>();
  if (!user) return c.json({ error: 'Sessione scaduta, accedi di nuovo' }, 401);
  c.set('user', user);
  await next();
};

export const requireAgency: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.get('user').role !== 'agency') return c.json({ error: 'Permesso negato' }, 403);
  await next();
};

// Determina su quale tenant opera la richiesta: gli utenti "client" lavorano
// solo sul proprio, l'agenzia sceglie con ?tenant=<slug>. Ogni query successiva
// filtra per tenant.id, quindi i dati dei clienti restano isolati tra loro.
export const resolveTenant: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('user');
  let tenant: TenantRow | null = null;
  if (user.role === 'client') {
    if (!user.tenant_id) return c.json({ error: 'Utente senza cliente associato' }, 403);
    tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(user.tenant_id)
      .first<TenantRow>();
  } else {
    const slug = c.req.query('tenant');
    if (!slug) return c.json({ error: 'Parametro tenant mancante' }, 400);
    tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
      .bind(slug)
      .first<TenantRow>();
  }
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  c.set('tenant', tenant);
  await next();
};

export function parseTheme(themeJson: string): SanitizedTheme {
  try {
    const parsed = JSON.parse(themeJson);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
