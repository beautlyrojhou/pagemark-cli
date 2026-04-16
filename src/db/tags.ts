import { Database } from 'better-sqlite3';

export interface Tag {
  id: number;
  name: string;
}

export function getAllTags(db: Database): Tag[] {
  return db.prepare('SELECT id, name FROM tags ORDER BY name ASC').all() as Tag[];
}

export function renameTag(db: Database, oldName: string, newName: string): boolean {
  const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(oldName) as Tag | undefined;
  if (!tag) return false;
  const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(newName) as Tag | undefined;
  if (existing) {
    db.prepare('UPDATE bookmark_tags SET tag_id = ? WHERE tag_id = ?').run(existing.id, tag.id);
    db.prepare('DELETE FROM tags WHERE id = ?').run(tag.id);
  } else {
    db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(newName, tag.id);
  }
  return true;
}

export function deleteTag(db: Database, name: string): boolean {
  const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(name) as Tag | undefined;
  if (!tag) return false;
  db.prepare('DELETE FROM bookmark_tags WHERE tag_id = ?').run(tag.id);
  db.prepare('DELETE FROM tags WHERE id = ?').run(tag.id);
  return true;
}

export function getTagUsageCounts(db: Database): Array<Tag & { count: number }> {
  return db
    .prepare(
      `SELECT t.id, t.name, COUNT(bt.bookmark_id) as count
       FROM tags t
       LEFT JOIN bookmark_tags bt ON bt.tag_id = t.id
       GROUP BY t.id
       ORDER BY count DESC, t.name ASC`
    )
    .all() as Array<Tag & { count: number }>;
}
