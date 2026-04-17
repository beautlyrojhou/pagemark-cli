import { Command } from 'commander';
import { Database } from 'better-sqlite3';
import {
  archiveBookmark,
  unarchiveBookmark,
  listArchivedBookmarks,
  purgeArchivedBookmarks,
} from '../../db/bookmarks-archive';

export function registerArchiveCommand(program: Command, db: Database): void {
  const archive = program
    .command('archive')
    .description('Manage archived bookmarks');

  archive
    .command('add <id>')
    .description('Archive a bookmark by ID')
    .action((id: string) => {
      const changed = archiveBookmark(db, Number(id));
      if (changed) {
        console.log(`Bookmark ${id} archived.`);
      } else {
        console.error(`Bookmark ${id} not found or already archived.`);
        process.exitCode = 1;
      }
    });

  archive
    .command('restore <id>')
    .description('Unarchive a bookmark by ID')
    .action((id: string) => {
      const changed = unarchiveBookmark(db, Number(id));
      if (changed) {
        console.log(`Bookmark ${id} restored.`);
      } else {
        console.error(`Bookmark ${id} not found or not archived.`);
        process.exitCode = 1;
      }
    });

  archive
    .command('list')
    .description('List all archived bookmarks')
    .action(() => {
      const rows = listArchivedBookmarks(db);
      if (rows.length === 0) {
        console.log('No archived bookmarks.');
        return;
      }
      for (const b of rows) {
        console.log(`[${b.id}] ${b.title ?? '(no title)'} — ${b.url}`);
      }
    });

  archive
    .command('purge')
    .description('Permanently delete all archived bookmarks')
    .action(() => {
      const count = purgeArchivedBookmarks(db);
      console.log(`Purged ${count} archived bookmark(s).`);
    });
}
