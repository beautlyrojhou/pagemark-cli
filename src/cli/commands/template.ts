import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  createTemplate,
  listTemplates,
  deleteTemplate,
  getTemplateByName,
  applyTemplate,
} from '../../db/bookmarks-bookmark-template';
import { addBookmark } from '../../db/bookmarks';

export function registerTemplateCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'template <action>',
    'Manage bookmark templates',
    (y) =>
      y
        .positional('action', {
          choices: ['add', 'list', 'delete', 'apply'] as const,
          describe: 'Action to perform',
        })
        .option('name', { type: 'string', describe: 'Template name' })
        .option('url-pattern', { type: 'string', describe: 'URL pattern for the template' })
        .option('title-prefix', { type: 'string', describe: 'Default title prefix' })
        .option('tags', { type: 'string', describe: 'Comma-separated default tags' })
        .option('notes', { type: 'string', describe: 'Template notes' })
        .option('url', { type: 'string', describe: 'URL to apply template to' })
        .option('title', { type: 'string', describe: 'Override title when applying template' }),
    (argv) => {
      const action = argv.action as string;

      if (action === 'add') {
        if (!argv.name || !argv['url-pattern']) {
          console.error('--name and --url-pattern are required for add');
          process.exit(1);
        }
        const tags = argv.tags ? argv.tags.split(',').map((t: string) => t.trim()) : [];
        const t = createTemplate(db, argv.name, argv['url-pattern'], argv['title-prefix'], tags, argv.notes);
        console.log(`Template created: [${t.id}] ${t.name}`);
      } else if (action === 'list') {
        const templates = listTemplates(db);
        if (templates.length === 0) {
          console.log('No templates found.');
        } else {
          templates.forEach((t) =>
            console.log(`[${t.id}] ${t.name} | pattern: ${t.url_pattern} | tags: ${t.default_tags ?? ''}`)
          );
        }
      } else if (action === 'delete') {
        if (!argv.name) {
          console.error('--name is required for delete');
          process.exit(1);
        }
        const t = getTemplateByName(db, argv.name);
        if (!t) {
          console.error(`Template '${argv.name}' not found`);
          process.exit(1);
        }
        deleteTemplate(db, t.id);
        console.log(`Template '${argv.name}' deleted.`);
      } else if (action === 'apply') {
        if (!argv.name || !argv.url) {
          console.error('--name and --url are required for apply');
          process.exit(1);
        }
        const t = getTemplateByName(db, argv.name);
        if (!t) {
          console.error(`Template '${argv.name}' not found`);
          process.exit(1);
        }
        const { url, title, tags } = applyTemplate(db, t.id, argv.url, argv.title);
        const bookmark = addBookmark(db, url, title ?? url, tags);
        console.log(`Bookmark added from template: [${bookmark.id}] ${bookmark.title}`);
      }
    }
  );
}
