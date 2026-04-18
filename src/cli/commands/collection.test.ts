import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import yargs from 'yargs';
import { initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerCollectionCommand } from './collection';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, created_at TEXT);
    CREATE TABLE IF NOT EXISTS collection_bookmarks (collection_id INTEGER, bookmark_id INTEGER, PRIMARY KEY (collection_id, bookmark_id));
  `);
  return db;
}

function runCli(db: Database, args: string[]) {
  const logs: string[] = [];
  const spy = (msg: string) => logs.push(msg);
  const orig = console.log;
  console.log = spy;
  const cli = yargs().exitProcess(false);
  registerCollectionCommand(cli, db);
  cli.parse(args);
  console.log = orig;
  return logs;
}

describe('collection command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => { db = createTestDb(); });

  it('creates a collection', () => {
    const out = runCli(db, ['collection', 'create', '--name', 'Work']);
    expect(out[0]).toMatch(/created/);
  });

  it('lists collections', () => {
    runCli(db, ['collection', 'create', '--name', 'Work']);
    const out = runCli(db, ['collection', 'list']);
    expect(out[0]).toMatch(/Work/);
  });

  it('adds and shows bookmark in collection', () => {
    const bId = addBookmark(db, { url: 'https://test.com', title: 'Test', tags: [] });
    runCli(db, ['collection', 'create', '--name', 'Saved']);
    runCli(db, ['collection', 'add', '--name', 'Saved', '--id', String(bId)]);
    const out = runCli(db, ['collection', 'show', '--name', 'Saved']);
    expect(out[0]).toMatch(/test\.com/);
  });

  it('removes bookmark from collection', () => {
    const bId = addBookmark(db, { url: 'https://x.com', title: 'X', tags: [] });
    runCli(db, ['collection', 'create', '--name', 'Mine']);
    runCli(db, ['collection', 'add', '--name', 'Mine', '--id', String(bId)]);
    runCli(db, ['collection', 'remove', '--name', 'Mine', '--id', String(bId)]);
    const out = runCli(db, ['collection', 'show', '--name', 'Mine']);
    expect(out[0]).toMatch(/No bookmarks/);
  });

  it('deletes a collection', () => {
    runCli(db, ['collection', 'create', '--name', 'Temp']);
    runCli(db, ['collection', 'delete', '--name', 'Temp']);
    const out = runCli(db, ['collection', 'list']);
    expect(out[0]).toMatch(/No collections/);
  });
});
