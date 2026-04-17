import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { Command } from 'commander';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerArchiveCommand } from './archive';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const program = new Command();
  program.exitOverride();
  registerArchiveCommand(program, db);
  const output: string[] = [];
  const orig = console.log;
  const origErr = console.error;
  console.log = (...a) => output.push(a.join(' '));
  console.error = (...a) => output.push(a.join(' '));
  try {
    program.parse(['node', 'test', ...args]);
  } finally {
    console.log = orig;
    console.error = origErr;
  }
  return output;
}

describe('archive command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('archives a bookmark', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const out = runCli(db, ['add', String(id)]);
    expect(out[0]).toContain('archived');
  });

  it('restores an archived bookmark', () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    runCli(db, ['add', String(id)]);
    const out = runCli(db, ['restore', String(id)]);
    expect(out[0]).toContain('restored');
  });

  it('lists archived bookmarks', () => {
    const id = addBookmark(db, { url: 'https://test.org', title: 'Test', tags: [] });
    runCli(db, ['add', String(id)]);
    const out = runCli(db, ['list']);
    expect(out[0]).toContain('https://test.org');
  });

  it('purges archived bookmarks', () => {
    const id = addBookmark(db, { url: 'https://purge.io', title: 'Purge', tags: [] });
    runCli(db, ['add', String(id)]);
    const out = runCli(db, ['purge']);
    expect(out[0]).toContain('Purged 1');
  });

  it('reports error for unknown id', () => {
    const out = runCli(db, ['add', '999']);
    expect(out[0]).toContain('not found');
  });
});
