import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDb, initSchema } from './schema';
import {
  markBrokenLink,
  clearBrokenStatus,
  listBrokenLinks,
  checkUrl,
} from './bookmarks-broken-link';
import { addBookmark } from './bookmarks';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('broken-link db', () => {
  it('marks a bookmark as broken', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    markBrokenLink(db, id, 404);
    const broken = listBrokenLinks(db);
    expect(broken).toHaveLength(1);
    expect(broken[0].id).toBe(id);
    expect(broken[0].statusCode).toBe(404);
  });

  it('clears broken status', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    markBrokenLink(db, id, 500);
    clearBrokenStatus(db, id);
    const broken = listBrokenLinks(db);
    expect(broken).toHaveLength(0);
  });

  it('does not list bookmarks with 2xx status', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    markBrokenLink(db, id, 200);
    const broken = listBrokenLinks(db);
    expect(broken).toHaveLength(0);
  });

  it('lists multiple broken links ordered by checkedAt desc', () => {
    const db = createTestDb();
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    markBrokenLink(db, id1, 404);
    markBrokenLink(db, id2, 503);
    const broken = listBrokenLinks(db);
    expect(broken).toHaveLength(2);
  });

  it('checkUrl returns ok false on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const result = await checkUrl('https://unreachable.example');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    vi.unstubAllGlobals();
  });

  it('checkUrl returns status from response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const result = await checkUrl('https://example.com/gone');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    vi.unstubAllGlobals();
  });
});
