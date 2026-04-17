import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { setNote, getNote, clearNote, searchByNote } from './bookmarks-notes';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-notes', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('sets and retrieves a note', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setNote(db, id, 'My note here');
    expect(getNote(db, id)).toBe('My note here');
  });

  it('returns null when no note set', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    expect(getNote(db, id)).toBeNull();
  });

  it('clears a note', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setNote(db, id, 'Some note');
    clearNote(db, id);
    expect(getNote(db, id)).toBeNull();
  });

  it('searches bookmarks by note content', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    setNote(db, id1, 'important resource');
    setNote(db, id2, 'just a link');
    const results = searchByNote(db, 'important');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(id1);
  });

  it('throws on unknown bookmark id', () => {
    expect(() => setNote(db, 9999, 'note')).toThrow();
    expect(() => getNote(db, 9999)).toThrow();
  });
});
