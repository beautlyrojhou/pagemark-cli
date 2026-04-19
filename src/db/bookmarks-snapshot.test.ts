import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { saveSnapshot, getLatestSnapshot, listSnapshots, deleteSnapshot, clearSnapshots } from './bookmarks-snapshot';
import type { Database } from 'better-sqlite3';

async function createTestDb(): Promise<Database> {
  const db = await openDb(':memory:');
  await initSchema(db);
  return db;
}

describe('bookmarks-snapshot', () => {
  let db: Database;
  let bookmarkId: number;

  beforeEach(async () => {
    db = await createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('saves and retrieves a snapshot', () => {
    saveSnapshot(db, bookmarkId, '<html>content</html>', 'text/html');
    const snap = getLatestSnapshot(db, bookmarkId);
    expect(snap).not.toBeNull();
    expect(snap!.content).toBe('<html>content</html>');
    expect(snap!.mime_type).toBe('text/html');
  });

  it('lists snapshots for a bookmark', () => {
    saveSnapshot(db, bookmarkId, 'first', 'text/plain');
    saveSnapshot(db, bookmarkId, 'second', 'text/plain');
    const snaps = listSnapshots(db, bookmarkId);
    expect(snaps.length).toBe(2);
  });

  it('deletes a specific snapshot', () => {
    saveSnapshot(db, bookmarkId, 'to delete', 'text/plain');
    const snap = getLatestSnapshot(db, bookmarkId);
    deleteSnapshot(db, snap!.id);
    expect(getLatestSnapshot(db, bookmarkId)).toBeNull();
  });

  it('clears all snapshots for a bookmark', () => {
    saveSnapshot(db, bookmarkId, 'a', 'text/plain');
    saveSnapshot(db, bookmarkId, 'b', 'text/plain');
    clearSnapshots(db, bookmarkId);
    expect(listSnapshots(db, bookmarkId).length).toBe(0);
  });
});
