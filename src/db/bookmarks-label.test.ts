import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { addLabel, removeLabel, getLabels, listByLabel, getAllLabels, clearLabels, initLabelSchema } from './bookmarks-label';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  initLabelSchema(db);
  return db;
}

describe('bookmarks-label', () => {
  let db: ReturnType<typeof createTestDb>;
  let id1: number;
  let id2: number;

  beforeEach(() => {
    db = createTestDb();
    id1 = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    id2 = addBookmark(db, { url: 'https://other.com', title: 'Other', tags: [] });
  });

  it('adds and retrieves labels', () => {
    addLabel(db, id1, 'work');
    addLabel(db, id1, 'important');
    const labels = getLabels(db, id1);
    expect(labels).toContain('work');
    expect(labels).toContain('important');
  });

  it('normalises labels to lowercase', () => {
    addLabel(db, id1, 'Work');
    expect(getLabels(db, id1)).toContain('work');
  });

  it('ignores duplicate labels', () => {
    addLabel(db, id1, 'work');
    addLabel(db, id1, 'work');
    expect(getLabels(db, id1)).toHaveLength(1);
  });

  it('removes a label', () => {
    addLabel(db, id1, 'work');
    removeLabel(db, id1, 'work');
    expect(getLabels(db, id1)).toHaveLength(0);
  });

  it('lists bookmarks by label', () => {
    addLabel(db, id1, 'dev');
    addLabel(db, id2, 'dev');
    const results = listByLabel(db, 'dev');
    expect(results).toHaveLength(2);
  });

  it('returns all labels with counts', () => {
    addLabel(db, id1, 'work');
    addLabel(db, id2, 'work');
    addLabel(db, id1, 'personal');
    const all = getAllLabels(db);
    expect(all[0].label).toBe('work');
    expect(all[0].count).toBe(2);
  });

  it('clears all labels for a bookmark', () => {
    addLabel(db, id1, 'a');
    addLabel(db, id1, 'b');
    clearLabels(db, id1);
    expect(getLabels(db, id1)).toHaveLength(0);
  });
});
