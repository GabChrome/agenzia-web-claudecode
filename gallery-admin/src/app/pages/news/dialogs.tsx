import { type FormEvent, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api';
import type { Post } from '../../types';
import { Button, Dialog, ErrorText, Field, Input, Spinner, Textarea, Toggle } from '../../ui';
import { RichEditor } from '../../components/RichEditor';

export interface PostFields {
  title_it: string;
  title_en: string;
  excerpt_it: string;
  excerpt_en: string;
  body_it: string;
  body_en: string;
  tags: string;
  published: boolean;
  publish_at: string;
  remove_cover?: boolean;
}

type Lang = 'it' | 'en';

// Converte tra il formato ISO salvato e quello richiesto da <input
// type="datetime-local">, che vuole l'ora locale senza fuso.
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  return local ? new Date(local).toISOString() : '';
}

interface Texts {
  title_it: string;
  title_en: string;
  excerpt_it: string;
  excerpt_en: string;
  body_it: string;
  body_en: string;
}

function textsOf(post: Post): Texts {
  return {
    title_it: post.title_it,
    title_en: post.title_en,
    excerpt_it: post.excerpt_it,
    excerpt_en: post.excerpt_en,
    body_it: post.body_it,
    body_en: post.body_en,
  };
}

function startingTexts(post: Post): Texts {
  const saved = textsOf(post);
  if (!post.draft) return saved;
  const out = { ...saved };
  for (const key of Object.keys(saved) as (keyof Texts)[]) {
    if (post.draft[key] !== undefined) out[key] = post.draft[key];
  }
  return out;
}

