import { Database } from 'better-sqlite3';

export interface BookmarkList {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export function createBookmarkList(
  db: Database,
  name: string,
  description?: string
): BookmarkList {
  const stmt = db.prepare(
    `INSERT INTO bookmark_lists (name, description) VALUES (?, ?) RETURNING *`
  );
  return stmt.get(name, description ?? null) as BookmarkList;
}

export function deleteBookmarkList(db: Database, id: number): boolean {
  const result = db.prepare(`DELETE FROM bookmark_lists WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function listBookmarkLists(db: Database): BookmarkList[] {
  return db.prepare(`SELECT * FROM bookmark_lists ORDER BY name ASC`).all() as BookmarkList[];
}

export function addBookmarkToList(
  db: Database,
  listId: number,
  bookmarkId: number
): void {
  db.prepare(
    `INSERT OR IGNORE INTO bookmark_list_items (list_id, bookmark_id) VALUES (?, ?)`
  ).run(listId, bookmarkId);
}

export function removeBookmarkFromList(
  db: Database,
  listId: number,
  bookmarkId: number
): boolean {
  const result = db
    .prepare(`DELETE FROM bookmark_list_items WHERE list_id = ? AND bookmark_id = ?`)
    .run(listId, bookmarkId);
  return result.changes > 0;
}

export function getBookmarksInList(
  db: Database,
  listId: number
): { id: number; url: string; title: string }[] {
  return db
    .prepare(
      `SELECT b.id, b.url, b.title
       FROM bookmarks b
       JOIN bookmark_list_items bli ON bli.bookmark_id = b.id
       WHERE bli.list_id = ?
       ORDER BY b.title ASC`
    )
    .all(listId) as { id: number; url: string; title: string }[];
}

export function getListByName(db: Database, name: string): BookmarkList | undefined {
  return db
    .prepare(`SELECT * FROM bookmark_lists WHERE name = ?`)
    .get(name) as BookmarkList | undefined;
}
