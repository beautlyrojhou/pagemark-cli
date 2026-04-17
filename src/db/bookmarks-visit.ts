import { Database } from 'better-sqlite3';

export function recordVisit(db: Database, id: number): void {
  const stmt = db.prepare(
    `UPDATE bookmarks SET visit_count = COALESCE(visit_count, 0) + 1, last_visited_at = datetime('now') WHERE id = ?`
  );
  const result = stmt.run(id);
  if (result.changes === 0) {
    throw new Error(`Bookmark with id ${id} not found`);
  }
}

export function getVisitStats(db: Database, id: number): { visitCount: number; lastVisitedAt: string | null } {
  const row = db.prepare('SELECT visit_count, last_visited_at FROM bookmarks WHERE id = ?').get(id) as
    | { visit_count: number; last_visited_at: string | null }
    | undefined;
  if (!row) throw new Error(`Bookmark with id ${id} not found`);
  return { visitCount: row.visit_count ?? 0, lastVisitedAt: row.last_visited_at ?? null };
}

export function listMostVisited(db: Database, limit = 10): Array<{ id: number; url: string; title: string; visitCount: number; lastVisitedAt: string | null }> {
  const rows = db.prepare(
    `SELECT id, url, title, COALESCE(visit_count, 0) as visit_count, last_visited_at
     FROM bookmarks
     ORDER BY visit_count DESC, last_visited_at DESC
     LIMIT ?`
  ).all(limit) as Array<{ id: number; url: string; title: string; visit_count: number; last_visited_at: string | null }>;
  return rows.map(r => ({
    id: r.id,
    url: r.url,
    title: r.title,
    visitCount: r.visit_count,
    lastVisitedAt: r.last_visited_at,
  }));
}

export function resetVisits(db: Database, id: number): void {
  const stmt = db.prepare(`UPDATE bookmarks SET visit_count = 0, last_visited_at = NULL WHERE id = ?`);
  const result = stmt.run(id);
  if (result.changes === 0) {
    throw new Error(`Bookmark with id ${id} not found`);
  }
}
