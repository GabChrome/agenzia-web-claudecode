export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
}

export type Role = 'agency' | 'client';
export type MediaKind = 'image' | 'video' | 'embed';

export interface UserRow {
  id: string;
  tenant_id: string | null;
  email: string;
  password_hash: string;
  role: Role;
}

export interface TenantRow {
  id: string;
  slug: string;
  name: string;
  theme_json: string;
}

export interface AlbumRow {
  id: string;
  tenant_id: string;
  title_it: string;
  title_en: string;
  description_it: string;
  description_en: string;
  position: number;
  published: number;
  created_at: string;
}

export interface MediaRow {
  id: string;
  tenant_id: string;
  album_id: string;
  kind: MediaKind;
  r2_key: string | null;
  thumb_key: string | null;
  embed_url: string | null;
  embed_thumb_url: string | null;
  content_type: string | null;
  title_it: string;
  title_en: string;
  caption_it: string;
  caption_en: string;
  description_it: string;
  description_en: string;
  alt_it: string;
  alt_en: string;
  position: number;
  published: number;
  draft_json: string;
  draft_at: string | null;
  created_at: string;
}

export interface PostRow {
  id: string;
  tenant_id: string;
  slug: string;
  slug_locked: number;
  title_it: string;
  title_en: string;
  excerpt_it: string;
  excerpt_en: string;
  body_it: string;
  body_en: string;
  cover_key: string | null;
  cover_content_type: string | null;
  tags: string;
  published: number;
  publish_at: string | null;
  draft_json: string;
  draft_at: string | null;
  created_at: string;
  updated_at: string;
}

// Tipatura condivisa per Hono: bindings + variabili impostate dai middleware.
export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: UserRow;
    tenant: TenantRow;
  };
};
