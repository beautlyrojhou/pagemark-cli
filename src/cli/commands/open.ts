import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { getBookmarkById } from '../../db/bookmarks';
import { exec } from 'child_process';
import { platform } from 'os';

function openUrl(url: string): void {
  const cmd =
    platform() === 'darwin' ? 'open' :
    platform() === 'win32' ? 'start' :
    'xdg-open';
  exec(`${cmd} "${url}"`);
}

export function registerOpenCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'open <id>',
    'Open a bookmark URL in the default browser',
    (y) =>
      y.positional('id', {
        describe: 'Bookmark ID to open',
        type: 'number',
        demandOption: true,
      }),
    (argv) => {
      const id = argv.id as number;
      const bookmark = getBookmarkById(db, id);
      if (!bookmark) {
        console.error(`Bookmark with ID ${id} not found.`);
        process.exitCode = 1;
        return;
      }
      console.log(`Opening: ${bookmark.url}`);
      openUrl(bookmark.url);
    }
  );
}
