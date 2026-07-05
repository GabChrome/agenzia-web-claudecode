import { type FormEvent, useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import { useAuth } from '../App';
import { applyTheme } from '../theme';
import { Button, ErrorText, Field, FullPageSpinner, Input } from '../ui';

export default function LoginPage() {
  const { refresh } = useAuth();
  const [bootstrapNeeded, setBootstrapNeeded] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    applyTheme(null);
    api<{ needed: boolean }>('/api/auth/bootstrap')
      .then((d) => setBootstrapNeeded(d.needed))
      .catch(() => setBootstrapNeeded(false));
  }, []);

  if (bootstrapNeeded === null) return <FullPageSpinner />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (bootstrapNeeded && password !== confirm) {
      setError('Le due password non coincidono');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(bootstrapNeeded ? '/api/auth/bootstrap' : '/api/auth/login', {
        body: { email, password },
      });
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-theme border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Gestione Galleria</h1>
        <p className="mb-6 mt-1 text-sm text-soft">
          {bootstrapNeeded
            ? 'Primo avvio: crea l’account amministratore dell’agenzia.'
            : 'Accedi per gestire la vetrina foto e video del tuo sito.'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </Field>
          <Field label="Password" hint={bootstrapNeeded ? 'Almeno 8 caratteri' : undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={bootstrapNeeded ? 8 : undefined}
              autoComplete={bootstrapNeeded ? 'new-password' : 'current-password'}
            />
          </Field>
          {bootstrapNeeded && (
            <Field label="Ripeti la password">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
          )}
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Attendi…' : bootstrapNeeded ? 'Crea account' : 'Accedi'}
          </Button>
        </form>
      </div>
    </div>
  );
}
