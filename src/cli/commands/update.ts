import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { updateBookmark } from '../../db/bookmarks-update';
import { getBookmarkById } from '../../db/bookmarks';

export function registerUpdateCommand(yargs: Argv, db: Database) {
  yargs.command(
    'update <id>',
    'Update a bookmark by ID',
    (y) =>
      y
        .positional('id', { type: 'number', description: 'Bookmark ID', demandOption: true })
        .option('title', { type: 'string', description: 'New title' })
        .option('url', { type: 'string', description: 'New URL' })
        .option('description', { type: 'string', description: 'New description' })
        .option('tags', { type: 'string', description: 'Comma-separated tags to replace existing' }),
    (argv) => {
      const id = argv.id as number;
      const existing = getBookmarkById(db, id);
      if (!existing) {
        console.error(`Bookmark #${id} not found.`);
        process.exitCode = 1;
        return;
      }

      const tags = argv.tags !== undefined
        ? argv.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : undefined;

      const ok = updateBookmark(db, id, {
        title: argv.title as string | undefined,
        url: argv.url as string | undefined,
        description: argv.description as string | undefined,
        tags,
      });

      if (ok) {
        console.log(`Bookmark #${id} updated.`);
      } else {
        console.error(`Failed to update bookmark #${id}.`);
        process.exitCode = 1;
      }
    }
  );
}
