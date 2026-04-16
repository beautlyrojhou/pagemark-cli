import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import { importFromJson, importFromCsv } from '../../db/bookmarks-import';
import * as path from 'path';

export function registerImportCommand(yargs: Argv, db: Database) {
  yargs.command(
    'import <file>',
    'Import bookmarks from a JSON or CSV file',
    (y) =>
      y
        .positional('file', { type: 'string', description: 'Path to import file', demandOption: true })
        .option('format', {
          alias: 'f',
          type: 'string',
          choices: ['json', 'csv'] as const,
          description: 'File format (default: inferred from extension)',
        }),
    (argv) => {
      const file = argv.file as string;
      const ext = path.extname(file).toLowerCase().slice(1);
      const format = (argv.format as string | undefined) || ext;

      let result;
      try {
        if (format === 'csv') {
          result = importFromCsv(db, file);
        } else if (format === 'json') {
          result = importFromJson(db, file);
        } else {
          console.error(`Unknown format: ${format}. Use --format json or --format csv`);
          process.exit(1);
        }
      } catch (e: any) {
        console.error(`Import failed: ${e.message}`);
        process.exit(1);
      }

      console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
      if (result.errors.length) {
        console.warn('Errors:');
        result.errors.forEach(e => console.warn(' ', e));
      }
    }
  );
}
