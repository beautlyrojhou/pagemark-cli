import { Database } from 'better-sqlite3';
import { addBookmark } from './bookmarks';
import { deleteBookmark } from './bookmarks-delete';
import { updateBookmark } from './bookmarks-update';

export interface BatchAddItem {
  url: string;
  title: string;
  tags?: string[];
  notes?: string;
}

export interface BatchDeleteItem {
  id: number;
}

export interface BatchUpdateItem {
  id: number;
  url?: string;
  title?: string;
  tags?: string[];
}

export interface BatchResult {
  succeeded: number;
  failed: number;
  errors: { index: number; message: string }[];
}

export function batchAddBookmarks(db: Database, items: BatchAddItem[]): BatchResult {
  const result: BatchResult = { succeeded: 0, failed: 0, errors: [] };
  for (let i = 0; i < items.length; i++) {
    try {
      addBookmark(db, items[i].url, items[i].title, items[i].tags ?? [], items[i].notes);
      result.succeeded++;
    } catch (err: any) {
      result.failed++;
      result.errors.push({ index: i, message: err.message ?? String(err) });
    }
  }
  return result;
}

export function batchDeleteBookmarks(db: Database, items: BatchDeleteItem[]): BatchResult {
  const result: BatchResult = { succeeded: 0, failed: 0, errors: [] };
  for (let i = 0; i < items.length; i++) {
    try {
      const deleted = deleteBookmark(db, items[i].id);
      if (!deleted) throw new Error(`Bookmark ${items[i].id} not found`);
      result.succeeded++;
    } catch (err: any) {
      result.failed++;
      result.errors.push({ index: i, message: err.message ?? String(err) });
    }
  }
  return result;
}

export function batchUpdateBookmarks(db: Database, items: BatchUpdateItem[]): BatchResult {
  const result: BatchResult = { succeeded: 0, failed: 0, errors: [] };
  for (let i = 0; i < items.length; i++) {
    try {
      const updated = updateBookmark(db, items[i].id, {
        url: items[i].url,
        title: items[i].title,
        tags: items[i].tags,
      });
      if (!updated) throw new Error(`Bookmark ${items[i].id} not found`);
      result.succeeded++;
    } catch (err: any) {
      result.failed++;
      result.errors.push({ index: i, message: err.message ?? String(err) });
    }
  }
  return result;
}
