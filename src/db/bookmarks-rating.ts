import { Database } from 'better-sqlite3';

export function setRating(db: Database, id: number, rating: number): void {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
  const result = db.prepare('UPDATE bookmarks SET rating = ? WHERE id = ?').run(rating, id);
  if (result.changes === 0) throw new Error(`Bookmark ${id} not found`);
}

export function clearRating(db: Database, id: number): void {
  const result = db.prepare('UPDATE bookmarks SET rating = NULL WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Bookmark ${id} not found`);
}

export function getRating(db: Database, id: number): number | null {
  const row = db.prepare('SELECT rating FROM bookmarks WHERE id = ?').get(id) as { rating: number | null } | undefined;
  if (!row) throw new Error(`Bookmark ${id} not found`);
  return row.rating;
}

export function listByRating(db: Database, rating: number): { id: number; url: string; title: string; rating: number }[] {
  return db
    .prepare('SELECT id, url, title, rating FROM bookmarks WHERE rating = ? ORDER BY created_at DESC')
    .all(rating) as { id: number; url: string; title: string; rating: number }[];
}

export function listRated(db: Database): { id: number; url: string; title: string; rating: number }[] {
  return db
    .prepare('SELECT id, url, title, rating FROM bookmarks WHERE rating IS NOT NULL ORDER BY rating DESC, created_at DESC')
    .all() as { id: number; url: string; title: string; rating: number }[];
}

export function ensureRatingColumn(db: Database): void {
  const cols = db.prepare("PRAGMA table_info(bookmarks)").all() as { name: string }[];
  if (!cols.some(c => c.name === 'rating')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN rating INTEGER CHECK(rating BETWEEN 1 AND 5)');
  }
}
