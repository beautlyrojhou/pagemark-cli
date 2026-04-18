import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { saveSnapshot, getLatestSnapshot, listSnapshots, clearSnapshots } from '../../db/bookmarks-snapshot';
import { getBookmarkById } from '../../db/bookmarks';

export function registerSnapshotCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'snapshot <action> <id> [content]',
    'Manage bookmark snapshots',
    (y) =>
      y
        .positional('action', { type: 'string', choices: ['save', 'latest', 'list', 'clear'], demandOption: true })
        .positional('id', { type: 'number', demandOption: true })
        .positional('content', { type: 'string' }),
    (argv) => {
      const id = argv.id as number;
      const bookmark = getBookmarkById(db, id);
      if (!bookmark) {
        console.error(`Bookmark ${id} not found.`);
        process.exit(1);
      }

      switch (argv.action) {
        case 'save': {
          const content = argv.content as string | undefined;
          if (!content) {
            console.error('Content is required for save.');
            process.exit(1);
          }
          saveSnapshot(db, id, content);
          console.log(`Snapshot saved for bookmark ${id}.`);
          break;
        }
        case 'latest': {
          const snap = getLatestSnapshot(db, id);
          if (!snap) { console.log('No snapshots found.'); break; }
          console.log(`[${snap.captured_at}] ${snap.content}`);
          break;
        }
        case 'list': {
          const snaps = listSnapshots(db, id);
          if (!snaps.length) { console.log('No snapshots found.'); break; }
          snaps.forEach((s) => console.log(`#${s.id} [${s.captured_at}] ${s.content}`));
          break;
        }
        case 'clear': {
          clearSnapshots(db, id);
          console.log(`All snapshots cleared for bookmark ${id}.`);
          break;
        }
      }
    }
  );
}
