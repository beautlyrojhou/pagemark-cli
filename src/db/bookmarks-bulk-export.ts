import { Database } from 'better-sqlite3';
import { exportToJson, exportToCsv } from './bookmarks-export';
import { getAllTags } from './tags';

export interface BulkExportOptions {
  tags?: string[];
  since?: string; // ISO date string
  format: 'json' | 'csv';
  includeArchived?: boolean;
  includePinned?: boolean;
}

export interface BulkExportResult {
  count: number;
  output: string;
  format: 'json' | 'csv';
}

export function bulkExportBookmarks(
  db: Database,
  options: BulkExportOptions
): BulkExportResult {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!options.includeArchived) {
    conditions.push('b.archived = 0');
  }

  if (options.since) {
    conditions.push('b.created_at >= ?');
    params.push(options.since);
  }

  if (options.tags && options.tags.length > 0) {
    const placeholders = options.tags.map(() => '?').join(', ');
    conditions.push(
      `b.id IN (SELECT bookmark_id FROM bookmark_tags bt JOIN tags t ON bt.tag_id = t.id WHERE t.name IN (${placeholders}))`
    );
    params.push(...options.tags);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT b.* FROM bookmarks b ${where} ORDER BY b.created_at DESC`)
    .all(...params) as Array<Record<string, unknown>>;

  const ids = rows.map((r) => r.id as number);

  if (ids.length === 0) {
    return { count: 0, output: options.format === 'json' ? '[]' : '', format: options.format };
  }

  const output =
    options.format === 'json'
      ? exportToJson(db, ids)
      : exportToCsv(db, ids);

  return { count: ids.length, output, format: options.format };
}

export function listExportableTags(db: Database): string[] {
  return getAllTags(db).map((t) => t.name);
}
