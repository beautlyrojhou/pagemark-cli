import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  addToReadingList,
  removeFromReadingList,
  listReadingList,
  clearReadingList,
  markAsRead,
  isInReadingList,
} from '../../db/bookmarks-reading-list';

export function registerReadingListCommand(yargs: Argv, db: Database) {
  yargs.command(
    'reading-list <action> [id]',
    'Manage reading list',
    (y) =>
      y
        .positional('action', {
          describe: 'Action: add | remove | list | clear | read',
          type: 'string',
          choices: ['add', 'remove', 'list', 'clear', 'read'],
        })
        .positional('id', {
          describe: 'Bookmark ID',
          type: 'number',
        })
        .option('unread', {
          type: 'boolean',
          describe: 'List only unread items',
          default: false,
        }),
    (argv) => {
      const { action, id } = argv as { action: string; id?: number };

      if (action === 'list') {
        const items = listReadingList(db, argv.unread ? false : undefined);
        if (items.length === 0) {
          console.log('Reading list is empty.');
        } else {
          items.forEach((b) =>
            console.log(`[${b.read ? 'x' : ' '}] #${b.id} ${b.url} (${b.title ?? 'no title'})`)
          );
        }
        return;
      }

      if (action === 'clear') {
        clearReadingList(db);
        console.log('Reading list cleared.');
        return;
      }

      if (!id) {
        console.error('Bookmark ID required for this action.');
        process.exit(1);
      }

      if (action === 'add') {
        addToReadingList(db, id);
        console.log(`Bookmark #${id} added to reading list.`);
      } else if (action === 'remove') {
        removeFromReadingList(db, id);
        console.log(`Bookmark #${id} removed from reading list.`);
      } else if (action === 'read') {
        markAsRead(db, id);
        console.log(`Bookmark #${id} marked as read.`);
      }
    }
  );
}
