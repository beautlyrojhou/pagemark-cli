import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { recordVisit, getVisitStats, listMostVisited, resetVisits } from './bookmarks-visit';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.exec(`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0`);
  db.exec(`ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS last_visited_at TEXT`);
  return db;
}

describe('bookmarks-visit', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('records a visit and increments count', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    recordVisit(db, id);
    const stats = getVisitStats(db, id);
    expect(stats.visitCount).toBe(1);
    expect(stats.lastVisitedAt).not.toBeNull();
  });

  it('increments visit count on multiple visits', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    recordVisit(db, id);
    recordVisit(db, id);
    recordVisit(db, id);
    const stats = getVisitStats(db, id);
    expect(stats.visitCount).toBe(3);
  });

  it('throws when recording visit for missing bookmark', () => {
    expect(() => recordVisit(db, 9999)).toThrow('not found');
  });

  it('lists most visited bookmarks in order', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    recordVisit(db, id1);
    recordVisit(db, id2);
    recordVisit(db, id2);
    const results = listMostVisited(db);
    expect(results[0].id).toBe(id2);
    expect(results[0].visitCount).toBe(2);
    expect(results[1].id).toBe(id1);
  });

  it('resets visit stats', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    recordVisit(db, id);
    resetVisits(db, id);
    const stats = getVisitStats(db, id);
    expect(stats.visitCount).toBe(0);
    expect(stats.lastVisitedAt).toBeNull();
  });
});
