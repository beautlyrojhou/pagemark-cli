import Database from 'better-sqlite3';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerReadingListCommand } from './reading-list';
import yargs from 'yargs';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database.Database, args: string[]) {
  const output: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => output.push(a.join(' '));
  console.error = (...a) => output.push(a.join(' '));
  const parser = yargs().exitProcess(false);
  registerReadingListCommand(parser, db);
  parser.parse(['reading-list', ...args]);
  console.log = origLog;
  console.error = origErr;
  return output;
}

describe('reading-list command', () => {
  let db: Database.Database;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('shows empty reading list', () => {
    const out = runCli(db, ['list']);
    expect(out.join(' ')).toContain('empty');
  });

  it('adds bookmark to reading list', () => {
    const out = runCli(db, ['add', String(bookmarkId)]);
    expect(out.join(' ')).toContain(`#${bookmarkId}`);
    expect(out.join(' ')).toContain('added');
  });

  it('lists bookmark after adding', () => {
    runCli(db, ['add', String(bookmarkId)]);
    const out = runCli(db, ['list']);
    expect(out.join('\n')).toContain('example.com');
  });

  it('marks bookmark as read', () => {
    runCli(db, ['add', String(bookmarkId)]);
    const out = runCli(db, ['read', String(bookmarkId)]);
    expect(out.join(' ')).toContain('marked as read');
  });

  it('removes bookmark from reading list', () => {
    runCli(db, ['add', String(bookmarkId)]);
    runCli(db, ['remove', String(bookmarkId)]);
    const out = runCli(db, ['list']);
    expect(out.join(' ')).toContain('empty');
  });

  it('clears reading list', () => {
    runCli(db, ['add', String(bookmarkId)]);
    const out = runCli(db, ['clear']);
    expect(out.join(' ')).toContain('cleared');
  });
});
