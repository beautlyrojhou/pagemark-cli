import { Argv } from 'yargs';
import { openDb, initSchema } from '../../db/schema';
import {
  setStatus,
  getStatus,
  clearStatus,
  listByStatus,
  getStatusCounts,
  BookmarkStatus,
} from '../../db/bookmarks-bookmark-status';

const VALID_STATUSES: BookmarkStatus[] = ['active', 'archived', 'draft', 'broken', 'review'];

export function registerStatusCommand(yargs: Argv) {
  yargs.command(
    'status <subcommand>',
    'Manage bookmark status',
    (y) => {
      y.command(
        'set <id> <status>',
        'Set status for a bookmark',
        (y2) => y2
          .positional('id', { type: 'number', demandOption: true })
          .positional('status', { type: 'string', choices: VALID_STATUSES, demandOption: true }),
        (argv) => {
          const db = openDb();
          initSchema(db);
          const ok = setStatus(db, argv.id as number, argv.status as BookmarkStatus);
          if (ok) {
            console.log(`Status set to "${argv.status}" for bookmark #${argv.id}.`);
          } else {
            console.error(`Bookmark #${argv.id} not found.`);
            process.exit(1);
          }
        }
      );

      y.command(
        'get <id>',
        'Get status of a bookmark',
        (y2) => y2.positional('id', { type: 'number', demandOption: true }),
        (argv) => {
          const db = openDb();
          initSchema(db);
          const status = getStatus(db, argv.id as number);
          if (status === null) {
            console.error(`Bookmark #${argv.id} not found.`);
            process.exit(1);
          }
          console.log(status);
        }
      );

      y.command(
        'clear <id>',
        'Reset bookmark status to active',
        (y2) => y2.positional('id', { type: 'number', demandOption: true }),
        (argv) => {
          const db = openDb();
          initSchema(db);
          clearStatus(db, argv.id as number);
          console.log(`Status cleared for bookmark #${argv.id}.`);
        }
      );

      y.command(
        'list <status>',
        'List bookmarks by status',
        (y2) => y2.positional('status', { type: 'string', choices: VALID_STATUSES, demandOption: true }),
        (argv) => {
          const db = openDb();
          initSchema(db);
          const results = listByStatus(db, argv.status as BookmarkStatus);
          if (results.length === 0) {
            console.log(`No bookmarks with status "${argv.status}".`);
          } else {
            for (const b of results) {
              console.log(`[${b.id}] ${b.title} — ${b.url}`);
            }
          }
        }
      );

      y.command(
        'counts',
        'Show counts per status',
        () => {},
        () => {
          const db = openDb();
          initSchema(db);
          const counts = getStatusCounts(db);
          for (const [status, count] of Object.entries(counts)) {
            console.log(`${status}: ${count}`);
          }
        }
      );
    },
    () => {}
  );
}
