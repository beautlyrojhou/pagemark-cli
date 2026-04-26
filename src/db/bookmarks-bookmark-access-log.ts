import { Database } from 'better-sqlite3';

/**
 * Access log entry for a bookmark.
 */
export interface AccessLogEntry {
  id: number;
  bookmarkId: number;
  accessedAt: string;
  source: string; // e.g. 'cli', 'open', 'api'
  note?: string;
}

/**
 * Records an access event for a bookmark.
 */
export function recordAccess(
  db: Database,
  bookmarkId: number,
  source: string = 'cli',
  note?: string
): void {
  db.prepare(
    `INSERT INTO bookmark_access_log (bookmark_id, accessed_at, source, note)
     VALUES (?, datetime('now'), ?, ?)`
  ).run(bookmarkId, source, note ?? null);
}

/**
 * Returns all access log entries for a given bookmark, newest first.
 */
export function getAccessLog(
  db: Database,
  bookmarkId: number,
  limit: number = 50
): AccessLogEntry[] {
  return db
    .prepare(
      `SELECT id, bookmark_id AS bookmarkId, accessed_at AS accessedAt, source, note
       FROM bookmark_access_log
       WHERE bookmark_id = ?
       ORDER BY accessed_at DESC
       LIMIT ?`
    )
    .all(bookmarkId, limit) as AccessLogEntry[];
}

/**
 * Returns the most recently accessed bookmarks across all entries.
 */
export function listRecentAccesses(
  db: Database,
  limit: number = 20
): Array<AccessLogEntry & { url: string; title: string }> {
  return db
    .prepare(
      `SELECT al.id, al.bookmark_id AS bookmarkId, al.accessed_at AS accessedAt,
              al.source, al.note, b.url, b.title
       FROM bookmark_access_log al
       JOIN bookmarks b ON b.id = al.bookmark_id
       ORDER BY al.accessed_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<AccessLogEntry & { url: string; title: string }>;
}

/**
 * Clears all access log entries for a given bookmark.
 */
export function clearAccessLog(db: Database, bookmarkId: number): number {
  const result = db
    .prepare(`DELETE FROM bookmark_access_log WHERE bookmark_id = ?`)
    .run(bookmarkId);
  return result.changes;
}

/**
 * Removes access log entries older than the given number of days.
 */
export function purgeOldAccessLog(db: Database, olderThanDays: number): number {
  const result = db
    .prepare(
      `DELETE FROM bookmark_access_log
       WHERE accessed_at < datetime('now', ?)`
    )
    .run(`-${olderThanDays} days`);
  return result.changes;
}

/**
 * Ensures the bookmark_access_log table exists.
 */
export function migrateAccessLog(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_access_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      accessed_at TEXT    NOT NULL,
      source      TEXT    NOT NULL DEFAULT 'cli',
      note        TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_access_log_bookmark_id
      ON bookmark_access_log(bookmark_id);
    CREATE INDEX IF NOT EXISTS idx_access_log_accessed_at
      ON bookmark_access_log(accessed_at);
  `);
}
