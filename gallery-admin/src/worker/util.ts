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
