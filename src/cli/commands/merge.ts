import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import { mergeBookmarks, listMergeCandidates } from '../../db/bookmarks-bookmark-merge';

export function registerMergeCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'merge <subcommand>',
    'Merge duplicate or related bookmarks',
    (y) =>
      y
        .command(
          'run <sourceId> <targetId>',
          'Merge source bookmark into target bookmark',
          (sub) =>
            sub
              .positional('sourceId', { type: 'number', demandOption: true, describe: 'Bookmark ID to merge from (will be deleted)' })
              .positional('targetId', { type: 'number', demandOption: true, describe: 'Bookmark ID to merge into (will be kept)' })
              .option('dry-run', { type: 'boolean', default: false, describe: 'Preview merge without making changes' }),
          (args) => {
            if (args.dryRun) {
              console.log(`[dry-run] Would merge bookmark #${args.sourceId} into #${args.targetId}`);
              return;
            }
            const result = mergeBookmarks(db, args.sourceId as number, args.targetId as number);
            if (!result.success) {
              console.error(`Merge failed: ${result.error}`);
              process.exit(1);
            }
            console.log(`Merged bookmark #${args.sourceId} into #${args.targetId}. Tags and notes combined.`);
          }
        )
        .command(
          'candidates',
          'List pairs of bookmarks that are potential merge candidates (same URL or very similar title)',
          (sub) =>
            sub.option('limit', { type: 'number', default: 20, describe: 'Max number of candidate pairs to show' }),
          (args) => {
            const candidates = listMergeCandidates(db, args.limit as number);
            if (candidates.length === 0) {
              console.log('No merge candidates found.');
              return;
            }
            console.log(`Found ${candidates.length} candidate pair(s):\n`);
            for (const pair of candidates) {
              console.log(`  [#${pair.a.id}] ${pair.a.title ?? pair.a.url}`);
              console.log(`  [#${pair.b.id}] ${pair.b.title ?? pair.b.url}`);
              console.log(`  Reason: ${pair.reason}\n`);
            }
          }
        )
        .demandCommand(1, 'Specify a subcommand: run | candidates'),
    () => {}
  );
}
