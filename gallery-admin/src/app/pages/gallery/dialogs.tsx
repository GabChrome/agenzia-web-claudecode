import { type FormEvent, useState } from 'react';
import { errorMessage } from '../../api';
import type { Album, Media } from '../../types';
import { Button, Dialog, ErrorText, Field, Input, Textarea, Toggle } from '../../ui';

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

export function EditMediaDialog({
  media,
  onClose,
  onSave,
  onDelete,
}: {
  media: Media;
  onClose: () => void;
  onSave: (fields: MediaFields) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  // I testi delle due lingue stanno in un unico stato: si passa da IT a EN con
  // le schede, senza perdere quanto scritto nell'altra lingua.
  const [texts, setTexts] = useState({
    title_it: media.title_it,
    title_en: media.title_en,
    caption_it: media.caption_it,
    caption_en: media.caption_en,
    description_it: media.description_it,
    description_en: media.description_en,
    alt_it: media.alt_it,
    alt_en: media.alt_en,
  });
  const [lang, setLang] = useState<Lang>('it');
  const [published, setPublished] = useState(media.published === 1);
  const [embedUrl, setEmbedUrl] = useState(media.embed_url ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field: keyof typeof texts) => (value: string) =>
    setTexts((prev) => ({ ...prev, [field]: value }));

  // Segnala con un pallino le lingue che hanno già del testo.
  const filled = (l: Lang) =>
    Boolean(texts[`title_${l}`] || texts[`caption_${l}`] || texts[`description_${l}`]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fields: MediaFields = { ...texts, published };
      if (media.kind === 'embed') fields.embed_url = embedUrl;
      await onSave(fields);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Eliminare definitivamente questo elemento?')) return;
    setBusy(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch (err) {
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
        {media.kind === 'embed' && (
          <Field label="Link del video" hint="YouTube o Vimeo">
            <Input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
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
              onChange={(e) => set(`title_${lang}`)(e.target.value)}
              placeholder={lang === 'it' ? 'Es. Sala principale' : 'e.g. Main hall'}
            />
          </Field>
          <Field label="Didascalia" hint="Una riga breve, mostrata sotto la foto nella vetrina.">
            <Input
              value={texts[`caption_${lang}`]}
              onChange={(e) => set(`caption_${lang}`)(e.target.value)}
            />
          </Field>
          <Field
            label="Testo esteso"
            hint="Informazioni aggiuntive, mostrate quando si apre l’elemento a schermo intero."
          >
            <Textarea
              rows={4}
              value={texts[`description_${lang}`]}
              onChange={(e) => set(`description_${lang}`)(e.target.value)}
            />
          </Field>
          {media.kind !== 'embed' && (
            <Field
              label="Testo alternativo (facoltativo)"
              hint="Descrive l’immagine a chi non può vederla e aiuta Google. Se lo lasci vuoto viene usata la didascalia."
            >
              <Input
                value={texts[`alt_${lang}`]}
                onChange={(e) => set(`alt_${lang}`)(e.target.value)}
              />
            </Field>
          )}
        </div>
        <Toggle
          checked={published}
          onChange={setPublished}
          label={published ? 'Pubblicato: visibile sul sito' : 'Bozza: nascosto dal sito'}
        />
        <ErrorText>{error}</ErrorText>
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
