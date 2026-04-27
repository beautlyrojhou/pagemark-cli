import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { setStatus, getStatus, clearStatus, listByStatus, getStatusCounts } from './bookmarks-bookmark-status';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.prepare(`ALTER TABLE bookmarks ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`).run();
  return db;
}

describe('bookmarks-bookmark-status', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('sets and gets a status', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setStatus(db, id, 'draft');
    expect(getStatus(db, id)).toBe('draft');
  });

  it('returns null for missing bookmark', () => {
    expect(getStatus(db, 9999)).toBeNull();
  });

  it('clears status back to active', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setStatus(db, id, 'broken');
    clearStatus(db, id);
    expect(getStatus(db, id)).toBe('active');
  });

  it('lists bookmarks by status', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    setStatus(db, id1, 'review');
    setStatus(db, id2, 'review');
    const results = listByStatus(db, 'review');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toContain(id1);
    expect(results.map(r => r.id)).toContain(id2);
  });

  it('returns status counts', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    setStatus(db, id1, 'draft');
    setStatus(db, id2, 'broken');
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    const counts = getStatusCounts(db);
    expect(counts['draft']).toBe(1);
    expect(counts['broken']).toBe(1);
    expect(counts['active']).toBe(1);
  });
});
