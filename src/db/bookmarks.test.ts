import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark, searchBookmarks, listByTag, getBookmarkById } from './bookmarks';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

describe('bookmarks module', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  test('addBookmark stores a bookmark with tags', () => {
    const bm = addBookmark(db, 'https://example.com', 'Example', 'A test site', ['web', 'test']);
    expect(bm.id).toBeGreaterThan(0);
    expect(bm.url).toBe('https://example.com');
    expect(bm.tags).toEqual(expect.arrayContaining(['web', 'test']));
  });

  test('getBookmarkById returns undefined for missing id', () => {
    expect(getBookmarkById(db, 999)).toBeUndefined();
  });

  test('searchBookmarks finds by title', () => {
    addBookmark(db, 'https://typescript.org', 'TypeScript Docs', '', ['ts']);
    addBookmark(db, 'https://rust-lang.org', 'Rust Language', '', ['rust']);
    const results = searchBookmarks(db, 'TypeScript');
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://typescript.org');
  });

  test('searchBookmarks finds by notes', () => {
    addBookmark(db, 'https://nodejs.org', 'Node.js', 'async runtime for javascript', ['js']);
    const results = searchBookmarks(db, 'async runtime');
    expect(results[0].url).toBe('https://nodejs.org');
  });

  test('listByTag returns only bookmarks with matching tag', () => {
    addBookmark(db, 'https://a.com', 'A', '', ['alpha', 'shared']);
    addBookmark(db, 'https://b.com', 'B', '', ['beta', 'shared']);
    addBookmark(db, 'https://c.com', 'C', '', ['alpha']);
    const alpha = listByTag(db, 'alpha');
    expect(alpha.map(b => b.url)).toEqual(expect.arrayContaining(['https://a.com', 'https://c.com']));
    expect(alpha.map(b => b.url)).not.toContain('https://b.com');
  });

  test('listByTag is case-insensitive', () => {
    addBookmark(db, 'https://d.com', 'D', '', ['CaseSensitive']);
    const results = listByTag(db, 'casesensitive');
    expect(results).toHaveLength(1);
  });
});
