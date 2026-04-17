import { Command } from 'commander';
import Database from 'better-sqlite3';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerDuplicateCommand } from './duplicate';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database.Database, args: string[]): string {
  const program = new Command();
  program.exitOverride();
  registerDuplicateCommand(program, db);
  const output: string[] = [];
  const orig = console.log;
  console.log = (...a) => output.push(a.join(' '));
  try {
    program.parse(['node', 'test', ...args]);
  } finally {
    console.log = orig;
  }
  return output.join('\n');
}

describe('duplicate commands', () => {
  test('list reports no duplicates when none exist', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const out = runCli(db, ['duplicates', 'list']);
    expect(out).toContain('No duplicates found.');
  });

  test('list shows duplicate groups', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://dupe.com', title: 'First', tags: [] });
    addBookmark(db, { url: 'https://dupe.com', title: 'Second', tags: [] });
    const out = runCli(db, ['duplicates', 'list']);
    expect(out).toContain('https://dupe.com');
    expect(out).toContain('First');
    expect(out).toContain('Second');
  });

  test('clean removes duplicates', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://dupe.com', title: 'First', tags: [] });
    addBookmark(db, { url: 'https://dupe.com', title: 'Second', tags: [] });
    const out = runCli(db, ['duplicates', 'clean']);
    expect(out).toContain('Removed 1 duplicate');
  });

  test('clean --dry-run does not delete', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://dupe.com', title: 'First', tags: [] });
    addBookmark(db, { url: 'https://dupe.com', title: 'Second', tags: [] });
    const out = runCli(db, ['duplicates', 'clean', '--dry-run']);
    expect(out).toContain('Would remove');
    expect(out).toContain('1 bookmark(s) would be removed.');
    const out2 = runCli(db, ['duplicates', 'list']);
    expect(out2).toContain('https://dupe.com');
  });
});
