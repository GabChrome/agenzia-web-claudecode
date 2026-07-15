import type { Context } from 'hono';
import type { AppEnv } from './types';

// Protezione anti brute-force basata su D1: finestre di 15 minuti per chiave
// (email o IP). Le chiavi vengono azzerate al login riuscito o alla scadenza
// della finestra.
const WINDOW_MINUTES = 15;

export const RATE_LIMIT_MESSAGE = `Troppi tentativi: riprova tra ${WINDOW_MINUTES} minuti`;

function cutoffIso(): string {
  return new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
}

export function clientIp(c: Context<AppEnv>): string {
  return c.req.header('cf-connecting-ip') ?? 'sconosciuto';
}

export async function rateLimitExceeded(
  db: D1Database,
  key: string,
  limit: number
): Promise<boolean> {
  const row = await db
    .prepare('SELECT count, window_start FROM login_attempts WHERE key = ?')
    .bind(key)
    .first<{ count: number; window_start: string }>();
  if (!row) return false;
  if (row.window_start < cutoffIso()) return false;
  return row.count >= limit;
}

export async function recordFailure(db: D1Database, key: string): Promise<void> {
  const now = new Date().toISOString();
  const cutoff = cutoffIso();
  await db
    .prepare(
      `INSERT INTO login_attempts (key, count, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN login_attempts.window_start < ?3 THEN 1 ELSE login_attempts.count + 1 END,
         window_start = CASE WHEN login_attempts.window_start < ?3 THEN ?2 ELSE login_attempts.window_start END`
    )
    .bind(key, now, cutoff)
    .run();
}

export async function clearFailures(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();
}
