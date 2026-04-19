import { Database } from 'better-sqlite3';

export function addToReadingList(db: Database, bookmarkId: number): void {
  db.prepare(`
    INSERT OR IGNORE INTO reading_list (bookmark_id, added_at)
    VALUES (?, datetime('now'))
  `).run(bookmarkId);
}

export function removeFromReadingList(db: Database, bookmarkId: number): void {
  db.prepare(`DELETE FROM reading_list WHERE bookmark_id = ?`).run(bookmarkId);
}

export function isInReadingList(db: Database, bookmarkId: number): boolean {
  const row = db.prepare(`SELECT 1 FROM reading_list WHERE bookmark_id = ?`).get(bookmarkId);
  return !!row;
}

export function listReadingList(db: Database): any[] {
  return db.prepare(`
    SELECT b.id, b.url, b.title, rl.added_at
    FROM reading_list rl
    JOIN bookmarks b ON b.id = rl.bookmark_id
    ORDER BY rl.added_at DESC
  `).all();
}

export function clearReadingList(db: Database): number {
  const result = db.prepare(`DELETE FROM reading_list`).run();
  return result.changes;
}

export function markAsRead(db: Database, bookmarkId: number): void {
  db.prepare(`
    UPDATE reading_list SET read_at = datetime('now') WHERE bookmark_id = ?
  `).run(bookmarkId);
}

export function listUnread(db: Database): any[] {
  return db.prepare(`
    SELECT b.id, b.url, b.title, rl.added_at
    FROM reading_list rl
    JOIN bookmarks b ON b.id = rl.bookmark_id
    WHERE rl.read_at IS NULL
    ORDER BY rl.added_at DESC
  `).all();
}
