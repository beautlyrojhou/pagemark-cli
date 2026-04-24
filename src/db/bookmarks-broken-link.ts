import { Database } from 'better-sqlite3';

export interface BrokenLinkResult {
  id: number;
  url: string;
  title: string;
  statusCode: number | null;
  checkedAt: string;
}

export function markBrokenLink(
  db: Database,
  bookmarkId: number,
  statusCode: number
): void {
  db.prepare(
    `UPDATE bookmarks SET broken_status = ?, broken_checked_at = datetime('now') WHERE id = ?`
  ).run(statusCode, bookmarkId);
}

export function clearBrokenStatus(db: Database, bookmarkId: number): void {
  db.prepare(
    `UPDATE bookmarks SET broken_status = NULL, broken_checked_at = NULL WHERE id = ?`
  ).run(bookmarkId);
}

export function listBrokenLinks(db: Database): BrokenLinkResult[] {
  return db
    .prepare(
      `SELECT id, url, title, broken_status AS statusCode, broken_checked_at AS checkedAt
       FROM bookmarks
       WHERE broken_status IS NOT NULL AND broken_status >= 400
       ORDER BY broken_checked_at DESC`
    )
    .all() as BrokenLinkResult[];
}

export async function checkUrl(
  url: string
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function checkAllLinks(
  db: Database
): Promise<BrokenLinkResult[]> {
  const rows = db
    .prepare(`SELECT id, url, title FROM bookmarks ORDER BY id`)
    .all() as { id: number; url: string; title: string }[];

  for (const row of rows) {
    const { status } = await checkUrl(row.url);
    if (status === 0 || status >= 400) {
      markBrokenLink(db, row.id, status);
    } else {
      clearBrokenStatus(db, row.id);
    }
  }

  return listBrokenLinks(db);
}
