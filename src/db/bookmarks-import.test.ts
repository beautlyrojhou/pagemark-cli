import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import { importFromJson, importFromCsv } from './bookmarks-import';
import { searchBookmarks } from './bookmarks';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function writeTmp(name: string, content: string) {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content);
  return p;
}

describe('importFromJson', () => {
  it('imports valid records', () => {
    const db = createTestDb();
    const file = writeTmp('test.json', JSON.stringify([
      { url: 'https://a.com', title: 'A', tags: ['x'] },
      { url: 'https://b.com', title: 'B', tags: [] },
    ]));
    const result = importFromJson(db, file);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it('skips records without url', () => {
    const db = createTestDb();
    const file = writeTmp('test2.json', JSON.stringify([{ title: 'No URL' }]));
    const result = importFromJson(db, file);
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
  });

  it('throws on invalid JSON', () => {
    const db = createTestDb();
    const file = writeTmp('bad.json', 'not json');
    expect(() => importFromJson(db, file)).toThrow('Invalid JSON');
  });
});

describe('importFromCsv', () => {
  it('imports valid csv', () => {
    const db = createTestDb();
    const csv = 'url,title,tags\nhttps://c.com,C,foo|bar\nhttps://d.com,D,';
    const file = writeTmp('test.csv', csv);
    const result = importFromCsv(db, file);
    expect(result.imported).toBe(2);
  });

  it('skips rows without url', () => {
    const db = createTestDb();
    const csv = 'url,title,tags\n,Empty,';
    const file = writeTmp('test2.csv', csv);
    const result = importFromCsv(db, file);
    expect(result.skipped).toBe(1);
  });
});
