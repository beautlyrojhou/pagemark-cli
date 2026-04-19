import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  addToReadingList,
  removeFromReadingList,
  isInReadingList,
  listReadingList,
  clearReadingList,
  markAsRead,
  listUnread,
} from './bookmarks-reading-list';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.prepare(`
    CREATE TABLE IF NOT EXISTS reading_list (
      bookmark_id INTEGER PRIMARY KEY REFERENCES bookmarks(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL,
      read_at TEXT
    )
  `).run();
  return db;
}

describe('reading list', () => {
  let db: ReturnType<typeof createTestDb>;
  let id1: number;
  let id2: number;

  beforeEach(() => {
    db = createTestDb();
    id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
  });

  it('adds and checks membership', () => {
    addToReadingList(db, id1);
    expect(isInReadingList(db, id1)).toBe(true);
    expect(isInReadingList(db, id2)).toBe(false);
  });

  it('lists reading list entries', () => {
    addToReadingList(db, id1);
    addToReadingList(db, id2);
    const list = listReadingList(db);
    expect(list).toHaveLength(2);
  });

  it('removes from reading list', () => {
    addToReadingList(db, id1);
    removeFromReadingList(db, id1);
    expect(isInReadingList(db, id1)).toBe(false);
  });

  it('marks as read and filters unread', () => {
    addToReadingList(db, id1);
    addToReadingList(db, id2);
    markAsRead(db, id1);
    const unread = listUnread(db);
    expect(unread).toHaveLength(1);
    expect(unread[0].id).toBe(id2);
  });

  it('clears reading list', () => {
    addToReadingList(db, id1);
    addToReadingList(db, id2);
    const count = clearReadingList(db);
    expect(count).toBe(2);
    expect(listReadingList(db)).toHaveLength(0);
  });
});
