import type { CSSProperties } from 'react';
import type { SiteStyle, TenantTheme } from '../../types';
import { Field, Input } from '../../ui';

// Valori usati quando il cliente non ha ancora scelto nulla: coincidono con i
// predefiniti del componente di embed.
export const SITE_DEFAULTS: Required<Omit<SiteStyle, 'font' | 'accent' | 'bg' | 'text' | 'muted'>> = {
  layout: 'grid',
  columns: '260',
  gap: '18',
  radius: '12',
  ratio: '4/3',
  captions: 'below',
  hover: 'zoom',
  header: 'off',
};

export function siteValue(site: SiteStyle, key: keyof typeof SITE_DEFAULTS): string {
  return site[key] || SITE_DEFAULTS[key];
}

const LAYOUTS = [
  { v: 'grid', label: 'Griglia' },
  { v: 'masonry', label: 'Muratura' },
  { v: 'carousel', label: 'Carosello' },
  { v: 'list', label: 'Elenco' },
];
const RATIOS = [
  { v: '4/3', label: 'Classico 4:3' },
  { v: '1/1', label: 'Quadrato' },
  { v: '3/2', label: 'Fotografico 3:2' },
  { v: '16/9', label: 'Panoramico 16:9' },
];
const CAPTIONS = [
  { v: 'below', label: 'Sotto la foto' },
  { v: 'overlay', label: 'Sopra la foto' },
  { v: 'hover', label: 'Al passaggio del mouse' },
  { v: 'off', label: 'Nascoste' },
];
const HOVERS = [
  { v: 'zoom', label: 'Ingrandimento' },
  { v: 'lift', label: 'Sollevamento' },
  { v: 'fade', label: 'Schiarita' },
  { v: 'none', label: 'Nessuno' },
];

const selectCls =
  'w-full rounded-theme-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent';

