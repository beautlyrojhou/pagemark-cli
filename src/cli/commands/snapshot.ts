import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import {
  saveSnapshot,
  getLatestSnapshot,
  listSnapshots,
  deleteSnapshot,
  clearSnapshots,
} from '../../db/bookmarks-snapshot';

export function registerSnapshotCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'snapshot <subcommand>',
    'Manage page snapshots for bookmarks',
    (y) =>
      y
        .command(
          'save <id> <content>',
          'Save a snapshot for a bookmark',
          (y) =>
            y
              .positional('id', { type: 'number', demandOption: true })
              .positional('content', { type: 'string', demandOption: true })
              .option('mime', { type: 'string', default: 'text/html' }),
          (argv) => {
            saveSnapshot(db, argv.id as number, argv.content as string, argv.mime as string);
            console.log('Snapshot saved.');
          }
        )
        .command(
          'latest <id>',
          'Show the latest snapshot for a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            const snap = getLatestSnapshot(db, argv.id as number);
            if (!snap) { console.log('No snapshot found.'); return; }
            console.log(`[${snap.id}] ${snap.created_at} (${snap.mime_type})\n${snap.content}`);
          }
        )
        .command(
          'list <id>',
          'List all snapshots for a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            const snaps = listSnapshots(db, argv.id as number);
            if (!snaps.length) { console.log('No snapshots.'); return; }
            snaps.forEach((s) => console.log(`[${s.id}] ${s.created_at} (${s.mime_type})`));
          }
        )
        .command(
          'delete <snapshotId>',
          'Delete a specific snapshot by ID',
          (y) => y.positional('snapshotId', { type: 'number', demandOption: true }),
          (argv) => {
            deleteSnapshot(db, argv.snapshotId as number);
            console.log('Snapshot deleted.');
          }
        )
        .command(
          'clear <id>',
          'Clear all snapshots for a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            clearSnapshots(db, argv.id as number);
            console.log('All snapshots cleared.');
          }
        ),
    () => {}
  );
}
