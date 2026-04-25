import Database from 'better-sqlite3';
import { initSchema } from './schema';
import {
  addAlias,
  removeAlias,
  getAliases,
  resolveAlias,
  listAllAliases,
  clearAliases,
} from './bookmarks-bookmark-alias';
import { addBookmark } from './bookmarks';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmark_aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
      alias TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);
  return db;
}

describe('bookmark aliases', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  test('addAlias and getAliases', () => {
    addAlias(db, bookmarkId, 'ex');
    addAlias(db, bookmarkId, 'example');
    const aliases = getAliases(db, bookmarkId);
    expect(aliases).toContain('ex');
    expect(aliases).toContain('example');
    expect(aliases).toHaveLength(2);
  });

  test('addAlias throws on duplicate alias', () => {
    addAlias(db, bookmarkId, 'ex');
    expect(() => addAlias(db, bookmarkId, 'ex')).toThrow("Alias 'ex' is already in use.");
  });

  test('removeAlias returns true when removed', () => {
    addAlias(db, bookmarkId, 'ex');
    const removed = removeAlias(db, 'ex');
    expect(removed).toBe(true);
    expect(getAliases(db, bookmarkId)).toHaveLength(0);
  });

  test('removeAlias returns false when not found', () => {
    expect(removeAlias(db, 'nonexistent')).toBe(false);
  });

  test('resolveAlias returns bookmarkId', () => {
    addAlias(db, bookmarkId, 'mysite');
    expect(resolveAlias(db, 'mysite')).toBe(bookmarkId);
  });

  test('resolveAlias returns null for unknown alias', () => {
    expect(resolveAlias(db, 'ghost')).toBeNull();
  });

  test('listAllAliases returns all aliases', () => {
    const id2 = addBookmark(db, { url: 'https://other.com', title: 'Other', tags: [] });
    addAlias(db, bookmarkId, 'alpha');
    addAlias(db, id2, 'beta');
    const all = listAllAliases(db);
    expect(all).toHaveLength(2);
    expect(all.map((a) => a.alias)).toEqual(['alpha', 'beta']);
  });

  test('clearAliases removes all aliases for a bookmark', () => {
    addAlias(db, bookmarkId, 'a1');
    addAlias(db, bookmarkId, 'a2');
    const count = clearAliases(db, bookmarkId);
    expect(count).toBe(2);
    expect(getAliases(db, bookmarkId)).toHaveLength(0);
  });
});
