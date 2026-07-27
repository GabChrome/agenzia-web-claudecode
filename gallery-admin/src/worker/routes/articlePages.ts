import { Hono } from 'hono';
import type { AppEnv, PostRow, TenantRow } from '../types';
import { parseTheme } from '../auth';
import { renderArticlePage, renderIndexPage } from '../render';

// Pagine pubbliche vere (HTML renderizzato dal server, non da uno script):
// sono quelle che Google indicizza e che WhatsApp/Facebook sanno mostrare in
// anteprima quando un articolo viene condiviso. Vivono fuori da /api perché
// sono destinate alla navigazione diretta, non a essere interrogate da JS.
export const articleRoutes = new Hono<AppEnv>();

function lang(c: { req: { query: (k: string) => string | undefined } }): 'it' | 'en' {
  return c.req.query('lang') === 'en' ? 'en' : 'it';
}

articleRoutes.get('/:slug', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
    .bind(c.req.param('slug'))
    .first<TenantRow>();
  if (!tenant) return c.notFound();
  const posts = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE tenant_id = ? AND published = 1
       AND (publish_at IS NULL OR publish_at <= ?)
     ORDER BY COALESCE(publish_at, created_at) DESC`
  )
    .bind(tenant.id, new Date().toISOString())
    .all<PostRow>();
  const html = renderIndexPage({
    tenant,
    theme: parseTheme(tenant.theme_json),
    posts: posts.results,
    lang: lang(c),
    origin: new URL(c.req.url).origin,
  });
  return c.html(html, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
});

articleRoutes.get('/:slug/:postSlug', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
    .bind(c.req.param('slug'))
    .first<TenantRow>();
  if (!tenant) return c.notFound();
  const post = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE tenant_id = ? AND slug = ? AND published = 1
       AND (publish_at IS NULL OR publish_at <= ?)`
  )
    .bind(tenant.id, c.req.param('postSlug'), new Date().toISOString())
    .first<PostRow>();
  if (!post) return c.notFound();
  const html = renderArticlePage({
    tenant,
    theme: parseTheme(tenant.theme_json),
    post,
    lang: lang(c),
    origin: new URL(c.req.url).origin,
  });
  return c.html(html, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
});
