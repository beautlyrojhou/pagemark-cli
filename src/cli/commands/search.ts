import { Command } from 'commander';
import { searchBookmarks, listByTag, getTagsForBookmark } from '../../db/bookmarks';
import { openDb } from '../../db/schema';

interface SearchResult {
  id: number;
  url: string;
  title: string;
  notes: string | null;
  created_at: string;
  tags?: string[];
}

async function printResults(results: SearchResult[], dbPath?: string): Promise<void> {
  if (results.length === 0) {
    console.log('No bookmarks found.');
    return;
  }

  const db = await openDb(dbPath);
  for (const bookmark of results) {
    const tags = await getTagsForBookmark(db, bookmark.id);
    console.log(`[${bookmark.id}] ${bookmark.title || '(no title)'}`);
    console.log(`    URL: ${bookmark.url}`);
    if (bookmark.notes) console.log(`    Notes: ${bookmark.notes}`);
    if (tags.length > 0) console.log(`    Tags: ${tags.join(', ')}`);
    console.log(`    Added: ${bookmark.created_at}`);
    console.log();
  }
  await db.close();
}

export function registerSearchCommand(program: Command, dbPath?: string): void {
  program
    .command('search <query>')
    .description('Full-text search across bookmarks')
    .option('-t, --tag <tag>', 'Filter results by tag')
    .action(async (query: string, options: { tag?: string }) => {
      try {
        const db = await openDb(dbPath);
        let results: SearchResult[];

        if (options.tag) {
          results = await listByTag(db, options.tag);
          const lq = query.toLowerCase();
          results = results.filter(
            (b) =>
              b.url.toLowerCase().includes(lq) ||
              (b.title && b.title.toLowerCase().includes(lq)) ||
              (b.notes && b.notes.toLowerCase().includes(lq))
          );
        } else {
          results = await searchBookmarks(db, query);
        }

        await db.close();
        await printResults(results, dbPath);
      } catch (err) {
        console.error('Error searching bookmarks:', (err as Error).message);
        process.exit(1);
      }
    });
}
