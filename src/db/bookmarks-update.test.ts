import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark, getBookmarkById, getTagsForBookmark } from './bookmarks';
import { updateBookmark } from './bookmarks-update';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('updateBookmark', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => { db = createTestDb(); });

  it('updates title and url', () => {
    const id = addBookmark(db, { url: 'https://old.com', title: 'Old', tags: [] });
    const ok = updateBookmark(db, id, { title: 'New', url: 'https://new.com' });
    expect(ok).toBe(true);
    const bm = getBookmarkById(db, id);
    expect(bm?.title).toBe('New');
    expect(bm?.url).toBe('https://new.com');
  });

  it('updates tags', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Ex', tags: ['a', 'b'] });
    updateBookmark(db, id, { tags: ['c'] });
    const tags = getTagsForBookmark(db, id);
    expect(tags).toEqual(['c']);
  });

  it('returns false for missing bookmark when updating fields', () => {
    const ok = updateBookmark(db, 9999, { title: 'Ghost' });
    expect(ok).toBe(false);
  });

  it('no-op update with only tags still returns true', () => {
    const id = addBookmark(db, { url: 'https://x.com', title: 'X', tags: [] });
    const ok = updateBookmark(db, id, { tags: ['new'] });
    expect(ok).toBe(true);
  });
});
