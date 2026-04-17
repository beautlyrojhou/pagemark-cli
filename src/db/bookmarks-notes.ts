import { Database } from 'better-sqlite3';

export function setNote(db: Database, bookmarkId: number, note: string): void {
  const stmt = db.prepare(`
    UPDATE bookmarks SET notes = ? WHERE id = ?
  `);
  const result = stmt.run(note, bookmarkId);
  if (result.changes === 0) {
    throw new Error(`Bookmark with id ${bookmarkId} not found`);
  }
}

export function getNote(db: Database, bookmarkId: number): string | null {
  const row = db.prepare('SELECT notes FROM bookmarks WHERE id = ?').get(bookmarkId) as { notes: string | null } | undefined;
  if (!row) {
    throw new Error(`Bookmark with id ${bookmarkId} not found`);
  }
  return row.notes ?? null;
}

export function clearNote(db: Database, bookmarkId: number): void {
  const stmt = db.prepare('UPDATE bookmarks SET notes = NULL WHERE id = ?');
  const result = stmt.run(bookmarkId);
  if (result.changes === 0) {
    throw new Error(`Bookmark with id ${bookmarkId} not found`);
  }
}

export function searchByNote(db: Database, query: string): any[] {
  return db.prepare(`
    SELECT * FROM bookmarks WHERE notes LIKE ? ORDER BY created_at DESC
  `).all(`%${query}%`);
}
