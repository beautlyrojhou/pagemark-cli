import { Database } from 'better-sqlite3';

export function deleteBookmark(db: Database, id: number): boolean {
  const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function deleteBookmarksByTag(db: Database, tag: string): number {
  const tagRow = db.prepare('SELECT id FROM tags WHERE name = ?').get(tag) as { id: number } | undefined;
  if (!tagRow) return 0;

  const bookmarkIds = db
    .prepare('SELECT bookmark_id FROM bookmark_tags WHERE tag_id = ?')
    .all(tagRow.id) as { bookmark_id: number }[];

  if (bookmarkIds.length === 0) return 0;

  const deleteStmt = db.prepare('DELETE FROM bookmarks WHERE id = ?');
  let count = 0;
  for (const { bookmark_id } of bookmarkIds) {
    const res = deleteStmt.run(bookmark_id);
    count += res.changes;
  }
  return count;
}
