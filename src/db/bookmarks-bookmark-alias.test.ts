import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  addAlias,
  removeAlias,
  getAliases,
  resolveAlias,
  listAllAliases,
  clearAliases,
} from './bookmarks-bookmark-alias';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-bookmark-alias', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example' });
  });

  it('adds an alias to a bookmark', () => {
    addAlias(db, bookmarkId, 'my-example');
    const aliases = getAliases(db, bookmarkId);
    expect(aliases).toContain('my-example');
  });

  it('resolves an alias to a bookmark id', () => {
    addAlias(db, bookmarkId, 'ex-alias');
    const resolved = resolveAlias(db, 'ex-alias');
    expect(resolved).toBe(bookmarkId);
  });

  it('returns null for unknown alias', () => {
    const resolved = resolveAlias(db, 'nonexistent');
    expect(resolved).toBeNull();
  });

  it('removes an alias', () => {
    addAlias(db, bookmarkId, 'temp-alias');
    removeAlias(db, bookmarkId, 'temp-alias');
    const aliases = getAliases(db, bookmarkId);
    expect(aliases).not.toContain('temp-alias');
  });

  it('lists all aliases across bookmarks', () => {
    const id2 = addBookmark(db, { url: 'https://other.com', title: 'Other' });
    addAlias(db, bookmarkId, 'alias-a');
    addAlias(db, id2, 'alias-b');
    const all = listAllAliases(db);
    expect(all.length).toBe(2);
    expect(all.map((a) => a.alias)).toEqual(expect.arrayContaining(['alias-a', 'alias-b']));
  });

  it('clears all aliases for a bookmark', () => {
    addAlias(db, bookmarkId, 'a1');
    addAlias(db, bookmarkId, 'a2');
    clearAliases(db, bookmarkId);
    expect(getAliases(db, bookmarkId)).toHaveLength(0);
  });

  it('does not allow duplicate aliases', () => {
    addAlias(db, bookmarkId, 'dup');
    expect(() => addAlias(db, bookmarkId, 'dup')).toThrow();
  });
});
