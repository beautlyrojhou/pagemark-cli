import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import Database from 'better-sqlite3';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerCustomFieldCommand } from './custom-field';
import { setCustomField } from '../../db/bookmarks-custom-field';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bookmark_custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bookmark_id, key)
    )
  `).run();
  return db;
}

function runCli(db: Database, args: string[]) {
  const logs: string[] = [];
  const spy = (msg: string) => logs.push(msg);
  const original = console.log;
  console.log = spy;
  try {
    registerCustomFieldCommand(yargs(args), db).parseSync();
  } finally {
    console.log = original;
  }
  return logs;
}

describe('custom-field command', () => {
  let db: ReturnType<typeof createTestDb>;
  let id: number;

  beforeEach(() => {
    db = createTestDb();
    id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('sets a field', () => {
    const logs = runCli(db, ['field', 'set', String(id), 'color', 'blue']);
    expect(logs[0]).toContain('Set field');
  });

  it('gets a field', () => {
    setCustomField(db, id, 'color', 'blue');
    const logs = runCli(db, ['field', 'get', String(id), 'color']);
    expect(logs[0]).toBe('color: blue');
  });

  it('returns not found for missing field', () => {
    const logs = runCli(db, ['field', 'get', String(id), 'nope']);
    expect(logs[0]).toBe('Field not found.');
  });

  it('lists all fields', () => {
    setCustomField(db, id, 'a', '1');
    setCustomField(db, id, 'b', '2');
    const logs = runCli(db, ['field', 'list', String(id)]);
    expect(logs).toContain('a: 1');
    expect(logs).toContain('b: 2');
  });

  it('deletes a field', () => {
    setCustomField(db, id, 'x', 'y');
    const logs = runCli(db, ['field', 'delete', String(id), 'x']);
    expect(logs[0]).toContain('Deleted');
  });

  it('clears all fields', () => {
    setCustomField(db, id, 'a', '1');
    const logs = runCli(db, ['field', 'clear', String(id)]);
    expect(logs[0]).toContain('Cleared');
  });
});
