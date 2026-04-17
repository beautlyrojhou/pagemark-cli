import { Database } from 'better-sqlite3';
import { addBookmark, getBookmarkById } from './bookmarks';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: number;
  existingTitle?: string;
}

export function checkDuplicate(db: Database, url: string): DuplicateCheckResult {
  const row = db
    .prepare('SELECT id, title FROM bookmarks WHERE url = ?')
    .get(url) as { id: number; title: string } | undefined;

  if (row) {
    return { isDuplicate: true, existingId: row.id, existingTitle: row.title };
  }
  return { isDuplicate: false };
}

export function findDuplicates(db: Database): Array<{ url: string; ids: number[]; titles: string[] }> {
  const rows = db
    .prepare(
      `SELECT url, GROUP_CONCAT(id) as ids, GROUP_CONCAT(title, '||') as titles
       FROM bookmarks
       GROUP BY url
       HAVING COUNT(*) > 1`
    )
    .all() as Array<{ url: string; ids: string; titles: string }>;

  return rows.map((row) => ({
    url: row.url,
    ids: row.ids.split(',').map(Number),
    titles: row.titles.split('||'),
  }));
}

export function deduplicateBookmarks(db: Database): number {
  const duplicates = findDuplicates(db);
  let removed = 0;

  for (const group of duplicates) {
    // Keep the first (lowest id), delete the rest
    const toDelete = group.ids.slice(1);
    for (const id of toDelete) {
      db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(id);
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
      removed++;
    }
  }

  return removed;
}
