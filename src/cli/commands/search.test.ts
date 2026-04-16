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

describe('registerSearchCommand', () => {
  it('registers the search command on the program', () => {
    const program = new Command();
    registerSearchCommand(program, dbPath);
    const cmd = program.commands.find((c) => c.name() === 'search');
    expect(cmd).toBeDefined();
  });

  it('search command has --tag option', () => {
    const program = new Command();
    registerSearchCommand(program, dbPath);
    const cmd = program.commands.find((c) => c.name() === 'search')!;
    const tagOpt = cmd.options.find((o) => o.long === '--tag');
    expect(tagOpt).toBeDefined();
  });

  it('parses query argument correctly', () => {
    const program = new Command();
    registerSearchCommand(program, dbPath);
    const cmd = program.commands.find((c) => c.name() === 'search')!;
    expect(cmd.registeredArguments[0].name()).toBe('query');
  });
});
