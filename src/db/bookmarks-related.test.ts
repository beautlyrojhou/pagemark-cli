import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { findRelatedBookmarks, getRelatedIds } from './bookmarks-related';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('findRelatedBookmarks', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns empty array when bookmark has no tags', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['news'] });
    const result = findRelatedBookmarks(db, id);
    expect(result).toEqual([]);
  });

  it('returns bookmarks sharing at least one tag', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['python'] });

    const result = findRelatedBookmarks(db, id);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('B');
    expect(result[0].sharedTags).toContain('ts');
  });

  it('ranks bookmarks with more shared tags higher', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node', 'web'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['ts', 'node'] });

    const result = findRelatedBookmarks(db, id);
    expect(result[0].title).toBe('C');
    expect(result[0].score).toBe(2);
    expect(result[1].title).toBe('B');
    expect(result[1].score).toBe(1);
  });

  it('respects the limit parameter', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['tag'] });
    for (let i = 0; i < 10; i++) {
      addBookmark(db, { url: `https://x${i}.com`, title: `X${i}`, tags: ['tag'] });
    }
    const result = findRelatedBookmarks(db, id, 3);
    expect(result).toHaveLength(3);
  });

  it('does not include the source bookmark itself', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    const result = findRelatedBookmarks(db, id);
    expect(result.every((r) => r.id !== id)).toBe(true);
  });
});

describe('getRelatedIds', () => {
  it('returns only IDs', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts'] });
    const b = addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    const ids = getRelatedIds(db, id);
    expect(ids).toContain(b);
  });
});
