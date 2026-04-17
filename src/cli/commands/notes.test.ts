import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { getNote } from '../../db/bookmarks-notes';
import { registerNotesCommand } from './notes';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

async function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const logs: string[] = [];
  const spy = (msg: string) => logs.push(msg);
  const orig = console.log;
  console.log = spy;
  try {
    await registerNotesCommand(yargs([]), db)
      .parse(args);
  } finally {
    console.log = orig;
  }
  return logs;
}

describe('notes command', () => {
  let db: ReturnType<typeof createTestDb>;
  let id: number;

  beforeEach(() => {
    db = createTestDb();
    id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('sets a note via CLI', async () => {
    const logs = await runCli(db, ['notes', 'set', String(id), 'hello world']);
    expect(logs.join(' ')).toContain(`Note set on bookmark #${id}`);
    expect(getNote(db, id)).toBe('hello world');
  });

  it('gets a note via CLI', async () => {
    const, ['notes', 'get', String(id)]);
    expect(logs.join(' ')).toContain('No note set.');
  });

  it('clears a note via CLI', async () => {
    const logs = await runCli(db, ['notes', 'set', String(id), 'temp']);
    await runCli(db, ['notes', 'clear', String(id)]);
    expect(getNote(db, id)).toBeNull();
  });
});
