import { Argv } from "yargs";
import { Database } from "better-sqlite3";
import { pinBookmark, unpinBookmark, listPinnedBookmarks } from "../../db/bookmarks-pin";

export function registerPinCommand(yargs: Argv, db: Database): Argv {
  return yargs
    .command(
      "pin <id>",
      "Pin a bookmark",
      (y) =>
        y.positional("id", { type: "number", demandOption: true, describe: "Bookmark ID" }),
      (argv) => {
        const result = pinBookmark(db, argv.id as number);
        if (result) {
          console.log(`Pinned bookmark #${argv.id}`);
        } else {
          console.error(`Bookmark #${argv.id} not found`);
          process.exit(1);
        }
      }
    )
    .command(
      "unpin <id>",
      "Unpin a bookmark",
      (y) =>
        y.positional("id", { type: "number", demandOption: true, describe: "Bookmark ID" }),
      (argv) => {
        const result = unpinBookmark(db, argv.id as number);
        if (result) {
          console.log(`Unpinned bookmark #${argv.id}`);
        } else {
          console.error(`Bookmark #${argv.id} not found`);
          process.exit(1);
        }
      }
    )
    .command(
      "pinned",
      "List all pinned bookmarks",
      () => {},
      () => {
        const bookmarks = listPinnedBookmarks(db);
        if (bookmarks.length === 0) {
          console.log("No pinned bookmarks.");
          return;
        }
        for (const b of bookmarks) {
          console.log(`[${b.id}] ${b.title} — ${b.url}`);
          if (b.tags) console.log(`    Tags: ${b.tags}`);
        }
      }
    );
}
