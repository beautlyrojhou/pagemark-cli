import { Command } from 'commander';
import { openDb } from '../../db/schema';
import { listByTag, getBookmarkById } from '../../db/bookmarks';

export function registerTagCommand(program: Command, dbPath?: string): void {
  const tagCmd = program
    .command('tag')
    .description('Tag-related operations');

  tagCmd
    .command('list <tag>')
    .description('List all bookmarks with a given tag')
    .action(async (tag: string) => {
      try {
        const db = await openDb(dbPath);
        const results = await listByTag(db, tag);
        await db.close();

        if (results.length === 0) {
          console.log(`No bookmarks found with tag "${tag}".`);
          return;
        }

        console.log(`Bookmarks tagged "${tag}":`);
        for (const b of results) {
          console.log(`  [${b.id}] ${b.title || b.url}`);
          console.log(`       ${b.url}`);
        }
      } catch (err) {
        console.error('Error listing by tag:', (err as Error).message);
        process.exit(1);
      }
    });

  tagCmd
    .command('show <id>')
    .description('Show tags for a bookmark by ID')
    .action(async (id: string) => {
      try {
        const db = await openDb(dbPath);
        const bookmark = await getBookmarkById(db, parseInt(id, 10));
        if (!bookmark) {
          console.error(`Bookmark with ID ${id} not found.`);
          await db.close();
          process.exit(1);
        }
        const { getTagsForBookmark } = await import('../../db/bookmarks');
        const tags = await getTagsForBookmark(db, bookmark.id);
        await db.close();

        if (tags.length === 0) {
          console.log(`Bookmark [${id}] has no tags.`);
        } else {
          console.log(`Tags for [${id}] ${bookmark.title || bookmark.url}: ${tags.join(', ')}`);
        }
      } catch (err) {
        console.error('Error fetching tags:', (err as Error).message);
        process.exit(1);
      }
    });
}
