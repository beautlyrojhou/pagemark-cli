import { Database } from 'better-sqlite3';

export function addLabel(db: Database, bookmarkId: number, label: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO labels (bookmark_id, label)
    VALUES (?, ?)
  `).run(bookmarkId, label.trim().toLowerCase());
}

export function removeLabel(db: Database, bookmarkId: number, label: string): void {
  db.prepare(`
    DELETE FROM labels WHERE bookmark_id = ? AND label = ?
  `).run(bookmarkId, label.trim().toLowerCase());
}

export function getLabels(db: Database, bookmarkId: number): string[] {
  const rows = db.prepare(`
    SELECT label FROM labels WHERE bookmark_id = ? ORDER BY label
  `).all(bookmarkId) as { label: string }[];
  return rows.map(r => r.label);
}

export function listByLabel(db: Database, label: string): { id: number; url: string; title: string }[] {
  return db.prepare(`
    SELECT b.id, b.url, b.title
    FROM bookmarks b
    JOIN labels l ON l.bookmark_id = b.id
    WHERE l.label = ?
    ORDER BY b.created_at DESC
  `).all(label.trim().toLowerCase()) as { id: number; url: string; title: string }[];
}

export function getAllLabels(db: Database): { label: string; count: number }[] {
  return db.prepare(`
    SELECT label, COUNT(*) as count
    FROM labels
    GROUP BY label
    ORDER BY count DESC, label
  `).all() as { label: string; count: number }[];
}

export function clearLabels(db: Database, bookmarkId: number): void {
  db.prepare(`DELETE FROM labels WHERE bookmark_id = ?`).run(bookmarkId);
}

export function initLabelSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      PRIMARY KEY (bookmark_id, label)
    );
  `);
}
