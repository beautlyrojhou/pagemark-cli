import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { deleteBookmark } from '../../db/bookmarks-delete';
import { getBookmarkById } from '../../db/bookmarks';

export function registerDeleteCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'delete <id>',
    'Delete a bookmark by ID',
    (y) =>
      y.positional('id', {
        describe: 'Bookmark ID to delete',
        type: 'number',
        demandOption: true,
      }).option('yes', {
        alias: 'y',
        type: 'boolean',
        description: 'Skip confirmation prompt',
        default: false,
      }),
    async (argv) => {
      const id = argv.id as number;
      const bookmark = getBookmarkById(db, id);

      if (!bookmark) {
        console.error(`No bookmark found with ID ${id}`);
        process.exit(1);
      }

      if (!argv.yes) {
        console.log(`About to delete: [${bookmark.id}] ${bookmark.title} (${bookmark.url})`);
        console.log('Use --yes to confirm deletion.');
        process.exit(0);
      }

      const deleted = deleteBookmark(db, id);
      if (deleted) {
        console.log(`Deleted bookmark #${id}: ${bookmark.title}`);
      } else {
        console.error(`Failed to delete bookmark #${id}`);
        process.exit(1);
      }
    }
  );
}
