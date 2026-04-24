import { Database } from 'better-sqlite3';

export interface BookmarkGroup {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export function createGroup(db: Database, name: string, description?: string): BookmarkGroup {
  const stmt = db.prepare(
    `INSERT INTO bookmark_groups (name, description) VALUES (?, ?) RETURNING *`
  );
  return stmt.get(name, description ?? null) as BookmarkGroup;
}

export function deleteGroup(db: Database, groupId: number): boolean {
  const stmt = db.prepare(`DELETE FROM bookmark_groups WHERE id = ?`);
  const result = stmt.run(groupId);
  return result.changes > 0;
}

export function listGroups(db: Database): BookmarkGroup[] {
  return db.prepare(`SELECT * FROM bookmark_groups ORDER BY name ASC`).all() as BookmarkGroup[];
}

export function addBookmarkToGroup(db: Database, bookmarkId: number, groupId: number): void {
  db.prepare(
    `INSERT OR IGNORE INTO bookmark_group_members (bookmark_id, group_id) VALUES (?, ?)`
  ).run(bookmarkId, groupId);
}

export function removeBookmarkFromGroup(db: Database, bookmarkId: number, groupId: number): boolean {
  const result = db
    .prepare(`DELETE FROM bookmark_group_members WHERE bookmark_id = ? AND group_id = ?`)
    .run(bookmarkId, groupId);
  return result.changes > 0;
}

export function listBookmarksInGroup(db: Database, groupId: number): number[] {
  const rows = db
    .prepare(`SELECT bookmark_id FROM bookmark_group_members WHERE group_id = ?`)
    .all(groupId) as { bookmark_id: number }[];
  return rows.map((r) => r.bookmark_id);
}

export function getGroupsForBookmark(db: Database, bookmarkId: number): BookmarkGroup[] {
  return db
    .prepare(
      `SELECT g.* FROM bookmark_groups g
       JOIN bookmark_group_members m ON m.group_id = g.id
       WHERE m.bookmark_id = ?
       ORDER BY g.name ASC`
    )
    .all(bookmarkId) as BookmarkGroup[];
}

export function renameGroup(db: Database, groupId: number, newName: string): boolean {
  const result = db
    .prepare(`UPDATE bookmark_groups SET name = ? WHERE id = ?`)
    .run(newName, groupId);
  return result.changes > 0;
}
