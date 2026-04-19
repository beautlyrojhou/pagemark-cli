import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import {
  createShareLink,
  getShareLink,
  listShareLinks,
  revokeShareLink,
  pruneExpiredShareLinks,
} from './bookmarks-share';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-share', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    bookmarkId = bm.id;
  });

  it('creates a share link with a unique token', () => {
    const link = createShareLink(db, bookmarkId);
    expect(link.token).toHaveLength(32);
    expect(link.bookmarkId).toBe(bookmarkId);
    expect(link.expiresAt).toBeNull();
  });

  it('creates a share link with expiry', () => {
    const link = createShareLink(db, bookmarkId, 7);
    expect(link.expiresAt).not.toBeNull();
    const expires = new Date(link.expiresAt!);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });

  it('retrieves a share link by token', () => {
    const link = createShareLink(db, bookmarkId);
    const found = getShareLink(db, link.token);
    expect(found).toBeDefined();
    expect(found!.bookmarkId).toBe(bookmarkId);
  });

  it('lists share links for a bookmark', () => {
    createShareLink(db, bookmarkId);
    createShareLink(db, bookmarkId);
    const links = listShareLinks(db, bookmarkId);
    expect(links).toHaveLength(2);
  });

  it('revokes a share link', () => {
    const link = createShareLink(db, bookmarkId);
    const revoked = revokeShareLink(db, link.token);
    expect(revoked).toBe(true);
    expect(getShareLink(db, link.token)).toBeUndefined();
  });

  it('prunes expired share links', () => {
    const link = createShareLink(db, bookmarkId);
    db.prepare(`UPDATE share_links SET expires_at = datetime('now', '-1 day') WHERE token = ?`).run(link.token);
    const pruned = pruneExpiredShareLinks(db);
    expect(pruned).toBe(1);
    expect(getShareLink(db, link.token)).toBeUndefined();
  });
});
