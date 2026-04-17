import { Database } from 'better-sqlite3';

export interface BookmarkStats {
  totalBookmarks: number;
  totalTags: number;
  mostUsedTags: { tag: string; count: number }[];
  recentBookmarks: { id: number; url: string; title: string; createdAt: string }[];
  bookmarksPerDay: { date: string; count: number }[];
}

export function getStats(db: Database): BookmarkStats {
  const totalBookmarks = (db.prepare('SELECT COUNT(*) as count FROM bookmarks').get() as { count: number }).count;

  const totalTags = (db.prepare('SELECT COUNT(DISTINCT tag) as count FROM bookmark_tags').get() as { count: number }).count;

  const mostUsedTags = db.prepare(
    `SELECT tag, COUNT(*) as count FROM bookmark_tags GROUP BY tag ORDER BY count DESC LIMIT 10`
  ).all() as { tag: string; count: number }[];

  const recentBookmarks = db.prepare(
    `SELECT id, url, title, created_at as createdAt FROM bookmarks ORDER BY created_at DESC LIMIT 5`
  ).all() as { id: number; url: string; title: string; createdAt: string }[];

  const bookmarksPerDay = db.prepare(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM bookmarks
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT 30`
  ).all() as { date: string; count: number }[];

  return { totalBookmarks, totalTags, mostUsedTags, recentBookmarks, bookmarksPerDay };
}
