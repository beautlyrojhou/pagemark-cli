import { Database } from 'better-sqlite3';

export interface BookmarkComment {
  id: number;
  bookmarkId: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export function migrateBookmarkComments(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_bookmark_comments_bookmark_id ON bookmark_comments(bookmark_id);
  `);
}

export function addComment(db: Database, bookmarkId: number, body: string): BookmarkComment {
  const stmt = db.prepare(
    `INSERT INTO bookmark_comments (bookmark_id, body) VALUES (?, ?) RETURNING *`
  );
  return stmt.get(bookmarkId, body) as BookmarkComment;
}

export function updateComment(db: Database, commentId: number, body: string): boolean {
  const stmt = db.prepare(
    `UPDATE bookmark_comments SET body = ?, updated_at = datetime('now') WHERE id = ?`
  );
  const result = stmt.run(body, commentId);
  return result.changes > 0;
}

export function deleteComment(db: Database, commentId: number): boolean {
  const stmt = db.prepare(`DELETE FROM bookmark_comments WHERE id = ?`);
  const result = stmt.run(commentId);
  return result.changes > 0;
}

export function listComments(db: Database, bookmarkId: number): BookmarkComment[] {
  return db
    .prepare(`SELECT * FROM bookmark_comments WHERE bookmark_id = ? ORDER BY created_at ASC`)
    .all(bookmarkId) as BookmarkComment[];
}

export function clearComments(db: Database, bookmarkId: number): number {
  const result = db
    .prepare(`DELETE FROM bookmark_comments WHERE bookmark_id = ?`)
    .run(bookmarkId);
  return result.changes;
}

export function getComment(db: Database, commentId: number): BookmarkComment | undefined {
  return db
    .prepare(`SELECT * FROM bookmark_comments WHERE id = ?`)
    .get(commentId) as BookmarkComment | undefined;
}