export function SiteStyleEditor({
  site,
  onChange,
}: {
  site: SiteStyle;
  onChange: (next: SiteStyle) => void;
}) {
  const set = (key: keyof SiteStyle) => (value: string) => onChange({ ...site, [key]: value });

  const select = (
    key: keyof typeof SITE_DEFAULTS,
    label: string,
    options: { v: string; label: string }[],
    hint?: string
  ) => (
    <Field label={label} hint={hint}>
      <select
        value={siteValue(site, key)}
        onChange={(e) => set(key)(e.target.value)}
        className={selectCls}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );

  const number = (key: keyof typeof SITE_DEFAULTS, label: string, hint: string) => (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        min={0}
        max={2000}
        value={siteValue(site, key)}
        onChange={(e) => set(key)(e.target.value)}
      />
    </Field>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-soft">
        Come appare la galleria <strong className="text-ink">sul sito del cliente</strong>. Sono
        impostazioni salvate sul cliente: si applicano subito, senza ripubblicare il sito.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {select('layout', 'Disposizione', LAYOUTS)}
        {select('ratio', 'Proporzioni delle foto', RATIOS)}
        {select('captions', 'Didascalie', CAPTIONS)}
        {select('hover', 'Effetto al passaggio', HOVERS)}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {number('columns', 'Larghezza colonna', 'In pixel: più è alta, meno foto per riga')}
        {number('gap', 'Spazio tra le foto', 'In pixel')}
        {number('radius', 'Angoli', 'In pixel: 0 per angoli vivi')}
      </div>

      <Field
        label="Intestazione"
        hint="Mostra il nome e il logo del cliente sopra la galleria."
      >
        <select
          value={siteValue(site, 'header')}
          onChange={(e) => set('header')(e.target.value)}
          className={selectCls}
        >
          <option value="off">Nessuna intestazione</option>
          <option value="on">Mostra nome e logo</option>
        </select>
      </Field>

      <fieldset className="rounded-theme-sm border border-line p-4">
        <legend className="px-1 text-sm font-semibold text-ink">
          Colori e font della vetrina (facoltativi)
        </legend>
        <p className="mb-3 text-xs text-soft">
          Se li lasci vuoti, la vetrina usa i colori del cliente e il font del sito che la ospita.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Colore di rilievo">
            <Input
              value={site.accent ?? ''}
              onChange={(e) => set('accent')(e.target.value)}
              placeholder="come il tema del cliente"
            />
          </Field>
          <Field label="Colore del testo">
            <Input
              value={site.text ?? ''}
              onChange={(e) => set('text')(e.target.value)}
              placeholder="come il sito"
            />
          </Field>
          <Field label="Sfondo">
            <Input
              value={site.bg ?? ''}
              onChange={(e) => set('bg')(e.target.value)}
              placeholder="trasparente"
            />
          </Field>
          <Field label="Font">
            <Input
              value={site.font ?? ''}
              onChange={(e) => set('font')(e.target.value)}
              placeholder="come il sito"
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}

/* ---------- Anteprima dal vivo ---------- */

const SWATCHES = ['#c9926b', '#8fa37a', '#b5806d'];

export function SiteStylePreview({
  site,
  theme,
  name,
}: {
  site: SiteStyle;
  theme: TenantTheme;
  name: string;
}) {
  const layout = siteValue(site, 'layout');
  const captions = siteValue(site, 'captions');
  const radius = `${siteValue(site, 'radius')}px`;
  const gap = `${siteValue(site, 'gap')}px`;
  const ratio = siteValue(site, 'ratio').replace('/', ' / ');
  const text = site.text || theme.text || '#1a1814';
  const bg = site.bg || '#ffffff';
  const accent = site.accent || theme.accent || '#9a7830';

  const listStyle: CSSProperties =
    layout === 'carousel'
      ? { display: 'flex', gap, overflow: 'hidden' }
      : layout === 'list'
        ? { display: 'grid', gap }
        : { display: 'grid', gap, gridTemplateColumns: 'repeat(3, 1fr)' };

  return (
    <div
      className="rounded-theme-sm border border-line p-4"
      style={{ background: bg, color: text, fontFamily: site.font || undefined }}
    >
      {siteValue(site, 'header') === 'on' && (
        <div className="mb-3 flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded text-[11px] font-bold text-white"
            style={{ background: accent }}
          >
            {name.slice(0, 2).toUpperCase() || 'AG'}
          </span>
          <span className="text-base font-semibold">{name || 'Nome cliente'}</span>
        </div>
      )}
      <p className="mb-2 text-sm font-semibold">La sala</p>
      <div style={listStyle}>
        {SWATCHES.map((color, i) => {
          const tile = (
            <div
              key={color}
              style={{
                flex: layout === 'carousel' ? '0 0 46%' : undefined,
                display: layout === 'list' ? 'grid' : undefined,
                gridTemplateColumns: layout === 'list' ? '32% 1fr' : undefined,
                gap: layout === 'list' ? gap : undefined,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: layout === 'masonry' ? `1 / ${1 + i * 0.25}` : ratio,
                  borderRadius: radius,
                  overflow: 'hidden',
                  background: `linear-gradient(140deg, ${color}, ${color}99)`,
                }}
              >
                {(captions === 'overlay' || captions === 'hover') && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 'auto 0 0 0',
                      padding: '18px 8px 6px',
                      color: '#fff',
                      fontSize: 11,
                      opacity: captions === 'hover' ? 0.45 : 1,
                      background: 'linear-gradient(to top, rgba(0,0,0,.75), transparent)',
                    }}
                  >
                    <b>Sala principale</b>
                  </div>
                )}
              </div>
              {captions === 'below' && (
                <div style={{ marginTop: layout === 'list' ? 0 : 6, fontSize: 11 }}>
                  <b style={{ display: 'block' }}>Sala principale</b>
                  <span style={{ opacity: 0.7 }}>40 coperti</span>
                </div>
              )}
            </div>
          );
          return tile;
        })}
      </div>
      {captions === 'hover' && (
        <p className="mt-2 text-[11px]" style={{ opacity: 0.6 }}>
          Le didascalie compaiono al passaggio del mouse.
        </p>
      )}
    </div>
  );
}
