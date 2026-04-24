import { describe, it, expect, beforeEach } from 'vitest';
import yargs from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { migrateBookmarkTemplates } from '../../db/schema-template-migration';
import { registerTemplateCommand } from './template';
import { listTemplates, getTemplateByName } from '../../db/bookmarks-bookmark-template';
import { searchBookmarks } from '../../db/bookmarks';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  migrateBookmarkTemplates(db);
  return db;
}

async function runCli(db: ReturnType<typeof createTestDb>, args: string[]) {
  const output: string[] = [];
  const orig = console.log;
  console.log = (...a) => output.push(a.join(' '));
  try {
    await registerTemplateCommand(yargs([]), db)
      .exitProcess(false)
      .parseAsync(args);
  } finally {
    console.log = orig;
  }
  return output;
}

describe('template command', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('adds a template', async () => {
    const out = await runCli(db, [
      'template', 'add',
      '--name', 'github',
      '--url-pattern', 'https://github.com/*',
      '--title-prefix', 'GH:',
      '--tags', 'dev,oss',
    ]);
    expect(out[0]).toMatch(/Template created/);
    expect(out[0]).toMatch(/github/);
    const t = getTemplateByName(db, 'github');
    expect(t).toBeDefined();
    expect(t?.default_tags).toBe('dev,oss');
  });

  it('lists templates', async () => {
    await runCli(db, ['template', 'add', '--name', 'hn', '--url-pattern', 'https://news.ycombinator.com/*']);
    const out = await runCli(db, ['template', 'list']);
    expect(out[0]).toMatch(/hn/);
  });

  it('shows no templates message when empty', async () => {
    const out = await runCli(db, ['template', 'list']);
    expect(out[0]).toMatch(/No templates found/);
  });

  it('deletes a template', async () => {
    await runCli(db, ['template', 'add', '--name', 'todelete', '--url-pattern', 'https://x.com/*']);
    const out = await runCli(db, ['template', 'delete', '--name', 'todelete']);
    expect(out[0]).toMatch(/deleted/);
    expect(listTemplates(db).length).toBe(0);
  });

  it('applies a template and creates a bookmark', async () => {
    await runCli(db, [
      'template', 'add',
      '--name', 'gh',
      '--url-pattern', 'https://github.com/*',
      '--title-prefix', 'Repo:',
      '--tags', 'dev',
    ]);
    const out = await runCli(db, [
      'template', 'apply',
      '--name', 'gh',
      '--url', 'https://github.com/user/project',
    ]);
    expect(out[0]).toMatch(/Bookmark added from template/);
    const results = searchBookmarks(db, 'github.com/user/project');
    expect(results.length).toBe(1);
  });
});
