import { Database } from 'better-sqlite3';

export function pinBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare('UPDATE bookmarks SET pinned = 1 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function unpinBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare('UPDATE bookmarks SET pinned = 0 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function listPinnedBookmarks(db: Database): Array<{
  id: number;
  url: string;
  title: string | null;
  created_at: string;
}> {
  const stmt = db.prepare(
    'SELECT id, url, title, created_at FROM bookmarks WHERE pinned = 1 ORDER BY created_at DESC'
  );
  return stmt.all() as any[];
}
