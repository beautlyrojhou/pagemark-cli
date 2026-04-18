import Database from 'better-sqlite3';
import { initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { setRating, getRating } from '../../db/bookmarks-rating';
import yargs from 'yargs';
import { registerRatingCommand } from './rating';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database, args: string[]) {
  const output: string[] = [];
  const log = jest.spyOn(console, 'log').mockImplementation((msg) => output.push(msg));
  const err = jest.spyOn(console, 'error').mockImplementation(() => {});
  const parser = registerRatingCommand(yargs([]), db).help(false);
  parser.parse(args);
  logerr.mockRestore();
  return output;
}

describe('rating command', () => {
  test('set and get rating', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    runCli(db, ['rating', 'set', String(id), '4']);
    const rating = getRating(db, id);
    expect(rating).toBe(4);
  });

  test('get rating output', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setRating(db, id, 3);
    const out = runCli(db, ['rating', 'get', String(id)]);
    expect(out[0]).toContain('3');
  });

  test('clear rating', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setRating(db, id, 5);
    runCli(db, ['rating', 'clear', String(id)]);
    expect(getRating(db, id)).toBeNull();
  });

  test('list rated bookmarks', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    setRating(db, id, 5);
    const out = runCli(db, ['rating', 'list']);
    expect(out[0]).toContain('Example');
  });

  test('get no rating', () => {
    const db = createTestDb();
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const out = runCli(db, ['rating', 'get', String(id)]);
    expect(out[0]).toContain('No rating');
  });
});
