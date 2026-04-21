import { describe, it, expect, beforeEach } from 'vitest';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { findRelatedBookmarks, getRelatedIds } from './bookmarks-related';
import type { Database } from 'better-sqlite3';

async function createTestDb(): Promise<Database> {
  const db = await openDb(':memory:');
  await initSchema(db);
  return db;
}

describe('bookmarks-related', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('finds related bookmarks by shared tags', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node'] });
    const id2 = await addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts', 'web'] });
    const id3 = await addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['python'] });

    const related = await findRelatedBookmarks(db, id1);
    const relatedIds = related.map((r) => r.id);

    expect(relatedIds).toContain(id2);
    expect(relatedIds).not.toContain(id3);
    expect(relatedIds).not.toContain(id1);
  });

  it('returns empty array when no shared tags', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['unique-tag'] });
    await addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['other-tag'] });

    const related = await findRelatedBookmarks(db, id1);
    expect(related).toHaveLength(0);
  });

  it('orders results by shared tag count descending', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node', 'web'] });
    const id2 = await addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts', 'node'] });
    const id3 = await addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['ts'] });

    const related = await findRelatedBookmarks(db, id1);
    expect(related[0].id).toBe(id2);
    expect(related[1].id).toBe(id3);
  });

  it('respects limit option', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts'] });
    await addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    await addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['ts'] });
    await addBookmark(db, { url: 'https://d.com', title: 'D', tags: ['ts'] });

    const related = await findRelatedBookmarks(db, id1, { limit: 2 });
    expect(related).toHaveLength(2);
  });

  it('getRelatedIds returns only ids', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts'] });
    const id2 = await addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });

    const ids = await getRelatedIds(db, id1);
    expect(ids).toContain(id2);
    expect(typeof ids[0]).toBe('number');
  });
});
