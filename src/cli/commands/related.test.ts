import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerRelatedCommand } from './related';
import type { Database } from 'better-sqlite3';

async function createTestDb(): Promise<Database> {
  const db = await openDb(':memory:');
  await initSchema(db);
  return db;
}

async function runCli(db: Database, args: string[]): Promise<string> {
  let output = '';
  const log = console.log;
  console.log = (...a: unknown[]) => { output += a.join(' ') + '\n'; };
  try {
    await registerRelatedCommand(yargs([]), db)
      .parse(['related', ...args]);
  } finally {
    console.log = log;
  }
  return output;
}

describe('related command', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it('shows related bookmarks by shared tags', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'Alpha', tags: ['ts', 'node'] });
    await addBookmark(db, { url: 'https://b.com', title: 'Beta', tags: ['ts', 'web'] });

    const output = await runCli(db, [String(id1)]);
    expect(output).toContain('Beta');
    expect(output).toContain('https://b.com');
  });

  it('shows message when no related bookmarks found', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'Alone', tags: ['unique-xyz'] });
    await addBookmark(db, { url: 'https://b.com', title: 'Other', tags: ['different'] });

    const output = await runCli(db, [String(id1)]);
    expect(output).toContain('No related bookmarks found');
  });

  it('outputs JSON when --json flag is passed', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'Alpha', tags: ['ts'] });
    await addBookmark(db, { url: 'https://b.com', title: 'Beta', tags: ['ts'] });

    const output = await runCli(db, [String(id1), '--json']);
    const parsed = JSON.parse(output.trim());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('url');
  });

  it('respects --limit option', async () => {
    const id1 = await addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['ts'] });
    await addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['ts'] });
    await addBookmark(db, { url: 'https://c.com', title: 'C', tags: ['ts'] });
    await addBookmark(db, { url: 'https://d.com', title: 'D', tags: ['ts'] });

    const output = await runCli(db, [String(id1), '--limit', '1', '--json']);
    const parsed = JSON.parse(output.trim());
    expect(parsed).toHaveLength(1);
  });
});
