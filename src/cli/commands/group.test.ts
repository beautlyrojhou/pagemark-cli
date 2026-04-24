import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { migrateBookmarkGroups } from '../../db/schema-group-migration';
import { registerGroupCommand } from './group';
import { addBookmark } from '../../db/bookmarks';
import { createGroup, addBookmarkToGroup } from '../../db/bookmarks-bookmark-group';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  migrateBookmarkGroups(db);
  return db;
}

function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const output: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => output.push(a.join(' '));
  console.error = (...a) => output.push(a.join(' '));
  try {
    const dbPath = ':memory:';
    // Patch openDb to return our test db
    const cli = registerGroupCommand(
      yargs().exitProcess(false),
      dbPath
    );
    // We call the handler directly via parse
    cli.parse(['group', ...args]);
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return output;
}

describe('group command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates a group via db function', () => {
    const g = createGroup(db, 'Favorites', 'My faves');
    expect(g.id).toBeGreaterThan(0);
    expect(g.name).toBe('Favorites');
  });

  it('lists groups', () => {
    createGroup(db, 'Alpha');
    createGroup(db, 'Beta');
    const { listGroups } = require('../../db/bookmarks-bookmark-group');
    const groups = listGroups(db);
    expect(groups).toHaveLength(2);
  });

  it('adds and retrieves bookmark in group', () => {
    const bm = addBookmark(db, 'https://test.com', 'Test', []);
    const g = createGroup(db, 'Work');
    addBookmarkToGroup(db, bm.id, g.id);
    const { listBookmarksInGroup } = require('../../db/bookmarks-bookmark-group');
    expect(listBookmarksInGroup(db, g.id)).toContain(bm.id);
  });

  it('deletes a group', () => {
    const g = createGroup(db, 'Temp');
    const { deleteGroup, listGroups } = require('../../db/bookmarks-bookmark-group');
    deleteGroup(db, g.id);
    expect(listGroups(db)).toHaveLength(0);
  });

  it('renames a group', () => {
    const g = createGroup(db, 'OldName');
    const { renameGroup, listGroups } = require('../../db/bookmarks-bookmark-group');
    renameGroup(db, g.id, 'NewName');
    expect(listGroups(db)[0].name).toBe('NewName');
  });
});
