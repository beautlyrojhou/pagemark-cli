import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './bookmarks.test';
import { addBookmark, getBookmarkById } from './bookmarks';
import { deleteBookmark, deleteBookmarksByTag } from './bookmarks-delete';

describe('deleteBookmark', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('deletes an existing bookmark by id', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const deleted = deleteBookmark(db, id);
    expect(deleted).toBe(true);
    expect(getBookmarkById(db, id)).toBeUndefined();
  });

  it('returns false for non-existent id', () => {
    const deleted = deleteBookmark(db, 9999);
    expect(deleted).toBe(false);
  });

  it('deleteBookmarksByTag removes all bookmarks with given tag', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['news'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['news'] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['other'] });
    const count = deleteBookmarksByTag(db, 'news');
    expect(count).toBe(2);
  });

  it('deleteBookmarksByTag returns 0 for unknown tag', () => {
    const count = deleteBookmarksByTag(db, 'nonexistent');
    expect(count).toBe(0);
  });
});
