import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  listBrokenLinks,
  checkAllLinks,
  clearBrokenStatus,
} from '../../db/bookmarks-broken-link';

export function registerBrokenLinkCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'broken-link <action>',
    'Check and manage broken bookmark links',
    (y) =>
      y
        .positional('action', {
          choices: ['list', 'check', 'clear'] as const,
          describe: 'Action to perform',
        })
        .option('id', {
          type: 'number',
          describe: 'Bookmark ID (required for clear)',
        }),
    async (argv) => {
      const action = argv.action as string;

      if (action === 'list') {
        const broken = listBrokenLinks(db);
        if (broken.length === 0) {
          console.log('No broken links found.');
          return;
        }
        console.log(`Found ${broken.length} broken link(s):\n`);
        for (const b of broken) {
          const status = b.statusCode === 0 ? 'unreachable' : `HTTP ${b.statusCode}`;
          console.log(`  [${b.id}] ${b.title}`);
          console.log(`       ${b.url}`);
          console.log(`       Status: ${status}  Checked: ${b.checkedAt}`);
        }
        return;
      }

      if (action === 'check') {
        console.log('Checking all bookmark URLs (this may take a while)...');
        const broken = await checkAllLinks(db);
        if (broken.length === 0) {
          console.log('All links appear to be reachable.');
        } else {
          console.log(`\nFound ${broken.length} broken link(s).`);
          console.log('Run `broken-link list` to see details.');
        }
        return;
      }

      if (action === 'clear') {
        const id = argv.id;
        if (!id) {
          console.error('Error: --id is required for the clear action.');
          process.exit(1);
        }
        clearBrokenStatus(db, id);
        console.log(`Cleared broken status for bookmark ${id}.`);
        return;
      }
    }
  );
}
