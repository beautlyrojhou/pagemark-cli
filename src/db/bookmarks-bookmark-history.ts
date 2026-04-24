import { Database } from 'better-sqlite3';

export interface HistoryEntry {
  id: number;
  bookmarkId: number;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

export function recordHistory(
  db: Database,
  bookmarkId: number,
  field: string,
  oldValue: string | null,
  newValue: string | null
): void {
  db.prepare(
    `INSERT INTO bookmark_history (bookmark_id, field, old_value, new_value, changed_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(bookmarkId, field, oldValue, newValue);
}

export function getHistory(
  db: Database,
  bookmarkId: number
): HistoryEntry[] {
  return db
    .prepare(
      `SELECT id, bookmark_id as bookmarkId, field, old_value as oldValue,
              new_value as newValue, changed_at as changedAt
       FROM bookmark_history
       WHERE bookmark_id = ?
       ORDER BY changed_at DESC`
    )
    .all(bookmarkId) as HistoryEntry[];
}

export function clearHistory(db: Database, bookmarkId: number): number {
  const result = db
    .prepare(`DELETE FROM bookmark_history WHERE bookmark_id = ?`)
    .run(bookmarkId);
  return result.changes;
}

export function purgeOldHistory(db: Database, olderThanDays: number): number {
  const result = db
    .prepare(
      `DELETE FROM bookmark_history
       WHERE changed_at < datetime('now', ?)`
    )
    .run(`-${olderThanDays} days`);
  return result.changes;
}

export function listRecentChanges(
  db: Database,
  limit = 20
): HistoryEntry[] {
  return db
    .prepare(
      `SELECT id, bookmark_id as bookmarkId, field, old_value as oldValue,
              new_value as newValue, changed_at as changedAt
       FROM bookmark_history
       ORDER BY changed_at DESC
       LIMIT ?`
    )
    .all(limit) as HistoryEntry[];
}
