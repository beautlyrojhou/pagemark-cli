import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { ensureRatingColumn, setRating, clearRating, getRating, listByRating, listRated } from './bookmarks-rating';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  ensureRatingColumn(db);
  return db;
}

describe('bookmarks-rating', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('sets and gets a rating', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setRating(db, id, 4);
    expect(getRating(db, id)).toBe(4);
  });

  it('throws on invalid rating', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    expect(() => setRating(db, id, 0)).toThrow('Rating must be between 1 and 5');
    expect(() => setRating(db, id, 6)).toThrow('Rating must be between 1 and 5');
  });

  it('clears a rating', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setRating(db, id, 3);
    clearRating(db, id);
    expect(getRating(db, id)).toBeNull();
  });

  it('lists bookmarks by rating', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    setRating(db, id1, 5);
    setRating(db, id2, 3);
    const fiveStars = listByRating(db, 5);
    expect(fiveStars).toHaveLength(1);
    expect(fiveStars[0].url).toBe('https://a.com');
  });

  it('lists all rated bookmarks ordered by rating desc', () => {
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    setRating(db, id1, 2);
    setRating(db, id2, 5);
    const rated = listRated(db);
    expect(rated).toHaveLength(2);
    expect(rated[0].rating).toBe(5);
    expect(rated[1].rating).toBe(2);
  });

  it('throws when bookmark not found', () => {
    expect(() => getRating(db, 999)).toThrow('Bookmark 999 not found');
    expect(() => setRating(db, 999, 3)).toThrow('Bookmark 999 not found');
  });
});
