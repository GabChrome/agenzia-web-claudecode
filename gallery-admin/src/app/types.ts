export type Role = 'agency' | 'client';
export type MediaKind = 'image' | 'video' | 'embed';

// Aspetto della vetrina sul sito del cliente: sono dati salvati sul cliente,
// applicati dal componente di embed. Cambiarli non richiede alcun deploy.
export interface SiteStyle {
  layout?: string; // grid | masonry | carousel | list
  columns?: string;
  gap?: string;
  radius?: string;
  ratio?: string;
  captions?: string; // below | overlay | hover | off
  hover?: string; // zoom | lift | fade | none
  header?: string; // on | off
  font?: string;
  accent?: string;
  bg?: string;
  text?: string;
  muted?: string;
}

export interface TenantTheme {
  site?: SiteStyle;
  accent?: string;
  bg?: string;
  surface?: string;
  surface2?: string;
  text?: string;
  textSoft?: string;
  border?: string;
  radius?: string;
  font?: string;
  logo?: string;
}

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  theme: TenantTheme;
}

export interface Me {
  user: { id: string; email: string; role: Role };
  tenant: TenantInfo | null;
}

export interface Media {
  id: string;
  album_id: string;
  kind: MediaKind;
  url: string | null;
  thumb: string | null;
  embed_url: string | null;
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
  uploaded: boolean;
}

export interface Album {
  id: string;
  title_it: string;
  title_en: string;
  description_it: string;
  description_en: string;
  position: number;
  published: number;
  media: Media[];
}

export interface GalleryData {
  tenant: TenantInfo;
  albums: Album[];
}

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  theme: TenantTheme;
  album_count: number;
  media_count: number;
  user_count: number;
}

export interface TenantUser {
  id: string;
  email: string;
  created_at: string;
}
