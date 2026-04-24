import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import {
  createGroup,
  deleteGroup,
  listGroups,
  addBookmarkToGroup,
  removeBookmarkFromGroup,
  listBookmarksInGroup,
  getGroupsForBookmark,
  renameGroup,
} from './bookmarks-bookmark-group';
import { addBookmark } from './bookmarks';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bookmark_group_members (
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES bookmark_groups(id) ON DELETE CASCADE,
      PRIMARY KEY (bookmark_id, group_id)
    );
  `);
  return db;
}

describe('bookmark groups', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    const bm = addBookmark(db, 'https://example.com', 'Example', []);
    bookmarkId = bm.id;
  });

  it('creates and lists a group', () => {
    createGroup(db, 'Reading', 'Things to read');
    const groups = listGroups(db);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Reading');
    expect(groups[0].description).toBe('Things to read');
  });

  it('deletes a group', () => {
    const g = createGroup(db, 'Temp');
    expect(deleteGroup(db, g.id)).toBe(true);
    expect(listGroups(db)).toHaveLength(0);
  });

  it('adds and lists bookmarks in group', () => {
    const g = createGroup(db, 'Work');
    addBookmarkToGroup(db, bookmarkId, g.id);
    expect(listBookmarksInGroup(db, g.id)).toContain(bookmarkId);
  });

  it('removes bookmark from group', () => {
    const g = createGroup(db, 'Work');
    addBookmarkToGroup(db, bookmarkId, g.id);
    expect(removeBookmarkFromGroup(db, bookmarkId, g.id)).toBe(true);
    expect(listBookmarksInGroup(db, g.id)).toHaveLength(0);
  });

  it('gets groups for a bookmark', () => {
    const g1 = createGroup(db, 'Alpha');
    const g2 = createGroup(db, 'Beta');
    addBookmarkToGroup(db, bookmarkId, g1.id);
    addBookmarkToGroup(db, bookmarkId, g2.id);
    const groups = getGroupsForBookmark(db, bookmarkId);
    expect(groups.map((g) => g.name)).toEqual(['Alpha', 'Beta']);
  });

  it('renames a group', () => {
    const g = createGroup(db, 'OldName');
    expect(renameGroup(db, g.id, 'NewName')).toBe(true);
    expect(listGroups(db)[0].name).toBe('NewName');
  });
});
