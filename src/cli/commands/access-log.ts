import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import {
  recordAccess,
  getAccessLog,
  listRecentAccesses,
  clearAccessLog,
  purgeOldAccessLog,
} from '../../db/bookmarks-bookmark-access-log';

export function registerAccessLogCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'access-log <subcommand>',
    'Manage bookmark access logs',
    (y) =>
      y
        .command(
          'record <id> <action>',
          'Record an access event for a bookmark',
          (y2) =>
            y2
              .positional('id', { type: 'number', demandOption: true, describe: 'Bookmark ID' })
              .positional('action', { type: 'string', demandOption: true, describe: 'Action type (e.g. open, copy)' }),
          (argv) => {
            recordAccess(db, argv.id as number, argv.action as string);
            console.log(`Access recorded: [${argv.action}] for bookmark #${argv.id}`);
          }
        )
        .command(
          'show <id>',
          'Show access log for a bookmark',
          (y2) =>
            y2
              .positional('id', { type: 'number', demandOption: true, describe: 'Bookmark ID' })
              .option('limit', { type: 'number', default: 20, describe: 'Max entries to show' }),
          (argv) => {
            const log = getAccessLog(db, argv.id as number, argv.limit as number);
            if (log.length === 0) {
              console.log('No access log entries found.');
              return;
            }
            for (const entry of log) {
              console.log(`[${entry.accessed_at}] ${entry.action}`);
            }
          }
        )
        .command(
          'recent',
          'List recent accesses across all bookmarks',
          (y2) => y2.option('limit', { type: 'number', default: 20, describe: 'Max entries' }),
          (argv) => {
            const entries = listRecentAccesses(db, argv.limit as number);
            if (entries.length === 0) {
              console.log('No recent accesses.');
              return;
            }
            for (const e of entries) {
              console.log(`[${e.accessed_at}] bookmark #${e.bookmark_id} — ${e.action}`);
            }
          }
        )
        .command(
          'clear <id>',
          'Clear access log for a bookmark',
          (y2) => y2.positional('id', { type: 'number', demandOption: true, describe: 'Bookmark ID' }),
          (argv) => {
            clearAccessLog(db, argv.id as number);
            console.log(`Access log cleared for bookmark #${argv.id}`);
          }
        )
        .command(
          'purge',
          'Purge access log entries older than N days',
          (y2) => y2.option('days', { type: 'number', default: 90, describe: 'Retention period in days' }),
          (argv) => {
            const deleted = purgeOldAccessLog(db, argv.days as number);
            console.log(`Purged ${deleted} old access log entries (older than ${argv.days} days).`);
          }
        )
        .demandCommand(1, 'Specify a subcommand'),
    () => {}
  );
}
