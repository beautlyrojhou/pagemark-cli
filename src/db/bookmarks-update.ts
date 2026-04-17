import { Database } from 'better-sqlite3';

export interface UpdateBookmarkOptions {
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
}

export function updateBookmark(
  db: Database,
  id: number,
  opts: UpdateBookmarkOptions
): boolean {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (opts.title !== undefined) { fields.push('title = ?'); values.push(opts.title); }
  if (opts.url !== undefined) { fields.push('url = ?'); values.push(opts.url); }
  if (opts.description !== undefined) { fields.push('description = ?'); values.push(opts.description); }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const result = db.prepare(`UPDATE bookmarks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    if (result.changes === 0) return false;
  }

  if (opts.tags !== undefined) {
    db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(id);
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const linkTag = db.prepare(
      'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) SELECT ?, id FROM tags WHERE name = ?'
    );
    for (const tag of opts.tags) {
      insertTag.run(tag);
      linkTag.run(id, tag);
    }
  }

  return true;
}