export function PostDialog({
  post,
  onClose,
  onSave,
  onDelete,
  onSaveDraft,
  onDiscardDraft,
  onUploadCover,
  onUploadInlineImage,
}: {
  post: Post;
  onClose: () => void;
  onSave: (fields: PostFields) => Promise<void>;
  onDelete: () => Promise<void>;
  onSaveDraft: (fields: PostFields) => Promise<void>;
  onDiscardDraft: () => Promise<void>;
  onUploadCover: (file: File) => Promise<string>;
  onUploadInlineImage: (file: File) => Promise<string>;
}) {
  const [texts, setTexts] = useState<Texts>(() => startingTexts(post));
  const [lang, setLang] = useState<Lang>('it');
  const [tags, setTags] = useState(post.draft?.tags ?? post.tags.join(', '));
  const [published, setPublished] = useState(
    post.draft?.published !== undefined ? post.draft.published === '1' : post.published === 1
  );
  const [publishAt, setPublishAt] = useState(post.draft?.publish_at ?? post.publish_at ?? '');
  const [cover, setCover] = useState(post.cover);
  const [coverBusy, setCoverBusy] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resumed, setResumed] = useState(Boolean(post.draft));
  const [autosave, setAutosave] = useState<'idle' | 'saving' | 'saved'>('idle');

  const set = (field: keyof Texts) => (value: string) => setTexts((prev) => ({ ...prev, [field]: value }));
  const filled = (l: Lang) => Boolean(texts[`title_${l}`] || texts[`excerpt_${l}`] || texts[`body_${l}`]);

  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const latest = useRef({ texts, tags, published, publishAt });
  latest.current = { texts, tags, published, publishAt };

  function currentFields(): PostFields {
    return {
      ...latest.current.texts,
      tags: latest.current.tags,
      published: latest.current.published,
      publish_at: latest.current.publishAt,
    };
  }

  useEffect(() => {
    if (!dirty.current) return;
    setAutosave('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSaveDraft(currentFields())
        .then(() => setAutosave('saved'))
        .catch(() => setAutosave('idle'));
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts, tags, published, publishAt]);

  useEffect(() => {
    function flush() {
      if (!dirty.current || closing.current) return;
      if (timer.current) clearTimeout(timer.current);
      void onSaveDraft(currentFields());
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty.current || closing.current) return;
      flush();
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edited<T>(apply: (value: T) => void) {
    return (value: T) => {
      dirty.current = true;
      apply(value);
    };
  }

  async function discardDraft() {
    if (!window.confirm('Scartare le modifiche non salvate e tornare alla versione pubblicata?')) return;
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    closing.current = true;
    setBusy(true);
    try {
      await onDiscardDraft();
      setTexts(textsOf(post));
      setTags(post.tags.join(', '));
      setPublished(post.published === 1);
      setPublishAt(post.publish_at ?? '');
      setResumed(false);
      setAutosave('idle');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      closing.current = false;
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!texts.title_it.trim()) {
      setLang('it');
      setError('Il titolo (italiano) è obbligatorio');
      return;
    }
    setBusy(true);
    setError('');
    if (timer.current) clearTimeout(timer.current);
    closing.current = true;
    try {
      await onSave(currentFields());
      onClose();
    } catch (err) {
      closing.current = false;
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Eliminare definitivamente questo articolo?')) return;
    setBusy(true);
    setError('');
    if (timer.current) clearTimeout(timer.current);
    closing.current = true;
    try {
      await onDelete();
      onClose();
    } catch (err) {
      closing.current = false;
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function pickCover(file: File) {
    setCoverBusy(true);
    try {
      const url = await onUploadCover(file);
      setCover(url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCoverBusy(false);
    }
  }

  async function removeCover() {
    setCoverBusy(true);
    try {
      await onSave({ ...currentFields(), remove_cover: true });
      setCover(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCoverBusy(false);
    }
  }

  const status =
    published && publishAt && publishAt > new Date().toISOString()
      ? 'Programmato'
      : published
        ? 'Pubblicato'
        : 'Bozza';

  return (
    <Dialog title="Articolo" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {resumed && (
          <div className="flex flex-wrap items-center gap-2 rounded-theme-sm bg-accentsoft px-3 py-2 text-sm text-ink">
            <span>Ripreso da dove avevi lasciato: queste modifiche non sono ancora pubblicate.</span>
            <button
              type="button"
              onClick={discardDraft}
              disabled={busy}
              className="ml-auto text-xs font-semibold underline underline-offset-2"
            >
              Scarta le modifiche
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-theme-sm border border-line bg-surface2">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-soft">Nessuna copertina</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex w-fit cursor-pointer items-center rounded-theme-sm border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface2">
              {coverBusy ? 'Caricamento…' : cover ? 'Cambia copertina' : 'Aggiungi copertina'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={coverBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void pickCover(file);
                }}
              />
            </label>
            {cover && (
              <button
                type="button"
                onClick={removeCover}
                disabled={coverBusy}
                className="text-xs text-soft underline underline-offset-2 hover:text-ink"
              >
                Rimuovi copertina
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-line">
            {(['it', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                  lang === l ? 'border-accent text-ink' : 'border-transparent text-soft hover:text-ink'
                }`}
              >
                {l === 'it' ? 'Italiano' : 'English'}
                {filled(l) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </button>
            ))}
          </div>

          <Field label="Titolo">
            <Input
              value={texts[`title_${lang}`]}
              onChange={(e) => edited(set(`title_${lang}`))(e.target.value)}
              placeholder={lang === 'it' ? 'Es. Aperti anche ad agosto' : 'e.g. Open all summer'}
            />
          </Field>
          <Field label="Estratto" hint="Una o due righe, mostrate nell’elenco degli articoli.">
            <Textarea
              rows={2}
              value={texts[`excerpt_${lang}`]}
              onChange={(e) => edited(set(`excerpt_${lang}`))(e.target.value)}
            />
          </Field>
          <Field label="Testo dell’articolo">
            <RichEditor
              value={texts[`body_${lang}`]}
              onChange={edited(set(`body_${lang}`))}
              onUploadImage={onUploadInlineImage}
            />
          </Field>
        </div>

        <Field label="Tag" hint="Separati da virgola">
          <Input
            value={tags}
            onChange={(e) => edited(setTags)(e.target.value)}
            placeholder="Eventi, Menù"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle checked={published} onChange={edited(setPublished)} label={`Stato: ${status}`} />
          <Field
            label="Pubblicazione programmata (facoltativo)"
            hint="Se imposti una data futura, l’articolo diventa visibile da solo a quell’ora."
          >
            <Input
              type="datetime-local"
              value={isoToLocalInput(publishAt || null)}
              onChange={(e) => edited(setPublishAt)(localInputToIso(e.target.value))}
            />
          </Field>
        </div>

        <ErrorText>{error}</ErrorText>
        <p className="flex items-center gap-2 text-xs text-soft">
          {autosave === 'saving' && (
            <>
              <Spinner className="h-3 w-3" /> Salvataggio automatico…
            </>
          )}
          {autosave === 'saved' &&
            'Modifiche conservate: se chiudi ora, alla riapertura riprendi da qui.'}
          {autosave === 'idle' && 'Le modifiche vengono conservate mentre scrivi.'}
        </p>

        <div className="flex items-center gap-2">
          <Button type="button" variant="danger" onClick={remove} disabled={busy}>
            Elimina
          </Button>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Annulla
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Salvataggio…' : 'Salva'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
