import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import {
  createBookmarkList,
  deleteBookmarkList,
  listBookmarkLists,
  addBookmarkToList,
  removeBookmarkFromList,
  getBookmarksInList,
  getListByName,
} from './bookmarks-bookmark-list';
import { addBookmark } from './bookmarks';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  // Create bookmark_lists and bookmark_list_items tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bookmark_list_items (
      list_id INTEGER NOT NULL REFERENCES bookmark_lists(id) ON DELETE CASCADE,
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      PRIMARY KEY (list_id, bookmark_id)
    );
  `);
  return db;
}

describe('bookmark lists', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates a list', () => {
    const list = createBookmarkList(db, 'Favorites', 'My fav links');
    expect(list.name).toBe('Favorites');
    expect(list.description).toBe('My fav links');
    expect(list.id).toBeGreaterThan(0);
  });

  it('lists all bookmark lists', () => {
    createBookmarkList(db, 'Alpha');
    createBookmarkList(db, 'Beta');
    const lists = listBookmarkLists(db);
    expect(lists).toHaveLength(2);
    expect(lists[0].name).toBe('Alpha');
  });

  it('deletes a list', () => {
    const list = createBookmarkList(db, 'ToDelete');
    expect(deleteBookmarkList(db, list.id)).toBe(true);
    expect(listBookmarkLists(db)).toHaveLength(0);
  });

  it('adds and retrieves bookmarks in a list', () => {
    const list = createBookmarkList(db, 'Work');
    const bm = addBookmark(db, 'https://example.com', 'Example', []);
    addBookmarkToList(db, list.id, bm.id);
    const items = getBookmarksInList(db, list.id);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com');
  });

  it('removes a bookmark from a list', () => {
    const list = createBookmarkList(db, 'Temp');
    const bm = addBookmark(db, 'https://test.com', 'Test', []);
    addBookmarkToList(db, list.id, bm.id);
    expect(removeBookmarkFromList(db, list.id, bm.id)).toBe(true);
    expect(getBookmarksInList(db, list.id)).toHaveLength(0);
  });

  it('finds a list by name', () => {
    createBookmarkList(db, 'Named');
    const found = getListByName(db, 'Named');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Named');
  });
});
