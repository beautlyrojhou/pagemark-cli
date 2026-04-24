import { Database } from 'better-sqlite3';

export function migrateBookmarkGroups(db: Database): void {
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='bookmark_groups'`)
    .get();

  if (!tables) {
    db.exec(`
      CREATE TABLE bookmark_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE bookmark_group_members (
        bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
        group_id INTEGER NOT NULL REFERENCES bookmark_groups(id) ON DELETE CASCADE,
        PRIMARY KEY (bookmark_id, group_id)
      );

      CREATE INDEX IF NOT EXISTS idx_group_members_bookmark
        ON bookmark_group_members(bookmark_id);

      CREATE INDEX IF NOT EXISTS idx_group_members_group
        ON bookmark_group_members(group_id);
    `);
  }
}
