import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { registerBookmarkListCommand } from './bookmark-list';
import { addBookmark } from '../../db/bookmarks';
import { migrateBookmarkLists } from '../../db/schema-bookmark-list-migration';
import { getListByName, getBookmarksInList } from '../../db/bookmarks-bookmark-list';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  migrateBookmarkLists(db);
  return db;
}

async function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const output: string[] = [];
  const log = (msg: string) => output.push(msg);
  const spy = vi.spyOn(console, 'log').mockImplementation(log);
  await yargs(args)
    .command(registerBookmarkListCommand(yargs([]), db) as any)
    .parseAsync();
  spy.mockRestore();
  return output;
}

import { vi } from 'vitest';

describe('bookmark-list CLI', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates a list', async () => {
    const cli = yargs(['list', 'create', 'Favorites', 'My favs']);
    registerBookmarkListCommand(cli, db);
    await cli.parseAsync();
    const list = getListByName(db, 'Favorites');
    expect(list).toBeDefined();
    expect(list!.description).toBe('My favs');
  });

  it('adds a bookmark to a list', async () => {
    const bm = addBookmark(db, 'https://example.com', 'Example', []);
    const cli1 = yargs(['list', 'create', 'Work']);
    registerBookmarkListCommand(cli1, db);
    await cli1.parseAsync();

    const cli2 = yargs(['list', 'add', 'Work', String(bm.id)]);
    registerBookmarkListCommand(cli2, db);
    await cli2.parseAsync();

    const list = getListByName(db, 'Work')!;
    const items = getBookmarksInList(db, list.id);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com');
  });

  it('deletes a list', async () => {
    const cli1 = yargs(['list', 'create', 'Temp']);
    registerBookmarkListCommand(cli1, db);
    await cli1.parseAsync();
    const list = getListByName(db, 'Temp')!;

    const cli2 = yargs(['list', 'delete', String(list.id)]);
    registerBookmarkListCommand(cli2, db);
    await cli2.parseAsync();

    expect(getListByName(db, 'Temp')).toBeUndefined();
  });
});
