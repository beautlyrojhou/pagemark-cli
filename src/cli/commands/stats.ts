import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { getStats } from '../../db/bookmarks-stats';

export function registerStatsCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'stats',
    'Show bookmark statistics',
    (y) => y,
    () => {
      const stats = getStats(db);

      console.log('=== Pagemark Stats ===');
      console.log(`Total bookmarks : ${stats.totalBookmarks}`);
      console.log(`Total tags      : ${stats.totalTags}`);

      if (stats.mostUsedTags.length > 0) {
        console.log('\nTop tags:');
        for (const { tag, count } of stats.mostUsedTags) {
          console.log(`  ${tag.padEnd(20)} ${count}`);
        }
      }

      if (stats.recentBookmarks.length > 0) {
        console.log('\nRecent bookmarks:');
        for (const bm of stats.recentBookmarks) {
          const title = (bm.title || bm.url).slice(0, 50);
          console.log(`  [${bm.id}] ${title}`);
        }
      }

      if (stats.bookmarksPerDay.length > 0) {
        console.log('\nActivity (last 30 days):');
        for (const { date, count } of stats.bookmarksPerDay.slice(0, 7)) {
          console.log(`  ${date}  ${'█'.repeat(Math.min(count, 20))} ${count}`);
        }
      }
    }
  );
}
