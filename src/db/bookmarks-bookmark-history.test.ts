import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, initSchema } from './schema';
import {
  recordHistory,
  getHistory,
  clearHistory,
  purgeOldHistory,
  listRecentChanges,
} from './bookmarks-bookmark-history';
import { addBookmark } from './bookmarks';
import { Database } from 'better-sqlite3';

function createTestDb(): Database {
  const db = openDb(':memory:');
  initSchema(db);
  db.prepare(
    `CREATE TABLE IF NOT EXISTS bookmark_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL
    )`
  ).run();
  return db;
}

describe('bookmarks-bookmark-history', () => {
  let db: Database;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, 'https://example.com', 'Example', ['test']);
  });

  it('records a history entry', () => {
    recordHistory(db, bookmarkId, 'title', 'Old Title', 'New Title');
    const history = getHistory(db, bookmarkId);
    expect(history).toHaveLength(1);
    expect(history[0].field).toBe('title');
    expect(history[0].oldValue).toBe('Old Title');
    expect(history[0].newValue).toBe('New Title');
  });

  it('returns history in descending order', () => {
    recordHistory(db, bookmarkId, 'title', 'A', 'B');
    recordHistory(db, bookmarkId, 'url', 'http://a.com', 'http://b.com');
    const history = getHistory(db, bookmarkId);
    expect(history[0].field).toBe('url');
  });

  it('clears history for a bookmark', () => {
    recordHistory(db, bookmarkId, 'title', 'A', 'B');
    const deleted = clearHistory(db, bookmarkId);
    expect(deleted).toBe(1);
    expect(getHistory(db, bookmarkId)).toHaveLength(0);
  });

  it('clears history only for the specified bookmark', () => {
    const id2 = addBookmark(db, 'https://other.com', 'Other', []);
    recordHistory(db, bookmarkId, 'title', 'A', 'B');
    recordHistory(db, id2, 'title', 'X', 'Y');
    clearHistory(db, bookmarkId);
    expect(getHistory(db, bookmarkId)).toHaveLength(0);
    expect(getHistory(db, id2)).toHaveLength(1);
  });

  it('lists recent changes across all bookmarks', () => {
    const id2 = addBookmark(db, 'https://other.com', 'Other', []);
    recordHistory(db, bookmarkId, 'title', 'A', 'B');
    recordHistory(db, id2, 'url', 'http://x.com', 'http://y.com');
    const recent = listRecentChanges(db, 10);
    expect(recent.length).toBe(2);
  });

  it('purgeOldHistory returns 0 when nothing is old enough', () => {
    recordHistory(db, bookmarkId, 'title', 'A', 'B');
    const deleted = purgeOldHistory(db, 365);
    expect(deleted).toBe(0);
  });
});
