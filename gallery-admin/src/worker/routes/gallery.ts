import { Hono } from 'hono';
import type { AlbumRow, AppEnv, MediaRow } from '../types';
import { requireAuth, resolveTenant } from '../auth';
import { cleanText, newId, parseEmbedUrl } from '../util';

const MB = 1024 * 1024;
const MAX_IMAGE_BYTES = 25 * MB;
const MAX_VIDEO_BYTES = 100 * MB;
const MAX_THUMB_BYTES = 3 * MB;

export const galleryRoutes = new Hono<AppEnv>();
galleryRoutes.use('*', requireAuth, resolveTenant);

export function mediaDto(m: MediaRow) {
  return {
    id: m.id,
    album_id: m.album_id,
    kind: m.kind,
    url: m.r2_key ? `/files/${m.r2_key}` : null,
    thumb: m.thumb_key ? `/files/${m.thumb_key}` : m.embed_thumb_url,
    embed_url: m.embed_url,
    content_type: m.content_type,
    caption_it: m.caption_it,
    caption_en: m.caption_en,
    position: m.position,
    published: m.published,
    // false finché il file non è stato caricato su R2 (upload interrotti).
    uploaded: m.kind === 'embed' || m.r2_key !== null,
  };
}

function albumDto(a: AlbumRow, media: MediaRow[]) {
  return {
    id: a.id,
    title_it: a.title_it,
    title_en: a.title_en,
    description_it: a.description_it,
    description_en: a.description_en,
    position: a.position,
    published: a.published,
    media: media.map(mediaDto),
  };
}

// Albero completo della galleria del tenant corrente.
galleryRoutes.get('/', async (c) => {
  const tenant = c.get('tenant');
  const albums = await c.env.DB.prepare(
    'SELECT * FROM albums WHERE tenant_id = ? ORDER BY position, created_at'
  )
    .bind(tenant.id)
    .all<AlbumRow>();
  const media = await c.env.DB.prepare(
    'SELECT * FROM media WHERE tenant_id = ? ORDER BY position, created_at'
  )
    .bind(tenant.id)
    .all<MediaRow>();
  const byAlbum = new Map<string, MediaRow[]>();
  for (const m of media.results) {
    const list = byAlbum.get(m.album_id) ?? [];
    list.push(m);
    byAlbum.set(m.album_id, list);
  }
  return c.json({
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      theme: JSON.parse(tenant.theme_json || '{}'),
    },
    albums: albums.results.map((a) => albumDto(a, byAlbum.get(a.id) ?? [])),
  });
});

galleryRoutes.post('/albums', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const title_it = cleanText(body.title_it, 200);
  if (!title_it) return c.json({ error: 'Il titolo (italiano) è obbligatorio' }, 400);
  const pos = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(position) + 1, 0) AS p FROM albums WHERE tenant_id = ?'
  )
    .bind(tenant.id)
    .first<{ p: number }>();
  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO albums (id, tenant_id, title_it, title_en, description_it, description_en, position, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      tenant.id,
      title_it,
      cleanText(body.title_en, 200),
      cleanText(body.description_it, 1000),
      cleanText(body.description_en, 1000),
      pos?.p ?? 0,
      body.published === false ? 0 : 1
    )
    .run();
  const album = await c.env.DB.prepare('SELECT * FROM albums WHERE id = ?')
    .bind(id)
    .first<AlbumRow>();
  return c.json({ album: albumDto(album as AlbumRow, []) });
});

