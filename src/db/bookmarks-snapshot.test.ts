import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { saveSnapshot, getLatestSnapshot, listSnapshots, deleteSnapshot, clearSnapshots } from './bookmarks-snapshot';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.prepare(`CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    captured_at TEXT NOT NULL
  )`).run();
  return db;
}

describe('bookmarks-snapshot', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('saves and retrieves latest snapshot', () => {
    saveSnapshot(db, bookmarkId, 'Hello World');
    const snap = getLatestSnapshot(db, bookmarkId);
    expect(snap).toBeDefined();
    expect(snap!.content).toBe('Hello World');
  });

  it('returns most recent snapshot as latest', () => {
    saveSnapshot(db, bookmarkId, 'First');
    saveSnapshot(db, bookmarkId, 'Second');
    const snap = getLatestSnapshot(db, bookmarkId);
    expect(snap!.content).toBe('Second');
  });

  it('lists all snapshots in descending order', () => {
    saveSnapshot(db, bookmarkId, 'A');
    saveSnapshot(db, bookmarkId, 'B');
    const snaps = listSnapshots(db, bookmarkId);
    expect(snaps).toHaveLength(2);
    expect(snaps[0].content).toBe('B');
  });

  it('deletes a specific snapshot', () => {
    saveSnapshot(db, bookmarkId, 'ToDelete');
    const snap = getLatestSnapshot(db, bookmarkId)!;
    deleteSnapshot(db, snap.id);
    expect(listSnapshots(db, bookmarkId)).toHaveLength(0);
  });

  it('clears all snapshots for a bookmark', () => {
    saveSnapshot(db, bookmarkId, 'X');
    saveSnapshot(db, bookmarkId, 'Y');
    clearSnapshots(db, bookmarkId);
    expect(listSnapshots(db, bookmarkId)).toHaveLength(0);
  });
});
