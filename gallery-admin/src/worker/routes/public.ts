import { Hono } from 'hono';
import type { AlbumRow, AppEnv, MediaRow, TenantRow } from '../types';
import { parseTheme } from '../auth';

// Endpoint pubblico (senza login) usato dai siti dei clienti per mostrare la
// vetrina: restituisce solo album ed elementi pubblicati.
export const publicRoutes = new Hono<AppEnv>();

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
          caption: { it: m.caption_it, en: m.caption_en },
        })),
      })),
    },
    200,
    { 'Cache-Control': 'public, max-age=60' }
  );
});
