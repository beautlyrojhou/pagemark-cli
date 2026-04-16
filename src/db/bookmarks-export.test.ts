import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { exportAllBookmarks, exportToJson, exportToCsv } from './bookmarks-export';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

describe('bookmarks-export', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('exportAllBookmarks returns empty array when no bookmarks', () => {
    expect(exportAllBookmarks(db)).toEqual([]);
  });

  it('exportAllBookmarks includes tags', () => {
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: ['dev', 'ref'] });
    const results = exportAllBookmarks(db);
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://example.com');
    expect(results[0].tags).toContain('dev');
    expect(results[0].tags).toContain('ref');
  });

  it('exportToJson produces valid JSON', () => {
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: ['test'] });
    const json = exportToJson(db);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].url).toBe('https://example.com');
  });

  it('exportToCsv produces header and one data row', () => {
    addBookmark(db, { url: 'https://example.com', title: 'My Site', tags: ['a', 'b'] });
    const csv = exportToCsv(db);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,url,title,notes,tags,created_at');
    expect(lines[1]).toContain('https://example.com');
    expect(lines[1]).toContain('a;b');
  });

  it('exportToCsv escapes quotes in fields', () => {
    addBookmark(db, { url: 'https://example.com', title: 'Say "hello"', tags: [] });
    const csv = exportToCsv(db);
    expect(csv).toContain('Say ""hello""');
  });
});
