import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import yargs from 'yargs';
import { initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerRemindCommand } from './remind';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.prepare(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL UNIQUE,
    remind_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  return db;
}

function runCli(db: Database, args: string[]) {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(' '));
  registerRemindCommand(yargs([...args]).help(false), db).parse();
  console.log = orig;
  return logs;
}

describe('remind command', () => {
  let db: ReturnType<typeof createTestDb>;
  let id: number;

  beforeEach(() => {
    db = createTestDb();
    id = addBookmark(db, { url: 'https://example.com', title: 'Ex', tags: [] });
  });

  it('set and get reminder', () => {
    runCli(db, ['remind', 'set', String(id), '2030-06-01T09:00:00Z', 'check later']);
    const out = runCli(db, ['remind', 'get', String(id)]);
    expect(out[0]).toContain('2030');
    expect(out[0]).toContain('check later');
  });

  it('clear reminder', () => {
    runCli(db, ['remind', 'set', String(id), '2030-06-01T09:00:00Z']);
    runCli(db, ['remind', 'clear', String(id)]);
    const out = runCli(db, ['remind', 'get', String(id)]);
    expect(out[0]).toContain('No reminder');
  });

  it('list shows reminders', () => {
    runCli(db, ['remind', 'set', String(id), '2030-06-01T09:00:00Z', 'hi']);
    const out = runCli(db, ['remind', 'list']);
    expect(out[0]).toContain(String(id));
  });

  it('due shows nothing when none due', () => {
    runCli(db, ['remind', 'set', String(id), '2099-01-01T00:00:00Z']);
    const out = runCli(db, ['remind', 'due']);
    expect(out[0]).toContain('No reminders due');
  });
});
