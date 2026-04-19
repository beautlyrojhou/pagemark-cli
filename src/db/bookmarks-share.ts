import { Database } from 'better-sqlite3';
import { randomBytes } from 'crypto';

export interface ShareLink {
  id: number;
  bookmarkId: number;
  token: string;
  createdAt: string;
  expiresAt: string | null;
}

export function createShareLink(
  db: Database,
  bookmarkId: number,
  expiresInDays?: number
): ShareLink {
  db.exec(`
    CREATE TABLE IF NOT EXISTS share_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    )
  `);

  const token = randomBytes(16).toString('hex');
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const stmt = db.prepare(
    `INSERT INTO share_links (bookmark_id, token, expires_at) VALUES (?, ?, ?)`
  );
  const result = stmt.run(bookmarkId, token, expiresAt);

  return db
    .prepare(`SELECT id, bookmark_id as bookmarkId, token, created_at as createdAt, expires_at as expiresAt FROM share_links WHERE id = ?`)
    .get(result.lastInsertRowid) as ShareLink;
}

export function getShareLink(db: Database, token: string): ShareLink | undefined {
  return db
    .prepare(`SELECT id, bookmark_id as bookmarkId, token, created_at as createdAt, expires_at as expiresAt FROM share_links WHERE token = ?`)
    .get(token) as ShareLink | undefined;
}

export function listShareLinks(db: Database, bookmarkId: number): ShareLink[] {
  return db
    .prepare(`SELECT id, bookmark_id as bookmarkId, token, created_at as createdAt, expires_at as expiresAt FROM share_links WHERE bookmark_id = ?`)
    .all(bookmarkId) as ShareLink[];
}

export function revokeShareLink(db: Database, token: string): boolean {
  const result = db.prepare(`DELETE FROM share_links WHERE token = ?`).run(token);
  return result.changes > 0;
}

export function pruneExpiredShareLinks(db: Database): number {
  const result = db
    .prepare(`DELETE FROM share_links WHERE expires_at IS NOT NULL AND expires_at < datetime('now')`)
    .run();
  return result.changes;
}
