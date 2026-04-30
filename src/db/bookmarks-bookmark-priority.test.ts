import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import {
  setPriority,
  getPriority,
  clearPriority,
  listByPriority,
  getPriorityCounts,
  migratePriorities,
  isValidPriority,
} from './bookmarks-bookmark-priority';
import { addBookmark } from './bookmarks';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  migratePriorities(db);
  return db;
}

describe('bookmarks-bookmark-priority', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('isValidPriority returns true for valid values', () => {
    expect(isValidPriority('low')).toBe(true);
    expect(isValidPriority('normal')).toBe(true);
    expect(isValidPriority('high')).toBe(true);
    expect(isValidPriority('critical')).toBe(true);
    expect(isValidPriority('urgent')).toBe(false);
  });

  it('sets and gets a priority', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setPriority(db, id, 'high');
    expect(getPriority(db, id)).toBe('high');
  });

  it('returns null when no priority is set', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    expect(getPriority(db, id)).toBeNull();
  });

  it('overwrites an existing priority', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setPriority(db, id, 'low');
    setPriority(db, id, 'critical');
    expect(getPriority(db, id)).toBe('critical');
  });

  it('clears a priority', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setPriority(db, id, 'high');
    clearPriority(db, id);
    expect(getPriority(db, id)).toBeNull();
  });

  it('lists bookmarks by priority', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    setPriority(db, id1, 'high');
    setPriority(db, id2, 'high');
    const results = listByPriority(db, 'high');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toContain(id1);
    expect(results.map((r) => r.id)).toContain(id2);
  });

  it('returns priority counts', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    const id3 = addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    setPriority(db, id1, 'critical');
    setPriority(db, id2, 'critical');
    setPriority(db, id3, 'low');
    const counts = getPriorityCounts(db);
    expect(counts.critical).toBe(2);
    expect(counts.low).toBe(1);
    expect(counts.normal).toBe(0);
    expect(counts.high).toBe(0);
  });
});
