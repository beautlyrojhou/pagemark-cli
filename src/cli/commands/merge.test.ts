import Database from 'better-sqlite3';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerMergeCommand } from './merge';
import yargs from 'yargs';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database.Database, args: string[]) {
  const output: string[] = [];
  const errors: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...a: unknown[]) => output.push(a.join(' '));
  console.error = (...a: unknown[]) => errors.push(a.join(' '));
  try {
    registerMergeCommand(yargs([]), db).parse(args);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
  return { output, errors };
}

describe('merge command', () => {
  test('lists no candidates when db is empty', () => {
    const db = createTestDb();
    const { output } = runCli(db, ['merge', 'candidates']);
    expect(output.join('\n')).toContain('No merge candidates found.');
  });

  test('lists candidates for duplicate URLs', () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    addBookmark(db, { url: 'https://example.com', title: 'Example Duplicate', tags: [] });
    const { output } = runCli(db, ['merge', 'candidates']);
    expect(output.join('\n')).toMatch(/#1|#2/);
  });

  test('dry-run does not modify db', () => {
    const db = createTestDb();
    const id1 = addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    const id2 = addBookmark(db, { url: 'https://a.com', title: 'A copy', tags: [] });
    const { output } = runCli(db, ['merge', 'run', String(id1), String(id2), '--dry-run']);
    expect(output.join('\n')).toContain('dry-run');
    const row = db.prepare('SELECT id FROM bookmarks WHERE id = ?').get(id1);
    expect(row).toBeTruthy();
  });

  test('merge run combines bookmarks', () => {
    const db = createTestDb();
    const id1 = addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['news'] });
    const id2 = addBookmark(db, { url: 'https://b.com', title: 'B kept', tags: ['tech'] });
    const { output } = runCli(db, ['merge', 'run', String(id1), String(id2)]);
    expect(output.join('\n')).toContain(`Merged bookmark #${id1} into #${id2}`);
    const deleted = db.prepare('SELECT id FROM bookmarks WHERE id = ?').get(id1);
    expect(deleted).toBeFalsy();
  });
});
