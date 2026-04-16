import { describe, it, expect, beforeEach, vi } from 'vitest';
import yargs from 'yargs';
import { createTestDb } from '../../db/bookmarks.test';
import { addBookmark } from '../../db/bookmarks';
import { registerTagsCommand } from './tags';

function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const logs: string[] = [];
  const errors: string[] = [];
  vi.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
  vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a.join(' ')));
  const parser = registerTagsCommand(yargs(args).help(false), db);
  parser.parse();
  return { logs, errors };
}

describe('tags command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
    addBookmark(db, { url: 'https://x.com', title: 'X', tags: ['alpha', 'beta'] });
    addBookmark(db, { url: 'https://y.com', title: 'Y', tags: ['alpha'] });
    vi.restoreAllMocks();
  });

  it('list prints all tags', () => {
    const { logs } = runCli(db, ['tags', 'list']);
    expect(logs).toContain('alpha');
    expect(logs).toContain('beta');
  });

  it('stats prints usage counts', () => {
    const { logs } = runCli(db, ['tags', 'stats']);
    expect(logs.some(l => l.includes('alpha: 2'))).toBe(true);
    expect(logs.some(l => l.includes('beta: 1'))).toBe(true);
  });

  it('rename renames a tag', () => {
    const { logs } = runCli(db, ['tags', 'rename', '--from', 'beta', '--to', 'gamma']);
    expect(logs[0]).toContain('Renamed tag');
  });

  it('delete removes a tag', () => {
    const { logs } = runCli(db, ['tags', 'delete', '--name', 'beta']);
    expect(logs[0]).toContain('Deleted tag');
  });

  it('list shows no tags message when empty', () => {
    const emptyDb = createTestDb();
    const { logs } = runCli(emptyDb, ['tags', 'list']);
    expect(logs[0]).toContain('No tags found');
  });
});
