/*
 * vetrina.js — mostra la galleria di un cliente dentro il suo sito.
 *
 * Il design è personalizzabile al 100% su tre livelli, nessuno dei quali
 * richiede di toccare il backend:
 *
 *   1. DAL PANNELLO (zero codice) — nome, logo, colori, layout, proporzioni,
 *      posizione delle didascalie ed effetti sono salvati sul cliente e questo
 *      script li applica da solo.
 *   2. CON I CSS DEL SITO — variabili CSS e classi stabili (`.vt-*`), oppure
 *      data-styles="off" per non ricevere alcuno stile e scrivere tutto tu.
 *   3. CON IL TUO MARKUP — un hook di rendering per i singoli elementi, o la
 *      modalità headless (data-render="off") in cui lo script si limita a
 *      portarti i dati e disegni tutto tu.
 *
 * Uso minimo:
 *   <div id="vetrina"></div>
 *   <script src="https://pannello.tuaagenzia.it/embed/vetrina.js"
 *           data-slug="da-mario" data-target="#vetrina" defer></script>
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
  function warn(msg) { console.warn('[vetrina] ' + msg); }

  var locale = attr('locale', 'it') === 'en' ? 'en' : 'it';
  var onlyAlbum = attr('album', '');
  var withStyles = attr('styles', 'on') !== 'off';
  var withRender = attr('render', 'on') !== 'off';
  var apiBase = new URL('..', script.src).href.replace(/\/$/, '');

  var T = {
    it: { loading: 'Caricamento della galleria…', empty: 'Nessun contenuto disponibile.',
          error: 'Galleria momentaneamente non disponibile.', close: 'Chiudi',
          prev: 'Precedente', next: 'Successivo', video: 'Riproduci il video' },
    en: { loading: 'Loading gallery…', empty: 'No content available.',
          error: 'Gallery temporarily unavailable.', close: 'Close',
          prev: 'Previous', next: 'Next', video: 'Play video' }
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
  mount.classList.add('vt-root');

  /* ---------------- Stili di base ----------------
   * Tutto passa da variabili CSS: il sito può ridefinirle, sovrascrivere le
   * classi .vt-* o disattivare del tutto questi stili con data-styles="off".
   */
  if (withStyles && !document.getElementById('vt-styles')) {
    var css = document.createElement('style');
    css.id = 'vt-styles';
    css.textContent = [
      /* valori predefiniti: il pannello e il sito li sovrascrivono */
      '.vt-root{--vt-gap:18px;--vt-radius:12px;--vt-col:260px;--vt-ratio:4/3;',
      '--vt-accent:currentColor;--vt-text:inherit;--vt-muted:inherit;--vt-bg:transparent;',
      '--vt-font:inherit;--vt-cap-align:left;color:var(--vt-text);font-family:var(--vt-font);background:var(--vt-bg)}',
      '.vt-msg{opacity:.7;font-size:.95em;margin:0;padding:12px 0}',

      /* intestazione con nome e logo del cliente */
      '.vt-header{display:flex;align-items:center;gap:14px;margin-bottom:calc(var(--vt-gap) * 1.2)}',
      '.vt-logo{height:44px;width:auto;flex:none}',
      '.vt-name{font-size:1.5em;font-weight:600;margin:0}',

      '.vt-album+.vt-album{margin-top:calc(var(--vt-gap) * 2)}',
      '.vt-album-title{font-size:1.35em;margin:0 0 .2em;font-weight:600}',
      '.vt-album-desc{margin:0 0 .9em;opacity:.75;font-size:.95em;max-width:65ch}',

      /* layout: griglia (predefinito) */
      '.vt-list{margin:0;padding:0;list-style:none;display:grid;gap:var(--vt-gap);',
      'grid-template-columns:repeat(auto-fill,minmax(var(--vt-col),1fr))}',
      '.vt-item{margin:0;min-width:0}',

      /* layout: muratura */
      '[data-vt-layout="masonry"] .vt-list{display:block;columns:var(--vt-col) auto;column-gap:var(--vt-gap)}',
      '[data-vt-layout="masonry"] .vt-item{break-inside:avoid;margin-bottom:var(--vt-gap)}',
      '[data-vt-layout="masonry"] .vt-frame{aspect-ratio:auto}',
      '[data-vt-layout="masonry"] .vt-frame img{height:auto}',

      /* layout: carosello */
      '[data-vt-layout="carousel"] .vt-list{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;',
      'padding-bottom:6px;scrollbar-width:thin}',
      '[data-vt-layout="carousel"] .vt-item{flex:0 0 var(--vt-col);scroll-snap-align:start}',

      /* layout: elenco */
      '[data-vt-layout="list"] .vt-list{grid-template-columns:1fr}',
      '[data-vt-layout="list"] .vt-btn{display:grid;grid-template-columns:minmax(120px,32%) 1fr;gap:var(--vt-gap);align-items:center}',
      '[data-vt-layout="list"] .vt-cap{margin-top:0}',

      '.vt-btn{display:block;width:100%;padding:0;border:0;background:none;cursor:pointer;font:inherit;color:inherit;text-align:var(--vt-cap-align)}',
      '.vt-frame{position:relative;aspect-ratio:var(--vt-ratio);border-radius:var(--vt-radius);overflow:hidden;background:rgba(128,128,128,.14)}',
      '.vt-frame img,.vt-frame video{width:100%;height:100%;object-fit:cover;display:block}',
      '.vt-btn:focus-visible{outline:2px solid var(--vt-accent);outline-offset:3px;border-radius:var(--vt-radius)}',
      '.vt-play{position:absolute;inset:0;margin:auto;width:54px;height:54px;border-radius:999px;',
      'background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;pointer-events:none}',

      /* didascalie: sotto (predefinito), sovrapposte, al passaggio del mouse */
      '.vt-cap{margin-top:.55em;text-align:var(--vt-cap-align)}',
      '.vt-cap-title{display:block;font-weight:600;font-size:.98em;line-height:1.3}',
      '.vt-cap-text{display:block;opacity:.72;font-size:.88em;line-height:1.4;margin-top:.15em}',
      '[data-vt-captions="overlay"] .vt-cap,[data-vt-captions="hover"] .vt-cap{position:absolute;',
      'inset:auto 0 0 0;margin:0;padding:2.2em .8em .7em;color:#fff;',
      'background:linear-gradient(to top,rgba(0,0,0,.78),transparent)}',
      '[data-vt-captions="overlay"] .vt-cap-text,[data-vt-captions="hover"] .vt-cap-text{opacity:.85}',
      '[data-vt-captions="hover"] .vt-cap{opacity:0;transition:opacity .25s ease}',
      '[data-vt-captions="hover"] .vt-btn:hover .vt-cap,[data-vt-captions="hover"] .vt-btn:focus-visible .vt-cap{opacity:1}',
      '[data-vt-captions="off"] .vt-cap{display:none}',

      /* effetti al passaggio del mouse */
      '.vt-frame img,.vt-frame video{transition:transform .45s ease,opacity .3s ease}',
      '[data-vt-hover="zoom"] .vt-btn:hover .vt-frame img{transform:scale(1.05)}',
      '[data-vt-hover="lift"] .vt-item{transition:transform .25s ease,box-shadow .25s ease}',
      '[data-vt-hover="lift"] .vt-btn:hover{transform:translateY(-4px)}',
      '[data-vt-hover="lift"] .vt-btn:hover .vt-frame{box-shadow:0 14px 30px -12px rgba(0,0,0,.45)}',
      '[data-vt-hover="fade"] .vt-btn:hover .vt-frame img{opacity:.72}',

      /* schermo intero */
      '.vt-lb{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.92);display:flex;',
      'align-items:center;justify-content:center;padding:clamp(12px,3vw,40px);font-family:var(--vt-font)}',
      '.vt-lb-stage{max-width:min(1100px,100%);max-height:100%;display:flex;flex-direction:column;gap:14px;align-items:center}',
      '.vt-lb-media{max-width:100%;max-height:74vh;border-radius:8px;display:block;background:#000}',
      '.vt-lb iframe.vt-lb-media{width:min(1000px,86vw);aspect-ratio:16/9;height:auto;border:0}',
      '.vt-lb-text{color:#fff;max-width:70ch;text-align:center}',
      '.vt-lb-title{display:block;font-size:1.1em;font-weight:600}',
      '.vt-lb-text p{margin:.35em 0 0;opacity:.82;font-size:.95em;line-height:1.55;white-space:pre-line}',
      '.vt-nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:999px;',
      'border:0;background:rgba(255,255,255,.14);color:#fff;font-size:22px;cursor:pointer;display:grid;place-items:center}',
      '.vt-nav:hover,.vt-close:hover{background:rgba(255,255,255,.28)}',
      '.vt-prev{left:12px}.vt-next{right:12px}',
      '.vt-close{position:absolute;top:12px;right:12px;width:42px;height:42px;border-radius:999px;border:0;',
      'background:rgba(255,255,255,.14);color:#fff;font-size:26px;line-height:1;cursor:pointer}',
      '@media (prefers-reduced-motion: reduce){.vt-frame img,.vt-frame video,.vt-item,.vt-cap{transition:none}',
      '[data-vt-hover] .vt-btn:hover .vt-frame img{transform:none}}'
    ].join('');
    document.head.appendChild(css);
  }

  /* ---------------- Utility ---------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;   // sempre testo, mai HTML dai dati
    return n;
  }
  function pick(field) {
    if (!field) return '';
    return (field[locale] || field.it || field.en || '').trim();
  }
  function px(v) { return /^\d+$/.test(String(v)) ? v + 'px' : v; }
  var playIcon = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

  // Precedenza: attributo sul tag <script> → impostazione del cliente nel
  // pannello → valore predefinito. Così il sito può sempre avere l'ultima parola.
  function setting(name, siteCfg, fallback) {
    var fromAttr = script.getAttribute('data-' + name);
    if (fromAttr) return fromAttr;
    if (siteCfg && siteCfg[name]) return siteCfg[name];
    return fallback;
  }

  /* ---------------- Caricamento dati ---------------- */
  if (withRender) {
    mount.setAttribute('data-vt-state', 'loading');
    mount.innerHTML = '';
    mount.appendChild(el('p', 'vt-msg', T.loading));
  }

  fetch(apiBase + '/api/public/' + encodeURIComponent(slug), { credentials: 'omit' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      // I dati arrivano sempre, anche in modalità headless: il sito può
      // costruirsi la vetrina da zero ascoltando questo evento.
      mount.dispatchEvent(new CustomEvent('vetrina:data', {
        bubbles: true,
        detail: { tenant: data.tenant, albums: data.albums, locale: locale, mount: mount }
      }));
      if (withRender) render(data);
      else mount.setAttribute('data-vt-state', 'ready');
    })
    .catch(function (err) {
      warn(err.message);
      mount.setAttribute('data-vt-state', 'error');
      mount.dispatchEvent(new CustomEvent('vetrina:error', { bubbles: true, detail: { error: err } }));
      if (withRender) { mount.innerHTML = ''; mount.appendChild(el('p', 'vt-msg', T.error)); }
    });

  /* ---------------- Render ---------------- */
  var flat = [];   // elementi mostrati, per la navigazione a schermo intero

  function render(data) {
    var tenant = data.tenant || {};
    var theme = tenant.theme || {};
    var site = theme.site || {};

    // Identità del cliente e aspetto scelto nel pannello → variabili CSS.
    var vars = {
      '--vt-accent': setting('accent', site, theme.accent),
      '--vt-bg': setting('bg', site, ''),
      '--vt-text': setting('text', site, ''),
      '--vt-muted': setting('muted', site, ''),
      '--vt-font': setting('font', site, theme.font),
      '--vt-gap': px(setting('gap', site, '')),
      '--vt-radius': px(setting('radius', site, theme.radius)),
      '--vt-col': px(setting('columns', site, '')),
      '--vt-ratio': setting('ratio', site, '')
    };
    Object.keys(vars).forEach(function (k) {
      if (vars[k]) mount.style.setProperty(k, vars[k]);
    });

    var layout = setting('layout', site, 'grid');
    mount.setAttribute('data-vt-layout', layout);
    mount.setAttribute('data-vt-captions', setting('captions', site, 'below'));
    mount.setAttribute('data-vt-hover', setting('hover', site, 'zoom'));
    if (layout === 'masonry' || layout === 'carousel') mount.style.setProperty('--vt-cap-align', 'left');

    var albums = (data.albums || []).filter(function (a) { return a.media && a.media.length; });
    if (onlyAlbum) {
      albums = albums.filter(function (a) {
        return a.id === onlyAlbum || pick(a.title).toLowerCase() === onlyAlbum.toLowerCase();
      });
    }

    mount.innerHTML = '';
    mount.setAttribute('data-vt-state', 'ready');

    // Nome e logo del cliente, se richiesti.
    if (setting('header', site, 'off') === 'on') {
      var head = el('header', 'vt-header');
      if (theme.logo) {
        var logo = el('img', 'vt-logo');
        logo.src = theme.logo.indexOf('http') === 0 ? theme.logo : apiBase + theme.logo;
        logo.alt = tenant.name || '';
        head.appendChild(logo);
      }
      if (tenant.name) head.appendChild(el('p', 'vt-name', tenant.name));
      mount.appendChild(head);
    }

    if (!albums.length) { mount.appendChild(el('p', 'vt-msg', T.empty)); return; }

    var showTitles = setting('titles', site, 'on') !== 'off';
    albums.forEach(function (album) {
      var section = el('section', 'vt-album');
      section.setAttribute('data-vt-album', album.id);
      if (showTitles) {
        var t = pick(album.title);
        if (t) section.appendChild(el('h2', 'vt-album-title', t));
        var d = pick(album.description);
        if (d) section.appendChild(el('p', 'vt-album-desc', d));
      }
      var list = el('ul', 'vt-list');
      album.media.forEach(function (mediaItem) {
        var index = flat.length;
        flat.push(mediaItem);
        list.appendChild(card(mediaItem, index, album));
      });
      section.appendChild(list);
      mount.appendChild(section);
    });

    mount.dispatchEvent(new CustomEvent('vetrina:ready', { bubbles: true, detail: { mount: mount } }));
  }

  function card(m, index, album) {
    var li = el('li', 'vt-item');
    li.setAttribute('data-vt-kind', m.kind);
    li.setAttribute('data-vt-id', m.id);

    // Hook di rendering: se il sito ne definisce uno, il markup interno è
    // interamente suo. Restituendo un nodo o una stringa HTML.
    var hook = window.Vetrina && window.Vetrina.renderItem;
    if (typeof hook === 'function') {
      var custom = hook(m, { index: index, album: album, locale: locale, open: function () { openLightbox(index); } });
      if (custom) {
        if (typeof custom === 'string') li.innerHTML = custom;
        else li.appendChild(custom);
        return li;
      }
    }

    var btn = el('button', 'vt-btn');
    btn.type = 'button';

    var frame = el('div', 'vt-frame');
    var thumb = m.thumb || m.url;
    if (thumb) {
      var img = el('img');
      img.src = thumb;                 // miniatura leggera nella griglia
      img.alt = pick(m.alt);
      img.loading = 'lazy';
      img.decoding = 'async';
      frame.appendChild(img);
    } else if (m.kind === 'video' && m.url) {
      var v = el('video');
      v.src = m.url; v.muted = true; v.playsInline = true; v.preload = 'metadata';
      frame.appendChild(v);
    }
    if (m.kind !== 'image') {
      var play = el('span', 'vt-play');
      play.innerHTML = playIcon;
      frame.appendChild(play);
    }

    var title = pick(m.title), caption = pick(m.caption);
    var cap = null;
    if (title || caption) {
      cap = el('div', 'vt-cap');
      if (title) cap.appendChild(el('span', 'vt-cap-title', title));
      if (caption) cap.appendChild(el('span', 'vt-cap-text', caption));
    }

    // Con le didascalie sovrapposte devono stare dentro al riquadro.
    var mode = mount.getAttribute('data-vt-captions');
    if (cap && (mode === 'overlay' || mode === 'hover')) frame.appendChild(cap);
    btn.appendChild(frame);
    if (cap && mode !== 'overlay' && mode !== 'hover') btn.appendChild(cap);

    btn.setAttribute('aria-label',
      (title || caption || pick(m.alt) || '') + (m.kind !== 'image' ? ' — ' + T.video : ''));
    btn.addEventListener('click', function () { openLightbox(index); });
    li.appendChild(btn);
    return li;
  }

  /* ---------------- Schermo intero ---------------- */
  var lb = null, lbIndex = 0, lastFocus = null;

  function openLightbox(index) {
    if (window.Vetrina && window.Vetrina.onOpen) {
      // Il sito può gestire l'apertura con la propria lightbox.
      if (window.Vetrina.onOpen(flat[index], { index: index, items: flat, locale: locale }) === false) return;
    }
    lbIndex = index;
    lastFocus = document.activeElement;
    lb = el('div', 'vt-lb');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');

    var close = el('button', 'vt-close', '×');
    close.type = 'button'; close.setAttribute('aria-label', T.close);
    close.addEventListener('click', closeLightbox);
    lb.appendChild(close);

    if (flat.length > 1) {
      var prev = el('button', 'vt-nav vt-prev', '‹');
      prev.type = 'button'; prev.setAttribute('aria-label', T.prev);
      prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
      var next = el('button', 'vt-nav vt-next', '›');
      next.type = 'button'; next.setAttribute('aria-label', T.next);
      next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
      lb.appendChild(prev); lb.appendChild(next);
    }

    lb.appendChild(el('div', 'vt-lb-stage'));
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    drawLightbox();
    close.focus();
  }

  function drawLightbox() {
    var m = flat[lbIndex];
    var stage = lb.querySelector('.vt-lb-stage');
    stage.innerHTML = '';

    var node;
    if (m.kind === 'embed' && m.embed_url) {
      node = el('iframe', 'vt-lb-media');
      node.src = m.embed_url;
      node.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      node.allowFullscreen = true;
      node.title = pick(m.title) || pick(m.caption) || 'video';
    } else if (m.kind === 'video' && m.url) {
      node = el('video', 'vt-lb-media');
      node.src = m.url; node.controls = true; node.autoplay = true; node.playsInline = true;
      if (m.thumb) node.poster = m.thumb;
    } else if (m.url || m.thumb) {
      node = el('img', 'vt-lb-media');
      node.src = m.url || m.thumb;      // qui l'originale a piena risoluzione
      node.alt = pick(m.alt);
    }
    if (node) stage.appendChild(node);

    var title = pick(m.title), caption = pick(m.caption), desc = pick(m.description);
    if (title || caption || desc) {
      var box = el('div', 'vt-lb-text');
      if (title) box.appendChild(el('span', 'vt-lb-title', title));
      if (caption) box.appendChild(el('p', 'vt-lb-caption', caption));
      if (desc) box.appendChild(el('p', 'vt-lb-desc', desc));
      stage.appendChild(box);
    }
  }

  function step(delta) {
    lbIndex = (lbIndex + delta + flat.length) % flat.length;
    drawLightbox();
  }

  function onKey(e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight' && flat.length > 1) step(1);
    else if (e.key === 'ArrowLeft' && flat.length > 1) step(-1);
  }

  function closeLightbox() {
    if (!lb) return;
    document.removeEventListener('keydown', onKey);
    lb.remove();
    lb = null;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
})();
