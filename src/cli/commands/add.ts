import { Command } from 'commander';
import { openDb, initSchema } from '../../db/schema';
import { addBookmark, getTagsForBookmark } from '../../db/bookmarks';

export function registerAddCommand(program: Command): void {
  program
    .command('add <url>')
    .description('Add a new bookmark')
    .option('-t, --title <title>', 'Title for the bookmark')
    .option('--tags <tags>', 'Comma-separated list of tags')
    .option('--notes <notes>', 'Optional notes')
    .action(async (url: string, options: { title?: string; tags?: string; notes?: string }) => {
      const db = await openDb();
      await initSchema(db);

      const tags = options.tags
        ? options.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      try {
        const id = await addBookmark(db, {
          url,
          title: options.title ?? url,
          notes: options.notes,
          tags,
        });

        const savedTags = await getTagsForBookmark(db, id);

        console.log(`✅ Bookmark added (id: ${id})`);
        console.log(`   URL   : ${url}`);
        console.log(`   Title : ${options.title ?? url}`);
        if (savedTags.length > 0) {
          console.log(`   Tags  : ${savedTags.join(', ')}`);
        }
        if (options.notes) {
          console.log(`   Notes : ${options.notes}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Failed to add bookmark: ${message}`);
        process.exit(1);
      } finally {
        await db.close();
      }
    });
}
