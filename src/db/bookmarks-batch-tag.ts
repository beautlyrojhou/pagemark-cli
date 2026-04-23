import { Database } from 'better-sqlite3';

export function batchAddTag(db: Database, bookmarkIds: number[], tag: string): number {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag) VALUES (?, ?)`
  );
  const run = db.transaction((ids: number[]) => {
    let count = 0;
    for (const id of ids) {
      const result = insert.run(id, tag.trim().toLowerCase());
      if (result.changes > 0) count++;
    }
    return count;
  });
  return run(bookmarkIds);
}

export function batchRemoveTag(db: Database, bookmarkIds: number[], tag: string): number {
  const del = db.prepare(
    `DELETE FROM bookmark_tags WHERE bookmark_id = ? AND tag = ?`
  );
  const run = db.transaction((ids: number[]) => {
    let count = 0;
    for (const id of ids) {
      const result = del.run(id, tag.trim().toLowerCase());
      if (result.changes > 0) count++;
    }
    return count;
  });
  return run(bookmarkIds);
}

export function batchReplaceTag(db: Database, oldTag: string, newTag: string): number {
  const stmt = db.prepare(
    `UPDATE bookmark_tags SET tag = ? WHERE tag = ?`
  );
  const result = stmt.run(newTag.trim().toLowerCase(), oldTag.trim().toLowerCase());
  return result.changes;
}

export function batchClearTags(db: Database, bookmarkIds: number[]): number {
  const del = db.prepare(`DELETE FROM bookmark_tags WHERE bookmark_id = ?`);
  const run = db.transaction((ids: number[]) => {
    let count = 0;
    for (const id of ids) {
      const result = del.run(id);
      count += result.changes;
    }
    return count;
  });
  return run(bookmarkIds);
}
