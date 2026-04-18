import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import { recordVisit, getVisitStats, listMostVisited, resetVisits } from '../../db/bookmarks-visit';

export function registerVisitCommand(yargs: Argv, db: Database): Argv {
  return yargs
    .command(
      'visit <id>',
      'Record a visit to a bookmark',
      (y) => y.positional('id', { type: 'number', demandOption: true }),
      (argv) => {
        recordVisit(db, argv.id as number);
        const stats = getVisitStats(db, argv.id as number);
        if (!stats) {
          console.error(`Bookmark ${argv.id} not found`);
          process.exit(1);
        }
        console.log(`Visited bookmark ${argv.id}. Total visits: ${stats.visitCount}`);
      }
    )
    .command(
      'most-visited [limit]',
      'List most visited bookmarks',
      (y) => y.positional('limit', { type: 'number', default: 10 }),
      (argv) => {
        const rows = listMostVisited(db, argv.limit as number);
        if (rows.length === 0) {
          console.log('No visits recorded.');
          return;
        }
        for (const r of rows) {
          console.log(`[${r.id}] ${r.url} — visits: ${r.visitCount}, last: ${r.lastVisited ?? 'never'}`);
        }
      }
    )
    .command(
      'reset-visits <id>',
      'Reset visit stats for a bookmark',
      (y) => y.positional('id', { type: 'number', demandOption: true }),
      (argv) => {
        resetVisits(db, argv.id as number);
        console.log(`Visit stats reset for bookmark ${argv.id}.`);
      }
    );
}
