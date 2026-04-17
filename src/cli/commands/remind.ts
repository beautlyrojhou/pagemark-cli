import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { setReminder, getReminder, clearReminder, listDueReminders, listAllReminders } from '../../db/bookmarks-remind';
import { getBookmarkById } from '../../db/bookmarks';

export function registerRemindCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'remind <subcommand>',
    'Manage bookmark reminders',
    (y) =>
      y
        .command('set <id> <date> [note]', 'Set a reminder for a bookmark', (y) =>
          y
            .positional('id', { type: 'number', demandOption: true })
            .positional('date', { type: 'string', demandOption: true, describe: 'ISO date/time' })
            .positional('note', { type: 'string' })
        , (argv) => {
          const bm = getBookmarkById(db, argv.id as number);
          if (!bm) { console.error(`Bookmark ${argv.id} not found`); process.exit(1); }
          const dt = new Date(argv.date as string);
          if (isNaN(dt.getTime())) { console.error('Invalid date'); process.exit(1); }
          setReminder(db, argv.id as number, dt, argv.note as string | undefined);
          console.log(`Reminder set for bookmark ${argv.id} at ${dt.toISOString()}`);
        })
        .command('get <id>', 'Get reminder for a bookmark', (y) =>
          y.positional('id', { type: 'number', demandOption: true })
        , (argv) => {
          const r = getReminder(db, argv.id as number);
          if (!r) { console.log('No reminder set.'); return; }
          console.log(`Remind at: ${r.remind_at}${r.note ? '  Note: ' + r.note : ''}`);
        })
        .command('clear <id>', 'Clear reminder for a bookmark', (y) =>
          y.positional('id', { type: 'number', demandOption: true })
        , (argv) => {
          clearReminder(db, argv.id as number);
          console.log(`Reminder cleared for bookmark ${argv.id}`);
        })
        .command('due', 'List reminders that are due now', {}, () => {
          const due = listDueReminders(db);
          if (!due.length) { console.log('No reminders due.'); return; }
          due.forEach((r) => console.log(`[${r.bookmark_id}] ${r.remind_at}${r.note ? ' — ' + r.note : ''}`))
        })
        .command('list', 'List all reminders', {}, () => {
          const all = listAllReminders(db);
          if (!all.length) { console.log('No reminders.'); return; }
          all.forEach((r) => console.log(`[${r.bookmark_id}] ${r.remind_at}${r.note ? ' — ' + r.note : ''}`))
        })
        .demandCommand(1),
    () => {}
  );
}
