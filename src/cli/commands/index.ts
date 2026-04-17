import { Command } from 'commander';
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
import { registerStatsCommand } from './stats';
import { registerDuplicateCommand } from './duplicate';

export function registerAllCommands(program: Command, db: Database): void {
  registerAddCommand(program, db);
  registerSearchCommand(program, db);
  registerTagCommand(program, db);
  registerTagsCommand(program, db);
  registerDeleteCommand(program, db);
  registerOpenCommand(program, db);
  registerExportCommand(program, db);
  registerImportCommand(program, db);
  registerUpdateCommand(program, db);
  registerStatsCommand(program, db);
  registerDuplicateCommand(program, db);
}
