import { Database } from "better-sqlite3";

export function pinBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare("UPDATE bookmarks SET pinned = 1 WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export function unpinBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare("UPDATE bookmarks SET pinned = 0 WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export function listPinnedBookmarks(db: Database): Array<{ id: number; url: string; title: string; tags: string }> {
  return db
    .prepare(
      `SELECT b.id, b.url, b.title,
        GROUP_CONCAT(t.name, ', ') as tags
       FROM bookmarks b
       LEFT JOIN bookmark_tags bt ON bt.bookmark_id = b.id
       LEFT JOIN tags t ON t.id = bt.tag_id
       WHERE b.pinned = 1
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    )
    .all() as Array<{ id: number; url: string; title: string; tags: string }>;
}
