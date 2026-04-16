import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from '../../db/schema';
import { addBookmark } from '../../db/bookmarks';
import { registerOpenCommand } from './open';
import yargs from 'yargs';
import * as child_process from 'child_process';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  return db;
}

function runCli(db: Database, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve) => {
    let stdout = '';
    let stderr = '';
    const log = vi.spyOn(console, 'log').mockImplementation((msg) => { stdout += msg + '\n'; });
    const err = vi.spyOn(console, 'error').mockImplementation((msg) => { stderr += msg + '\n'; });
    const cli = registerOpenCommand(yargs([]), db);
    cli.parse(args, () => {
      log.mockRestore();
      err.mockRestore();
      resolve({ stdout, stderr });
    });
  });
}

describe('open command', () => {
  let db: Database.Database;
  let execSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    db = createTestDb();
    execSpy = vi.spyOn(child_process, 'exec').mockImplementation((() => {}) as any);
  });

  it('opens a valid bookmark URL', async () => {
    addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
    const { stdout, stderr } = await runCli(db, ['open', '1']);
    expect(stdout).toContain('https://example.com');
    expect(stderr).toBe('');
    expect(execSpy).toHaveBeenCalled();
  });

  it('prints error for missing bookmark', async () => {
    const { stderr } = await runCli(db, ['open', '999']);
    expect(stderr).toContain('not found');
    expect(execSpy).not.toHaveBeenCalled();
  });
});
