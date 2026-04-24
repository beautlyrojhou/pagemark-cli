import { Argv } from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { migrateBookmarkGroups } from '../../db/schema-group-migration';
import {
  createGroup,
  deleteGroup,
  listGroups,
  addBookmarkToGroup,
  removeBookmarkFromGroup,
  listBookmarksInGroup,
  getGroupsForBookmark,
  renameGroup,
} from '../../db/bookmarks-bookmark-group';
import { getBookmarkById } from '../../db/bookmarks';

export function registerGroupCommand(yargs: Argv, dbPath: string): Argv {
  return yargs.command(
    'group <action>',
    'Manage bookmark groups',
    (y) =>
      y
        .positional('action', {
          choices: ['create', 'delete', 'list', 'add', 'remove', 'members', 'of', 'rename'] as const,
          demandOption: true,
        })
        .option('name', { type: 'string', description: 'Group name' })
        .option('description', { alias: 'd', type: 'string', description: 'Group description' })
        .option('id', { type: 'number', description: 'Group ID' })
        .option('bookmark', { alias: 'b', type: 'number', description: 'Bookmark ID' })
        .option('new-name', { type: 'string', description: 'New name for rename' }),
    (argv) => {
      const db = openDb(dbPath);
      initSchema(db);
      migrateBookmarkGroups(db);

      const action = argv.action as string;

      if (action === 'create') {
        if (!argv.name) { console.error('--name required'); process.exit(1); }
        const g = createGroup(db, argv.name, argv.description);
        console.log(`Created group #${g.id}: ${g.name}`);
      } else if (action === 'delete') {
        if (!argv.id) { console.error('--id required'); process.exit(1); }
        const ok = deleteGroup(db, argv.id);
        console.log(ok ? `Deleted group #${argv.id}` : 'Group not found');
      } else if (action === 'list') {
        const groups = listGroups(db);
        if (!groups.length) { console.log('No groups found.'); return; }
        groups.forEach((g) => console.log(`#${g.id}  ${g.name}${g.description ? '  — ' + g.description : ''}`));
      } else if (action === 'add') {
        if (!argv.bookmark || !argv.id) { console.error('--bookmark and --id required'); process.exit(1); }
        addBookmarkToGroup(db, argv.bookmark, argv.id);
        console.log(`Added bookmark #${argv.bookmark} to group #${argv.id}`);
      } else if (action === 'remove') {
        if (!argv.bookmark || !argv.id) { console.error('--bookmark and --id required'); process.exit(1); }
        const ok = removeBookmarkFromGroup(db, argv.bookmark, argv.id);
        console.log(ok ? 'Removed.' : 'Not found.');
      } else if (action === 'members') {
        if (!argv.id) { console.error('--id required'); process.exit(1); }
        const ids = listBookmarksInGroup(db, argv.id);
        if (!ids.length) { console.log('No bookmarks in this group.'); return; }
        ids.forEach((bid) => {
          const bm = getBookmarkById(db, bid);
          if (bm) console.log(`#${bm.id}  ${bm.title}  ${bm.url}`);
        });
      } else if (action === 'of') {
        if (!argv.bookmark) { console.error('--bookmark required'); process.exit(1); }
        const groups = getGroupsForBookmark(db, argv.bookmark);
        if (!groups.length) { console.log('Bookmark belongs to no groups.'); return; }
        groups.forEach((g) => console.log(`#${g.id}  ${g.name}`));
      } else if (action === 'rename') {
        if (!argv.id || !argv['new-name']) { console.error('--id and --new-name required'); process.exit(1); }
        const ok = renameGroup(db, argv.id, argv['new-name'] as string);
        console.log(ok ? `Renamed group #${argv.id} to "${argv['new-name']}"` : 'Group not found');
      }
    }
  );
}
