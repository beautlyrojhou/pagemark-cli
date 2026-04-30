import type { Argv } from 'yargs';
import type Database from 'better-sqlite3';
import {
  isValidPriority,
  setPriority,
  getPriority,
  clearPriority,
  listByPriority,
  getPriorityCounts,
} from '../../db/bookmarks-bookmark-priority';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export function registerPriorityCommand(yargs: Argv, db: Database.Database) {
  yargs.command(
    'priority <action>',
    'Manage bookmark priorities',
    (y) =>
      y
        .positional('action', {
          choices: ['set', 'get', 'clear', 'list', 'counts'] as const,
          describe: 'Action to perform',
        })
        .option('id', { type: 'number', describe: 'Bookmark ID' })
        .option('level', {
          type: 'string',
          choices: VALID_PRIORITIES,
          describe: 'Priority level',
        }),
    (argv) => {
      const { action, id, level } = argv as {
        action: string;
        id?: number;
        level?: string;
      };

      if (action === 'set') {
        if (!id) return console.error('--id is required for set');
        if (!level || !isValidPriority(level))
          return console.error(
            `--level must be one of: ${VALID_PRIORITIES.join(', ')}`
          );
        setPriority(db, id, level);
        console.log(`Priority for bookmark ${id} set to "${level}".`);
        return;
      }

      if (action === 'get') {
        if (!id) return console.error('--id is required for get');
        const p = getPriority(db, id);
        console.log(p ? `Bookmark ${id} priority: ${p}` : `Bookmark ${id} has no priority set.`);
        return;
      }

      if (action === 'clear') {
        if (!id) return console.error('--id is required for clear');
        clearPriority(db, id);
        console.log(`Priority cleared for bookmark ${id}.`);
        return;
      }

      if (action === 'list') {
        if (!level || !isValidPriority(level))
          return console.error(
            `--level must be one of: ${VALID_PRIORITIES.join(', ')}`
          );
        const bookmarks = listByPriority(db, level);
        if (!bookmarks.length) {
          console.log(`No bookmarks with priority "${level}".`);
          return;
        }
        bookmarks.forEach((b) =>
          console.log(`[${b.id}] ${b.title ?? b.url}  ${b.url}`)
        );
        return;
      }

      if (action === 'counts') {
        const counts = getPriorityCounts(db);
        const entries = Object.entries(counts);
        if (!entries.length) {
          console.log('No priorities assigned.');
          return;
        }
        entries.forEach(([lvl, count]) =>
          console.log(`${lvl}: ${count}`)
        );
        return;
      }

      console.error(`Unknown action: ${action}`);
    }
  );
}
