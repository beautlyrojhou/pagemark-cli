import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  isValidPriority,
  setPriority,
  getPriority,
  clearPriority,
  listByPriority,
  getPriorityCounts,
} from './bookmarks-bookmark-priority';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-bookmark-priority', () => {
  let db: ReturnType<typeof createTestDb>;
  let id1: number;
  let id2: number;
  let id3: number;

  beforeEach(() => {
    db = createTestDb();
    id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    id3 = addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
  });

  it('isValidPriority accepts low/medium/high/critical', () => {
    expect(isValidPriority('low')).toBe(true);
    expect(isValidPriority('medium')).toBe(true);
    expect(isValidPriority('high')).toBe(true);
    expect(isValidPriority('critical')).toBe(true);
    expect(isValidPriority('unknown')).toBe(false);
    expect(isValidPriority('')).toBe(false);
  });

  it('setPriority and getPriority round-trips', () => {
    setPriority(db, id1, 'high');
    expect(getPriority(db, id1)).toBe('high');
  });

  it('getPriority returns null when not set', () => {
    expect(getPriority(db, id1)).toBeNull();
  });

  it('clearPriority removes the priority', () => {
    setPriority(db, id1, 'critical');
    clearPriority(db, id1);
    expect(getPriority(db, id1)).toBeNull();
  });

  it('listByPriority returns bookmarks with that priority', () => {
    setPriority(db, id1, 'high');
    setPriority(db, id2, 'high');
    setPriority(db, id3, 'low');
    const highs = listByPriority(db, 'high');
    expect(highs.map((b) => b.id).sort()).toEqual([id1, id2].sort());
  });

  it('listByPriority returns empty array when none match', () => {
    expect(listByPriority(db, 'critical')).toHaveLength(0);
  });

  it('getPriorityCounts returns correct counts', () => {
    setPriority(db, id1, 'high');
    setPriority(db, id2, 'high');
    setPriority(db, id3, 'low');
    const counts = getPriorityCounts(db);
    expect(counts['high']).toBe(2);
    expect(counts['low']).toBe(1);
    expect(counts['medium'] ?? 0).toBe(0);
  });

  it('updating priority overwrites old value', () => {
    setPriority(db, id1, 'low');
    setPriority(db, id1, 'critical');
    expect(getPriority(db, id1)).toBe('critical');
  });
});
