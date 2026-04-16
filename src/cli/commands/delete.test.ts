import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { createTestDb } from '../../db/bookmarks.test';
import { addBookmark } from '../../db/bookmarks';
import { registerDeleteCommand } from './delete';

function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  return new Promise<{ stdout: string; code: number }>((resolve) => {
    const logs: string[] = [];
    const orig = console.log;
    const origErr = console.error;
    console.log = (...a) => logs.push(a.join(' '));
    console.error = (...a) => logs.push(a.join(' '));
    const exit = process.exit as unknown as (code?: number) => void;
    let code = 0;
    process.exit = ((c: number) => { code = c; throw new Error('exit'); }) as never;
    registerDeleteCommand(yargs(args), db)
      .parse(args, () => {
        console.log = orig;
        console.error = origErr;
        process.exit = exit;
        resolve({ stdout: logs.join('\n'), code });
      });
  }).catch(() => ({ stdout: '', code: 1 }));
}

describe('delete command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('shows confirmation message without --yes', async () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Test', tags: [] });
    const { stdout } = await runCli(db, ['delete', String(id)]);
    expect(stdout).toContain('Use --yes to confirm deletion');
  });

  it('deletes bookmark with --yes flag', async () => {
    const id = addBookmark(db, { url: 'https://example.com', title: 'Test', tags: [] });
    const { stdout } = await runCli(db, ['delete', String(id), '--yes']);
    expect(stdout).toContain(`Deleted bookmark #${id}`);
  });

  it('errors on unknown id', async () => {
    const { code } = await runCli(db, ['delete', '9999', '--yes']);
    expect(code).toBe(1);
  });
});
