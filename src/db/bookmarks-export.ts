import { Database } from 'better-sqlite3';
import { getTagsForBookmark } from './bookmarks';

export interface ExportedBookmark {
  id: number;
  url: string;
  title: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export function exportAllBookmarks(db: Database): ExportedBookmark[] {
  const rows = db
    .prepare('SELECT id, url, title, notes, created_at FROM bookmarks ORDER BY created_at DESC')
    .all() as { id: number; url: string; title: string | null; notes: string | null; created_at: string }[];

  return rows.map((row) => ({
    ...row,
    tags: getTagsForBookmark(db, row.id),
  }));
}

export function exportToJson(db: Database): string {
  return JSON.stringify(exportAllBookmarks(db), null, 2);
}

export function exportToCsv(db: Database): string {
  const bookmarks = exportAllBookmarks(db);
  const header = 'id,url,title,notes,tags,created_at';
  const rows = bookmarks.map((b) => {
    const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
    return [
      b.id,
      escape(b.url),
      escape(b.title),
      escape(b.notes),
      escape(b.tags.join(';')),
      escape(b.created_at),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
