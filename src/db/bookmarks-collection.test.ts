import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  createCollection, deleteCollection, listCollections,
  addToCollection, removeFromCollection, listCollectionBookmarks, getCollectionByName
} from './bookmarks-collection';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at TEXT);
    CREATE TABLE IF NOT EXISTS collection_bookmarks (collection_id INTEGER, bookmark_id INTEGER, PRIMARY KEY (collection_id, bookmark_id));
  `);
  return db;
}

describe('bookmarks-collection', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => { db = createTestDb(); });

  it('creates and lists collections', () => {
    createCollection(db, 'Work');
    createCollection(db, 'Personal');
    const cols = listCollections(db);
    expect(cols).toHaveLength(2);
    expect(cols.map(c => c.name)).toContain('Work');
  });

  it('adds bookmarks to collection', () => {
    const colId = createCollection(db, 'Dev');
    const bId = addBookmark(db, { url: 'https://example.com', title: 'Ex', tags: [] });
    addToCollection(db, colId, bId);
    const items = listCollectionBookmarks(db, colId);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com');
  });

  it('removes bookmark from collection', () => {
    const colId = createCollection(db, 'Dev');
    const bId = addBookmark(db, { url: 'https://example.com', title: 'Ex', tags: [] });
    addToCollection(db, colId, bId);
    removeFromCollection(db, colId, bId);
    expect(listCollectionBookmarks(db, colId)).toHaveLength(0);
  });

  it('deletes collection and its memberships', () => {
    const colId = createCollection(db, 'Temp');
    const bId = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addToCollection(db, colId, bId);
    deleteCollection(db, colId);
    expect(listCollections(db)).toHaveLength(0);
  });

  it('gets collection by name', () => {
    createCollection(db, 'Named');
    const col = getCollectionByName(db, 'Named');
    expect(col).toBeDefined();
    expect(col!.name).toBe('Named');
  });
});
