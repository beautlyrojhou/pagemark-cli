import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { addAlias } from '../../db/bookmarks-bookmark-alias';
import yargs from 'yargs';
import { registerAliasCommand } from './alias';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const output: string[] = [];
  const log = (msg: string) => output.push(msg);
  const parser = yargs().command(registerAliasCommand(db, log)).help();
  parser.parse(args);
  return output;
}

describe('alias command', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example' });
  });

  it('adds an alias via CLI', () => {
    const out = runCli(db, ['alias', 'add', String(bookmarkId), 'my-site']);
    expect(out.join(' ')).toMatch(/alias.*added|added.*alias/i);
  });

  it('removes an alias via CLI', () => {
    addAlias(db, bookmarkId, 'to-remove');
    const out = runCli(db, ['alias', 'remove', String(bookmarkId), 'to-remove']);
    expect(out.join(' ')).toMatch(/removed|deleted/i);
  });

  it('lists aliases for a bookmark via CLI', () => {
    addAlias(db, bookmarkId, 'listed-alias');
    const out = runCli(db, ['alias', 'list', String(bookmarkId)]);
    expect(out.join(' ')).toContain('listed-alias');
  });

  it('resolves an alias to a bookmark via CLI', () => {
    addAlias(db, bookmarkId, 'resolve-me');
    const out = runCli(db, ['alias', 'resolve', 'resolve-me']);
    expect(out.join(' ')).toContain(String(bookmarkId));
  });

  it('reports not found when resolving unknown alias', () => {
    const out = runCli(db, ['alias', 'resolve', 'ghost']);
    expect(out.join(' ')).toMatch(/not found|no alias/i);
  });
});
