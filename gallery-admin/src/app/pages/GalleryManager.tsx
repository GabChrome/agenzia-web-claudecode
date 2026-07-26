import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api, errorMessage, uploadFile } from '../api';
import { applyTheme } from '../theme';
import { makeImageThumb, makeVideoPoster } from '../thumbs';
import type { Album, GalleryData, Media } from '../types';
import {
  Button,
  FullPageSpinner,
  IconLink,
  IconPlus,
  IconUpload,
  Toasts,
  Toggle,
  useToasts,
} from '../ui';
import { TopBar } from '../components/TopBar';
import { MediaGrid } from './gallery/MediaGrid';
import {
  AlbumDialog,
  type AlbumFields,
  EditMediaDialog,
  EmbedDialog,
  type EmbedFields,
  type MediaFields,
} from './gallery/dialogs';

const MAX_IMAGE_MB = 25;
const MAX_VIDEO_MB = 100;

interface UploadItem {
  key: string;
  name: string;
  pct: number;
  error?: string;
}

export default function GalleryManager() {
  // Un utente cliente gestisce solo la propria galleria; l'agenzia arriva qui
  // da /t/:slug e opera sulla galleria di quel cliente.
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<GalleryData | null>(null);
  const [fatal, setFatal] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [albumDialog, setAlbumDialog] = useState<{ album: Album | null } | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [fileOver, setFileOver] = useState(false);
  // Preferenza di lavoro: caricare come bozza e pubblicare in un secondo
  // momento. Resta memorizzata su questo dispositivo.
  const [uploadAsDraft, setUploadAsDraft] = useState(
    () => localStorage.getItem('gallery:uploadAsDraft') === '1'
  );
  const { toasts, push } = useToasts();

  useEffect(() => {
    localStorage.setItem('gallery:uploadAsDraft', uploadAsDraft ? '1' : '0');
  }, [uploadAsDraft]);

  const q = useCallback(
    (path: string, params: Record<string, string> = {}) => {
      const sp = new URLSearchParams(params);
      if (slug) sp.set('tenant', slug);
      const query = sp.toString();
      return query ? `${path}?${query}` : path;
    },
    [slug]
  );

  const load = useCallback(async () => {
    const d = await api<GalleryData>(q('/api/gallery'));
    setData(d);
    applyTheme(d.tenant.theme);
    setSelectedId((prev) =>
      prev && d.albums.some((a) => a.id === prev) ? prev : (d.albums[0]?.id ?? null)
    );
    return d;
  }, [q]);

  useEffect(() => {
    load().catch((err) => setFatal(errorMessage(err)));
  }, [load]);

  const selected = data?.albums.find((a) => a.id === selectedId) ?? null;
  // Elementi caricati ma non ancora online, pronti per la pubblicazione.
  const draftMedia = (selected?.media ?? []).filter((m) => m.published !== 1 && m.uploaded);

  /* ---------- Album ---------- */

  async function saveAlbum(album: Album | null, fields: AlbumFields) {
    if (album) {
      await api(q(`/api/gallery/albums/${album.id}`), { method: 'PATCH', body: fields });
    } else {
      const created = await api<{ album: Album }>(q('/api/gallery/albums'), { body: fields });
      setSelectedId(created.album.id);
    }
    await load();
  }

  async function deleteAlbum(album: Album) {
    await api(q(`/api/gallery/albums/${album.id}`), { method: 'DELETE' });
    await load();
  }

  async function toggleAlbumPublished(album: Album, published: boolean) {
    setData((d) =>
      d
        ? {
            ...d,
            albums: d.albums.map((a) =>
              a.id === album.id ? { ...a, published: published ? 1 : 0 } : a
            ),
          }
        : d
    );
    try {
      await api(q(`/api/gallery/albums/${album.id}`), { method: 'PATCH', body: { published } });
    } catch (err) {
      push(errorMessage(err));
      await load();
    }
  }

  async function reorderAlbums(activeId: string, overId: string) {
    if (!data) return;
    const oldIndex = data.albums.findIndex((a) => a.id === activeId);
    const newIndex = data.albums.findIndex((a) => a.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const albums = arrayMove(data.albums, oldIndex, newIndex);
    setData({ ...data, albums });
    try {
      await api(q('/api/gallery/albums/reorder'), { body: { ids: albums.map((a) => a.id) } });
    } catch (err) {
      push(errorMessage(err));
      await load();
    }
  }

  /* ---------- Media ---------- */

  async function saveMedia(media: Media, fields: MediaFields) {
    await api(q(`/api/gallery/media/${media.id}`), { method: 'PATCH', body: fields });
    await load();
  }

  // Salvataggio automatico del lavoro in corso: non tocca i testi pubblicati,
  // quindi sul sito non cambia nulla finché il cliente non salva davvero.
  async function saveDraft(media: Media, fields: MediaFields) {
    await api(q(`/api/gallery/media/${media.id}/draft`), { method: 'PUT', body: fields });
    await load();
  }

  async function discardDraft(media: Media) {
    await api(q(`/api/gallery/media/${media.id}/draft`), { method: 'DELETE' });
    await load();
  }

  // Manda online (o rimette in bozza) più elementi in un colpo solo.
  async function publishMany(ids: string[], published: boolean) {
    if (ids.length === 0) return;
    try {
      await api(q('/api/gallery/media/publish'), { body: { ids, published } });
      await load();
      push(
        published
          ? `${ids.length === 1 ? 'Elemento pubblicato' : ids.length + ' elementi pubblicati'} sul sito`
          : `${ids.length === 1 ? 'Elemento rimesso' : ids.length + ' elementi rimessi'} in bozza`
      );
    } catch (err) {
      push(errorMessage(err));
    }
  }

  async function deleteMedia(media: Media) {
    await api(q(`/api/gallery/media/${media.id}`), { method: 'DELETE' });
    await load();
  }

  async function addEmbed(fields: EmbedFields) {
    if (!selected) return;
    await api(q(`/api/gallery/albums/${selected.id}/media`), {
      body: { kind: 'embed', ...fields },
    });
    await load();
  }

  async function reorderMedia(activeId: string, overId: string) {
    if (!data || !selected) return;
    const oldIndex = selected.media.findIndex((m) => m.id === activeId);
    const newIndex = selected.media.findIndex((m) => m.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const media = arrayMove(selected.media, oldIndex, newIndex);
    setData({
      ...data,
      albums: data.albums.map((a) => (a.id === selected.id ? { ...a, media } : a)),
    });
    try {
      await api(q('/api/gallery/media/reorder'), { body: { ids: media.map((m) => m.id) } });
    } catch (err) {
      push(errorMessage(err));
      await load();
    }
  }

  /* ---------- Upload ---------- */

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !selected) return;
    const albumId = selected.id;
    for (const file of Array.from(fileList)) {
      const kind = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : null;
      if (!kind) {
        push(`«${file.name}» non è una foto né un video`);
        continue;
      }
      const maxMb = kind === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB;
      if (file.size > maxMb * 1024 * 1024) {
        push(`«${file.name}» supera il limite di ${maxMb} MB`);
        continue;
      }

      const key = `${Date.now()}-${Math.random()}-${file.name}`;
      setUploads((u) => [...u, { key, name: file.name, pct: 0 }]);
      try {
        const { media } = await api<{ media: Media }>(q(`/api/gallery/albums/${albumId}/media`), {
          body: { kind, published: !uploadAsDraft },
        });
        const thumbPromise = kind === 'image' ? makeImageThumb(file) : makeVideoPoster(file);
        await uploadFile(
          q(`/api/gallery/media/${media.id}/file`, { variant: 'original' }),
          file,
          file.type || 'application/octet-stream',
          (pct) => setUploads((us) => us.map((x) => (x.key === key ? { ...x, pct } : x)))
        );
        const thumb = await thumbPromise;
        if (thumb) {
          await uploadFile(
            q(`/api/gallery/media/${media.id}/file`, { variant: 'thumb' }),
            thumb,
            'image/jpeg'
          );
        }
        setUploads((us) => us.filter((x) => x.key !== key));
        await load();
      } catch (err) {
        setUploads((us) => us.map((x) => (x.key === key ? { ...x, error: errorMessage(err) } : x)));
        await load();
      }
    }
  }

  /* ---------- Render ---------- */

  if (fatal) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="rounded-theme bg-red-50 px-6 py-4 text-red-700">{fatal}</p>
      </div>
    );
  }
  if (!data) return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        title={data.tenant.name}
        logo={data.tenant.theme.logo ?? null}
        backLink={slug ? { to: '/', label: 'Tutti i clienti' } : undefined}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        {/* Elenco album */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-soft">Album</h2>
            <Button variant="ghost" onClick={() => setAlbumDialog({ album: null })}>
              <IconPlus size={16} /> Nuovo
            </Button>
          </div>
          <AlbumList
            albums={data.albums}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorderAlbums}
          />
        </aside>

        {/* Contenuto dell'album selezionato */}
        <main
          className="min-w-0 flex-1"
          onDragOver={(e) => {
            e.preventDefault();
            setFileOver(true);
          }}
          onDragLeave={() => setFileOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setFileOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          {!selected ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 rounded-theme border border-dashed border-line p-8 text-center">
              <p className="text-soft">
                Non c’è ancora nessun album: creane uno per iniziare a caricare foto e video.
              </p>
              <Button onClick={() => setAlbumDialog({ album: null })}>
                <IconPlus size={16} /> Crea il primo album
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-2xl font-bold text-ink">{selected.title_it}</h1>
                    {selected.published !== 1 && (
                      <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-semibold text-soft">
                        Bozza
                      </span>
                    )}
                  </div>
                  {selected.description_it && (
                    <p className="mt-1 max-w-xl text-sm text-soft">{selected.description_it}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={selected.published === 1}
                    onChange={(next) => toggleAlbumPublished(selected, next)}
                    label="Pubblicato"
                  />
                  <Button variant="ghost" onClick={() => setAlbumDialog({ album: selected })}>
                    Modifica album
                  </Button>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-theme-sm bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  <IconUpload size={16} /> Carica foto o video
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                <Button variant="ghost" onClick={() => setEmbedOpen(true)}>
                  <IconLink size={16} /> Video da link
                </Button>
                <Toggle
                  checked={uploadAsDraft}
                  onChange={setUploadAsDraft}
                  label="Carica come bozza"
                />
                <span className="ml-auto hidden text-xs text-soft sm:block">
                  Trascina gli elementi per riordinarli
                </span>
              </div>

              {/* Bozze pronte: un solo tasto le manda online. */}
              {draftMedia.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-theme-sm border border-line bg-surface px-4 py-3">
                  <span className="text-sm text-ink">
                    <strong>
                      {draftMedia.length === 1
                        ? '1 elemento in bozza'
                        : `${draftMedia.length} elementi in bozza`}
                    </strong>{' '}
                    <span className="text-soft">— non ancora visibili sul sito.</span>
                  </span>
                  <Button
                    className="ml-auto"
                    onClick={() => publishMany(draftMedia.map((m) => m.id), true)}
                  >
                    {draftMedia.length === 1 ? 'Pubblica sul sito' : 'Pubblica tutto sul sito'}
                  </Button>
                </div>
              )}

              {uploads.length > 0 && (
                <div className="mb-4 space-y-2">
                  {uploads.map((u) => (
                    <div
                      key={u.key}
                      className="rounded-theme-sm border border-line bg-surface px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-ink">{u.name}</span>
                        {u.error ? (
                          <button
                            className="shrink-0 text-xs font-semibold text-red-700"
                            onClick={() =>
                              setUploads((us) => us.filter((x) => x.key !== u.key))
                            }
                          >
                            {u.error} — chiudi
                          </button>
                        ) : (
                          <span className="shrink-0 text-xs text-soft">{u.pct}%</span>
                        )}
                      </div>
                      {!u.error && (
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface2">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${u.pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selected.media.length === 0 && uploads.length === 0 ? (
                <div
                  className={`flex min-h-56 flex-col items-center justify-center gap-2 rounded-theme border-2 border-dashed p-8 text-center transition ${
                    fileOver ? 'border-accent bg-accentsoft' : 'border-line'
                  }`}
                >
                  <p className="font-medium text-ink">L’album è vuoto</p>
                  <p className="text-sm text-soft">
                    Trascina qui le foto e i video, oppure usa il pulsante «Carica foto o video».
                  </p>
                </div>
              ) : (
                <div
                  className={`rounded-theme transition ${
                    fileOver ? 'ring-2 ring-accent ring-offset-2' : ''
                  }`}
                >
                  <MediaGrid
                    media={selected.media}
                    onReorder={reorderMedia}
                    onEdit={setEditingMedia}
                    onTogglePublished={(m) => publishMany([m.id], m.published !== 1)}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {editingMedia && (
        <EditMediaDialog
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={(fields) => saveMedia(editingMedia, fields)}
          onDelete={() => deleteMedia(editingMedia)}
          onSaveDraft={(fields) => saveDraft(editingMedia, fields)}
          onDiscardDraft={() => discardDraft(editingMedia)}
        />
      )}
      {albumDialog && (
        <AlbumDialog
          album={albumDialog.album}
          onClose={() => setAlbumDialog(null)}
          onSave={(fields) => saveAlbum(albumDialog.album, fields)}
          onDelete={
            albumDialog.album ? () => deleteAlbum(albumDialog.album as Album) : undefined
          }
        />
      )}
      {embedOpen && <EmbedDialog onClose={() => setEmbedOpen(false)} onAdd={addEmbed} />}

      <Toasts toasts={toasts} />
    </div>
  );
}

/* ---------- Elenco album, riordinabile ---------- */

function AlbumList({
  albums,
  selectedId,
  onSelect,
  onReorder,
}: {
  albums: Album[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
  }

  if (albums.length === 0) {
    return <p className="text-sm text-soft">Nessun album.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={albums.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {albums.map((album) => (
            <SortableAlbumRow
              key={album.id}
              album={album}
              selected={album.id === selectedId}
              onSelect={() => onSelect(album.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableAlbumRow({
  album,
  selected,
  onSelect,
}: {
  album: Album;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: album.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'z-10 opacity-70' : ''}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={onSelect}
        className={`flex w-full items-center gap-2 rounded-theme-sm px-3 py-2 text-left text-sm transition ${
          selected
            ? 'bg-accentsoft font-semibold text-ink'
            : 'text-ink hover:bg-surface2'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{album.title_it || 'Senza titolo'}</span>
        {album.published !== 1 && (
          <span className="rounded-full bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold text-soft">
            Bozza
          </span>
        )}
        <span className="text-xs text-soft">{album.media.length}</span>
      </button>
    </li>
  );
}
