import Database from 'better-sqlite3';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerVisitCommand } from './visit';
import yargs from 'yargs';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database.Database, args: string[]) {
  const output: string[] = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((...a) => output.push(a.join(' ')));
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const parser = registerVisitCommand(yargs([]), db);
  return new Promise<string[]>((resolve) => {
    parser.parse(args, {}, () => {
      spy.mockRestore();
      errSpy.mockRestore();
      resolve(output);
    });
  });
}

describe('visit command', () => {
  test('records a visit and prints count', async () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const out = await runCli(db, ['visit', '1']);
    expect(out[0]).toMatch(/Total visits: 1/);
  });

  test('most-visited lists bookmarks', async () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: [] });
    await runCli(db, ['visit', '1']);
    await runCli(db, ['visit', '1']);
    const out = await runCli(db, ['most-visited']);
    expect(out[0]).toMatch(/visits: 2/);
  });

  test('reset-visits resets stats', async () => {
    const db = createTestDb();
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: [] });
    await runCli(db, ['visit', '1']);
    const out = await runCli(db, ['reset-visits', '1']);
    expect(out[0]).toMatch(/reset/);
  });

  test('most-visited with no data', async () => {
    const db = createTestDb();
    const out = await runCli(db, ['most-visited']);
    expect(out[0]).toMatch(/No visits/);
  });
});
