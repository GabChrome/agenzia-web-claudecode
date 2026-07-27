import { Hono } from 'hono';
import type { AppEnv, PostRow } from '../types';
import { requireAuth, resolveTenant } from '../auth';
import { cleanTags, cleanText, newId, sanitizePostHtml, slugify } from '../util';

const MB = 1024 * 1024;
const MAX_COVER_BYTES = 10 * MB;

export const newsRoutes = new Hono<AppEnv>();
newsRoutes.use('*', requireAuth, resolveTenant);

// Testi modificabili per articolo. Il corpo è HTML dell'editor ricco: viene
// sempre passato dalla sanificazione prima di finire nel database, perché è
// reso così com'è sia nel pannello sia sulle pagine pubbliche.
const POST_TEXTS = [
  ['title_it', 200],
  ['title_en', 200],
  ['excerpt_it', 300],
  ['excerpt_en', 300],
] as const;
const BODY_MAX = 60_000;

// "Bozza" / "Programmato" / "Pubblicato" si calcolano al volo dal confronto
// con l'orario attuale: non serve un processo che "scatti" all'ora giusta.
function statusOf(p: Pick<PostRow, 'published' | 'publish_at'>): 'draft' | 'scheduled' | 'published' {
  if (!p.published) return 'draft';
  if (p.publish_at && p.publish_at > new Date().toISOString()) return 'scheduled';
  return 'published';
}

function parseDraft(json: string): Record<string, string> | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, string>) : null;
  } catch {
    return null;
  }
}

// Campi piatti (title_it/title_en…), come mediaDto in gallery.ts: è la
// convenzione delle rotte del pannello. Le rotte pubbliche in public.ts
// usano invece {it, en} annidato — sono API diverse, per consumatori diversi.
function postDto(p: PostRow, includeBody: boolean) {
  return {
    id: p.id,
    slug: p.slug,
    title_it: p.title_it,
    title_en: p.title_en,
    excerpt_it: p.excerpt_it,
    excerpt_en: p.excerpt_en,
    ...(includeBody ? { body_it: p.body_it, body_en: p.body_en } : {}),
    cover: p.cover_key ? `/files/${p.cover_key}` : null,
    tags: p.tags ? p.tags.split(',').map((t) => t.trim()) : [],
    published: p.published,
    publish_at: p.publish_at,
    status: statusOf(p),
    draft: parseDraft(p.draft_json),
    draft_at: p.draft_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

// Genera uno slug dal titolo e lo rende unico per il cliente aggiungendo un
// suffisso numerico in caso di collisione (es. due articoli "Novità").
async function uniqueSlug(
  db: D1Database,
  tenantId: string,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugify(base) || 'articolo';
  const rows = await db
    .prepare(
      `SELECT slug FROM posts WHERE tenant_id = ? AND (slug = ? OR slug LIKE ?) AND id != ?`
    )
    .bind(tenantId, root, `${root}-%`, excludeId ?? '')
    .all<{ slug: string }>();
  const taken = new Set(rows.results.map((r) => r.slug));
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

newsRoutes.get('/', async (c) => {
  const tenant = c.get('tenant');
  const rows = await c.env.DB.prepare('SELECT * FROM posts WHERE tenant_id = ? ORDER BY created_at DESC')
    .bind(tenant.id)
    .all<PostRow>();
  return c.json({ posts: rows.results.map((p) => postDto(p, false)) });
});

newsRoutes.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<PostRow>();
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404);
  return c.json({ post: postDto(post, true) });
});

