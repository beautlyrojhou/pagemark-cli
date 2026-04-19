import { Command } from 'commander';
import { Database } from 'better-sqlite3';
import {
  addHighlight,
  listHighlights,
  deleteHighlight,
  clearHighlights,
  searchHighlights,
} from '../../db/bookmarks-highlight';

export function registerHighlightCommand(program: Command, db: Database) {
  const highlight = program
    .command('highlight')
    .description('Manage highlights for bookmarks');

  highlight
    .command('add <bookmarkId> <text>')
    .description('Add a highlight to a bookmark')
    .option('-n, --note <note>', 'Optional note for the highlight')
    .action((bookmarkId, text, opts) => {
      const id = addHighlight(db, Number(bookmarkId), text, opts.note);
      console.log(`Highlight added with id ${id}`);
    });

  highlight
    .command('list <bookmarkId>')
    .description('List highlights for a bookmark')
    .action((bookmarkId) => {
      const rows = listHighlights(db, Number(bookmarkId));
      if (rows.length === 0) {
        console.log('No highlights found.');
        return;
      }
      for (const row of rows) {
        console.log(`[${row.id}] "${row.text}"${row.note ? ' — ' + row.note : ''}`);
      }
    });

  highlight
    .command('delete <highlightId>')
    .description('Delete a highlight by id')
    .action((highlightId) => {
      deleteHighlight(db, Number(highlightId));
      console.log(`Highlight ${highlightId} deleted.`);
    });

  highlight
    .command('clear <bookmarkId>')
    .description('Clear all highlights for a bookmark')
    .action((bookmarkId) => {
      clearHighlights(db, Number(bookmarkId));
      console.log(`All highlights cleared for bookmark ${bookmarkId}.`);
    });

  highlight
    .command('search <query>')
    .description('Search highlights by text')
    .action((query) => {
      const rows = searchHighlights(db, query);
      if (rows.length === 0) {
        console.log('No highlights matched.');
        return;
      }
      for (const row of rows) {
        console.log(`[bookmark:${row.bookmarkId}] [highlight:${row.id}] "${row.text}"`);
      }
    });
}
