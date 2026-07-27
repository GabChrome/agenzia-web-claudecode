/*
 * notizie.js — mostra gli articoli di un cliente dentro il suo sito.
 *
 * Stessa filosofia di vetrina.js, con una scelta in più perché per un blog
 * conta anche essere trovati su Google e avere un'anteprima corretta quando
 * un articolo viene condiviso — cosa che uno script JavaScript da solo non
 * può garantire (i motori di ricerca leggono l'HTML della risposta, non
 * quello che il browser costruirebbe dopo).
 *
 *   data-mode="list" (predefinito) — gli articoli si aprono a schermo intero
 *     sopra la pagina, senza mai lasciare il sito. Comodo, ma l'articolo
 *     singolo non ha un indirizzo web proprio da condividere o indicizzare.
 *   data-mode="link" — ogni scheda porta alla pagina vera dell'articolo
 *     (generata dal pannello, con titolo e anteprima corretti per Google e
 *     social). Consigliata se le notizie contano per la visibilità online.
 *
 * Personalizzazione: variabili CSS e classi stabili (`.nz-*`), oppure
 * data-styles="off" per scrivere tutto da zero. Per il markup dei singoli
 * elementi: window.Notizie.renderItem, o data-render="off" per la modalità
 * headless (l'evento "notizie:data" porta i dati, il markup lo scrivi tu).
 *
 * Uso minimo:
 *   <div id="notizie"></div>
 *   <script src="https://pannello.tuaagenzia.it/embed/notizie.js"
 *           data-slug="da-mario" data-target="#notizie" defer></script>
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var slug = script.getAttribute('data-slug');
  if (!slug) return warn('manca data-slug sul tag <script>');

  var attr = function (name, fallback) {
    var v = script.getAttribute('data-' + name);
    return v === null || v === '' ? fallback : v;
  };
  function warn(msg) { console.warn('[notizie] ' + msg); }

  var locale = attr('locale', 'it') === 'en' ? 'en' : 'it';
  var withStyles = attr('styles', 'on') !== 'off';
  var withRender = attr('render', 'on') !== 'off';
  var mode = attr('mode', 'list') === 'link' ? 'link' : 'list';
  var onlyTag = attr('tag', '');
  var limit = parseInt(attr('limit', ''), 10);
  var apiBase = new URL('..', script.src).href.replace(/\/$/, '');

  var T = {
    it: { loading: 'Caricamento delle notizie…', empty: 'Nessun articolo pubblicato per ora.',
          error: 'Notizie momentaneamente non disponibili.', close: 'Chiudi',
          prev: 'Precedente', next: 'Successivo', readMore: 'Continua a leggere' },
    en: { loading: 'Loading news…', empty: 'No articles published yet.',
          error: 'News temporarily unavailable.', close: 'Close',
          prev: 'Previous', next: 'Next', readMore: 'Read more' }
  }[locale];

  /* ---------------- Contenitore ---------------- */
  var mount, targetSel = script.getAttribute('data-target');
  if (targetSel) {
    mount = document.querySelector(targetSel);
    if (!mount) return warn('contenitore non trovato: ' + targetSel);
  } else {
    mount = document.createElement('div');
    script.parentNode.insertBefore(mount, script);
  }
  mount.classList.add('nz-root');

  /* ---------------- Stili di base ---------------- */
  if (withStyles && !document.getElementById('nz-styles')) {
    var css = document.createElement('style');
    css.id = 'nz-styles';
    css.textContent = [
      '.nz-root{--nz-gap:24px;--nz-radius:12px;--nz-col:280px;--nz-accent:currentColor;',
      '--nz-text:inherit;--nz-muted:inherit;--nz-font:inherit;color:var(--nz-text);font-family:var(--nz-font)}',
      '.nz-msg{opacity:.7;font-size:.95em;margin:0;padding:12px 0}',
      '.nz-list{margin:0;padding:0;list-style:none;display:grid;gap:var(--nz-gap);',
      'grid-template-columns:repeat(auto-fill,minmax(var(--nz-col),1fr))}',
      '.nz-item{margin:0;min-width:0}',
      '.nz-card{display:block;text-decoration:none;color:inherit;cursor:pointer}',
      '.nz-cover{aspect-ratio:16/10;border-radius:var(--nz-radius);overflow:hidden;',
      'background:rgba(128,128,128,.14);margin:0 0 .7em}',
      '.nz-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}',
      '.nz-card:hover .nz-cover img{transform:scale(1.04)}',
      '.nz-date{display:block;font-size:.8em;opacity:.62;margin:0 0 .25em}',
      '.nz-title{margin:0 0 .3em;font-size:1.08em;font-weight:600;line-height:1.35}',
      '.nz-excerpt{margin:0;opacity:.75;font-size:.92em;line-height:1.5}',
      '.nz-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:.6em}',
      '.nz-tag{font-size:.72em;opacity:.65;border:1px solid currentColor;border-radius:999px;padding:2px 9px}',
      '.nz-card:focus-visible{outline:2px solid var(--nz-accent);outline-offset:4px;border-radius:var(--nz-radius)}',

      /* schermo intero (solo in data-mode="list") */
      '.nz-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.5);display:flex;',
      'align-items:flex-start;justify-content:center;overflow-y:auto;padding:clamp(16px,4vw,60px) 16px}',
      '.nz-ov-card{max-width:720px;width:100%;background:var(--nz-bg,#fff);color:var(--nz-text,#1a1a1a);',
      'border-radius:16px;padding:clamp(24px,4vw,48px);position:relative;font-family:var(--nz-font)}',
      '.nz-ov-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:999px;border:0;',
      'background:rgba(128,128,128,.16);font-size:22px;line-height:1;cursor:pointer;color:inherit}',
      '.nz-ov-close:hover{background:rgba(128,128,128,.28)}',
      '.nz-ov-cover{width:100%;max-height:340px;object-fit:cover;border-radius:12px;margin:0 0 20px;display:block}',
      '.nz-ov h2{margin:0 0 6px;font-size:1.5em;line-height:1.25}',
      '.nz-ov .nz-date{margin-bottom:20px}',
      '.nz-ov-body{line-height:1.7;font-size:.98em}',
      '.nz-ov-body > * + *{margin-top:.9em}',
      '.nz-ov-body h2{font-size:1.2em;font-weight:700;margin-top:1.3em}',
      '.nz-ov-body h3{font-size:1.05em;font-weight:700;margin-top:1.1em}',
      '.nz-ov-body a{color:var(--nz-accent)}',
      '.nz-ov-body ul,.nz-ov-body ol{padding-left:1.4em}',
      '.nz-ov-body img{max-width:100%;border-radius:8px}',
      '.nz-ov-body blockquote{border-left:3px solid var(--nz-accent);padding-left:.9em;opacity:.8;margin:0}',
      '.nz-ov-nav{position:sticky;bottom:0;display:flex;justify-content:space-between;margin-top:24px;',
      'padding-top:16px;border-top:1px solid rgba(128,128,128,.2)}',
      '.nz-ov-nav button{border:0;background:none;font:inherit;color:inherit;opacity:.7;cursor:pointer;padding:6px 0}',
      '.nz-ov-nav button:hover{opacity:1}',
      '@media (prefers-reduced-motion: reduce){.nz-cover img{transition:none}}'
    ].join('');
    document.head.appendChild(css);
  }

  /* ---------------- Utility ---------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pick(field) {
    if (!field) return '';
    return (field[locale] || field.it || field.en || '').trim();
  }
  function fmtDate(iso) {
    try {
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    } catch (e) { return iso.slice(0, 10); }
  }

  /* ---------------- Caricamento dati ---------------- */
  if (withRender) {
    mount.setAttribute('data-nz-state', 'loading');
    mount.innerHTML = '';
    mount.appendChild(el('p', 'nz-msg', T.loading));
  }

  fetch(apiBase + '/api/public/' + encodeURIComponent(slug) + '/posts', { credentials: 'omit' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var posts = data.posts || [];
      if (onlyTag) {
        posts = posts.filter(function (p) {
          return p.tags.some(function (t) { return t.toLowerCase() === onlyTag.toLowerCase(); });
        });
      }
      if (limit > 0) posts = posts.slice(0, limit);

      mount.dispatchEvent(new CustomEvent('notizie:data', {
        bubbles: true,
        detail: { tenant: data.tenant, posts: posts, locale: locale, mount: mount }
      }));
      if (withRender) render(data.tenant || {}, posts);
      else mount.setAttribute('data-nz-state', 'ready');
    })
    .catch(function (err) {
      warn(err.message);
      mount.setAttribute('data-nz-state', 'error');
      mount.dispatchEvent(new CustomEvent('notizie:error', { bubbles: true, detail: { error: err } }));
      if (withRender) { mount.innerHTML = ''; mount.appendChild(el('p', 'nz-msg', T.error)); }
    });

  /* ---------------- Render ---------------- */
  var items = [];   // articoli mostrati, per la navigazione a schermo intero

  function render(tenant, posts) {
    var theme = tenant.theme || {};
    if (theme.accent) mount.style.setProperty('--nz-accent', theme.accent);
    if (theme.font) mount.style.setProperty('--nz-font', theme.font);
    if (theme.bg) mount.style.setProperty('--nz-bg', theme.bg);
    if (theme.text) mount.style.setProperty('--nz-text', theme.text);

    items = posts;
    mount.innerHTML = '';
    mount.setAttribute('data-nz-state', 'ready');
    mount.setAttribute('data-nz-mode', mode);

    if (!posts.length) { mount.appendChild(el('p', 'nz-msg', T.empty)); return; }

    var list = el('ul', 'nz-list');
    posts.forEach(function (post, index) { list.appendChild(card(post, index)); });
    mount.appendChild(list);
    mount.dispatchEvent(new CustomEvent('notizie:ready', { bubbles: true, detail: { mount: mount } }));
  }

  function card(p, index) {
    var li = el('li', 'nz-item');
    li.setAttribute('data-nz-id', p.id);

    var hook = window.Notizie && window.Notizie.renderItem;
    if (typeof hook === 'function') {
      var custom = hook(p, { index: index, locale: locale, open: function () { openOverlay(index); } });
      if (custom) {
        if (typeof custom === 'string') li.innerHTML = custom;
        else li.appendChild(custom);
        return li;
      }
    }

    var linkOut = mode === 'link';
    var cardEl = el(linkOut ? 'a' : 'button', 'nz-card');
    if (linkOut) { cardEl.href = p.url; }
    else { cardEl.setAttribute('type', 'button'); }

    if (p.cover) {
      var coverWrap = el('div', 'nz-cover');
      var img = el('img');
      img.src = p.cover;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      coverWrap.appendChild(img);
      cardEl.appendChild(coverWrap);
    }
    cardEl.appendChild(el('span', 'nz-date', fmtDate(p.date)));
    var title = pick(p.title);
    cardEl.appendChild(el('h3', 'nz-title', title));
    var excerpt = pick(p.excerpt);
    if (excerpt) cardEl.appendChild(el('p', 'nz-excerpt', excerpt));
    if (p.tags && p.tags.length) {
      var tags = el('div', 'nz-tags');
      p.tags.forEach(function (t) { tags.appendChild(el('span', 'nz-tag', t)); });
      cardEl.appendChild(tags);
    }
    cardEl.setAttribute('aria-label', title);

    if (!linkOut) {
      cardEl.addEventListener('click', function () {
        if (window.Notizie && window.Notizie.onOpen) {
          if (window.Notizie.onOpen(p, { index: index, items: items, locale: locale }) === false) return;
        }
        openOverlay(index);
      });
    }
    li.appendChild(cardEl);
    return li;
  }

  /* ---------------- Schermo intero (solo data-mode="list") ---------------- */
  var ov = null, ovIndex = 0, lastFocus = null;

  function openOverlay(index) {
    ovIndex = index;
    lastFocus = document.activeElement;
    ov = el('div', 'nz-ov');
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.addEventListener('click', function (e) { if (e.target === ov) closeOverlay(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    drawOverlay();
  }

  function drawOverlay() {
    var p = items[ovIndex];
    ov.innerHTML = '';
    var box = el('div', 'nz-ov-card');

    var close = el('button', 'nz-ov-close', '×');
    close.type = 'button'; close.setAttribute('aria-label', T.close);
    close.addEventListener('click', closeOverlay);
    box.appendChild(close);

    if (p.cover) {
      var img = el('img', 'nz-ov-cover');
      img.src = p.cover; img.alt = '';
      box.appendChild(img);
    }
    box.appendChild(el('span', 'nz-date', fmtDate(p.date)));
    box.appendChild(el('h2', null, pick(p.title)));

    var body = el('div', 'nz-ov-body');
    // HTML già filtrato dal server (sanitizePostHtml) prima di essere salvato:
    // qui ci si fida della risposta dell'API, non di input arbitrario.
    body.innerHTML = pick(p.body) || '';
    box.appendChild(body);

    if (items.length > 1) {
      var nav = el('div', 'nz-ov-nav');
      var prev = el('button', null, '‹ ' + T.prev);
      prev.type = 'button';
      prev.addEventListener('click', function () { step(-1); });
      var next = el('button', null, T.next + ' ›');
      next.type = 'button';
      next.addEventListener('click', function () { step(1); });
      nav.appendChild(prev); nav.appendChild(next);
      box.appendChild(nav);
    }

    ov.appendChild(box);
    close.focus();
  }

  function step(delta) {
    ovIndex = (ovIndex + delta + items.length) % items.length;
    drawOverlay();
    ov.scrollTop = 0;
  }

  function onKey(e) {
    if (e.key === 'Escape') closeOverlay();
  }

  function closeOverlay() {
    if (!ov) return;
    document.removeEventListener('keydown', onKey);
    ov.remove();
    ov = null;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
})();
