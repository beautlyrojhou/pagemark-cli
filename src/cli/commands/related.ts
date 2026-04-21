import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import { findRelatedBookmarks } from '../../db/bookmarks-related';

export function registerRelatedCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'related <id>',
    'Find bookmarks related to a given bookmark by shared tags',
    (y) =>
      y
        .positional('id', {
          type: 'number',
          description: 'Bookmark ID to find related bookmarks for',
          demandOption: true,
        })
        .option('limit', {
          alias: 'l',
          type: 'number',
          description: 'Maximum number of related bookmarks to return',
          default: 10,
        })
        .option('json', {
          type: 'boolean',
          description: 'Output results as JSON',
          default: false,
        }),
    async (argv) => {
      const id = argv.id as number;
      const limit = argv.limit as number;

      const related = await findRelatedBookmarks(db, id, { limit });

      if (related.length === 0) {
        console.log(`No related bookmarks found for ID ${id}.`);
        return;
      }

      if (argv.json) {
        console.log(JSON.stringify(related, null, 2));
        return;
      }

      console.log(`Related bookmarks for ID ${id}:\n`);
      for (const bm of related) {
        const tags = (bm.tags ?? []).join(', ');
        console.log(`  [${bm.id}] ${bm.title}`);
        console.log(`       ${bm.url}`);
        if (tags) console.log(`       Tags: ${tags}`);
        console.log();
      }
    }
  );
}
