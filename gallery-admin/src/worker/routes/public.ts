import { Hono } from 'hono';
import type { AlbumRow, AppEnv, MediaRow, PostRow, TenantRow } from '../types';
import { parseTheme } from '../auth';
import { effectiveDate, renderRss } from '../render';

// Endpoint pubblico (senza login) usato dai siti dei clienti per mostrare la
// vetrina: restituisce solo album ed elementi pubblicati.
export const publicRoutes = new Hono<AppEnv>();

function firstFilled(...values: string[]): string {
  return values.find((v) => v.trim() !== '') ?? '';
}

// Un articolo è visibile quando è stato pubblicato E, se ha una data di
// pubblicazione programmata, quella data è già passata. Si calcola al
// confronto, non serve alcun processo che "scatti" all'ora giusta.
async function publishedPosts(db: D1Database, tenantId: string): Promise<PostRow[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM posts WHERE tenant_id = ? AND published = 1
         AND (publish_at IS NULL OR publish_at <= ?)
       ORDER BY COALESCE(publish_at, created_at) DESC`
    )
    .bind(tenantId, new Date().toISOString())
    .all<PostRow>();
  return rows.results;
}

// Il corpo intero viaggia già nell'elenco (non solo nel singolo articolo):
// la modalità "list" dell'embed lo mostra a schermo intero con un solo
// fetch, senza una seconda chiamata quando il cliente apre una scheda.
function postSummaryDto(p: PostRow, origin: string, tenantSlug: string) {
  return {
    id: p.id,
    slug: p.slug,
    title: { it: p.title_it, en: p.title_en },
    excerpt: { it: p.excerpt_it, en: p.excerpt_en },
    body: { it: p.body_it, en: p.body_en },
    cover: p.cover_key ? `${origin}/files/${p.cover_key}` : null,
    tags: p.tags ? p.tags.split(',').map((t) => t.trim()) : [],
    date: effectiveDate(p),
    url: `${origin}/n/${tenantSlug}/${p.slug}`,
  };
}

publicRoutes.get('/:slug', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
    .bind(c.req.param('slug'))
    .first<TenantRow>();
  if (!tenant) return c.json({ error: 'Galleria non trovata' }, 404);

  const albums = await c.env.DB.prepare(
    'SELECT * FROM albums WHERE tenant_id = ? AND published = 1 ORDER BY position, created_at'
  )
    .bind(tenant.id)
    .all<AlbumRow>();
  const media = await c.env.DB.prepare(
    `SELECT * FROM media WHERE tenant_id = ? AND published = 1
       AND (kind = 'embed' OR r2_key IS NOT NULL)
     ORDER BY position, created_at`
  )
    .bind(tenant.id)
    .all<MediaRow>();

  const byAlbum = new Map<string, MediaRow[]>();
  for (const m of media.results) {
    const list = byAlbum.get(m.album_id) ?? [];
    list.push(m);
    byAlbum.set(m.album_id, list);
  }

  const origin = new URL(c.req.url).origin;
  const abs = (path: string | null) =>
    path === null ? null : path.startsWith('/') ? origin + path : path;

  return c.json(
    {
      tenant: { slug: tenant.slug, name: tenant.name, theme: parseTheme(tenant.theme_json) },
      albums: albums.results.map((a) => ({
        id: a.id,
        title: { it: a.title_it, en: a.title_en },
        description: { it: a.description_it, en: a.description_en },
        media: (byAlbum.get(a.id) ?? []).map((m) => ({
          id: m.id,
          kind: m.kind,
          url: abs(m.r2_key ? `/files/${m.r2_key}` : null),
          thumb: abs(m.thumb_key ? `/files/${m.thumb_key}` : m.embed_thumb_url),
          embed_url: m.embed_url,
          content_type: m.content_type,
          title: { it: m.title_it, en: m.title_en },
          caption: { it: m.caption_it, en: m.caption_en },
          description: { it: m.description_it, en: m.description_en },
          // Se il cliente non compila il testo alternativo si ricade su
          // didascalia e titolo della stessa lingua, poi sull'italiano: i siti
          // hanno sempre un alt utilizzabile per accessibilità e SEO.
          alt: {
            it: firstFilled(m.alt_it, m.caption_it, m.title_it),
            en: firstFilled(m.alt_en, m.caption_en, m.title_en, m.alt_it, m.caption_it, m.title_it),
          },
        })),
      })),
    },
    200,
    // Finestra breve: il cliente mette in bozza, ricarica il sito e vede il
    // cambiamento entro ~30 s. `stale-while-revalidate` tiene comunque le
    // pagine veloci, servendo subito la copia in cache mentre si aggiorna.
    { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' }
  );
});

publicRoutes.get('/:slug/posts', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
    .bind(c.req.param('slug'))
    .first<TenantRow>();
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  const origin = new URL(c.req.url).origin;
  const posts = await publishedPosts(c.env.DB, tenant.id);
  return c.json(
    {
      tenant: { slug: tenant.slug, name: tenant.name, theme: parseTheme(tenant.theme_json) },
      posts: posts.map((p) => postSummaryDto(p, origin, tenant.slug)),
    },
    200,
    { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' }
  );
});

publicRoutes.get('/:slug/posts/:postSlug', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
    .bind(c.req.param('slug'))
    .first<TenantRow>();
  if (!tenant) return c.json({ error: 'Cliente non trovato' }, 404);
  const post = await c.env.DB.prepare(
    `SELECT * FROM posts WHERE tenant_id = ? AND slug = ? AND published = 1
       AND (publish_at IS NULL OR publish_at <= ?)`
  )
    .bind(tenant.id, c.req.param('postSlug'), new Date().toISOString())
    .first<PostRow>();
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404);
  const origin = new URL(c.req.url).origin;
  return c.json(postSummaryDto(post, origin, tenant.slug), 200, {
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
  });
});

publicRoutes.get('/:slug/feed.xml', async (c) => {
  const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE slug = ?')
    .bind(c.req.param('slug'))
    .first<TenantRow>();
  if (!tenant) return c.notFound();
  const origin = new URL(c.req.url).origin;
  const posts = await publishedPosts(c.env.DB, tenant.id);
  return c.body(renderRss({ tenant, posts, origin }), 200, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  });
});
