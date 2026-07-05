import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api';
import { useAuth } from '../App';
import { applyTheme } from '../theme';
import { Button, Dialog, ErrorText, Field, Input } from '../ui';

export function TopBar({
  title,
  logo,
  backLink,
}: {
  title: string;
  logo?: string | null;
  backLink?: { to: string; label: string };
}) {
  const { me, setMe } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST', body: {} });
    } finally {
      applyTheme(null);
      setMe(null);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {backLink && (
          <Link
            to={backLink.to}
            className="shrink-0 text-sm font-medium text-soft transition hover:text-ink"
          >
            ← {backLink.label}
          </Link>
        )}
        {logo && <img src={logo} alt="" className="h-8 w-auto" />}
        <span className="truncate text-lg font-bold text-ink">{title}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-soft sm:block">{me?.user.email}</span>
          <Button variant="ghost" onClick={() => setPasswordOpen(true)}>
            Password
          </Button>
          <Button variant="ghost" onClick={logout}>
            Esci
          </Button>
        </div>
      </div>
      {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
    </header>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setError('Le due password non coincidono');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api('/api/auth/password', { body: { current, next } });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog title="Cambia password" onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p className="text-sm text-ink">Password aggiornata correttamente.</p>
          <Button onClick={onClose}>Chiudi</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Password attuale">
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="Nuova password" hint="Almeno 8 caratteri">
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Ripeti la nuova password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
