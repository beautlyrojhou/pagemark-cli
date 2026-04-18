import type { Argv } from 'yargs';
import type { Database } from 'better-sqlite3';
import { setRating, clearRating, getRating, listByRating, listRated } from '../../db/bookmarks-rating';

export function registerRatingCommand(yargs: Argv, db: Database): Argv {
  return yargs.command(
    'rating <subcommand>',
    'Manage bookmark ratings',
    (y) =>
      y
        .command('set <id> <stars>', 'Set rating (1-5) for a bookmark', (y2) =>
          y2
            .positional('id', { type: 'number', demandOption: true })
            .positional('stars', { type: 'number', demandOption: true })
        )
        .command('clear <id>', 'Clear rating for a bookmark', (y2) =>
          y2.positional('id', { type: 'number', demandOption: true })
        )
        .command('get <id>', 'Get rating for a bookmark', (y2) =>
          y2.positional('id', { type: 'number', demandOption: true })
        )
        .command('list', 'List all rated bookmarks', (y2) =>
          y2.option('min', { type: 'number', description: 'Minimum stars', default: 1 })
        )
        .demandCommand(1, 'Specify a subcommand'),
    (argv) => {
      const sub = argv._[1] as string;
      if (sub === 'set') {
        const stars = argv.stars as number;
        if (stars < 1 || stars > 5) {
          console.error('Stars must be between 1 and 5');
          process.exit(1);
        }
        setRating(db, argv.id as number, stars);
        console.log(`Rating set to ${stars} star(s).`);
      } else if (sub === 'clear') {
        clearRating(db, argv.id as number);
        console.log('Rating cleared.');
      } else if (sub === 'get') {
        const rating = getRating(db, argv.id as number);
        if (rating === null) {
          console.log('No rating set.');
        } else {
          console.log(`Rating: ${rating} star(s).`);
        }
      } else if (sub === 'list') {
        const min = (argv.min as number) ?? 1;
        const rows = listByRating(db, min);
        if (rows.length === 0) {
          console.log('No rated bookmarks found.');
        } else {
          rows.forEach((b: any) => console.log(`[${b.rating}★] (${b.id}) ${b.title} — ${b.url}`));
        }
      }
    }
  );
}
