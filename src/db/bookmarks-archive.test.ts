import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  archiveBookmark,
  unarchiveBookmark,
  listArchivedBookmarks,
  purgeArchivedBookmarks,
} from './bookmarks-archive';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-archive', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('archives a bookmark', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    expect(archiveBookmark(db, id)).toBe(true);
    const rows = listArchivedBookmarks(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(id);
  });

  it('returns false when archiving non-existent bookmark', () => {
    expect(archiveBookmark(db, 9999)).toBe(false);
  });

  it('unarchives a bookmark', () => {
    const id = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    archiveBookmark(db, id);
    expect(unarchiveBookmark(db, id)).toBe(true);
    expect(listArchivedBookmarks(db)).toHaveLength(0);
  });

  it('returns false when unarchiving non-archived bookmark', () => {
    const id = addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    expect(unarchiveBookmark(db, id)).toBe(false);
  });

  it('purges all archived bookmarks', () => {
    const id1 = addBookmark(db, { url: 'https://d.com', title: 'D', tags: [] });
    const id2 = addBookmark(db, { url: 'https://e.com', title: 'E', tags: [] });
    archiveBookmark(db, id1);
    archiveBookmark(db, id2);
    expect(purgeArchivedBookmarks(db)).toBe(2);
    expect(listArchivedBookmarks(db)).toHaveLength(0);
  });
});
