import { Database } from 'better-sqlite3';

/**
 * Applies the custom fields table migration to an existing database.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export function migrateCustomFields(db: Database): void {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bookmark_custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(bookmark_id, key)
    )
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_custom_fields_bookmark
    ON bookmark_custom_fields(bookmark_id)
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_custom_fields_key_value
    ON bookmark_custom_fields(key, value)
  `).run();
}
