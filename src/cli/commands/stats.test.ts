import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import yargs from 'yargs';
import { initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerStatsCommand } from './stats';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database, args: string[]) {
  const logs: string[] = [];
  const spy = (msg: string) => logs.push(msg);
  const orig = console.log;
  console.log = spy;
  try {
    registerStatsCommand(yargs([]), db).parse(args);
  } finally {
    console.log = orig;
  }
  return logs;
}

describe('stats command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('shows zero stats on empty db', () => {
    const logs = runCli(db, ['stats']);
    expect(logs.some(l => l.includes('Total bookmarks : 0'))).toBe(true);
    expect(logs.some(l => l.includes('Total tags      : 0'))).toBe(true);
  });

  it('shows correct counts after adding bookmarks', () => {
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: ['dev', 'ts'] });
    addBookmark(db, { url: 'https://other.com', title: 'Other', tags: ['dev'] });
    const logs = runCli(db, ['stats']);
    expect(logs.some(l => l.includes('Total bookmarks : 2'))).toBe(true);
    expect(logs.some(l => l.includes('Total tags      : 2'))).toBe(true);
  });

  it('shows top tags section', () => {
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: ['dev'] });
    const logs = runCli(db, ['stats']);
    expect(logs.some(l => l.includes('Top tags:'))).toBe(true);
    expect(logs.some(l => l.includes('dev'))).toBe(true);
  });
});
