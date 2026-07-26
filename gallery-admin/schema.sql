-- Schema D1 per il pannello gallerie multi-cliente.
-- Ogni riga è legata a un tenant (cliente): l'isolamento è garantito dal Worker,
-- che filtra sempre per tenant_id ricavato dalla sessione dell'utente.

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  theme_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agency','client')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title_it TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_it TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  album_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','video','embed')),
  r2_key TEXT,
  thumb_key TEXT,
  embed_url TEXT,
  embed_thumb_url TEXT,
  content_type TEXT,
  -- Testi per elemento, tutti modificabili dal cliente e tutti bilingue:
  -- titolo, didascalia breve, testo esteso e testo alternativo (accessibilità).
  title_it TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  caption_it TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  description_it TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  alt_it TEXT NOT NULL DEFAULT '',
  alt_en TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- Contatori anti brute-force (finestre di 15 minuti per email/IP).
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_tenant ON media(tenant_id, album_id, position);
CREATE INDEX IF NOT EXISTS idx_albums_tenant ON albums(tenant_id, position);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
