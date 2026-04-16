import { Command } from 'commander';
import { registerAddCommand } from './add';
import { createTestDb } from '../../db/bookmarks.test';
import { searchBookmarks, listByTag } from '../../db/bookmarks';

describe('add command', () => {
  it('registers the add command on the program', () => {
    const program = new Command();
    registerAddCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'add');
    expect(cmd).toBeDefined();
  });

  it('adds a bookmark with tags via addBookmark (integration)', async () => {
    const db = await createTestDb();

    const { addBookmark, getTagsForBookmark } = await import('../../db/bookmarks');

    const id = await addBookmark(db, {
      url: 'https://example.com',
      title: 'Example',
      tags: ['test', 'demo'],
    });

    expect(id).toBeGreaterThan(0);

    const tags = await getTagsForBookmark(db, id);
    expect(tags).toEqual(expect.arrayContaining(['test', 'demo']));

    const results = await searchBookmarks(db, 'Example');
    expect(results.length).toBe(1);
    expect(results[0].url).toBe('https://example.com');

    const byTag = await listByTag(db, 'demo');
    expect(byTag.length).toBe(1);
    expect(byTag[0].id).toBe(id);

    await db.close();
  });

  it('adds a bookmark without tags', async () => {
    const db = await createTestDb();
    const { addBookmark, getTagsForBookmark } = await import('../../db/bookmarks');

    const id = await addBookmark(db, {
      url: 'https://no-tags.com',
      title: 'No Tags',
    });

    const tags = await getTagsForBookmark(db, id);
    expect(tags).toEqual([]);

    await db.close();
  });
});
