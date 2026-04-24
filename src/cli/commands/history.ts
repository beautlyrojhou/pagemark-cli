import { Argv } from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import { migrateBookmarkHistory } from '../../db/schema-history-migration';
import {
  getHistory,
  clearHistory,
  listRecentChanges,
  purgeOldHistory,
} from '../../db/bookmarks-bookmark-history';

export function registerHistoryCommand(yargs: Argv, dbPath: string): Argv {
  return yargs.command(
    'history <subcommand>',
    'View and manage bookmark change history',
    (y) =>
      y
        .command(
          'show <id>',
          'Show change history for a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            const db = openDb(dbPath);
            initSchema(db);
            migrateBookmarkHistory(db);
            const entries = getHistory(db, argv.id as number);
            if (entries.length === 0) {
              console.log('No history found for this bookmark.');
              return;
            }
            for (const e of entries) {
              console.log(`[${e.changedAt}] ${e.field}: ${e.oldValue ?? '(none)'} → ${e.newValue ?? '(none)'}`);
            }
          }
        )
        .command(
          'recent',
          'List recent changes across all bookmarks',
          (y) => y.option('limit', { type: 'number', default: 20, alias: 'n' }),
          (argv) => {
            const db = openDb(dbPath);
            initSchema(db);
            migrateBookmarkHistory(db);
            const entries = listRecentChanges(db, argv.limit as number);
            if (entries.length === 0) {
              console.log('No recent changes.');
              return;
            }
            for (const e of entries) {
              console.log(`[${e.changedAt}] #${e.bookmarkId} ${e.field}: ${e.oldValue ?? '(none)'} → ${e.newValue ?? '(none)'}`);
            }
          }
        )
        .command(
          'clear <id>',
          'Clear history for a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            const db = openDb(dbPath);
            initSchema(db);
            migrateBookmarkHistory(db);
            const n = clearHistory(db, argv.id as number);
            console.log(`Cleared ${n} history entries.`);
          }
        )
        .command(
          'purge',
          'Purge history entries older than N days',
          (y) => y.option('days', { type: 'number', default: 90, alias: 'd' }),
          (argv) => {
            const db = openDb(dbPath);
            initSchema(db);
            migrateBookmarkHistory(db);
            const n = purgeOldHistory(db, argv.days as number);
            console.log(`Purged ${n} old history entries.`);
          }
        )
        .demandCommand(1, 'Specify a history subcommand'),
    () => {}
  );
}
