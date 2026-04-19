import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createTestDb } from '../../db/bookmarks.test';
import { addBookmark } from '../../db/bookmarks';
import { registerSearchCommand } from './search';
import type { Database } from 'sqlite';

let db: Database;
let dbPath: string;

beforeEach(async () => {
  ({ db, dbPath } = await createTestDb());
  await addBookmark(db, 'https://example.com', 'Example Site', 'A sample site', ['web', 'demo']);
  await addBookmark(db, 'https://typescript.org', 'TypeScript', 'Typed JS', ['typescript', 'dev']);
  await addBookmark(db, 'https://sqlite.org', 'SQLite Docs', null, ['database', 'dev']);
  await db.close();
});

afterEach(async () => {
  const fs = await import('fs/promises');
  await fs.unlink(dbPath).catch(() => {});
});

/** Helper to get the registered search command from a fresh program. */
function getSearchCommand(dbPath: string) {
  const program = new Command();
  registerSearchCommand(program, dbPath);
  return program.commands.find((c) => c.name() === 'search')!;
}

describe('registerSearchCommand', () => {
  it('registers the search command on the program', () => {
    const program = new Command();
    registerSearchCommand(program, dbPath);
    const cmd = program.commands.find((c) => c.name() === 'search');
    expect(cmd).toBeDefined();
  });

  it('search command has --tag option', () => {
    const cmd = getSearchCommand(dbPath);
    const tagOpt = cmd.options.find((o) => o.long === '--tag');
    expect(tagOpt).toBeDefined();
  });

  it('parses query argument correctly', () => {
    const cmd = getSearchCommand(dbPath);
    expect(cmd.registeredArguments[0].name()).toBe('query');
  });
});
