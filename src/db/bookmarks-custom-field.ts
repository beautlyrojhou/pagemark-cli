import { Database } from 'better-sqlite3';

export interface CustomField {
  id: number;
  bookmarkId: number;
  key: string;
  value: string;
  createdAt: string;
}

export function setCustomField(db: Database, bookmarkId: number, key: string, value: string): void {
  db.prepare(`
    INSERT INTO bookmark_custom_fields (bookmark_id, key, value)
    VALUES (?, ?, ?)
    ON CONFLICT(bookmark_id, key) DO UPDATE SET value = excluded.value
  `).run(bookmarkId, key, value);
}

export function getCustomField(db: Database, bookmarkId: number, key: string): string | null {
  const row = db.prepare(
    'SELECT value FROM bookmark_custom_fields WHERE bookmark_id = ? AND key = ?'
  ).get(bookmarkId, key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function getAllCustomFields(db: Database, bookmarkId: number): Record<string, string> {
  const rows = db.prepare(
    'SELECT key, value FROM bookmark_custom_fields WHERE bookmark_id = ?'
  ).all(bookmarkId) as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export function deleteCustomField(db: Database, bookmarkId: number, key: string): boolean {
  const result = db.prepare(
    'DELETE FROM bookmark_custom_fields WHERE bookmark_id = ? AND key = ?'
  ).run(bookmarkId, key);
  return result.changes > 0;
}

export function clearCustomFields(db: Database, bookmarkId: number): void {
  db.prepare('DELETE FROM bookmark_custom_fields WHERE bookmark_id = ?').run(bookmarkId);
}

export function listByCustomField(db: Database, key: string, value?: string): number[] {
  if (value !== undefined) {
    const rows = db.prepare(
      'SELECT bookmark_id FROM bookmark_custom_fields WHERE key = ? AND value = ?'
    ).all(key, value) as { bookmark_id: number }[];
    return rows.map(r => r.bookmark_id);
  }
  const rows = db.prepare(
    'SELECT bookmark_id FROM bookmark_custom_fields WHERE key = ?'
  ).all(key) as { bookmark_id: number }[];
  return rows.map(r => r.bookmark_id);
}
