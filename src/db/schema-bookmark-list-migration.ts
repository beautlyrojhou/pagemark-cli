import { Database } from 'better-sqlite3';

/**
 * Adds bookmark_lists and bookmark_list_items tables if they don't exist.
 * Safe to run multiple times (idempotent).
 */
export function migrateBookmarkLists(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_lists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      description TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmark_list_items (
      list_id     INTEGER NOT NULL
                    REFERENCES bookmark_lists(id) ON DELETE CASCADE,
      bookmark_id INTEGER NOT NULL
                    REFERENCES bookmarks(id) ON DELETE CASCADE,
      PRIMARY KEY (list_id, bookmark_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookmark_list_items_bookmark
      ON bookmark_list_items(bookmark_id);
  `);
}
