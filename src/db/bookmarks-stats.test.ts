import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { getStats } from './bookmarks-stats';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('getStats', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns zero counts for empty db', () => {
    const stats = getStats(db);
    expect(stats.totalBookmarks).toBe(0);
    expect(stats.totalTags).toBe(0);
    expect(stats.mostUsedTags).toHaveLength(0);
    expect(stats.recentBookmarks).toHaveLength(0);
  });

  it('counts bookmarks and tags correctly', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'web'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    const stats = getStats(db);
    expect(stats.totalBookmarks).toBe(2);
    expect(stats.totalTags).toBe(2);
  });

  it('returns most used tags in order', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'web'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    const stats = getStats(db);
    expect(stats.mostUsedTags[0].tag).toBe('ts');
    expect(stats.mostUsedTags[0].count).toBe(2);
  });

  it('returns recent bookmarks', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    const stats = getStats(db);
    expect(stats.recentBookmarks.length).toBeGreaterThanOrEqual(2);
    expect(stats.recentBookmarks[0]).toHaveProperty('url');
  });
});
