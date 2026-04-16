import type { Argv } from 'yargs';
import { writeFileSync } from 'fs';
import { openDb, initSchema } from '../../db/schema';
import { exportToJson, exportToCsv } from '../../db/bookmarks-export';

export function registerExportCommand(yargs: Argv, dbPath: string) {
  yargs.command(
    'export',
    'Export bookmarks to JSON or CSV',
    (y) =>
      y
        .option('format', {
          alias: 'f',
          choices: ['json', 'csv'] as const,
          default: 'json' as 'json' | 'csv',
          description: 'Output format',
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output file path (defaults to stdout)',
        }),
    (argv) => {
      const db = openDb(dbPath);
      initSchema(db);

      const content =
        argv.format === 'csv' ? exportToCsv(db) : exportToJson(db);

      if (argv.output) {
        writeFileSync(argv.output, content, 'utf-8');
        console.log(`Exported bookmarks to ${argv.output}`);
      } else {
        process.stdout.write(content + '\n');
      }
    }
  );
}
