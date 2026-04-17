import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { archiveBookmark, unarchiveBookmark, listArchivedBookmarks, purgeArchivedBookmarks } from './bookmarks-archive';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-archive', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('archives a bookmark by id', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const result = archiveBookmark(db, id);
    expect(result).toBe(true);
    const archived = listArchivedBookmarks(db);
    expect(archived).toHaveLength(1);
    expect(archived[0].url).toBe('https://example.com');
  });

  it('returns false when archiving non-existent bookmark', () => {
    const result = archiveBookmark(db, 9999);
    expect(result).toBe(false);
  });

  it('unarchives a bookmark', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    archiveBookmark(db, id);
    const result = unarchiveBookmark(db, id);
    expect(result).toBe(true);
    expect(listArchivedBookmarks(db)).toHaveLength(0);
  });

  it('lists only archived bookmarks', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    archiveBookmark(db, id1);
    const archived = listArchivedBookmarks(db);
    expect(archived).toHaveLength(1);
    expect(archived[0].url).toBe('https://a.com');
  });

  it('purges all archived bookmarks', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    archiveBookmark(db, id1);
    archiveBookmark(db, id2);
    const count = purgeArchivedBookmarks(db);
    expect(count).toBe(2);
    expect(listArchivedBookmarks(db)).toHaveLength(0);
  });
});
