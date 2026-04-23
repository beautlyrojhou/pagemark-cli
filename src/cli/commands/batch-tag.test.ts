import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark, getTagsForBookmark } from '../../db/bookmarks';
import { registerBatchTagCommand } from './batch-tag';

function createTestDb(path = ':memory:') {
  const db = openDb(path);
  initSchema(db);
  return db;
}

async function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const output: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => output.push(a.join(' '));
  console.error = (...a) => output.push(a.join(' '));
  try {
    const cli = registerBatchTagCommand(
      yargs(args).scriptName('pagemark'),
      ':memory:'
    );
    // Override db usage by patching module — instead we test db functions directly
    await cli.parseAsync(args);
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return output;
}

describe('batch-tag CLI', () => {
  let db: ReturnType<typeof createTestDb>;
  let id1: number;
  let id2: number;

  beforeEach(() => {
    db = createTestDb();
    id1 = addBookmark(db, { url: 'https://x.com', title: 'X', tags: ['alpha'] });
    id2 = addBookmark(db, { url: 'https://y.com', title: 'Y', tags: ['alpha'] });
  });

  it('batchAddTag adds tag to specified bookmarks', () => {
    const { batchAddTag } = require('../../db/bookmarks-batch-tag');
    const count = batchAddTag(db, [id1, id2], 'beta');
    expect(count).toBe(2);
    expect(getTagsForBookmark(db, id1)).toContain('beta');
  });

  it('batchRemoveTag removes tag from specified bookmarks', () => {
    const { batchRemoveTag } = require('../../db/bookmarks-batch-tag');
    const count = batchRemoveTag(db, [id1], 'alpha');
    expect(count).toBe(1);
    expect(getTagsForBookmark(db, id1)).not.toContain('alpha');
    expect(getTagsForBookmark(db, id2)).toContain('alpha');
  });

  it('batchReplaceTag renames tag globally', () => {
    const { batchReplaceTag } = require('../../db/bookmarks-batch-tag');
    batchReplaceTag(db, 'alpha', 'gamma');
    expect(getTagsForBookmark(db, id1)).toContain('gamma');
    expect(getTagsForBookmark(db, id2)).toContain('gamma');
  });

  it('batchClearTags removes all tags', () => {
    const { batchClearTags } = require('../../db/bookmarks-batch-tag');
    batchClearTags(db, [id1]);
    expect(getTagsForBookmark(db, id1)).toHaveLength(0);
    expect(getTagsForBookmark(db, id2)).toContain('alpha');
  });
});
