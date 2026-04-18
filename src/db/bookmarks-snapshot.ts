import { Database } from 'better-sqlite3';

export interface Snapshot {
  id: number;
  bookmark_id: number;
  content: string;
  captured_at: string;
}

export function saveSnapshot(db: Database, bookmarkId: number, content: string): void {
  db.prepare(
    `INSERT INTO snapshots (bookmark_id, content, captured_at) VALUES (?, ?, datetime('now'))`
  ).run(bookmarkId, content);
}

export function getLatestSnapshot(db: Database, bookmarkId: number): Snapshot | undefined {
  return db.prepare(
    `SELECT * FROM snapshots WHERE bookmark_id = ? ORDER BY captured_at DESC LIMIT 1`
  ).get(bookmarkId) as Snapshot | undefined;
}

export function listSnapshots(db: Database, bookmarkId: number): Snapshot[] {
  return db.prepare(
    `SELECT * FROM snapshots WHERE bookmark_id = ? ORDER BY captured_at DESC`
  ).all(bookmarkId) as Snapshot[];
}

export function deleteSnapshot(db: Database, snapshotId: number): void {
  db.prepare(`DELETE FROM snapshots WHERE id = ?`).run(snapshotId);
}

export function clearSnapshots(db: Database, bookmarkId: number): void {
  db.prepare(`DELETE FROM snapshots WHERE bookmark_id = ?`).run(bookmarkId);
}
