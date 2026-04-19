import { Database } from 'better-sqlite3';

export interface Highlight {
  id: number;
  bookmarkId: number;
  text: string;
  color: string;
  createdAt: string;
}

export function addHighlight(
  db: Database,
  bookmarkId: number,
  text: string,
  color = 'yellow'
): Highlight {
  const stmt = db.prepare(
    `INSERT INTO highlights (bookmark_id, text, color, created_at)
     VALUES (?, ?, ?, datetime('now'))`
  );
  const result = stmt.run(bookmarkId, text, color);
  return getHighlight(db, result.lastInsertRowid as number)!;
}

export function getHighlight(db: Database, id: number): Highlight | undefined {
  return db
    .prepare('SELECT id, bookmark_id as bookmarkId, text, color, created_at as createdAt FROM highlights WHERE id = ?')
    .get(id) as Highlight | undefined;
}

export function listHighlights(db: Database, bookmarkId: number): Highlight[] {
  return db
    .prepare('SELECT id, bookmark_id as bookmarkId, text, color, created_at as createdAt FROM highlights WHERE bookmark_id = ? ORDER BY created_at')
    .all(bookmarkId) as Highlight[];
}

export function deleteHighlight(db: Database, id: number): boolean {
  const result = db.prepare('DELETE FROM highlights WHERE id = ?').run(id);
  return result.changes > 0;
}

export function clearHighlights(db: Database, bookmarkId: number): number {
  const result = db.prepare('DELETE FROM highlights WHERE bookmark_id = ?').run(bookmarkId);
  return result.changes;
}

export function initHighlightsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'yellow',
      created_at TEXT NOT NULL,
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    )
  `);
}
