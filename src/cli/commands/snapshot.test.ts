import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerSnapshotCommand } from './snapshot';
import { getLatestSnapshot, listSnapshots } from '../../db/bookmarks-snapshot';
import type { Database } from 'better-sqlite3';

async function createTestDb(): Promise<Database> {
  const db = await openDb(':memory:');
  await initSchema(db);
  return db;
}

async function runCli(db: Database, args: string[]): Promise<string> {
  let output = '';
  const log = console.log;
  console.log = (...a) => { output += a.join(' ') + '\n'; };
  await registerSnapshotCommand(yargs(args), db).parseAsync();
  console.log = log;
  return output;
}

describe('snapshot command', () => {
  let db: Database;
  let id: number;

  beforeEach(async () => {
    db = await createTestDb();
    id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('saves a snapshot', async () => {
    const out = await runCli(db, ['snapshot', 'save', String(id), 'hello world']);
    expect(out).toContain('Snapshot saved');
    expect(getLatestSnapshot(db, id)?.content).toBe('hello world');
  });

  it('shows latest snapshot', async () => {
    await runCli(db, ['snapshot', 'save', String(id), 'my content']);
    const out = await runCli(db, ['snapshot', 'latest', String(id)]);
    expect(out).toContain('my content');
  });

  it('lists snapshots', async () => {
    await runCli(db, ['snapshot', 'save', String(id), 'first']);
    await runCli(db, ['snapshot', 'save', String(id), 'second']);
    const out = await runCli(db, ['snapshot', 'list', String(id)]);
    expect(out.split('\n').filter(Boolean).length).toBe(2);
  });

  it('clears snapshots', async () => {
    await runCli(db, ['snapshot', 'save', String(id), 'x']);
    await runCli(db, ['snapshot', 'clear', String(id)]);
    expect(listSnapshots(db, id).length).toBe(0);
  });
});
