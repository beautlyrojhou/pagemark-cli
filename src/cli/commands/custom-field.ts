import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  setCustomField, getCustomField, getAllCustomFields,
  deleteCustomField, clearCustomFields
} from '../../db/bookmarks-custom-field';

export function registerCustomFieldCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'field <subcommand>',
    'Manage custom fields on bookmarks',
    (y) => y
      .command('set <id> <key> <value>', 'Set a custom field', (y) =>
        y.positional('id', { type: 'number', demandOption: true })
         .positional('key', { type: 'string', demandOption: true })
         .positional('value', { type: 'string', demandOption: true }),
        (argv) => {
          setCustomField(db, argv.id as number, argv.key as string, argv.value as string);
          console.log(`Set field "${argv.key}" on bookmark #${argv.id}`);
        }
      )
      .command('get <id> <key>', 'Get a custom field', (y) =>
        y.positional('id', { type: 'number', demandOption: true })
         .positional('key', { type: 'string', demandOption: true }),
        (argv) => {
          const val = getCustomField(db, argv.id as number, argv.key as string);
          if (val === null) console.log('Field not found.');
          else console.log(`${argv.key}: ${val}`);
        }
      )
      .command('list <id>', 'List all custom fields for a bookmark', (y) =>
        y.positional('id', { type: 'number', demandOption: true }),
        (argv) => {
          const fields = getAllCustomFields(db, argv.id as number);
          const entries = Object.entries(fields);
          if (entries.length === 0) console.log('No custom fields.');
          else entries.forEach(([k, v]) => console.log(`${k}: ${v}`));
        }
      )
      .command('delete <id> <key>', 'Delete a custom field', (y) =>
        y.positional('id', { type: 'number', demandOption: true })
         .positional('key', { type: 'string', demandOption: true }),
        (argv) => {
          const removed = deleteCustomField(db, argv.id as number, argv.key as string);
          console.log(removed ? `Deleted field "${argv.key}"` : 'Field not found.');
        }
      )
      .command('clear <id>', 'Clear all custom fields for a bookmark', (y) =>
        y.positional('id', { type: 'number', demandOption: true }),
        (argv) => {
          clearCustomFields(db, argv.id as number);
          console.log(`Cleared all custom fields for bookmark #${argv.id}`);
        }
      )
      .demandCommand(1, 'Specify a subcommand'),
    () => {}
  );
}
