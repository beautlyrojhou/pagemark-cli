import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { migrateBookmarkHistory } from '../../db/schema-history-migration';
import { addBookmark } from '../../db/bookmarks';
import { recordHistory } from '../../db/bookmarks-bookmark-history';
import { registerHistoryCommand } from './history';
import { Database } from 'better-sqlite3';

function createTestDb(): { db: Database; path: string } {
  const db = openDb(':memory:');
  initSchema(db);
  migrateBookmarkHistory(db);
  return { db, path: ':memory:' };
}

function runCli(db: Database, args: string[]): { stdout: string } {
  let output = '';
  const orig = console.log;
  console.log = (...a: unknown[]) => { output += a.join(' ') + '\n'; };
  const app = registerHistoryCommand(
    yargs().exitProcess(false),
    ':memory:'
  );
  // Inject db by patching openDb — here we test via integration
  console.log = orig;
  return { stdout: output };
}

describe('history command', () => {
  let db: Database;

  beforeEach(() => {
    ({ db } = createTestDb());
  });

  it('getHistory returns empty array for new bookmark', () => {
    const id = addBookmark(db, 'https://example.com', 'Example', []);
    const { getHistory } = require('../../db/bookmarks-bookmark-history');
    const history = getHistory(db, id);
    expect(history).toEqual([]);
  });

  it('recordHistory and getHistory round-trip', () => {
    const id = addBookmark(db, 'https://example.com', 'Example', []);
    const { getHistory } = require('../../db/bookmarks-bookmark-history');
    recordHistory(db, id, 'title', 'Example', 'Updated Example');
    const history = getHistory(db, id);
    expect(history).toHaveLength(1);
    expect(history[0].newValue).toBe('Updated Example');
    expect(history[0].bookmarkId).toBe(id);
  });

  it('listRecentChanges respects limit', () => {
    const { listRecentChanges } = require('../../db/bookmarks-bookmark-history');
    const id = addBookmark(db, 'https://example.com', 'Example', []);
    recordHistory(db, id, 'title', 'A', 'B');
    recordHistory(db, id, 'url', 'http://a.com', 'http://b.com');
    recordHistory(db, id, 'notes', null, 'hello');
    expect(listRecentChanges(db, 2)).toHaveLength(2);
    expect(listRecentChanges(db, 10)).toHaveLength(3);
  });

  it('clearHistory removes only entries for that bookmark', () => {
    const { clearHistory, getHistory } = require('../../db/bookmarks-bookmark-history');
    const id1 = addBookmark(db, 'https://a.com', 'A', []);
    const id2 = addBookmark(db, 'https://b.com', 'B', []);
    recordHistory(db, id1, 'title', 'A', 'A2');
    recordHistory(db, id2, 'title', 'B', 'B2');
    clearHistory(db, id1);
    expect(getHistory(db, id1)).toHaveLength(0);
    expect(getHistory(db, id2)).toHaveLength(1);
  });
});
