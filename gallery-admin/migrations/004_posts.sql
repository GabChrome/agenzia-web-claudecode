-- Migrazione per installazioni già attive: aggiunge la sezione Notizie.
--
-- Applicare con:
--   npx wrangler d1 execute gallery-admin-db --remote --file=./migrations/004_posts.sql

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  slug_locked INTEGER NOT NULL DEFAULT 0,
  title_it TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  excerpt_it TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  body_it TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  cover_key TEXT,
  cover_content_type TEXT,
  tags TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0,
  publish_at TEXT,
  draft_json TEXT NOT NULL DEFAULT '',
  draft_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_posts_tenant ON posts(tenant_id, published, publish_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(tenant_id, slug);
