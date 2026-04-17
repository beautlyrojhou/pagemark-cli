import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { pinBookmark, unpinBookmark, listPinnedBookmarks } from './bookmarks-pin';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  // ensure pinned column exists
  try {
    db.exec('ALTER TABLE bookmarks ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
  } catch {
    // column may already exist in schema
  }
  return db;
}

describe('bookmarks-pin', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('pins a bookmark', () => {
    const id = addBookmark(db, 'https://example.com', 'Example', []);
    const result = pinBookmark(db, id);
    expect(result).toBe(true);
    const pinned = listPinnedBookmarks(db);
    expect(pinned).toHaveLength(1);
    expect(pinned[0].url).toBe('https://example.com');
  });

  it('unpins a bookmark', () => {
    const id = addBookmark(db, 'https://example.com', 'Example', []);
    pinBookmark(db, id);
    const result = unpinBookmark(db, id);
    expect(result).toBe(true);
    expect(listPinnedBookmarks(db)).toHaveLength(0);
  });

  it('returns false when bookmark does not exist', () => {
    expect(pinBookmark(db, 9999)).toBe(false);
    expect(unpinBookmark(db, 9999)).toBe(false);
  });

  it('lists multiple pinned bookmarks', () => {
    const id1 = addBookmark(db, 'https://a.com', 'A', []);
    const id2 = addBookmark(db, 'https://b.com', 'B', []);
    addBookmark(db, 'https://c.com', 'C', []);
    pinBookmark(db, id1);
    pinBookmark(db, id2);
    const pinned = listPinnedBookmarks(db);
    expect(pinned).toHaveLength(2);
  });
});