newsRoutes.post('/', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const title_it = cleanText(body.title_it, 200);
  if (!title_it) return c.json({ error: 'Il titolo (italiano) è obbligatorio' }, 400);

  const origin = new URL(c.req.url).origin;
  const id = newId();
  const slug = await uniqueSlug(c.env.DB, tenant.id, title_it);
  await c.env.DB.prepare(
    `INSERT INTO posts (id, tenant_id, slug, title_it, title_en, excerpt_it, excerpt_en,
                        body_it, body_en, tags, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  )
    .bind(
      id,
      tenant.id,
      slug,
      title_it,
      cleanText(body.title_en, 200),
      cleanText(body.excerpt_it, 300),
      cleanText(body.excerpt_en, 300),
      await sanitizePostHtml(cleanText(body.body_it, BODY_MAX), origin),
      await sanitizePostHtml(cleanText(body.body_en, BODY_MAX), origin),
      cleanTags(body.tags)
    )
    .run();
  const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<PostRow>();
  return c.json({ post: postDto(post as PostRow, true) });
});

newsRoutes.patch('/:id', async (c) => {
  const tenant = c.get('tenant');
  const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<PostRow>();
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404);
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const origin = new URL(c.req.url).origin;

  const title_it = body.title_it !== undefined ? cleanText(body.title_it, 200) : post.title_it;
  if (!title_it) return c.json({ error: 'Il titolo (italiano) è obbligatorio' }, 400);
  const title_en = body.title_en !== undefined ? cleanText(body.title_en, 200) : post.title_en;
  const excerpt_it =
    body.excerpt_it !== undefined ? cleanText(body.excerpt_it, 300) : post.excerpt_it;
  const excerpt_en =
    body.excerpt_en !== undefined ? cleanText(body.excerpt_en, 300) : post.excerpt_en;
  const body_it =
    body.body_it !== undefined
      ? await sanitizePostHtml(cleanText(body.body_it, BODY_MAX), origin)
      : post.body_it;
  const body_en =
    body.body_en !== undefined
      ? await sanitizePostHtml(cleanText(body.body_en, BODY_MAX), origin)
      : post.body_en;
  const tags = body.tags !== undefined ? cleanTags(body.tags) : post.tags;
  const wasPublished = post.published === 1;
  const published = body.published !== undefined ? (body.published ? 1 : 0) : post.published;
  // Lo slug segue il titolo finché l'articolo non è mai stato pubblicato
  // (altrimenti resterebbe legato al titolo segnaposto "Nuovo articolo" per
  // sempre); dopo la prima pubblicazione si blocca, per non rompere link già
  // condivisi o indicizzati.
  let slug = post.slug;
  let slug_locked = post.slug_locked;
  if (!slug_locked && title_it !== post.title_it) {
    slug = await uniqueSlug(c.env.DB, tenant.id, title_it, post.id);
  }
  if (!wasPublished && published === 1) slug_locked = 1;
  const publish_at =
    body.publish_at !== undefined
      ? typeof body.publish_at === 'string' && body.publish_at
        ? new Date(body.publish_at).toISOString()
        : null
      : post.publish_at;

  // Rimozione esplicita della copertina, distinta dal "non toccarla" (assente
  // dal body): il file su R2 va ripulito, non solo scollegato dalla riga.
  let cover_key = post.cover_key;
  let cover_content_type = post.cover_content_type;
  if (body.remove_cover === true && post.cover_key) {
    await c.env.MEDIA.delete(post.cover_key);
    cover_key = null;
    cover_content_type = null;
  }

  // Salvare applica le modifiche e chiude il lavoro in sospeso, come per le foto.
  await c.env.DB.prepare(
    `UPDATE posts SET title_it = ?, title_en = ?, excerpt_it = ?, excerpt_en = ?,
                      body_it = ?, body_en = ?, tags = ?, published = ?, publish_at = ?,
                      cover_key = ?, cover_content_type = ?, slug = ?, slug_locked = ?,
                      draft_json = '', draft_at = NULL, updated_at = datetime('now')
     WHERE id = ? AND tenant_id = ?`
  )
    .bind(
      title_it,
      title_en,
      excerpt_it,
      excerpt_en,
      body_it,
      body_en,
      tags,
      published,
      publish_at,
      cover_key,
      cover_content_type,
      slug,
      slug_locked,
      post.id,
      tenant.id
    )
    .run();
  return c.json({ ok: true, slug });
});

newsRoutes.delete('/:id', async (c) => {
  const tenant = c.get('tenant');
  const post = await c.env.DB.prepare('SELECT cover_key FROM posts WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<{ cover_key: string | null }>();
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404);
  if (post.cover_key) await c.env.MEDIA.delete(post.cover_key);
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .run();
  return c.json({ ok: true });
});

// Immagine di copertina: stesso schema di chiave delle foto della galleria.
newsRoutes.put('/:id/cover', async (c) => {
  const tenant = c.get('tenant');
  const post = await c.env.DB.prepare('SELECT id, cover_key FROM posts WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<{ id: string; cover_key: string | null }>();
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404);

  const size = Number(c.req.header('content-length') ?? '0');
  if (!size) return c.json({ error: 'File vuoto o dimensione sconosciuta' }, 400);
  if (size > MAX_COVER_BYTES) {
    return c.json({ error: `File troppo grande: il limite è ${Math.round(MAX_COVER_BYTES / MB)} MB` }, 413);
  }
  const contentType = c.req.header('content-type') ?? 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return c.json({ error: 'Il file deve essere un’immagine' }, 400);
  }
  const key = `${tenant.id}/posts/${post.id}/cover`;
  await c.env.MEDIA.put(key, c.req.raw.body, { httpMetadata: { contentType } });
  await c.env.DB.prepare('UPDATE posts SET cover_key = ?, cover_content_type = ? WHERE id = ?')
    .bind(key, contentType, post.id)
    .run();
  return c.json({ ok: true, url: `/files/${key}` });
});

// Immagini inserite dentro al corpo dell'articolo: l'editor le carica mentre
// si scrive, prima ancora che l'articolo sia salvato la prima volta.
newsRoutes.put('/upload-image', async (c) => {
  const tenant = c.get('tenant');
  const size = Number(c.req.header('content-length') ?? '0');
  if (!size) return c.json({ error: 'File vuoto o dimensione sconosciuta' }, 400);
  if (size > MAX_COVER_BYTES) {
    return c.json({ error: `File troppo grande: il limite è ${Math.round(MAX_COVER_BYTES / MB)} MB` }, 413);
  }
  const contentType = c.req.header('content-type') ?? 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    return c.json({ error: 'Il file deve essere un’immagine' }, 400);
  }
  const key = `${tenant.id}/posts/inline/${newId()}`;
  await c.env.MEDIA.put(key, c.req.raw.body, { httpMetadata: { contentType } });
  const origin = new URL(c.req.url).origin;
  return c.json({ ok: true, url: `${origin}/files/${key}` });
});

// Salvataggio automatico mentre si scrive: non tocca l'articolo pubblicato.
newsRoutes.put('/:id/draft', async (c) => {
  const tenant = c.get('tenant');
  const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ? AND tenant_id = ?')
    .bind(c.req.param('id'), tenant.id)
    .first<{ id: string }>();
  if (!post) return c.json({ error: 'Articolo non trovato' }, 404);

  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}) as Record<string, unknown>);
  const origin = new URL(c.req.url).origin;
  const draft: Record<string, string> = {};
  for (const [field, max] of POST_TEXTS) {
    if (body[field] !== undefined) draft[field] = cleanText(body[field], max);
  }
  if (body.body_it !== undefined) {
    draft.body_it = await sanitizePostHtml(cleanText(body.body_it, BODY_MAX), origin);
  }
  if (body.body_en !== undefined) {
    draft.body_en = await sanitizePostHtml(cleanText(body.body_en, BODY_MAX), origin);
  }
  if (body.tags !== undefined) draft.tags = cleanTags(body.tags);
  if (body.published !== undefined) draft.published = body.published ? '1' : '0';
  if (typeof body.publish_at === 'string') draft.publish_at = body.publish_at;

  const now = new Date().toISOString();
  await c.env.DB.prepare('UPDATE posts SET draft_json = ?, draft_at = ? WHERE id = ? AND tenant_id = ?')
    .bind(JSON.stringify(draft), now, post.id, tenant.id)
    .run();
  return c.json({ ok: true, draft_at: now });
});

newsRoutes.delete('/:id/draft', async (c) => {
  const tenant = c.get('tenant');
  await c.env.DB.prepare(
    "UPDATE posts SET draft_json = '', draft_at = NULL WHERE id = ? AND tenant_id = ?"
  )
    .bind(c.req.param('id'), tenant.id)
    .run();
  return c.json({ ok: true });
});

// Pubblica (o rimette in bozza) più articoli con un solo comando.
newsRoutes.post('/publish', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req
    .json<{ ids?: unknown; published?: unknown }>()
    .catch(() => ({}) as never);
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === 'string')
    : [];
  if (ids.length === 0 || ids.length > 500) {
    return c.json({ error: 'Elenco di elementi non valido' }, 400);
  }
  const published = body.published === false ? 0 : 1;
  // Come nel salvataggio singolo: pubblicare per la prima volta blocca lo
  // slug (che fino a quel momento seguiva il titolo). Non pubblicare non lo
  // sblocca mai: un link già condiviso non deve smettere di funzionare.
  const stmt = c.env.DB.prepare(
    `UPDATE posts SET published = ?, slug_locked = CASE WHEN ? = 1 THEN 1 ELSE slug_locked END
     WHERE id = ? AND tenant_id = ?`
  );
  await c.env.DB.batch(ids.map((id) => stmt.bind(published, published, id, tenant.id)));
  return c.json({ ok: true, count: ids.length, published: published === 1 });
});
