import { Database } from 'better-sqlite3';

export interface RelatedBookmark {
  id: number;
  url: string;
  title: string;
  sharedTags: string[];
  score: number;
}

/**
 * Find bookmarks related to a given bookmark based on shared tags.
 * Bookmarks sharing more tags rank higher.
 */
export function findRelatedBookmarks(
  db: Database,
  bookmarkId: number,
  limit = 5
): RelatedBookmark[] {
  const tags: { name: string }[] = db
    .prepare(
      `SELECT t.name FROM tags t
       JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE bt.bookmark_id = ?`
    )
    .all(bookmarkId) as { name: string }[];

  if (tags.length === 0) return [];

  const tagNames = tags.map((t) => t.name);
  const placeholders = tagNames.map(() => '?').join(', ');

  const rows: { id: number; url: string; title: string; tag_name: string }[] = db
    .prepare(
      `SELECT b.id, b.url, b.title, t.name AS tag_name
       FROM bookmarks b
       JOIN bookmark_tags bt ON bt.bookmark_id = b.id
       JOIN tags t ON t.id = bt.tag_id
       WHERE t.name IN (${placeholders})
         AND b.id != ?
       ORDER BY b.id`
    )
    .all(...tagNames, bookmarkId) as { id: number; url: string; title: string; tag_name: string }[];

  const map = new Map<number, RelatedBookmark>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, { id: row.id, url: row.url, title: row.title, sharedTags: [], score: 0 });
    }
    const entry = map.get(row.id)!;
    entry.sharedTags.push(row.tag_name);
    entry.score += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get IDs of bookmarks that are related to a given bookmark (convenience wrapper).
 */
export function getRelatedIds(db: Database, bookmarkId: number, limit = 5): number[] {
  return findRelatedBookmarks(db, bookmarkId, limit).map((b) => b.id);
}
