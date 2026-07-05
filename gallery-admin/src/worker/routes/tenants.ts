import { Hono } from 'hono';
import type { AppEnv, TenantRow } from '../types';
import { hashPassword, parseTheme, requireAgency, requireAuth } from '../auth';
import { cleanText, deleteR2Prefix, isValidEmail, isValidSlug, newId, sanitizeTheme } from '../util';

// Tutte le rotte qui sotto sono riservate all'agenzia.
export const tenantRoutes = new Hono<AppEnv>();
tenantRoutes.use('*', requireAuth, requireAgency);

tenantRoutes.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT t.*,
            (SELECT COUNT(*) FROM albums a WHERE a.tenant_id = t.id) AS album_count,
            (SELECT COUNT(*) FROM media m WHERE m.tenant_id = t.id) AS media_count,
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS user_count
     FROM tenants t ORDER BY t.name COLLATE NOCASE`
  ).all<TenantRow & { album_count: number; media_count: number; user_count: number }>();
  return c.json({
    tenants: rows.results.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      theme: parseTheme(t.theme_json),
      album_count: t.album_count,
      media_count: t.media_count,
      user_count: t.user_count,
    })),
  });
});

tenantRoutes.post('/', async (c) => {
  const body = await c.req
    .json<{ name?: string; slug?: string; theme?: unknown }>()
    .catch(() => ({}) as never);
  const name = cleanText(body.name, 120);
  const slug = cleanText(body.slug, 40).toLowerCase();
  if (!name) return c.json({ error: 'Il nome del cliente è obbligatorio' }, 400);
  if (!isValidSlug(slug)) {
    return c.json({ error: 'Lo slug può contenere solo lettere minuscole, numeri e trattini' }, 400);
  }
  const existing = await c.env.DB.prepare('SELECT id FROM tenants WHERE slug = ?')
    .bind(slug)
    .first();
  if (existing) return c.json({ error: 'Esiste già un cliente con questo slug' }, 409);
  const id = newId();
  const theme = sanitizeTheme(body.theme);
  await c.env.DB.prepare('INSERT INTO tenants (id, slug, name, theme_json) VALUES (?, ?, ?, ?)')
    .bind(id, slug, name, JSON.stringify(theme))
    .run();
  return c.json({ tenant: { id, slug, name, theme } });
});

tenantRoutes.patch('/:id', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
    .bind(c.req.param('id'))
    .first<TenantRow>();
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  const body = await c.req
    .json<{ name?: string; slug?: string; theme?: unknown }>()
    .catch(() => ({}) as never);

  let name = tenant.name;
  let slug = tenant.slug;
  let themeJson = tenant.theme_json;

  if (body.name !== undefined) {
    name = cleanText(body.name, 120);
    if (!name) return c.json({ error: 'Il nome del cliente è obbligatorio' }, 400);
  }
  if (body.slug !== undefined) {
    slug = cleanText(body.slug, 40).toLowerCase();
    if (!isValidSlug(slug)) {
      return c.json({ error: 'Lo slug può contenere solo lettere minuscole, numeri e trattini' }, 400);
    }
    const clash = await c.env.DB.prepare('SELECT id FROM tenants WHERE slug = ? AND id != ?')
      .bind(slug, tenant.id)
      .first();
    if (clash) return c.json({ error: 'Esiste già un cliente con questo slug' }, 409);
  }
  if (body.theme !== undefined) {
    themeJson = JSON.stringify(sanitizeTheme(body.theme));
  }

  await c.env.DB.prepare('UPDATE tenants SET name = ?, slug = ?, theme_json = ? WHERE id = ?')
    .bind(name, slug, themeJson, tenant.id)
    .run();
  return c.json({ tenant: { id: tenant.id, slug, name, theme: parseTheme(themeJson) } });
});

tenantRoutes.delete('/:id', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
    .bind(c.req.param('id'))
    .first<TenantRow>();
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  await deleteR2Prefix(c.env.MEDIA, `${tenant.id}/`);
  await c.env.DB.batch([
    c.env.DB.prepare(
      'DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE tenant_id = ?)'
    ).bind(tenant.id),
    c.env.DB.prepare('DELETE FROM users WHERE tenant_id = ?').bind(tenant.id),
    c.env.DB.prepare('DELETE FROM media WHERE tenant_id = ?').bind(tenant.id),
    c.env.DB.prepare('DELETE FROM albums WHERE tenant_id = ?').bind(tenant.id),
    c.env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(tenant.id),
  ]);
  return c.json({ ok: true });
});

// Carica o sostituisce il logo del cliente (body binario, es. PNG/SVG).
tenantRoutes.put('/:id/logo', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?')
    .bind(c.req.param('id'))
    .first<TenantRow>();
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  const size = Number(c.req.header('content-length') ?? '0');
  if (!size || size > 2 * 1024 * 1024) {
    return c.json({ error: 'Il logo deve pesare al massimo 2 MB' }, 413);
  }
  const contentType = c.req.header('content-type') ?? 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return c.json({ error: 'Il logo deve essere un file immagine' }, 400);
  }
  const key = `${tenant.id}/logo`;
  await c.env.MEDIA.put(key, c.req.raw.body, { httpMetadata: { contentType } });
  const theme = parseTheme(tenant.theme_json);
  theme.logo = `/files/${key}?v=${Date.now()}`;
  await c.env.DB.prepare('UPDATE tenants SET theme_json = ? WHERE id = ?')
    .bind(JSON.stringify(theme), tenant.id)
    .run();
  return c.json({ logo: theme.logo });
});

tenantRoutes.get('/:id/users', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, email, created_at FROM users WHERE tenant_id = ? ORDER BY email'
  )
    .bind(c.req.param('id'))
    .all<{ id: string; email: string; created_at: string }>();
  return c.json({ users: rows.results });
});

tenantRoutes.post('/:id/users', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT id FROM tenants WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string }>();
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as never);
  const email = cleanText(body.email, 200).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidEmail(email)) return c.json({ error: 'Email non valida' }, 400);
  if (password.length < 8) return c.json({ error: 'La password deve avere almeno 8 caratteri' }, 400);
  const clash = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (clash) return c.json({ error: 'Esiste già un utente con questa email' }, 409);
  const id = newId();
  await c.env.DB.prepare(
    "INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES (?, ?, ?, ?, 'client')"
  )
    .bind(id, tenant.id, email, await hashPassword(password))
    .run();
  return c.json({ user: { id, email } });
});

tenantRoutes.delete('/users/:userId', async (c) => {
  const user = await c.env.DB.prepare("SELECT id FROM users WHERE id = ? AND role = 'client'")
    .bind(c.req.param('userId'))
    .first<{ id: string }>();
  if (!user) return c.json({ error: 'Utente non trovato' }, 404);
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ]);
  return c.json({ ok: true });
});
