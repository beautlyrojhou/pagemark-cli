import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { registerAddCommand } from './add';
import { registerSearchCommand } from './search';
import { registerTagCommand } from './tag';
import { registerTagsCommand } from './tags';

export function registerAllCommands(yargs: Argv, db: Database): Argv {
  let y = yargs;
  y = registerAddCommand(y, db);
  y = registerSearchCommand(y, db);
  y = registerTagCommand(y, db);
  y = registerTagsCommand(y, db);
  return y;
}
