export function newId(): string {
  return crypto.randomUUID();
}

export function cleanText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

// Chiavi ammesse nel tema di un tenant: tutto il resto viene scartato.
const THEME_KEYS = [
  'accent',
  'bg',
  'surface',
  'surface2',
  'text',
  'textSoft',
  'border',
  'radius',
  'font',
  'logo',
] as const;

// Aspetto della vetrina sul sito del cliente. Sono dati, non codice: si
// cambiano dal pannello e i siti li applicano da soli, senza toccare il backend
// né ridistribuire nulla.
const SITE_KEYS = [
  'layout', // grid | masonry | carousel | list
  'columns', // larghezza minima colonna (px)
  'gap', // spazio tra gli elementi (px)
  'radius', // arrotondamento (px)
  'ratio', // 1/1, 4/3, 16/9, auto
  'captions', // below | overlay | hover | off
  'hover', // zoom | lift | fade | none
  'header', // on | off — nome e logo del cliente sopra la vetrina
  'font',
  'accent',
  'bg',
  'text',
  'muted',
] as const;

export type SanitizedTheme = Record<string, string | Record<string, string>>;

export function sanitizeTheme(input: unknown): SanitizedTheme {
  const out: SanitizedTheme = {};
  if (typeof input !== 'object' || input === null) return out;
  const src = input as Record<string, unknown>;

  for (const key of THEME_KEYS) {
    const value = src[key];
    if (typeof value === 'string' && value.length <= 300) out[key] = value;
  }

  if (typeof src.site === 'object' && src.site !== null) {
    const site: Record<string, string> = {};
    const rawSite = src.site as Record<string, unknown>;
    for (const key of SITE_KEYS) {
      const value = rawSite[key];
      if (typeof value === 'string' && value.length <= 300) site[key] = value;
    }
    if (Object.keys(site).length > 0) out.site = site;
  }

  return out;
}

export interface EmbedInfo {
  provider: 'youtube' | 'vimeo';
  embed_url: string;
  thumb_url: string | null;
}

// Accetta link YouTube (watch, shorts, youtu.be, embed) e Vimeo e li normalizza
// nell'URL da usare dentro un iframe.
export function parseEmbedUrl(raw: string): EmbedInfo | null {
  const url = raw.trim();
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,20})/
  );
  if (yt) {
    const id = yt[1];
    return {
      provider: 'youtube',
      embed_url: `https://www.youtube-nocookie.com/embed/${id}`,
      thumb_url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if (vimeo) {
    return {
      provider: 'vimeo',
      embed_url: `https://player.vimeo.com/video/${vimeo[1]}`,
      thumb_url: null,
    };
  }
  return null;
}

export async function deleteR2Prefix(bucket: R2Bucket, prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const listing = await bucket.list({ prefix, cursor });
    if (listing.objects.length > 0) {
      await bucket.delete(listing.objects.map((o) => o.key));
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);
}

/* ---------- Articoli (Notizie) ---------- */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Elenco separato da virgole: pochi tag per un blog di piccola attività non
// giustificano una tabella a parte.
export function cleanTags(value: unknown): string {
  if (typeof value !== 'string') return '';
  const tags = value
    .split(',')
    .map((t) => t.trim().slice(0, 30))
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 10).join(', ');
}

// Tag e attributi che l'editor del pannello può davvero produrre. Qualsiasi
// altra cosa arrivi dall'API (l'editor è solo un client: il testo può arrivare
// anche da una chiamata diretta) viene rimossa prima di salvare, perché questo
// HTML finisce reso così com'è sia nel pannello sia sulle pagine pubbliche.
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'img',
  'hr',
  'code',
  'pre',
]);
// Rimossi insieme al loro contenuto: non hanno un uso legittimo nel corpo di
// un articolo e sono i vettori classici di script injection.
const STRIP_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'svg',
  'math',
  'link',
  'meta',
  'base',
]);

export async function sanitizePostHtml(html: string, origin: string): Promise<string> {
  if (!html) return '';
  const rewriter = new HTMLRewriter().on('*', {
    element(el) {
      const tag = el.tagName.toLowerCase();
      if (STRIP_WITH_CONTENT.has(tag)) {
        el.remove();
        return;
      }
      if (!ALLOWED_TAGS.has(tag)) {
        // Tag sconosciuto (es. <div>, <span> incollati da Word): si tiene il
        // testo, si scarta solo il contenitore.
        el.removeAndKeepContent();
        return;
      }
      const attrs = [...el.attributes];
      for (const [name] of attrs) {
        if (tag === 'a' && name === 'href') {
          const href = el.getAttribute('href') ?? '';
          if (!/^(https?:|mailto:)/i.test(href.trim())) el.removeAttribute('href');
          continue;
        }
        if (tag === 'img' && name === 'src') {
          const src = el.getAttribute('src') ?? '';
          if (!/^https?:\/\//i.test(src.trim()) && !src.startsWith(origin)) {
            el.removeAttribute('src');
          }
          continue;
        }
        if (tag === 'img' && name === 'alt') continue;
        el.removeAttribute(name);
      }
      if (tag === 'a' && el.getAttribute('href')) {
        // Il sito che lo ospita non è il nostro: mai passargli l'opener.
        el.setAttribute('rel', 'noopener noreferrer nofollow ugc');
        el.setAttribute('target', '_blank');
      }
    },
  });
  const result = rewriter.transform(new Response(html));
  return await result.text();
}
