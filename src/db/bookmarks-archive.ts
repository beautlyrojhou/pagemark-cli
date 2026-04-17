import { Database } from 'better-sqlite3';

export function archiveBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare(`UPDATE bookmarks SET archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function unarchiveBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare(`UPDATE bookmarks SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function listArchivedBookmarks(db: Database): any[] {
  return db.prepare(`
    SELECT b.id, b.url, b.title, b.notes, b.created_at, b.updated_at,
           GROUP_CONCAT(t.name, ', ') AS tags
    FROM bookmarks b
    LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
    LEFT JOIN tags t ON bt.tag_id = t.id
    WHERE b.archived = 1
    GROUP BY b.id
    ORDER BY b.updated_at DESC
  `).all();
}

export function purgeArchivedBookmarks(db: Database): number {
  const result = db.prepare(`DELETE FROM bookmarks WHERE archived = 1`).run();
  return result.changes;
}
