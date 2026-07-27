import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage, uploadFile } from '../api';
import { applyTheme } from '../theme';
import type { PostSummary, Post, TenantInfo } from '../types';
import { Button, FullPageSpinner, IconPencil, IconPlus, Toasts, useToasts } from '../ui';
import { TopBar } from '../components/TopBar';
import { PostDialog, type PostFields } from './news/dialogs';

interface NewsData {
  tenant: TenantInfo;
  posts: PostSummary[];
}

const STATUS_LABEL: Record<PostSummary['status'], string> = {
  draft: 'Bozza',
  scheduled: 'Programmato',
  published: 'Pubblicato',
};
const STATUS_CLASS: Record<PostSummary['status'], string> = {
  draft: 'bg-black/60 text-white',
  scheduled: 'bg-accent text-white',
  published: 'bg-emerald-600 text-white',
};

export default function NewsManager() {
  // Come GalleryManager: il cliente arriva da /notizie, l'agenzia da /t/:slug/notizie.
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<NewsData | null>(null);
  const [fatal, setFatal] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [creating, setCreating] = useState(false);
  const { toasts, push } = useToasts();

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
    const [news, gallery] = await Promise.all([
      api<{ posts: PostSummary[] }>(q('/api/news')),
      // Il tema (colori, logo) è già noto al pannello galleria: lo riusiamo
      // per evitare una seconda rotta identica solo per nome.
      api<{ tenant: TenantInfo }>(q('/api/gallery')),
    ]);
    setData({ tenant: gallery.tenant, posts: news.posts });
    applyTheme(gallery.tenant.theme);
  }, [q]);

  useEffect(() => {
    load().catch((err) => setFatal(errorMessage(err)));
  }, [load]);

  async function createPost() {
    setCreating(true);
    try {
      const { post } = await api<{ post: Post }>(q('/api/news'), {
        body: { title_it: 'Nuovo articolo' },
      });
      await load();
      setEditingPost(post);
    } catch (err) {
      push(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function openForEdit(summary: PostSummary) {
    try {
      const { post } = await api<{ post: Post }>(q(`/api/news/${summary.id}`));
      setEditingPost(post);
    } catch (err) {
      push(errorMessage(err));
    }
  }

  async function savePost(post: Post, fields: PostFields) {
    await api(q(`/api/news/${post.id}`), { method: 'PATCH', body: fields });
    await load();
  }

  async function saveDraft(post: Post, fields: PostFields) {
    await api(q(`/api/news/${post.id}/draft`), { method: 'PUT', body: fields });
    await load();
  }

  async function discardDraft(post: Post) {
    await api(q(`/api/news/${post.id}/draft`), { method: 'DELETE' });
    await load();
  }

  async function deletePost(post: Post) {
    await api(q(`/api/news/${post.id}`), { method: 'DELETE' });
    await load();
  }

  async function togglePublished(summary: PostSummary) {
    setData((d) =>
      d
        ? {
            ...d,
            posts: d.posts.map((p) =>
              p.id === summary.id
                ? { ...p, published: p.published === 1 ? 0 : 1, status: p.published === 1 ? 'draft' : 'published' }
                : p
            ),
          }
        : d
    );
    try {
      await api(q('/api/news/publish'), {
        body: { ids: [summary.id], published: summary.published !== 1 },
      });
    } catch (err) {
      push(errorMessage(err));
    } finally {
      await load();
    }
  }

  async function uploadCover(post: Post, file: File): Promise<string> {
    const res = await uploadFile<{ url: string }>(q(`/api/news/${post.id}/cover`), file, file.type);
    return res.url;
  }

  async function uploadInlineImage(file: File): Promise<string> {
    const res = await uploadFile<{ url: string }>(q('/api/news/upload-image'), file, file.type);
    return res.url;
  }

  if (fatal) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-soft">{fatal}</div>
    );
  }
  if (!data) return <FullPageSpinner />;

  const backLink = slug
    ? { to: '/', label: 'Tutti i clienti' }
    : undefined;
  const galleryLink = slug ? `/t/${slug}` : '/';

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title={data.tenant.name} logo={data.tenant.theme.logo} backLink={backLink} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-theme-sm border border-line bg-surface p-1 text-sm font-semibold">
            <Link to={galleryLink} className="rounded-theme-sm px-3 py-1.5 text-soft transition hover:text-ink">
              Galleria
            </Link>
            <span className="rounded-theme-sm bg-accent px-3 py-1.5 text-white">Notizie</span>
          </div>
          <Button className="ml-auto" onClick={createPost} disabled={creating}>
            <IconPlus size={16} /> {creating ? 'Creazione…' : 'Nuovo articolo'}
          </Button>
        </div>

        {data.posts.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-theme border border-dashed border-line p-8 text-center">
            <p className="text-soft">
              Non c’è ancora nessun articolo: scrivi il primo per iniziare a dare notizie ai tuoi
              clienti.
            </p>
            <Button onClick={createPost} disabled={creating}>
              <IconPlus size={16} /> Scrivi il primo articolo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.posts.map((post) => (
              <button
                key={post.id}
                onClick={() => openForEdit(post)}
                className="flex w-full items-center gap-4 rounded-theme border border-line bg-surface p-3 text-left transition hover:border-accent/40"
              >
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-theme-sm bg-surface2">
                  {post.cover ? (
                    <img src={post.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <IconPencil size={18} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-ink">{post.title_it || 'Senza titolo'}</h3>
                    {post.draft && (
                      <span className="shrink-0 rounded-full bg-accentsoft px-2 py-0.5 text-[11px] font-semibold text-ink">
                        In sospeso
                      </span>
                    )}
                  </div>
                  {post.excerpt_it && (
                    <p className="mt-0.5 truncate text-sm text-soft">{post.excerpt_it}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-soft">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_CLASS[post.status]}`}>
                      {STATUS_LABEL[post.status]}
                      {post.status === 'scheduled' && post.publish_at
                        ? ` · ${new Date(post.publish_at).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                        : ''}
                    </span>
                    {post.tags.map((t) => (
                      <span key={t} className="rounded-full bg-surface2 px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    void togglePublished(post);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      void togglePublished(post);
                    }
                  }}
                  className="shrink-0 rounded-theme-sm border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface2"
                >
                  {post.published === 1 ? 'Nascondi' : 'Pubblica'}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {editingPost && (
        <PostDialog
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={(fields) => savePost(editingPost, fields)}
          onDelete={() => deletePost(editingPost)}
          onSaveDraft={(fields) => saveDraft(editingPost, fields)}
          onDiscardDraft={() => discardDraft(editingPost)}
          onUploadCover={(file) => uploadCover(editingPost, file)}
          onUploadInlineImage={uploadInlineImage}
        />
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
