import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  addAlias,
  removeAlias,
  getAliases,
  resolveAlias,
  listAllAliases,
} from '../../db/bookmarks-bookmark-alias';
import { getBookmarkById } from '../../db/bookmarks';

export function registerAliasCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'alias <action>',
    'Manage bookmark aliases',
    (y) =>
      y
        .positional('action', {
          choices: ['add', 'remove', 'list', 'resolve'] as const,
          describe: 'Action to perform',
        })
        .option('id', { type: 'number', describe: 'Bookmark ID' })
        .option('alias', { alias: 'a', type: 'string', describe: 'Alias string' })
        .example('$0 alias add --id 1 --alias mysite', 'Add alias "mysite" to bookmark 1')
        .example('$0 alias remove --alias mysite', 'Remove alias "mysite"')
        .example('$0 alias list --id 1', 'List all aliases for bookmark 1')
        .example('$0 alias resolve --alias mysite', 'Resolve alias to a bookmark'),
    (argv) => {
      const action = argv.action as string;

      if (action === 'add') {
        if (!argv.id || !argv.alias) {
          console.error('--id and --alias are required for add');
          process.exit(1);
        }
        const bm = getBookmarkById(db, argv.id);
        if (!bm) {
          console.error(`Bookmark #${argv.id} not found.`);
          process.exit(1);
        }
        try {
          addAlias(db, argv.id, argv.alias);
          console.log(`Alias '${argv.alias}' added to bookmark #${argv.id}.`);
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
        return;
      }

      if (action === 'remove') {
        if (!argv.alias) {
          console.error('--alias is required for remove');
          process.exit(1);
        }
        const removed = removeAlias(db, argv.alias);
        if (removed) {
          console.log(`Alias '${argv.alias}' removed.`);
        } else {
          console.error(`Alias '${argv.alias}' not found.`);
          process.exit(1);
        }
        return;
      }

      if (action === 'list') {
        if (argv.id) {
          const aliases = getAliases(db, argv.id);
          if (aliases.length === 0) {
            console.log(`No aliases for bookmark #${argv.id}.`);
          } else {
            aliases.forEach((a) => console.log(a));
          }
        } else {
          const all = listAllAliases(db);
          if (all.length === 0) {
            console.log('No aliases defined.');
          } else {
            all.forEach((a) => console.log(`#${a.bookmarkId}\t${a.alias}\t${a.createdAt}`));
          }
        }
        return;
      }

      if (action === 'resolve') {
        if (!argv.alias) {
          console.error('--alias is required for resolve');
          process.exit(1);
        }
        const id = resolveAlias(db, argv.alias);
        if (id === null) {
          console.error(`Alias '${argv.alias}' not found.`);
          process.exit(1);
        }
        const bm = getBookmarkById(db, id);
        if (bm) {
          console.log(`#${bm.id} ${bm.url} — ${bm.title ?? '(no title)'}`);
        }
      }
    }
  );
}
