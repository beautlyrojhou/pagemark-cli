import { Database } from 'better-sqlite3';

export function createCollection(db: Database, name: string): number {
  const result = db.prepare(
    `INSERT INTO collections (name, created_at) VALUES (?, datetime('now'))`
  ).run(name);
  return result.lastInsertRowid as number;
}

export function deleteCollection(db: Database, id: number): boolean {
  db.prepare(`DELETE FROM collection_bookmarks WHERE collection_id = ?`).run(id);
  const result = db.prepare(`DELETE FROM collections WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function listCollections(db: Database): { id: number; name: string; count: number }[] {
  return db.prepare(`
    SELECT c.id, c.name, COUNT(cb.bookmark_id) as count
    FROM collections c
    LEFT JOIN collection_bookmarks cb ON c.id = cb.collection_id
    GROUP BY c.id ORDER BY c.name
  `).all() as any[];
}

export function addToCollection(db: Database, collectionId: number, bookmarkId: number): void {
  db.prepare(
    `INSERT OR IGNORE INTO collection_bookmarks (collection_id, bookmark_id) VALUES (?, ?)`
  ).run(collectionId, bookmarkId);
}

export function removeFromCollection(db: Database, collectionId: number, bookmarkId: number): boolean {
  const result = db.prepare(
    `DELETE FROM collection_bookmarks WHERE collection_id = ? AND bookmark_id = ?`
  ).run(collectionId, bookmarkId);
  return result.changes > 0;
}

export function listCollectionBookmarks(db: Database, collectionId: number): any[] {
  return db.prepare(`
    SELECT b.* FROM bookmarks b
    JOIN collection_bookmarks cb ON b.id = cb.bookmark_id
    WHERE cb.collection_id = ?
    ORDER BY b.created_at DESC
  `).all(collectionId);
}

export function getCollectionByName(db: Database, name: string): { id: number; name: string } | undefined {
  return db.prepare(`SELECT id, name FROM collections WHERE name = ?`).get(name) as any;
}

export function renameCollection(db: Database, id: number, newName: string): boolean {
  const result = db.prepare(
    `UPDATE collections SET name = ? WHERE id = ?`
  ).run(newName, id);
  return result.changes > 0;
}
