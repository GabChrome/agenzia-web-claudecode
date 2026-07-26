-- Migrazione per installazioni già attive: memorizza le modifiche in corso di
-- un elemento, così se il cliente chiude il pannello mentre sta scrivendo,
-- alla riapertura ritrova tutto e riprende da dove aveva lasciato.
--
-- Il contenuto resta separato dai testi pubblicati: finché il cliente non
-- salva, sul sito non cambia nulla.
--
-- Applicare con:
--   npx wrangler d1 execute gallery-admin-db --remote --file=./migrations/003_media_draft.sql

ALTER TABLE media ADD COLUMN draft_json TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN draft_at TEXT;
