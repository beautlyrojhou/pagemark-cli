import { Database } from 'better-sqlite3';

export type BookmarkStatus = 'active' | 'archived' | 'draft' | 'broken' | 'review';

export function setStatus(db: Database, bookmarkId: number, status: BookmarkStatus): boolean {
  const result = db.prepare(
    `UPDATE bookmarks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(status, bookmarkId);
  return result.changes > 0;
}

export function getStatus(db: Database, bookmarkId: number): BookmarkStatus | null {
  const row = db.prepare(
    `SELECT status FROM bookmarks WHERE id = ?`
  ).get(bookmarkId) as { status: string } | undefined;
  return row ? (row.status as BookmarkStatus) : null;
}

export function clearStatus(db: Database, bookmarkId: number): boolean {
  const result = db.prepare(
    `UPDATE bookmarks SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(bookmarkId);
  return result.changes > 0;
}

export function listByStatus(db: Database, status: BookmarkStatus): Array<{ id: number; url: string; title: string; status: string }> {
  return db.prepare(
    `SELECT id, url, title, status FROM bookmarks WHERE status = ? ORDER BY updated_at DESC`
  ).all(status) as Array<{ id: number; url: string; title: string; status: string }>;
}

export function getStatusCounts(db: Database): Record<string, number> {
  const rows = db.prepare(
    `SELECT status, COUNT(*) as count FROM bookmarks GROUP BY status`
  ).all() as Array<{ status: string; count: number }>;
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status ?? 'active'] = row.count;
  }
  return counts;
}