galleryRoutes.patch('/albums/:id', async (c) => {
  const tenant = c.get('tenant');
  const album = await c.env.DB.prepare('SELECT * FROM albums WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<AlbumRow>();
  if (!album) return c.json({ error: 'Album non trovato' }, 404);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);

  const title_it = body.title_it !== undefined ? cleanText(body.title_it, 200) : album.title_it;
  if (!title_it) return c.json({ error: 'Il titolo (italiano) è obbligatorio' }, 400);
  const title_en = body.title_en !== undefined ? cleanText(body.title_en, 200) : album.title_en;
  const description_it =
    body.description_it !== undefined ? cleanText(body.description_it, 1000) : album.description_it;
  const description_en =
    body.description_en !== undefined ? cleanText(body.description_en, 1000) : album.description_en;
  const published =
    body.published !== undefined ? (body.published ? 1 : 0) : album.published;

  await c.env.DB.prepare(
    `UPDATE albums SET title_it = ?, title_en = ?, description_it = ?, description_en = ?, published = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(title_it, title_en, description_it, description_en, published, album.id, tenant.id)
    .run();
  return c.json({ ok: true });
});

galleryRoutes.delete('/albums/:id', async (c) => {
  const tenant = c.get('tenant');
  const album = await c.env.DB.prepare('SELECT id FROM albums WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<{ id: string }>();
  if (!album) return c.json({ error: 'Album non trovato' }, 404);
  const media = await c.env.DB.prepare(
    'SELECT r2_key, thumb_key FROM media WHERE album_id = ? AND tenant_id = ?'
  )
    .bind(album.id, tenant.id)
    .all<{ r2_key: string | null; thumb_key: string | null }>();
  const keys = media.results
    .flatMap((m) => [m.r2_key, m.thumb_key])
    .filter((k): k is string => k !== null);
  if (keys.length > 0) await c.env.MEDIA.delete(keys);
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM media WHERE album_id = ? AND tenant_id = ?').bind(
      album.id,
      tenant.id
    ),
    c.env.DB.prepare('DELETE FROM albums WHERE id = ? AND tenant_id = ?').bind(album.id, tenant.id),
  ]);
  return c.json({ ok: true });
});

galleryRoutes.post('/albums/reorder', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json<{ ids?: unknown }>().catch(() => ({}) as never);
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : [];
  if (ids.length === 0 || ids.length > 500) return c.json({ error: 'Elenco di elementi non valido' }, 400);
  const stmt = c.env.DB.prepare('UPDATE albums SET position = ? WHERE id = ? AND tenant_id = ?');
  await c.env.DB.batch(ids.map((id, index) => stmt.bind(index, id, tenant.id)));
  return c.json({ ok: true });
});

// Crea l'elemento. Per foto/video restituisce l'id da usare poi con
// PUT /media/:id/file; per i link YouTube/Vimeo è già completo.
galleryRoutes.post('/albums/:albumId/media', async (c) => {
  const tenant = c.get('tenant');
  const album = await c.env.DB.prepare('SELECT id FROM albums WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('albumId'), tenant.id)
    .first<{ id: string }>();
  if (!album) return c.json({ error: 'Album non trovato' }, 404);

  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const kind = body.kind;
  if (kind !== 'image' && kind !== 'video' && kind !== 'embed') {
    return c.json({ error: 'Tipo di contenuto non valido' }, 400);
  }

  let embed_url: string | null = null;
  let embed_thumb_url: string | null = null;
  if (kind === 'embed') {
    const parsed = parseEmbedUrl(cleanText(body.embed_url, 500));
    if (!parsed) {
      return c.json({ error: 'Link non riconosciuto: incolla un link YouTube o Vimeo' }, 400);
    }
    embed_url = parsed.embed_url;
    embed_thumb_url = parsed.thumb_url;
  }

  const pos = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(position) + 1, 0) AS p FROM media WHERE album_id = ?'
  )
    .bind(album.id)
    .first<{ p: number }>();
  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO media (id, tenant_id, album_id, kind, embed_url, embed_thumb_url, caption_it, caption_en, position, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      tenant.id,
      album.id,
      kind,
      embed_url,
      embed_thumb_url,
      cleanText(body.caption_it, 500),
      cleanText(body.caption_en, 500),
      pos?.p ?? 0,
      body.published === false ? 0 : 1
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(id).first<MediaRow>();
  return c.json({ media: mediaDto(row as MediaRow) });
});

// Riceve il file binario (originale o miniatura) e lo salva su R2 in streaming.
galleryRoutes.put('/media/:id/file', async (c) => {
  const tenant = c.get('tenant');
  const media = await c.env.DB.prepare('SELECT * FROM media WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<MediaRow>();
  if (!media) return c.json({ error: 'Elemento non trovato' }, 404);
  if (media.kind === 'embed') return c.json({ error: 'I link non prevedono upload di file' }, 400);

  const variant = c.req.query('variant') === 'thumb' ? 'thumb' : 'original';
  const size = Number(c.req.header('content-length') ?? '0');
  const max =
    variant === 'thumb' ? MAX_THUMB_BYTES : media.kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!size) return c.json({ error: 'File vuoto o dimensione sconosciuta' }, 400);
  if (size > max) {
    return c.json({ error: `File troppo grande: il limite è ${Math.round(max / MB)} MB` }, 413);
  }
  const contentType = c.req.header('content-type') ?? 'application/octet-stream';
  // Allowlist dei tipi di file: solo immagini per foto e miniature, solo
  // video per i video.
  const expected = variant === 'thumb' || media.kind === 'image' ? 'image/' : 'video/';
  if (!contentType.startsWith(expected)) {
    return c.json(
      { error: expected === 'image/' ? 'Il file deve essere un’immagine' : 'Il file deve essere un video' },
      400
    );
  }
  const key = `${tenant.id}/${media.id}/${variant}`;
  await c.env.MEDIA.put(key, c.req.raw.body, { httpMetadata: { contentType } });
  if (variant === 'thumb') {
    await c.env.DB.prepare('UPDATE media SET thumb_key = ? WHERE id = ?').bind(key, media.id).run();
  } else {
    await c.env.DB.prepare('UPDATE media SET r2_key = ?, content_type = ? WHERE id = ?')
      .bind(key, contentType, media.id)
      .run();
  }
  return c.json({ ok: true, url: `/files/${key}` });
});

galleryRoutes.patch('/media/:id', async (c) => {
  const tenant = c.get('tenant');
  const media = await c.env.DB.prepare('SELECT * FROM media WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<MediaRow>();
  if (!media) return c.json({ error: 'Elemento non trovato' }, 404);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);

  let embed_url = media.embed_url;
  let embed_thumb_url = media.embed_thumb_url;
  if (media.kind === 'embed' && body.embed_url !== undefined) {
    const parsed = parseEmbedUrl(cleanText(body.embed_url, 500));
    if (!parsed) {
      return c.json({ error: 'Link non riconosciuto: incolla un link YouTube o Vimeo' }, 400);
    }
    embed_url = parsed.embed_url;
    embed_thumb_url = parsed.thumb_url;
  }

  await c.env.DB.prepare(
    `UPDATE media SET caption_it = ?, caption_en = ?, published = ?, embed_url = ?, embed_thumb_url = ?
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(
      body.caption_it !== undefined ? cleanText(body.caption_it, 500) : media.caption_it,
      body.caption_en !== undefined ? cleanText(body.caption_en, 500) : media.caption_en,
      body.published !== undefined ? (body.published ? 1 : 0) : media.published,
      embed_url,
      embed_thumb_url,
      media.id,
      tenant.id
    )
    .run();
  return c.json({ ok: true });
});

galleryRoutes.delete('/media/:id', async (c) => {
  const tenant = c.get('tenant');
  const media = await c.env.DB.prepare('SELECT * FROM media WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<MediaRow>();
  if (!media) return c.json({ error: 'Elemento non trovato' }, 404);
  const keys = [media.r2_key, media.thumb_key].filter((k): k is string => k !== null);
  if (keys.length > 0) await c.env.MEDIA.delete(keys);
  await c.env.DB.prepare('DELETE FROM media WHERE id = ? AND tenant_id = ?')
    .bind(media.id, tenant.id)
    .run();
  return c.json({ ok: true });
});

galleryRoutes.post('/media/reorder', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json<{ ids?: unknown }>().catch(() => ({}) as never);
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : [];
  if (ids.length === 0 || ids.length > 500) return c.json({ error: 'Elenco di elementi non valido' }, 400);
  const stmt = c.env.DB.prepare('UPDATE media SET position = ? WHERE id = ? AND tenant_id = ?');
  await c.env.DB.batch(ids.map((id, index) => stmt.bind(index, id, tenant.id)));
  return c.json({ ok: true });
});
