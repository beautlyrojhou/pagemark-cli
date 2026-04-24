import { Argv } from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { openDb } from '../../db/schema';
import { bulkExportBookmarks, listExportableTags } from '../../db/bookmarks-bulk-export';

export function registerBulkExportCommand(yargs: Argv, dbPath: string): Argv {
  return yargs.command(
    'bulk-export',
    'Export bookmarks in bulk with filtering options',
    (y) =>
      y
        .option('format', {
          alias: 'f',
          choices: ['json', 'csv'] as const,
          default: 'json' as const,
          description: 'Output format',
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          description: 'Output file path (defaults to stdout)',
        })
        .option('tags', {
          alias: 't',
          type: 'array',
          string: true,
          description: 'Filter by one or more tags',
        })
        .option('since', {
          type: 'string',
          description: 'Only export bookmarks created after this date (ISO format)',
        })
        .option('include-archived', {
          type: 'boolean',
          default: false,
          description: 'Include archived bookmarks',
        })
        .option('list-tags', {
          type: 'boolean',
          default: false,
          description: 'List all available tags and exit',
        }),
    (argv) => {
      const db = openDb(dbPath);

      if (argv['list-tags']) {
        const tags = listExportableTags(db);
        if (tags.length === 0) {
          console.log('No tags found.');
        } else {
          tags.forEach((t) => console.log(t));
        }
        return;
      }

      const result = bulkExportBookmarks(db, {
        format: argv.format,
        tags: argv.tags as string[] | undefined,
        since: argv.since,
        includeArchived: argv['include-archived'],
      });

      if (result.count === 0) {
        console.warn('No bookmarks matched the given filters.');
        return;
      }

      if (argv.output) {
        const outPath = path.resolve(argv.output);
        fs.writeFileSync(outPath, result.output, 'utf-8');
        console.log(`Exported ${result.count} bookmark(s) to ${outPath}`);
      } else {
        process.stdout.write(result.output + '\n');
        console.error(`Exported ${result.count} bookmark(s)`);
      }
    }
  );
}
