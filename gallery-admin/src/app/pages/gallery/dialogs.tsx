import { type FormEvent, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api';
import type { Album, Media } from '../../types';
import { Button, Dialog, ErrorText, Field, Input, Spinner, Textarea, Toggle } from '../../ui';

/* ---------- Modifica di un elemento (foto, video o link) ---------- */

export interface MediaFields {
  title_it: string;
  title_en: string;
  caption_it: string;
  caption_en: string;
  description_it: string;
  description_en: string;
  alt_it: string;
  alt_en: string;
  published: boolean;
  embed_url?: string;
}

type Lang = 'it' | 'en';

type Texts = Pick<
  MediaFields,
  | 'title_it'
  | 'title_en'
  | 'caption_it'
  | 'caption_en'
  | 'description_it'
  | 'description_en'
  | 'alt_it'
  | 'alt_en'
>;

function textsOf(media: Media): Texts {
  return {
    title_it: media.title_it,
    title_en: media.title_en,
    caption_it: media.caption_it,
    caption_en: media.caption_en,
    description_it: media.description_it,
    description_en: media.description_en,
    alt_it: media.alt_it,
    alt_en: media.alt_en,
  };
}

// Se c'è del lavoro lasciato a metà, il dialog riparte da lì invece che dai
// testi già salvati.
function startingTexts(media: Media): Texts {
  const saved = textsOf(media);
  if (!media.draft) return saved;
  const out = { ...saved };
  for (const key of Object.keys(saved) as (keyof Texts)[]) {
    if (media.draft[key] !== undefined) out[key] = media.draft[key];
  }
  return out;
}

export function EditMediaDialog({
  media,
  onClose,
  onSave,
  onDelete,
  onSaveDraft,
  onDiscardDraft,
}: {
  media: Media;
  onClose: () => void;
  onSave: (fields: MediaFields) => Promise<void>;
  onDelete: () => Promise<void>;
  onSaveDraft: (fields: MediaFields) => Promise<void>;
  onDiscardDraft: () => Promise<void>;
}) {
  // I testi delle due lingue stanno in un unico stato: si passa da IT a EN con
  // le schede, senza perdere quanto scritto nell'altra lingua.
  const [texts, setTexts] = useState<Texts>(() => startingTexts(media));
  const [lang, setLang] = useState<Lang>('it');
  const [published, setPublished] = useState(
    media.draft?.published !== undefined ? media.draft.published === '1' : media.published === 1
  );
  const [embedUrl, setEmbedUrl] = useState(media.draft?.embed_url ?? media.embed_url ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Il lavoro in sospeso trovato all'apertura: lo segnaliamo finché il cliente
  // non salva o non lo scarta.
  const [resumed, setResumed] = useState(Boolean(media.draft));
  const [autosave, setAutosave] = useState<'idle' | 'saving' | 'saved'>('idle');

  const set = (field: keyof Texts) => (value: string) =>
    setTexts((prev) => ({ ...prev, [field]: value }));

  /* ----- Salvataggio automatico delle modifiche in corso ----- */
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  // I valori più freschi, per il salvataggio d'emergenza alla chiusura.
  const latest = useRef({ texts, published, embedUrl });
  latest.current = { texts, published, embedUrl };

  function currentFields(): MediaFields {
    const fields: MediaFields = { ...latest.current.texts, published: latest.current.published };
    if (media.kind === 'embed') fields.embed_url = latest.current.embedUrl;
    return fields;
  }

  // Ogni modifica fa ripartire un timer: si salva quando il cliente si ferma.
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
  }, [texts, published, embedUrl]);

  // Chiusura del dialog o della finestra: quel che è stato scritto non si perde.
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
    if (!window.confirm('Scartare le modifiche non salvate e tornare ai testi pubblicati?')) return;
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    closing.current = true;
    setBusy(true);
    try {
      await onDiscardDraft();
      setTexts(textsOf(media));
      setPublished(media.published === 1);
      setEmbedUrl(media.embed_url ?? '');
      setResumed(false);
      setAutosave('idle');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      closing.current = false;
      setBusy(false);
    }
  }

  // Segnala con un pallino le lingue che hanno già del testo.
  const filled = (l: Lang) =>
    Boolean(texts[`title_${l}`] || texts[`caption_${l}`] || texts[`description_${l}`]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    // Il salvataggio definitivo ha la precedenza sull'automatico.
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
    if (!window.confirm('Eliminare definitivamente questo elemento?')) return;
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

  return (
    <Dialog title="Modifica elemento" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <MediaPreview media={media} />
        {!media.uploaded && (
          <ErrorText>
            Il caricamento di questo file non è andato a buon fine: eliminalo e riprova.
          </ErrorText>
        )}
        {resumed && (
          <div className="flex flex-wrap items-center gap-2 rounded-theme-sm bg-accentsoft px-3 py-2 text-sm text-ink">
            <span>
              Ripreso da dove avevi lasciato: queste modifiche non sono ancora pubblicate.
            </span>
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
        {media.kind === 'embed' && (
          <Field label="Link del video" hint="YouTube o Vimeo">
            <Input
              type="url"
              value={embedUrl}
              onChange={(e) => edited(setEmbedUrl)(e.target.value)}
              required
            />
          </Field>
        )}
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-line">
            {(['it', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                  lang === l
                    ? 'border-accent text-ink'
                    : 'border-transparent text-soft hover:text-ink'
                }`}
              >
                {l === 'it' ? 'Italiano' : 'English'}
                {filled(l) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </button>
            ))}
          </div>

          <Field label="Titolo" hint="Il nome dell’elemento, mostrato sopra la didascalia.">
            <Input
              value={texts[`title_${lang}`]}
              onChange={(e) => edited(set(`title_${lang}`))(e.target.value)}
              placeholder={lang === 'it' ? 'Es. Sala principale' : 'e.g. Main hall'}
            />
          </Field>
          <Field label="Didascalia" hint="Una riga breve, mostrata sotto la foto nella vetrina.">
            <Input
              value={texts[`caption_${lang}`]}
              onChange={(e) => edited(set(`caption_${lang}`))(e.target.value)}
            />
          </Field>
          <Field
            label="Testo esteso"
            hint="Informazioni aggiuntive, mostrate quando si apre l’elemento a schermo intero."
          >
            <Textarea
              rows={4}
              value={texts[`description_${lang}`]}
              onChange={(e) => edited(set(`description_${lang}`))(e.target.value)}
            />
          </Field>
          {media.kind !== 'embed' && (
            <Field
              label="Testo alternativo (facoltativo)"
              hint="Descrive l’immagine a chi non può vederla e aiuta Google. Se lo lasci vuoto viene usata la didascalia."
            >
              <Input
                value={texts[`alt_${lang}`]}
                onChange={(e) => edited(set(`alt_${lang}`))(e.target.value)}
              />
            </Field>
          )}
        </div>
        <Toggle
          checked={published}
          onChange={edited(setPublished)}
          label={published ? 'Pubblicato: visibile sul sito' : 'Bozza: nascosto dal sito'}
        />
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
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Salvataggio…' : 'Salva'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function MediaPreview({ media }: { media: Media }) {
  if (media.kind === 'image' && media.url) {
    return (
      <img
        src={media.url}
        alt={media.alt_it || media.caption_it || media.title_it}
        className="max-h-72 w-full rounded-theme-sm border border-line bg-surface2 object-contain"
      />
    );
  }
  if (media.kind === 'video' && media.url) {
    return (
      <video
        src={media.url}
        poster={media.thumb ?? undefined}
        controls
        preload="metadata"
        className="max-h-72 w-full rounded-theme-sm border border-line bg-black"
      />
    );
  }
  if (media.kind === 'embed' && media.embed_url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-theme-sm border border-line bg-black">
        <iframe
          src={media.embed_url}
          title="Anteprima video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return null;
}

/* ---------- Creazione / modifica album ---------- */

export interface AlbumFields {
  title_it: string;
  title_en: string;
  description_it: string;
  description_en: string;
  published: boolean;
}

export function AlbumDialog({
  album,
  onClose,
  onSave,
  onDelete,
}: {
  album: Album | null;
  onClose: () => void;
  onSave: (fields: AlbumFields) => Promise<void>;
  onDelete?: (() => Promise<void>) | undefined;
}) {
  const [titleIt, setTitleIt] = useState(album?.title_it ?? '');
  const [titleEn, setTitleEn] = useState(album?.title_en ?? '');
  const [descIt, setDescIt] = useState(album?.description_it ?? '');
  const [descEn, setDescEn] = useState(album?.description_en ?? '');
  const [published, setPublished] = useState(album ? album.published === 1 : true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        title_it: titleIt,
        title_en: titleEn,
        description_it: descIt,
        description_en: descEn,
        published,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function remove() {
    if (!onDelete || !album) return;
    const count = album.media.length;
    const warning =
      count > 0
        ? `Eliminare l’album «${album.title_it}» e i suoi ${count} contenuti? L’operazione non si può annullare.`
        : `Eliminare l’album «${album.title_it}»?`;
    if (!window.confirm(warning)) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title={album ? 'Modifica album' : 'Nuovo album'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titolo (italiano)">
            <Input value={titleIt} onChange={(e) => setTitleIt(e.target.value)} required />
          </Field>
          <Field label="Titolo (inglese)">
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descrizione (italiano)">
            <Textarea value={descIt} onChange={(e) => setDescIt(e.target.value)} />
          </Field>
          <Field label="Descrizione (inglese)">
            <Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          </Field>
        </div>
        <Toggle
          checked={published}
          onChange={setPublished}
          label={published ? 'Pubblicato: visibile sul sito' : 'Bozza: nascosto dal sito'}
        />
        <ErrorText>{error}</ErrorText>
        <div className="flex items-center gap-2">
          {album && onDelete && (
            <Button type="button" variant="danger" onClick={remove} disabled={busy}>
              Elimina album
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Salvataggio…' : album ? 'Salva' : 'Crea album'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Aggiunta di un video da link ---------- */

export interface EmbedFields {
  embed_url: string;
  caption_it: string;
  caption_en: string;
}

export function EmbedDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (fields: EmbedFields) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [captionIt, setCaptionIt] = useState('');
  const [captionEn, setCaptionEn] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onAdd({ embed_url: url, caption_it: captionIt, caption_en: captionEn });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Dialog title="Aggiungi video da link" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Link del video"
          hint="Incolla un link YouTube o Vimeo, ad esempio https://youtu.be/…"
        >
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            autoFocus
            placeholder="https://…"
          />
        </Field>
        <Field label="Didascalia (italiano)">
          <Input value={captionIt} onChange={(e) => setCaptionIt(e.target.value)} />
        </Field>
        <Field label="Didascalia (inglese)">
          <Input value={captionEn} onChange={(e) => setCaptionEn(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Aggiunta…' : 'Aggiungi'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
