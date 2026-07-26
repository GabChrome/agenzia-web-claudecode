-- Migrazione per installazioni già attive: aggiunge titolo, testo esteso e
-- testo alternativo per ogni elemento (la didascalia esisteva già).
--
-- Applicare con:
--   npx wrangler d1 execute gallery-admin-db --remote --file=./migrations/002_media_texts.sql
--
-- Chi parte da zero non deve fare nulla: schema.sql contiene già queste colonne.

ALTER TABLE media ADD COLUMN title_it TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN description_it TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN description_en TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN alt_it TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN alt_en TEXT NOT NULL DEFAULT '';
