import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { archiveBookmark } from './bookmarks-archive';
import { bulkExportBookmarks, listExportableTags } from './bookmarks-bulk-export';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

describe('bulkExportBookmarks', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('exports all bookmarks as json', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    const result = bulkExportBookmarks(db, { format: 'json' });
    expect(result.count).toBe(2);
    const parsed = JSON.parse(result.output);
    expect(parsed).toHaveLength(2);
  });

  it('exports filtered by tag', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['typescript'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['python'] });
    const result = bulkExportBookmarks(db, { format: 'json', tags: ['typescript'] });
    expect(result.count).toBe(1);
    const parsed = JSON.parse(result.output);
    expect(parsed[0].url).toBe('https://a.com');
  });

  it('excludes archived bookmarks by default', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    archiveBookmark(db, id);
    const result = bulkExportBookmarks(db, { format: 'json' });
    expect(result.count).toBe(1);
  });

  it('includes archived bookmarks when flag is set', () => {
    const id = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    archiveBookmark(db, id);
    const result = bulkExportBookmarks(db, { format: 'json', includeArchived: true });
    expect(result.count).toBe(2);
  });

  it('exports as csv', () => {
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const result = bulkExportBookmarks(db, { format: 'csv' });
    expect(result.format).toBe('csv');
    expect(result.output).toContain('https://a.com');
  });

  it('returns empty result when no bookmarks match', () => {
    const result = bulkExportBookmarks(db, { format: 'json', tags: ['nonexistent'] });
    expect(result.count).toBe(0);
    expect(result.output).toBe('[]');
  });
});

describe('listExportableTags', () => {
  it('returns all tag names', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts', 'node'] });
    const tags = listExportableTags(db);
    expect(tags).toContain('ts');
    expect(tags).toContain('node');
  });
});
