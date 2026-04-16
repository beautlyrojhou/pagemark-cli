import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { getAllTags, renameTag, deleteTag, getTagUsageCounts } from '../../db/tags';

export function registerTagsCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'tags <action>',
    'Manage tags (list, rename, delete, stats)',
    (y) =>
      y
        .positional('action', {
          choices: ['list', 'rename', 'delete', 'stats'] as const,
          describe: 'Action to perform',
        })
        .option('from', { type: 'string', describe: 'Current tag name (for rename)' })
        .option('to', { type: 'string', describe: 'New tag name (for rename)' })
        .option('name', { type: 'string', describe: 'Tag name (for delete)' }),
    (argv) => {
      const action = argv.action as string;

      if (action === 'list') {
        const tags = getAllTags(db);
        if (tags.length === 0) {
          console.log('No tags found.');
        } else {
          tags.forEach(t => console.log(t.name));
        }
        return;
      }

      if (action === 'stats') {
        const counts = getTagUsageCounts(db);
        if (counts.length === 0) {
          console.log('No tags found.');
        } else {
          counts.forEach(t => console.log(`${t.name}: ${t.count} bookmark(s)`));
        }
        return;
      }

      if (action === 'rename') {
        if (!argv.from || !argv.to) {
          console.error('Error: --from and --to are required for rename.');
          process.exit(1);
        }
        const ok = renameTag(db, argv.from as string, argv.to as string);
        console.log(ok ? `Renamed tag "${argv.from}" to "${argv.to}".` : `Tag "${argv.from}" not found.`);
        return;
      }

      if (action === 'delete') {
        if (!argv.name) {
          console.error('Error: --name is required for delete.');
          process.exit(1);
        }
        const ok = deleteTag(db, argv.name as string);
        console.log(ok ? `Deleted tag "${argv.name}".` : `Tag "${argv.name}" not found.`);
      }
    }
  );
}
