import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, uploadFile } from '../api';
import { DEFAULT_THEME, applyTheme } from '../theme';
import type { SiteStyle, TenantSummary, TenantTheme, TenantUser } from '../types';
import { SiteStyleEditor, SiteStylePreview } from './agency/SiteStyle';
import {
  Button,
  Dialog,
  ErrorText,
  Field,
  FullPageSpinner,
  IconPlus,
  Input,
  Toasts,
  useToasts,
} from '../ui';
import { TopBar } from '../components/TopBar';

type DialogState =
  | { mode: 'new' }
  | { mode: 'edit'; tenant: TenantSummary }
  | { mode: 'users'; tenant: TenantSummary }
  | null;

export default function AgencyDashboard() {
  const [tenants, setTenants] = useState<TenantSummary[] | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const { toasts, push } = useToasts();

  useEffect(() => {
    applyTheme(null);
  }, []);

  const load = useCallback(async () => {
    const d = await api<{ tenants: TenantSummary[] }>('/api/tenants');
    setTenants(d.tenants);
  }, []);

  useEffect(() => {
    load().catch((err) => push(errorMessage(err)));
  }, [load, push]);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Gestione Galleria — Clienti" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">I tuoi clienti</h1>
            <p className="mt-1 text-sm text-soft">
              Ogni cliente ha la sua galleria, il suo tema e i suoi accessi, separati dagli altri.
            </p>
          </div>
          <Button onClick={() => setDialog({ mode: 'new' })}>
            <IconPlus size={16} /> Nuovo cliente
          </Button>
        </div>

        {tenants === null ? (
          <FullPageSpinner />
        ) : tenants.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-theme border border-dashed border-line p-8 text-center">
            <p className="text-soft">Non hai ancora clienti: crea il primo per iniziare.</p>
            <Button onClick={() => setDialog({ mode: 'new' })}>
              <IconPlus size={16} /> Crea il primo cliente
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-col gap-3 rounded-theme border border-line bg-surface p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-line"
                    style={{ background: tenant.theme.accent ?? DEFAULT_THEME.accent }}
                  />
                  <span className="min-w-0 truncate text-lg font-bold text-ink">
                    {tenant.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-soft">
                  <code className="rounded bg-surface2 px-1.5 py-0.5">{tenant.slug}</code>
                  <span>{tenant.album_count} album</span>
                  <span>·</span>
                  <span>{tenant.media_count} contenuti</span>
                  <span>·</span>
                  <span>{tenant.user_count} accessi</span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Link
                    to={`/t/${tenant.slug}`}
                    className="inline-flex items-center justify-center rounded-theme-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Apri galleria
                  </Link>
                  <Link
                    to={`/t/${tenant.slug}/notizie`}
                    className="inline-flex items-center justify-center rounded-theme-sm border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface2"
                  >
                    Notizie
                  </Link>
                  <Button variant="ghost" onClick={() => setDialog({ mode: 'edit', tenant })}>
                    Tema e dati
                  </Button>
                  <Button variant="ghost" onClick={() => setDialog({ mode: 'users', tenant })}>
                    Accessi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {dialog && dialog.mode !== 'users' && (
        <TenantDialog
          tenant={dialog.mode === 'edit' ? dialog.tenant : null}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await load();
          }}
        />
      )}
      {dialog && dialog.mode === 'users' && (
        <UsersDialog tenant={dialog.tenant} onClose={() => setDialog(null)} onChanged={load} />
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}

/* ---------- Creazione / modifica cliente e tema ---------- */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function TenantDialog({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: TenantSummary | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const startTheme: TenantTheme = { ...tenant?.theme };
  const [name, setName] = useState(tenant?.name ?? '');
  const [slug, setSlug] = useState(tenant?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(tenant !== null);
  const [accent, setAccent] = useState(startTheme.accent ?? DEFAULT_THEME.accent);
  const [bg, setBg] = useState(startTheme.bg ?? DEFAULT_THEME.bg);
  const [surface, setSurface] = useState(startTheme.surface ?? DEFAULT_THEME.surface);
  const [text, setText] = useState(startTheme.text ?? DEFAULT_THEME.text);
  const [radius, setRadius] = useState(startTheme.radius ?? DEFAULT_THEME.radius);
  const [font, setFont] = useState(startTheme.font ?? '');
  const [logo, setLogo] = useState(startTheme.logo ?? '');
  const [logoBusy, setLogoBusy] = useState(false);
  const [site, setSite] = useState<SiteStyle>(startTheme.site ?? {});
  const [tab, setTab] = useState<'panel' | 'site'>('panel');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const theme: TenantTheme = {
      ...tenant?.theme,
      accent,
      bg,
      surface,
      text,
      radius,
      site,
    };
    if (font.trim()) {
      theme.font = font.trim();
    } else {
      delete theme.font;
    }
    try {
      if (tenant) {
        await api(`/api/tenants/${tenant.id}`, {
          method: 'PATCH',
          body: { name, slug, theme },
        });
      } else {
        await api('/api/tenants', { body: { name, slug, theme } });
      }
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function uploadLogo(file: File | undefined) {
    if (!file || !tenant) return;
    setLogoBusy(true);
    setError('');
    try {
      await uploadFile(`/api/tenants/${tenant.id}/logo`, file, file.type || 'image/png');
      // Ricarica il tema per ottenere l'URL aggiornato del logo.
      const d = await api<{ tenants: TenantSummary[] }>('/api/tenants');
      const updated = d.tenants.find((t) => t.id === tenant.id);
      if (updated?.theme.logo) setLogo(updated.theme.logo);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLogoBusy(false);
    }
  }

  async function removeTenant() {
    if (!tenant) return;
    const typed = window.prompt(
      `Questa operazione elimina il cliente «${tenant.name}», i suoi accessi e TUTTI i suoi contenuti.\n\nPer confermare digita lo slug: ${tenant.slug}`
    );
    if (typed !== tenant.slug) return;
    setBusy(true);
    try {
      await api(`/api/tenants/${tenant.id}`, { method: 'DELETE' });
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title={tenant ? `Cliente: ${tenant.name}` : 'Nuovo cliente'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome del cliente">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              placeholder="Es. Ristorante Da Mario"
            />
          </Field>
          <Field label="Slug" hint="Identifica il cliente negli URL, es. /api/public/da-mario">
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              // Il trattino va sempre in fuga: senza, i browser recenti non
              // compilano il pattern e la validazione viene ignorata.
              pattern="[a-z0-9][a-z0-9\-]*"
              title="Solo lettere minuscole, numeri e trattini"
              placeholder="da-mario"
            />
          </Field>
        </div>

        <div className="flex items-center gap-1 border-b border-line">
          {(
            [
              ['panel', 'Pannello di gestione'],
              ['site', 'Vetrina sul sito'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === id ? 'border-accent text-ink' : 'border-transparent text-soft hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'site' && (
          <>
            <SiteStyleEditor site={site} onChange={setSite} />
            <SiteStylePreview
              site={site}
              theme={{ accent, bg, surface, text, radius, logo }}
              name={name}
            />
          </>
        )}

        <fieldset className={`rounded-theme-sm border border-line p-4 ${tab === 'panel' ? '' : 'hidden'}`}>
          <legend className="px-1 text-sm font-semibold text-ink">
            Come vede il pannello questo cliente
          </legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorField label="Accento" value={accent} onChange={setAccent} />
            <ColorField label="Sfondo" value={bg} onChange={setBg} />
            <ColorField label="Pannelli" value={surface} onChange={setSurface} />
            <ColorField label="Testo" value={text} onChange={setText} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Arrotondamento angoli">
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full rounded-theme-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="6px">Minimo</option>
                <option value="14px">Medio</option>
                <option value="22px">Morbido</option>
              </select>
            </Field>
            <Field label="Font (opzionale)" hint="Es. 'Playfair Display', serif">
              <Input value={font} onChange={(e) => setFont(e.target.value)} />
            </Field>
          </div>

          {tenant && (
            <div className="mt-4">
              <span className="mb-1 block text-sm font-medium text-ink">Logo</span>
              <div className="flex items-center gap-3">
                {logo && (
                  <img
                    src={logo}
                    alt="Logo attuale"
                    className="h-10 w-auto rounded border border-line bg-white p-1"
                  />
                )}
                <label className="inline-flex cursor-pointer items-center rounded-theme-sm border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface2">
                  {logoBusy ? 'Caricamento…' : logo ? 'Sostituisci logo' : 'Carica logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={logoBusy}
                    onChange={(e) => uploadLogo(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Anteprima dal vivo del tema scelto */}
          <div
            className="mt-4 flex items-center justify-between gap-3 border p-4"
            style={{ background: bg, borderColor: 'rgba(0,0,0,0.1)', borderRadius: radius }}
          >
            <div className="flex items-center gap-2">
              {logo && <img src={logo} alt="" className="h-6 w-auto" />}
              <span style={{ color: text, fontFamily: font || undefined }} className="font-bold">
                {name || 'Anteprima'}
              </span>
            </div>
            <span
              className="px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: accent, borderRadius: `calc(${radius} * 0.6)` }}
            >
              Carica foto
            </span>
          </div>
        </fieldset>

        <ErrorText>{error}</ErrorText>
        <div className="flex items-center gap-2">
          {tenant && (
            <Button type="button" variant="danger" onClick={removeTenant} disabled={busy}>
              Elimina cliente
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Salvataggio…' : tenant ? 'Salva' : 'Crea cliente'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer rounded-theme-sm border border-line bg-surface p-1"
      />
    </label>
  );
}

/* ---------- Accessi del cliente ---------- */

function generatePassword(): string {
  const charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => charset[b % charset.length]).join('');
}

function UsersDialog({
  tenant,
  onClose,
  onChanged,
}: {
  tenant: TenantSummary;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [users, setUsers] = useState<TenantUser[] | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    const d = await api<{ users: TenantUser[] }>(`/api/tenants/${tenant.id}/users`);
    setUsers(d.users);
  }, [tenant.id]);

  useEffect(() => {
    loadUsers().catch((err) => setError(errorMessage(err)));
  }, [loadUsers]);

  async function addUser(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/api/tenants/${tenant.id}/users`, { body: { email, password } });
      setEmail('');
      setPassword(generatePassword());
      await loadUsers();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(user: TenantUser) {
    if (!window.confirm(`Rimuovere l’accesso di ${user.email}?`)) return;
    try {
      await api(`/api/tenants/users/${user.id}`, { method: 'DELETE' });
      await loadUsers();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Dialog title={`Accessi di ${tenant.name}`} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">Accessi attivi</h3>
          {users === null ? (
            <p className="text-sm text-soft">Caricamento…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-soft">Nessun accesso: creane uno qui sotto.</p>
          ) : (
            <ul className="divide-y divide-line rounded-theme-sm border border-line">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-ink">{user.email}</span>
                  <button
                    onClick={() => removeUser(user)}
                    className="shrink-0 text-xs font-semibold text-red-700 hover:underline"
                  >
                    Rimuovi
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={addUser} className="space-y-3 rounded-theme-sm border border-line p-4">
          <h3 className="text-sm font-semibold text-ink">Nuovo accesso</h3>
          <Field label="Email del cliente">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field
            label="Password"
            hint="Comunicala al cliente: non sarà più visibile dopo la creazione."
          >
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="font-mono"
              />
              <Button type="button" variant="ghost" onClick={() => setPassword(generatePassword())}>
                Genera
              </Button>
            </div>
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Creazione…' : 'Crea accesso'}
          </Button>
        </form>
      </div>
    </Dialog>
  );
}
