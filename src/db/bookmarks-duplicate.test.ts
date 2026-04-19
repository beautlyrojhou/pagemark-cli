import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { checkDuplicate, findDuplicates, deduplicateBookmarks } from './bookmarks-duplicate';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('checkDuplicate', () => {
  it('returns isDuplicate false for new url', () => {
    const db = createTestDb();
    const result = checkDuplicate(db, 'https://example.com');
    expect(result.isDuplicate).toBe(false);
  });

  it('returns isDuplicate true for existing url', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const result = checkDuplicate(db, 'https://example.com');
    expect(result.isDuplicate).toBe(true);
    expect(result.existingTitle).toBe('Example');
    expect(result.existingId).toBeTypeOf('number');
  });

  it('returns isDuplicate false for similar but different url', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const result = checkDuplicate(db, 'https://example.com/page');
    expect(result.isDuplicate).toBe(false);
  });
});

describe('findDuplicates', () => {
  it('returns empty array when no duplicates', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    expect(findDuplicates(db)).toHaveLength(0);
  });

  it('detects duplicate urls', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://dup.com', title: 'First', tags: [] });
    addBookmark(db, { url: 'https://dup.com', title: 'Second', tags: [] });
    const dups = findDuplicates(db);
    expect(dups).toHaveLength(1);
    expect(dups[0].url).toBe('https://dup.com');
    expect(dups[0].ids).toHaveLength(2);
  });

  it('returns empty array when database is empty', () => {
    const db = createTestDb();
    expect(findDuplicates(db)).toHaveLength(0);
  });
});

describe('deduplicateBookmarks', () => {
  it('removes duplicate entries keeping the first', () => {
    const db = createTestDb();
    const id1 = addBookmark(db, { url: 'https://dup.com', title: 'First', tags: [] });
    addBookmark(db, { url: 'https://dup.com', title: 'Second', tags: [] });
    addBookmark(db, { url: 'https://dup.com', title: 'Third', tags: [] });
    const removed = deduplicateBookmarks(db);
    expect(removed).toBe(2);
    const remaining = db.prepare('SELECT id, title FROM bookmarks WHERE url = ?').all('https://dup.com') as any[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id1);
  });

  it('returns 0 when there are no duplicates', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    const removed = deduplicateBookmarks(db);
    expect(removed).toBe(0);
  });
});
