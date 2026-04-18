import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { recordVisit, getVisitStats, listMostVisited, resetVisits } from './bookmarks-visit';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-visit', () => {
  test('recordVisit increments count', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://x.com', title: 'X', tags: [] });
    recordVisit(db, 1);
    recordVisit(db, 1);
    const stats = getVisitStats(db, 1);
    expect(stats?.visitCount).toBe(2);
  });

  test('getVisitStats returns null for missing bookmark', () => {
    const db = createTestDb();
    const stats = getVisitStats(db, 999);
    expect(stats).toBeNull();
  });

  test('listMostVisited orders by visit count', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    recordVisit(db, 2);
    recordVisit(db, 2);
    recordVisit(db, 1);
    const list = listMostVisited(db, 10);
    expect(list[0].id).toBe(2);
    expect(list[0].visitCount).toBe(2);
  });

  test('resetVisits sets count to zero', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] });
    recordVisit(db, 1);
    resetVisits(db, 1);
    const stats = getVisitStats(db, 1);
    expect(stats?.visitCount).toBe(0);
  });
});
