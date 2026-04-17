import { Command } from 'commander';
import { Database } from 'better-sqlite3';
import { findDuplicates, deduplicateBookmarks } from '../../db/bookmarks-duplicate';

export function registerDuplicateCommand(program: Command, db: Database): void {
  const cmd = program.command('duplicates');

  cmd
    .command('list')
    .description('List all duplicate bookmarks by URL')
    .action(() => {
      const groups = findDuplicates(db);
      if (groups.length === 0) {
        console.log('No duplicates found.');
        return;
      }
      for (const group of groups) {
        console.log(`\nURL: ${group.url}`);
        for (const bm of group.bookmarks) {
          console.log(`  [${bm.id}] ${bm.title || '(no title)'} | tags: ${bm.tags || ''} | added: ${bm.created_at}`);
        }
      }
    });

  cmd
    .command('clean')
    .description('Remove duplicate bookmarks, keeping the oldest entry per URL')
    .option('--dry-run', 'Show what would be removed without deleting')
    .action((opts) => {
      const groups = findDuplicates(db);
      if (groups.length === 0) {
        console.log('No duplicates found.');
        return;
      }
      if (opts.dryRun) {
        let total = 0;
        for (const group of groups) {
          const toRemove = group.bookmarks.slice(1);
          total += toRemove.length;
          for (const bm of toRemove) {
            console.log(`Would remove [${bm.id}] ${bm.title || bm.url}`);
          }
        }
        console.log(`\n${total} bookmark(s) would be removed.`);
      } else {
        const removed = deduplicateBookmarks(db);
        console.log(`Removed ${removed} duplicate bookmark(s).`);
      }
    });
}
