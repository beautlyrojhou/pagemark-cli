import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { setNote, getNote, clearNote } from '../../db/bookmarks-notes';

export function registerNotesCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'notes <subcommand>',
    'Manage notes on bookmarks',
    (y) =n        .command(
          'set <id> <note>',
          'Set a note on a bookmark',
          (y) =>
            y
              .positional('id', { type: 'number', demandOption: true })
              .positional('note', { type: 'string', demandOption: true }),
          (argv) => {
            setNote(db, argv.id as number, argv.note as string);
            console.log(`Note set on bookmark #${argv.id}`);
          }
        )
        .command(
          'get <id>',
          'Get the note on a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            const note = getNote(db, argv.id as number);
            if (note) {
              console.log(note);
            } else {
              console.log('No note set.');
            }
          }
        )
        .command(
          'clear <id>',
          'Clear the note on a bookmark',
          (y) => y.positional('id', { type: 'number', demandOption: true }),
          (argv) => {
            clearNote(db, argv.id as number);
            console.log(`Note cleared on bookmark #${argv.id}`);
          }
        )
        .demandCommand(1, 'Specify a subcommand: set, get, clear'),
    () => {}
  );
}
