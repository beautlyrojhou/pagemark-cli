import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, initSchema } from './schema';
import { getBookmarkById } from './bookmarks';
import { batchAddBookmarks, batchDeleteBookmarks, batchUpdateBookmarks } from './bookmarks-batch';
import type { Database } from 'better-sqlite3';

function createTestDb(): Database {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('batchAddBookmarks', () => {
  it('adds multiple bookmarks and returns success count', () => {
    const db = createTestDb();
    const result = batchAddBookmarks(db, [
      { url: 'https://a.com', title: 'A', tags: ['x'] },
      { url: 'https://b.com', title: 'B' },
    ]);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('records errors for failed items without stopping', () => {
    const db = createTestDb();
    // Add a bookmark first so duplicate URL triggers an error
    batchAddBookmarks(db, [{ url: 'https://dup.com', title: 'Dup' }]);
    const result = batchAddBookmarks(db, [
      { url: 'https://good.com', title: 'Good' },
      { url: 'https://dup.com', title: 'Duplicate' },
    ]);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0].index).toBe(1);
  });
});

describe('batchDeleteBookmarks', () => {
  it('deletes multiple bookmarks successfully', () => {
    const db = createTestDb();
    batchAddBookmarks(db, [
      { url: 'https://del1.com', title: 'Del1' },
      { url: 'https://del2.com', title: 'Del2' },
    ]);
    const result = batchDeleteBookmarks(db, [{ id: 1 }, { id: 2 }]);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(getBookmarkById(db, 1)).toBeUndefined();
  });

  it('records error for non-existent bookmark id', () => {
    const db = createTestDb();
    const result = batchDeleteBookmarks(db, [{ id: 999 }]);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toMatch(/999/);
  });
});

describe('batchUpdateBookmarks', () => {
  it('updates multiple bookmarks successfully', () => {
    const db = createTestDb();
    batchAddBookmarks(db, [
      { url: 'https://upd1.com', title: 'Upd1' },
      { url: 'https://upd2.com', title: 'Upd2' },
    ]);
    const result = batchUpdateBookmarks(db, [
      { id: 1, title: 'Updated1' },
      { id: 2, title: 'Updated2' },
    ]);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(getBookmarkById(db, 1)?.title).toBe('Updated1');
  });

  it('records error for non-existent bookmark id', () => {
    const db = createTestDb();
    const result = batchUpdateBookmarks(db, [{ id: 404, title: 'Ghost' }]);
    expect(result.failed).toBe(1);
    expect(result.errors[0].index).toBe(0);
  });
});
