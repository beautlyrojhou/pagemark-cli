import Database from 'better-sqlite3';

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  notes: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export function addBookmark(
  db: Database.Database,
  url: string,
  title: string,
  notes: string,
  tags: string[]
): Bookmark {
  const insert = db.prepare(
    `INSERT INTO bookmarks (url, title, notes) VALUES (?, ?, ?)`
  );
  const { lastInsertRowid } = insert.run(url, title, notes);
  const id = Number(lastInsertRowid);
  setTags(db, id, tags);
  return getBookmarkById(db, id)!;
}

export function getBookmarkById(db: Database.Database, id: number): Bookmark | undefined {
  const row = db.prepare(`SELECT * FROM bookmarks WHERE id = ?`).get(id) as any;
  if (!row) return undefined;
  return { ...row, tags: getTagsForBookmark(db, id) };
}

export function searchBookmarks(db: Database.Database, query: string): Bookmark[] {
  const rows = db.prepare(
    `SELECT b.* FROM bookmarks b
     JOIN bookmarks_fts fts ON fts.rowid = b.id
     WHERE bookmarks_fts MATCH ?
     ORDER BY rank`
  ).all(query) as any[];
  return rows.map(r => ({ ...r, tags: getTagsForBookmark(db, r.id) }));
}

export function listByTag(db: Database.Database, tag: string): Bookmark[] {
  const rows = db.prepare(
    `SELECT b.* FROM bookmarks b
     JOIN bookmark_tags bt ON bt.bookmark_id = b.id
     JOIN tags t ON t.id = bt.tag_id
     WHERE t.name = ? COLLATE NOCASE
     ORDER BY b.created_at DESC`
  ).all(tag) as any[];
  return rows.map(r => ({ ...r, tags: getTagsForBookmark(db, r.id) }));
}

function getTagsForBookmark(db: Database.Database, bookmarkId: number): string[] {
  return (db.prepare(
    `SELECT t.name FROM tags t
     JOIN bookmark_tags bt ON bt.tag_id = t.id
     WHERE bt.bookmark_id = ?`
  ).all(bookmarkId) as any[]).map(r => r.name);
}

function setTags(db: Database.Database, bookmarkId: number, tags: string[]): void {
  for (const name of tags) {
    db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).run(name);
    const tag = db.prepare(`SELECT id FROM tags WHERE name = ? COLLATE NOCASE`).get(name) as any;
    db.prepare(`INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)`).run(bookmarkId, tag.id);
  }
}
