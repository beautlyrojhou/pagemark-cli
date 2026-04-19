import { Command } from 'commander';
import Database from 'better-sqlite3';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerHighlightCommand } from './highlight';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database.Database, args: string[]) {
  const program = new Command();
  program.exitOverride();
  registerHighlightCommand(program, db);
  const output: string[] = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((msg) => output.push(msg));
  try {
    program.parse(['highlight', ...args], { from: 'user' });
  } finally {
    spy.mockRestore();
  }
  return output;
}

describe('highlight command', () => {
  let db: Database.Database;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  afterEach(() => db.close());

  it('adds a highlight', () => {
    const out = runCli(db, ['add', String(bookmarkId), 'interesting text']);
    expect(out[0]).toMatch(/Highlight added with id/);
  });

  it('lists highlights', () => {
    runCli(db, ['add', String(bookmarkId), 'first highlight']);
    const out = runCli(db, ['list', String(bookmarkId)]);
    expect(out[0]).toMatch(/first highlight/);
  });

  it('shows message when no highlights', () => {
    const out = runCli(db, ['list', String(bookmarkId)]);
    expect(out[0]).toBe('No highlights found.');
  });

  it('deletes a highlight', () => {
    runCli(db, ['add', String(bookmarkId), 'to delete']);
    const listOut = runCli(db, ['list', String(bookmarkId)]);
    const idMatch = listOut[0].match(/\[(\d+)\]/);
    const hid = idMatch![1];
    const out = runCli(db, ['delete', hid]);
    expect(out[0]).toMatch(/deleted/);
    const listAfter = runCli(db, ['list', String(bookmarkId)]);
    expect(listAfter[0]).toBe('No highlights found.');
  });

  it('clears all highlights', () => {
    runCli(db, ['add', String(bookmarkId), 'a']);
    runCli(db, ['add', String(bookmarkId), 'b']);
    const out = runCli(db, ['clear', String(bookmarkId)]);
    expect(out[0]).toMatch(/cleared/);
  });

  it('searches highlights', () => {
    runCli(db, ['add', String(bookmarkId), 'unique search term']);
    const out = runCli(db, ['search', 'unique']);
    expect(out[0]).toMatch(/unique search term/);
  });
});
