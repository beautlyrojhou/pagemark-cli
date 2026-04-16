import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = process.env.PAGEMARK_DB ?? path.join(os.homedir(), '.pagemark.db');

export function openDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      url       TEXT NOT NULL UNIQUE,
      title     TEXT NOT NULL DEFAULT '',
      notes     TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      tag_id      INTEGER NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
      PRIMARY KEY (bookmark_id, tag_id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS bookmarks_fts USING fts5(
      url, title, notes,
      content='bookmarks',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS bookmarks_ai AFTER INSERT ON bookmarks BEGIN
      INSERT INTO bookmarks_fts(rowid, url, title, notes)
        VALUES (new.id, new.url, new.title, new.notes);
    END;

    CREATE TRIGGER IF NOT EXISTS bookmarks_ad AFTER DELETE ON bookmarks BEGIN
      INSERT INTO bookmarks_fts(bookmarks_fts, rowid, url, title, notes)
        VALUES ('delete', old.id, old.url, old.title, old.notes);
    END;

    CREATE TRIGGER IF NOT EXISTS bookmarks_au AFTER UPDATE ON bookmarks BEGIN
      INSERT INTO bookmarks_fts(bookmarks_fts, rowid, url, title, notes)
        VALUES ('delete', old.id, old.url, old.title, old.notes);
      INSERT INTO bookmarks_fts(rowid, url, title, notes)
        VALUES (new.id, new.url, new.title, new.notes);
    END;
  `);
}
