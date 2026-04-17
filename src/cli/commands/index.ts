import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { registerAddCommand } from './add';
import { registerSearchCommand } from './search';
import { registerTagCommand } from './tag';
import { registerTagsCommand } from './tags';
import { registerDeleteCommand } from './delete';
import { registerOpenCommand } from './open';
import { registerExportCommand } from './export';
import { registerImportCommand } from './import';
import { registerUpdateCommand } from './update';

export function registerAllCommands(yargs: Argv, db: Database) {
  registerAddCommand(yargs, db);
  registerSearchCommand(yargs, db);
  registerTagCommand(yargs, db);
  registerTagsCommand(yargs, db);
  registerDeleteCommand(yargs, db);
  registerOpenCommand(yargs, db);
  registerExportCommand(yargs, db);
  registerImportCommand(yargs, db);
  registerUpdateCommand(yargs, db);
}
