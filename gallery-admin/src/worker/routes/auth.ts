import { Hono } from 'hono';
import type { AppEnv, TenantRow } from '../types';
import {
  createSession,
  destroySession,
  hashPassword,
  parseTheme,
  requireAuth,
  verifyPassword,
} from '../auth';
import { cleanText, isValidEmail, newId } from '../util';
import {
  RATE_LIMIT_MESSAGE,
  clearFailures,
  clientIp,
  rateLimitExceeded,
  recordFailure,
} from '../security';

export const authRoutes = new Hono<AppEnv>();

// Primo avvio: finché non esiste alcun utente, si può creare l'account agenzia.
authRoutes.get('/bootstrap', async (c) => {
  const row = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>();
  return c.json({ needed: (row?.n ?? 0) === 0 });
});

authRoutes.post('/bootstrap', async (c) => {
  if (await rateLimitExceeded(c.env.DB, `bootstrap:ip:${clientIp(c)}`, 10)) {
    return c.json({ error: RATE_LIMIT_MESSAGE }, 429);
  }
  const row = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>();
  if ((row?.n ?? 0) > 0) {
    await recordFailure(c.env.DB, `bootstrap:ip:${clientIp(c)}`);
    return c.json({ error: 'Account già configurato' }, 403);
  }
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as never);
  const email = cleanText(body.email, 200).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400);
  if (password.length < 8) return c.json({ error: 'La password deve avere almeno 8 caratteri' }, 400);
  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES (?, NULL, ?, ?, 'agency')"
  )
    .bind(id, email, await hashPassword(password))
    .run();
  await createSession(c, id);
  return c.json({ ok: true });
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as never);
  const email = cleanText(body.email, 200).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  // Anti brute-force: massimo 5 tentativi falliti per email e 30 per IP
  // ogni 15 minuti.
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${clientIp(c)}`;
  if (
    (await rateLimitExceeded(c.env.DB, emailKey, 5)) ||
    (await rateLimitExceeded(c.env.DB, ipKey, 30))
  ) {
    return c.json({ error: RATE_LIMIT_MESSAGE }, 429);
  }

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; password_hash: string }>();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    await recordFailure(c.env.DB, emailKey);
    await recordFailure(c.env.DB, ipKey);
    return c.json({ error: 'Email o password errati' }, 401);
  }

  await clearFailures(c.env.DB, emailKey);
  // Pulizia opportunistica delle sessioni scadute.
  await c.env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?')
    .bind(new Date().toISOString())
    .run();
  await createSession(c, user.id);
  return c.json({ ok: true });
});

authRoutes.post('/logout', async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  let tenant: { id: string; slug: string; name: string; theme: Record<string, string> } | null =
    null;
  if (user.role === 'client' && user.tenant_id) {
    const row = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(user.tenant_id)
      .first<TenantRow>();
    if (row) tenant = { id: row.id, slug: row.slug, name: row.name, theme: parseTheme(row.theme_json) };
  }
  return c.json({
    user: { id: user.id, email: user.email, role: user.role },
    tenant,
  });
});

authRoutes.post('/password', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req
    .json<{ current?: string; next?: string }>()
    .catch(() => ({}) as never);
  const current = typeof body.current === 'string' ? body.current : '';
  const next = typeof body.next === 'string' ? body.next : '';
  const key = `pwd:${user.id}`;
  if (await rateLimitExceeded(c.env.DB, key, 5)) {
    return c.json({ error: RATE_LIMIT_MESSAGE }, 429);
  }
  if (!(await verifyPassword(current, user.password_hash))) {
    await recordFailure(c.env.DB, key);
    return c.json({ error: 'La password attuale non è corretta' }, 400);
  }
  if (next.length < 8) return c.json({ error: 'La nuova password deve avere almeno 8 caratteri' }, 400);
  await clearFailures(c.env.DB, key);
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(await hashPassword(next), user.id)
    .run();
  return c.json({ ok: true });
});
