import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  setCustomField, getCustomField, getAllCustomFields,
  deleteCustomField, clearCustomFields, listByCustomField
} from './bookmarks-custom-field';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bookmark_custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bookmark_id, key)
    )
  `).run();
  return db;
}

describe('bookmarks-custom-field', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('sets and gets a custom field', () => {
    setCustomField(db, bookmarkId, 'priority', 'high');
    expect(getCustomField(db, bookmarkId, 'priority')).toBe('high');
  });

  it('overwrites existing field', () => {
    setCustomField(db, bookmarkId, 'priority', 'low');
    setCustomField(db, bookmarkId, 'priority', 'high');
    expect(getCustomField(db, bookmarkId, 'priority')).toBe('high');
  });

  it('returns null for missing field', () => {
    expect(getCustomField(db, bookmarkId, 'missing')).toBeNull();
  });

  it('gets all custom fields', () => {
    setCustomField(db, bookmarkId, 'a', '1');
    setCustomField(db, bookmarkId, 'b', '2');
    expect(getAllCustomFields(db, bookmarkId)).toEqual({ a: '1', b: '2' });
  });

  it('deletes a custom field', () => {
    setCustomField(db, bookmarkId, 'key', 'val');
    expect(deleteCustomField(db, bookmarkId, 'key')).toBe(true);
    expect(getCustomField(db, bookmarkId, 'key')).toBeNull();
  });

  it('clears all custom fields', () => {
    setCustomField(db, bookmarkId, 'x', '1');
    setCustomField(db, bookmarkId, 'y', '2');
    clearCustomFields(db, bookmarkId);
    expect(getAllCustomFields(db, bookmarkId)).toEqual({});
  });

  it('lists bookmarks by custom field key and value', () => {
    const b2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    setCustomField(db, bookmarkId, 'env', 'prod');
    setCustomField(db, b2, 'env', 'dev');
    expect(listByCustomField(db, 'env', 'prod')).toContain(bookmarkId);
    expect(listByCustomField(db, 'env', 'prod')).not.toContain(b2);
    expect(listByCustomField(db, 'env')).toHaveLength(2);
  });
});
