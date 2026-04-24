import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  createBookmarkList,
  deleteBookmarkList,
  listBookmarkLists,
  addBookmarkToList,
  removeBookmarkFromList,
  getBookmarksInList,
  getListByName,
} from '../../db/bookmarks-bookmark-list';
import { migrateBookmarkLists } from '../../db/schema-bookmark-list-migration';

export function registerBookmarkListCommand(yargs: Argv, db: Database): Argv {
  migrateBookmarkLists(db);

  return yargs.command(
    'list <subcommand>',
    'Manage bookmark lists',
    (y) =>
      y
        .command('create <name> [description]', 'Create a new list', {}, (argv) => {
          const list = createBookmarkList(db, argv.name as string, argv.description as string | undefined);
          console.log(`Created list #${list.id}: "${list.name}"`);
        })
        .command('delete <id>', 'Delete a list by ID', {}, (argv) => {
          const ok = deleteBookmarkList(db, Number(argv.id));
          console.log(ok ? `Deleted list #${argv.id}` : `List #${argv.id} not found`);
        })
        .command('ls', 'List all bookmark lists', {}, () => {
          const lists = listBookmarkLists(db);
          if (lists.length === 0) {
            console.log('No lists found.');
            return;
          }
          for (const l of lists) {
            console.log(`#${l.id}  ${l.name}${l.description ? '  — ' + l.description : ''}`);
          }
        })
        .command('add <listName> <bookmarkId>', 'Add a bookmark to a list', {}, (argv) => {
          const list = getListByName(db, argv.listName as string);
          if (!list) { console.error(`List "${argv.listName}" not found`); return; }
          addBookmarkToList(db, list.id, Number(argv.bookmarkId));
          console.log(`Added bookmark #${argv.bookmarkId} to list "${list.name}"`);
        })
        .command('remove <listName> <bookmarkId>', 'Remove a bookmark from a list', {}, (argv) => {
          const list = getListByName(db, argv.listName as string);
          if (!list) { console.error(`List "${argv.listName}" not found`); return; }
          const ok = removeBookmarkFromList(db, list.id, Number(argv.bookmarkId));
          console.log(ok ? `Removed bookmark #${argv.bookmarkId}` : 'Not found in list');
        })
        .command('show <listName>', 'Show bookmarks in a list', {}, (argv) => {
          const list = getListByName(db, argv.listName as string);
          if (!list) { console.error(`List "${argv.listName}" not found`); return; }
          const items = getBookmarksInList(db, list.id);
          if (items.length === 0) { console.log('List is empty.'); return; }
          for (const b of items) console.log(`#${b.id}  ${b.title}  ${b.url}`);
        })
        .demandCommand(1, 'Specify a subcommand'),
    () => {}
  );
}
