import { Database } from 'better-sqlite3';

export function migrateBookmarkHistory(db: Database): void {
  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type='table' AND name='bookmark_history'`
    )
    .get();

  if (!tableExists) {
    db.prepare(
      `CREATE TABLE bookmark_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
        field TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_bookmark_history_bookmark_id
       ON bookmark_history(bookmark_id)`
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_bookmark_history_changed_at
       ON bookmark_history(changed_at)`
    ).run();
  }
}
