import { Database } from 'better-sqlite3';

export function migrateBookmarkTemplates(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_templates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL UNIQUE,
      url_pattern TEXT NOT NULL,
      title_prefix TEXT,
      default_tags TEXT,
      notes       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
