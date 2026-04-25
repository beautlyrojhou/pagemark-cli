import { Database } from 'better-sqlite3';

export interface BookmarkAlias {
  id: number;
  bookmarkId: number;
  alias: string;
  createdAt: string;
}

export function addAlias(db: Database, bookmarkId: number, alias: string): void {
  const existing = db.prepare('SELECT id FROM bookmark_aliases WHERE alias = ?').get(alias);
  if (existing) {
    throw new Error(`Alias '${alias}' is already in use.`);
  }
  db.prepare(
    'INSERT INTO bookmark_aliases (bookmark_id, alias, created_at) VALUES (?, ?, datetime(\'now\'))'
  ).run(bookmarkId, alias);
}

export function removeAlias(db: Database, alias: string): boolean {
  const result = db.prepare('DELETE FROM bookmark_aliases WHERE alias = ?').run(alias);
  return result.changes > 0;
}

export function getAliases(db: Database, bookmarkId: number): string[] {
  const rows = db
    .prepare('SELECT alias FROM bookmark_aliases WHERE bookmark_id = ? ORDER BY created_at ASC')
    .all(bookmarkId) as { alias: string }[];
  return rows.map((r) => r.alias);
}

export function resolveAlias(db: Database, alias: string): number | null {
  const row = db
    .prepare('SELECT bookmark_id FROM bookmark_aliases WHERE alias = ?')
    .get(alias) as { bookmark_id: number } | undefined;
  return row ? row.bookmark_id : null;
}

export function listAllAliases(db: Database): BookmarkAlias[] {
  return db
    .prepare(
      'SELECT id, bookmark_id as bookmarkId, alias, created_at as createdAt FROM bookmark_aliases ORDER BY alias ASC'
    )
    .all() as BookmarkAlias[];
}

export function clearAliases(db: Database, bookmarkId: number): number {
  const result = db
    .prepare('DELETE FROM bookmark_aliases WHERE bookmark_id = ?')
    .run(bookmarkId);
  return result.changes;
}
