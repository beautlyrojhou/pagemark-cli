import type { Argv } from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { batchAddTag, batchRemoveTag, batchReplaceTag, batchClearTags } from '../../db/bookmarks-batch-tag';

export function registerBatchTagCommand(yargs: Argv, dbPath: string) {
  return yargs.command(
    'batch-tag <action>',
    'Perform bulk tag operations on bookmarks',
    (y) =>
      y
        .positional('action', {
          choices: ['add', 'remove', 'replace', 'clear'] as const,
          describe: 'Bulk tag action to perform',
        })
        .option('ids', {
          type: 'string',
          describe: 'Comma-separated bookmark IDs (for add/remove/clear)',
        })
        .option('tag', {
          type: 'string',
          describe: 'Tag name (for add/remove)',
        })
        .option('old-tag', {
          type: 'string',
          describe: 'Existing tag name (for replace)',
        })
        .option('new-tag', {
          type: 'string',
          describe: 'New tag name (for replace)',
        }),
    (argv) => {
      const db = openDb(dbPath);
      initSchema(db);

      const parseIds = (raw?: string): number[] =>
        (raw ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));

      switch (argv.action) {
        case 'add': {
          const ids = parseIds(argv.ids);
          if (!ids.length || !argv.tag) { console.error('--ids and --tag required'); process.exit(1); }
          const n = batchAddTag(db, ids, argv.tag);
          console.log(`Added tag "${argv.tag}" to ${n} bookmark(s).`);
          break;
        }
        case 'remove': {
          const ids = parseIds(argv.ids);
          if (!ids.length || !argv.tag) { console.error('--ids and --tag required'); process.exit(1); }
          const n = batchRemoveTag(db, ids, argv.tag);
          console.log(`Removed tag "${argv.tag}" from ${n} bookmark(s).`);
          break;
        }
        case 'replace': {
          if (!argv['old-tag'] || !argv['new-tag']) { console.error('--old-tag and --new-tag required'); process.exit(1); }
          const n = batchReplaceTag(db, argv['old-tag'], argv['new-tag']);
          console.log(`Replaced tag "${argv['old-tag']}" with "${argv['new-tag']}" on ${n} bookmark(s).`);
          break;
        }
        case 'clear': {
          const ids = parseIds(argv.ids);
          if (!ids.length) { console.error('--ids required'); process.exit(1); }
          const n = batchClearTags(db, ids);
          console.log(`Cleared ${n} tag(s) from ${ids.length} bookmark(s).`);
          break;
        }
      }
    }
  );
}
