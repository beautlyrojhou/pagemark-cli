import { Database } from 'better-sqlite3';
import { addBookmark } from './bookmarks';
import * as fs from 'fs';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function importFromJson(db: Database, filePath: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  const raw = fs.readFileSync(filePath, 'utf-8');
  let records: any[];
  try {
    records = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON file');
  }
  if (!Array.isArray(records)) throw new Error('JSON must be an array of bookmarks');
  for (const r of records) {
    if (!r.url) { result.skipped++; continue; }
    try {
      addBookmark(db, { url: r.url, title: r.title || '', tags: Array.isArray(r.tags) ? r.tags : [] });
      result.imported++;
    } catch (e: any) {
      result.errors.push(`${r.url}: ${e.message}`);
    }
  }
  return result;
}

export function importFromCsv(db: Database, filePath: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  const [header, ...rows] = lines;
  const cols = header.split(',').map(c => c.trim());
  const idx = (name: string) => cols.indexOf(name);
  for (const row of rows) {
    const vals = row.split(',').map(v => v.trim());
    const url = vals[idx('url')];
    if (!url) { result.skipped++; continue; }
    const title = vals[idx('title')] || '';
    const tagsRaw = vals[idx('tags')] || '';
    const tags = tagsRaw ? tagsRaw.split('|').map(t => t.trim()) : [];
    try {
      addBookmark(db, { url, title, tags });
      result.imported++;
    } catch (e: any) {
      result.errors.push(`${url}: ${e.message}`);
    }
  }
  return result;
}
