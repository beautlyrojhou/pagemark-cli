import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  pruneExpiredShareLinks,
} from '../../db/bookmarks-share';

export function registerShareCommand(yargs: Argv, db: Database) {
  yargs.command(
    'share <subcommand>',
    'Manage shareable links for bookmarks',
    (y) =>
      y
        .command(
          'create <bookmarkId>',
          'Create a share link for a bookmark',
          (y) =>
            y
              .positional('bookmarkId', { type: 'number', demandOption: true })
              .option('expires', { alias: 'e', type: 'number', description: 'Expiry in days' }),
          (argv) => {
            const link = createShareLink(db, argv.bookmarkId as number, argv.expires as number | undefined);
            console.log(`Share token: ${link.token}`);
            if (link.expiresAt) console.log(`Expires at: ${link.expiresAt}`);
          }
        )
        .command(
          'list <bookmarkId>',
          'List share links for a bookmark',
          (y) => y.positional('bookmarkId', { type: 'number', demandOption: true }),
          (argv) => {
            const links = listShareLinks(db, argv.bookmarkId as number);
            if (links.length === 0) {
              console.log('No share links found.');
              return;
            }
            for (const l of links) {
              console.log(`[${l.id}] ${l.token} created=${l.createdAt} expires=${l.expiresAt ?? 'never'}`);
            }
          }
        )
        .command(
          'revoke <token>',
          'Revoke a share link by token',
          (y) => y.positional('token', { type: 'string', demandOption: true }),
          (argv) => {
            const ok = revokeShareLink(db, argv.token as string);
            console.log(ok ? 'Share link revoked.' : 'Token not found.');
          }
        )
        .command(
          'prune',
          'Remove all expired share links',
          () => {},
          () => {
            const count = pruneExpiredShareLinks(db);
            console.log(`Pruned ${count} expired share link(s).`);
          }
        )
        .demandCommand(1, 'Specify a share subcommand'),
    () => {}
  );
}
