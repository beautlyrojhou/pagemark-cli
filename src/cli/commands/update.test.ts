import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark, getBookmarkById, getTagsForBookmark } from '../../db/bookmarks';
import { registerUpdateCommand } from './update';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  return yargs(args).command({
    command: '$0',
    handler: () => {},
    builder: (y) => { registerUpdateCommand(y, db); return y; },
  }).parseAsync(args);
}

describe('update command', () => {
  let db: ReturnType<typeof createTestDb>;
  let id: number;

  beforeEach(() => {
    db = createTestDb();
    id = addBookmark(db, { url: 'https://original.com', title: 'Original', tags: ['old'] });
  });

  it('updates title', async () => {
    await runCli(db, ['update', String(id), '--title', 'Updated']);
    expect(getBookmarkById(db, id)?.title).toBe('Updated');
  });

  it('updates tags', async () => {
    await runCli(db, ['update', String(id), '--tags', 'x,y']);
    expect(getTagsForBookmark(db, id)).toEqual(['x', 'y']);
  });

  it('updates url', async () => {
    await runCli(db, ['update', String(id), '--url', 'https://new.com']);
    expect(getBookmarkById(db, id)?.url).toBe('https://new.com');
  });
});
