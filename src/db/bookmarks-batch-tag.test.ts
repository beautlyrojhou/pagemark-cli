import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { batchAddTag, batchRemoveTag, batchReplaceTag, batchClearTags } from './bookmarks-batch-tag';
import { getTagsForBookmark } from './bookmarks';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-batch-tag', () => {
  let db: ReturnType<typeof createTestDb>;
  let ids: number[];

  beforeEach(() => {
    db = createTestDb();
    ids = [
      addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['existing'] }),
      addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['existing'] }),
      addBookmark(db, { url: 'https://c.com', title: 'C', tags: [] }),
    ];
  });

  it('batchAddTag adds a tag to multiple bookmarks', () => {
    const count = batchAddTag(db, ids, 'newtag');
    expect(count).toBe(3);
    for (const id of ids) {
      expect(getTagsForBookmark(db, id)).toContain('newtag');
    }
  });

  it('batchAddTag is idempotent', () => {
    batchAddTag(db, ids, 'existing');
    const count = batchAddTag(db, ids, 'existing');
    expect(count).toBe(0);
  });

  it('batchRemoveTag removes a tag from multiple bookmarks', () => {
    const count = batchRemoveTag(db, [ids[0], ids[1]], 'existing');
    expect(count).toBe(2);
    expect(getTagsForBookmark(db, ids[0])).not.toContain('existing');
    expect(getTagsForBookmark(db, ids[1])).not.toContain('existing');
    expect(getTagsForBookmark(db, ids[2])).not.toContain('existing');
  });

  it('batchReplaceTag renames a tag across all bookmarks', () => {
    const count = batchReplaceTag(db, 'existing', 'renamed');
    expect(count).toBe(2);
    expect(getTagsForBookmark(db, ids[0])).toContain('renamed');
    expect(getTagsForBookmark(db, ids[0])).not.toContain('existing');
  });

  it('batchClearTags removes all tags from given bookmarks', () => {
    batchAddTag(db, ids, 'extra');
    const count = batchClearTags(db, [ids[0], ids[1]]);
    expect(count).toBeGreaterThan(0);
    expect(getTagsForBookmark(db, ids[0])).toHaveLength(0);
    expect(getTagsForBookmark(db, ids[1])).toHaveLength(0);
    expect(getTagsForBookmark(db, ids[2])).toContain('extra');
  });
});
