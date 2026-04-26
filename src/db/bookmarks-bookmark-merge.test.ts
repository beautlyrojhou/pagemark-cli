import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark, getBookmarkById, getTagsForBookmark } from './bookmarks';
import { mergeBookmarks, listMergeCandidates } from './bookmarks-bookmark-merge';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('mergeBookmarks', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('merges tags from both bookmarks onto the target', () => {
    const targetId = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node'] });
    const sourceId = addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['node', 'react'] });

    const result = mergeBookmarks(db, targetId, sourceId);

    expect(result.survivorId).toBe(targetId);
    expect(result.removedId).toBe(sourceId);
    expect(result.mergedTags.sort()).toEqual(['node', 'react', 'ts']);

    const tags = getTagsForBookmark(db, targetId);
    expect(tags.sort()).toEqual(['node', 'react', 'ts']);
  });

  it('deletes the source bookmark after merge', () => {
    const targetId = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const sourceId = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });

    mergeBookmarks(db, targetId, sourceId);

    expect(getBookmarkById(db, sourceId)).toBeUndefined();
    expect(getBookmarkById(db, targetId)).toBeDefined();
  });

  it('concatenates notes from both bookmarks', () => {
    const targetId = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const sourceId = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });

    db.prepare('INSERT INTO bookmark_notes (bookmark_id, note) VALUES (?, ?)').run(targetId, 'Note A');
    db.prepare('INSERT INTO bookmark_notes (bookmark_id, note) VALUES (?, ?)').run(sourceId, 'Note B');

    const result = mergeBookmarks(db, targetId, sourceId);

    expect(result.mergedNote).toBe('Note A\n---\nNote B');
  });

  it('uses source note when target has none', () => {
    const targetId = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const sourceId = addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    db.prepare('INSERT INTO bookmark_notes (bookmark_id, note) VALUES (?, ?)').run(sourceId, 'Only source note');

    const result = mergeBookmarks(db, targetId, sourceId);
    expect(result.mergedNote).toBe('Only source note');
  });

  it('throws when merging a bookmark with itself', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    expect(() => mergeBookmarks(db, id, id)).toThrow('Cannot merge a bookmark with itself');
  });

  it('throws when target bookmark does not exist', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    expect(() => mergeBookmarks(db, 9999, id)).toThrow('Target bookmark 9999 not found');
  });
});

describe('listMergeCandidates', () => {
  it('returns bookmarks sharing at least one tag', () => {
    const db = createTestDb();
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node'] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['python'] });

    const candidates = listMergeCandidates(db, id1);
    expect(candidates.map((c) => c.id)).toContain(id2);
    expect(candidates.map((c) => c.id)).not.toContain(id1);
    expect(candidates.length).toBe(1);
  });
});
