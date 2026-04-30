import type { Database } from 'better-sqlite3';

export type Priority = 'low' | 'normal' | 'high' | 'critical';

const VALID_PRIORITIES: Priority[] = ['low', 'normal', 'high', 'critical'];

export function isValidPriority(value: string): value is Priority {
  return VALID_PRIORITIES.includes(value as Priority);
}

export function setPriority(db: Database, bookmarkId: number, priority: Priority): void {
  const stmt = db.prepare(
    `INSERT INTO bookmark_priorities (bookmark_id, priority, updated_at)
     VALUES (?, ?, unixepoch())
     ON CONFLICT(bookmark_id) DO UPDATE SET priority = excluded.priority, updated_at = excluded.updated_at`
  );
  stmt.run(bookmarkId, priority);
}

export function getPriority(db: Database, bookmarkId: number): Priority | null {
  const row = db.prepare(
    `SELECT priority FROM bookmark_priorities WHERE bookmark_id = ?`
  ).get(bookmarkId) as { priority: Priority } | undefined;
  return row?.priority ?? null;
}

export function clearPriority(db: Database, bookmarkId: number): void {
  db.prepare(`DELETE FROM bookmark_priorities WHERE bookmark_id = ?`).run(bookmarkId);
}

export function listByPriority(db: Database, priority: Priority): Array<{ id: number; url: string; title: string; priority: Priority }> {
  return db.prepare(
    `SELECT b.id, b.url, b.title, bp.priority
     FROM bookmarks b
     JOIN bookmark_priorities bp ON b.id = bp.bookmark_id
     WHERE bp.priority = ?
     ORDER BY b.created_at DESC`
  ).all(priority) as Array<{ id: number; url: string; title: string; priority: Priority }>;
}

export function getPriorityCounts(db: Database): Record<Priority, number> {
  const rows = db.prepare(
    `SELECT priority, COUNT(*) as count FROM bookmark_priorities GROUP BY priority`
  ).all() as Array<{ priority: Priority; count: number }>;

  const counts: Record<Priority, number> = { low: 0, normal: 0, high: 0, critical: 0 };
  for (const row of rows) {
    counts[row.priority] = row.count;
  }
  return counts;
}

export function migratePriorities(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_priorities (
      bookmark_id INTEGER PRIMARY KEY REFERENCES bookmarks(id) ON DELETE CASCADE,
      priority    TEXT NOT NULL DEFAULT 'normal',
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_bookmark_priorities_priority ON bookmark_priorities(priority);
  `);
}
