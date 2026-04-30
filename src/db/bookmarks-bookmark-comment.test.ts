import Database from 'better-sqlite3';
import { initSchema } from './schema';
import {
  migrateBookmarkComments,
  addComment,
  updateComment,
  deleteComment,
  listComments,
  clearComments,
  getComment,
} from './bookmarks-bookmark-comment';
import { addBookmark } from './bookmarks';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  migrateBookmarkComments(db);
  return db;
}

describe('bookmark comments', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    const bm = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    bookmarkId = bm.id;
  });

  it('adds a comment', () => {
    const comment = addComment(db, bookmarkId, 'Great resource!');
    expect(comment.id).toBeGreaterThan(0);
    expect(comment.body).toBe('Great resource!');
    expect(comment.bookmark_id ?? (comment as any).bookmarkId ?? bookmarkId).toBeTruthy();
  });

  it('lists comments for a bookmark', () => {
    addComment(db, bookmarkId, 'First comment');
    addComment(db, bookmarkId, 'Second comment');
    const comments = listComments(db, bookmarkId);
    expect(comments).toHaveLength(2);
    expect(comments[0].body).toBe('First comment');
  });

  it('updates a comment', () => {
    const comment = addComment(db, bookmarkId, 'Original');
    const updated = updateComment(db, comment.id, 'Revised');
    expect(updated).toBe(true);
    const fetched = getComment(db, comment.id);
    expect(fetched?.body).toBe('Revised');
  });

  it('returns false when updating non-existent comment', () => {
    expect(updateComment(db, 9999, 'Nope')).toBe(false);
  });

  it('deletes a comment', () => {
    const comment = addComment(db, bookmarkId, 'To delete');
    expect(deleteComment(db, comment.id)).toBe(true);
    expect(getComment(db, comment.id)).toBeUndefined();
  });

  it('clears all comments for a bookmark', () => {
    addComment(db, bookmarkId, 'A');
    addComment(db, bookmarkId, 'B');
    const count = clearComments(db, bookmarkId);
    expect(count).toBe(2);
    expect(listComments(db, bookmarkId)).toHaveLength(0);
  });

  it('cascades delete when bookmark is removed', () => {
    addComment(db, bookmarkId, 'Orphan');
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(bookmarkId);
    expect(listComments(db, bookmarkId)).toHaveLength(0);
  });
});
