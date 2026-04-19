import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  addHighlight,
  listHighlights,
  deleteHighlight,
  clearHighlights,
  initHighlightsTable,
} from './bookmarks-highlight';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  initHighlightsTable(db);
  return db;
}

describe('bookmarks-highlight', () => {
  it('adds and retrieves a highlight', () => {
    const db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const h = addHighlight(db, bm.id, 'interesting text', 'blue');
    expect(h.bookmarkId).toBe(bm.id);
    expect(h.text).toBe('interesting text');
    expect(h.color).toBe('blue');
    expect(h.id).toBeGreaterThan(0);
  });

  it('uses yellow as default color', () => {
    const db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const h = addHighlight(db, bm.id, 'some text');
    expect(h.color).toBe('yellow');
  });

  it('lists highlights for a bookmark', () => {
    const db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    addHighlight(db, bm.id, 'first');
    addHighlight(db, bm.id, 'second', 'green');
    const list = listHighlights(db, bm.id);
    expect(list).toHaveLength(2);
    expect(list.map(h => h.text)).toEqual(['first', 'second']);
  });

  it('deletes a highlight by id', () => {
    const db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const h = addHighlight(db, bm.id, 'to delete');
    const deleted = deleteHighlight(db, h.id);
    expect(deleted).toBe(true);
    expect(listHighlights(db, bm.id)).toHaveLength(0);
  });

  it('clears all highlights for a bookmark', () => {
    const db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    addHighlight(db, bm.id, 'a');
    addHighlight(db, bm.id, 'b');
    const count = clearHighlights(db, bm.id);
    expect(count).toBe(2);
    expect(listHighlights(db, bm.id)).toHaveLength(0);
  });
});
