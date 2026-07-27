import type { PostRow, TenantRow } from './types';
import type { SanitizedTheme } from './util';

// Pagine pubbliche renderizzate lato server (non JavaScript): servono perché
// Google e le anteprime di condivisione (WhatsApp, Facebook…) leggono l'HTML
// della risposta, non quello che uno script costruirebbe nel browser.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string, lang: 'it' | 'en'): string {
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function effectiveDate(p: Pick<PostRow, 'publish_at' | 'created_at'>): string {
  return p.publish_at ?? p.created_at;
}

function pick(p: PostRow, field: 'title' | 'excerpt' | 'body', lang: 'it' | 'en'): string {
  const it = p[`${field}_it`] as string;
  const en = p[`${field}_en`] as string;
  return lang === 'en' && en.trim() !== '' ? en : it;
}

function articleUrl(origin: string, tenantSlug: string, postSlug: string, lang: 'it' | 'en'): string {
  const base = `${origin}/n/${tenantSlug}/${postSlug}`;
  return lang === 'en' ? `${base}?lang=en` : base;
}

function pageChrome(theme: SanitizedTheme): string {
  const accent = typeof theme.accent === 'string' ? theme.accent : '#c0392b';
  const bg = typeof theme.bg === 'string' ? theme.bg : '#f8f5f0';
  const text = typeof theme.text === 'string' ? theme.text : '#1a1814';
  return `:root{--accent:${accent};--bg:${bg};--text:${text}}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 Georgia,'Times New Roman',serif}
.wrap{max-width:720px;margin:0 auto;padding:48px 20px 80px}
a{color:var(--accent)}
.eyebrow{font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 8px}
h1{font-size:2rem;line-height:1.2;margin:0 0 12px}
.meta{color:#8a8378;font:14px system-ui,sans-serif;margin:0 0 32px}
.cover{width:100%;max-height:420px;object-fit:cover;border-radius:14px;margin:0 0 32px}
.body img{max-width:100%;height:auto;border-radius:10px;margin:1.2em 0}
.body h2,.body h3{margin-top:1.6em}
.body blockquote{margin:1.4em 0;padding-left:1em;border-left:3px solid var(--accent);color:#5a544a}
.tags{margin-top:40px;display:flex;gap:8px;flex-wrap:wrap}
.tag{font:12px system-ui,sans-serif;background:rgba(0,0,0,.06);padding:4px 10px;border-radius:999px}
.back{display:inline-block;margin-bottom:24px;font:14px system-ui,sans-serif;text-decoration:none}
.card{display:block;margin-bottom:28px;text-decoration:none;color:inherit}
.card h2{font-size:1.3rem;margin:0 0 6px}
.card p{color:#5a544a;margin:0}
.empty{color:#8a8378;font:15px system-ui,sans-serif}`;
}

export function renderArticlePage(opts: {
  tenant: TenantRow;
  theme: SanitizedTheme;
  post: PostRow;
  lang: 'it' | 'en';
  origin: string;
}): string {
  const { tenant, theme, post, lang, origin } = opts;
  const title = pick(post, 'title', lang);
  const excerpt = pick(post, 'excerpt', lang) || pick(post, 'title', lang);
  const body = pick(post, 'body', lang);
  const cover = post.cover_key ? `${origin}/files/${post.cover_key}` : null;
  const url = articleUrl(origin, tenant.slug, post.slug, lang);
  const altUrl = articleUrl(origin, tenant.slug, post.slug, lang === 'en' ? 'it' : 'en');
  const tags = post.tags
    ? post.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(tenant.name)}</title>
<meta name="description" content="${escapeHtml(excerpt.slice(0, 300))}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="it" href="${articleUrl(origin, tenant.slug, post.slug, 'it')}">
<link rel="alternate" hreflang="en" href="${articleUrl(origin, tenant.slug, post.slug, 'en')}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(excerpt.slice(0, 300))}">
<meta property="og:url" content="${url}">
${cover ? `<meta property="og:image" content="${cover}">\n` : ''}<meta name="twitter:card" content="${cover ? 'summary_large_image' : 'summary'}">
<style>${pageChrome(theme)}</style>
</head>
<body>
<div class="wrap">
<a class="back" href="/n/${tenant.slug}${lang === 'en' ? '?lang=en' : ''}">← ${lang === 'en' ? 'All news' : 'Tutte le notizie'}</a>
<p class="eyebrow">${escapeHtml(tenant.name)}</p>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${formatDate(effectiveDate(post), lang)}${lang === 'en' ? ' · ' : ' · '}<a href="${altUrl}">${lang === 'en' ? 'Leggi in italiano' : 'Read in English'}</a></p>
${cover ? `<img class="cover" src="${cover}" alt="">\n` : ''}<div class="body">${body}</div>
${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>\n` : ''}</div>
</body>
</html>`;
}

export function renderIndexPage(opts: {
  tenant: TenantRow;
  theme: SanitizedTheme;
  posts: PostRow[];
  lang: 'it' | 'en';
  origin: string;
}): string {
  const { tenant, theme, posts, lang, origin } = opts;
  const heading = lang === 'en' ? 'News' : 'Notizie';
  const empty = lang === 'en' ? 'No articles published yet.' : 'Nessun articolo pubblicato per ora.';
  const cards = posts
    .map((p) => {
      const title = pick(p, 'title', lang);
      const excerpt = pick(p, 'excerpt', lang);
      return `<a class="card" href="${articleUrl(origin, tenant.slug, p.slug, lang)}">
<h2>${escapeHtml(title)}</h2>
<p class="meta">${formatDate(effectiveDate(p), lang)}</p>
${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
</a>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading} — ${escapeHtml(tenant.name)}</title>
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(tenant.name)}" href="${origin}/api/public/${tenant.slug}/feed.xml">
<style>${pageChrome(theme)}</style>
</head>
<body>
<div class="wrap">
<p class="eyebrow">${escapeHtml(tenant.name)}</p>
<h1>${heading}</h1>
${posts.length ? cards : `<p class="empty">${empty}</p>`}
</div>
</body>
</html>`;
}

export function renderRss(opts: { tenant: TenantRow; posts: PostRow[]; origin: string }): string {
  const { tenant, posts, origin } = opts;
  const items = posts
    .map((p) => {
      const url = articleUrl(origin, tenant.slug, p.slug, 'it');
      return `<item>
<title>${escapeHtml(pick(p, 'title', 'it'))}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${new Date(effectiveDate(p)).toUTCString()}</pubDate>
<description>${escapeHtml(pick(p, 'excerpt', 'it') || pick(p, 'title', 'it'))}</description>
</item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${escapeHtml(tenant.name)}</title>
<link>${origin}/n/${tenant.slug}</link>
<description>${escapeHtml(`Notizie di ${tenant.name}`)}</description>
<language>it</language>
${items}
</channel></rss>`;
}
