import { Argv } from 'yargs';
import { Database } from 'better-sqlite3';
import {
  createCollection, deleteCollection, listCollections,
  addToCollection, removeFromCollection, listCollectionBookmarks, getCollectionByName
} from '../../db/bookmarks-collection';
import { getBookmarkById } from '../../db/bookmarks';

export function registerCollectionCommand(yargs: Argv, db: Database) {
  yargs.command('collection <action>', 'Manage bookmark collections', (y) => {
    y.positional('action', { choices: ['create', 'delete', 'list', 'add', 'remove', 'show'] as const });
    y.option('name', { type: 'string', description: 'Collection name' });
    y.option('id', { type: 'number', description: 'Bookmark ID' });
  }, (argv) => {
    const action = argv.action as string;
    const name = argv.name as string | undefined;
    const bookmarkId = argv.id as number | undefined;

    if (action === 'create') {
      if (!name) { console.error('--name required'); process.exit(1); }
      const id = createCollection(db, name);
      console.log(`Collection "${name}" created (id: ${id})`);

    } else if (action === 'delete') {
      if (!name) { console.error('--name required'); process.exit(1); }
      const col = getCollectionByName(db, name);
      if (!col) { console.error(`Collection "${name}" not found`); process.exit(1); }
      deleteCollection(db, col.id);
      console.log(`Collection "${name}" deleted`);

    } else if (action === 'list') {
      const cols = listCollections(db);
      if (!cols.length) { console.log('No collections found.'); return; }
      cols.forEach(c => console.log(`[${c.id}] ${c.name} (${c.count} bookmarks)`));

    } else if (action === 'add') {
      if (!name || !bookmarkId) { console.error('--name and --id required'); process.exit(1); }
      const col = getCollectionByName(db, name);
      if (!col) { console.error(`Collection "${name}" not found`); process.exit(1); }
      addToCollection(db, col.id, bookmarkId);
      console.log(`Bookmark ${bookmarkId} added to "${name}"`);

    } else if (action === 'remove') {
      if (!name || !bookmarkId) { console.error('--name and --id required'); process.exit(1); }
      const col = getCollectionByName(db, name);
      if (!col) { console.error(`Collection "${name}" not found`); process.exit(1); }
      removeFromCollection(db, col.id, bookmarkId);
      console.log(`Bookmark ${bookmarkId} removed from "${name}"`);

    } else if (action === 'show') {
      if (!name) { console.error('--name required'); process.exit(1); }
      const col = getCollectionByName(db, name);
      if (!col) { console.error(`Collection "${name}" not found`); process.exit(1); }
      const items = listCollectionBookmarks(db, col.id);
      if (!items.length) { console.log('No bookmarks in this collection.'); return; }
      items.forEach(b => console.log(`[${b.id}] ${b.title} — ${b.url}`));
    }
  });
}
