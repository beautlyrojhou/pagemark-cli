import { Database } from 'better-sqlite3';
import { getBookmarkById } from './bookmarks';
import { getTagsForBookmark } from './bookmarks';

export interface MergeResult {
  survivorId: number;
  removedId: number;
  mergedTags: string[];
  mergedNote: string | null;
}

/**
 * Merge bookmark `sourceId` into `targetId`.
 * Tags from both are combined on the target; the source is deleted.
 * Notes are concatenated if both exist.
 */
export function mergeBookmarks(
  db: Database,
  targetId: number,
  sourceId: number
): MergeResult {
  const target = getBookmarkById(db, targetId);
  const source = getBookmarkById(db, sourceId);

  if (!target) throw new Error(`Target bookmark ${targetId} not found`);
  if (!source) throw new Error(`Source bookmark ${sourceId} not found`);
  if (targetId === sourceId) throw new Error('Cannot merge a bookmark with itself');

  const targetTags = getTagsForBookmark(db, targetId);
  const sourceTags = getTagsForBookmark(db, sourceId);
  const allTags = Array.from(new Set([...targetTags, ...sourceTags]));

  // Merge notes
  const targetNote: string | null = (db
    .prepare('SELECT note FROM bookmark_notes WHERE bookmark_id = ?')
    .get(targetId) as any)?.note ?? null;
  const sourceNote: string | null = (db
    .prepare('SELECT note FROM bookmark_notes WHERE bookmark_id = ?')
    .get(sourceId) as any)?.note ?? null;

  let mergedNote: string | null = null;
  if (targetNote && sourceNote) {
    mergedNote = `${targetNote}\n---\n${sourceNote}`;
  } else {
    mergedNote = targetNote ?? sourceNote;
  }

  db.transaction(() => {
    // Apply merged tags
    db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(targetId);
    const insertTag = db.prepare(
      `INSERT OR IGNORE INTO tags (name) VALUES (@tag)`
    );
    const linkTag = db.prepare(
      `INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id)
       SELECT ?, id FROM tags WHERE name = ?`
    );
    for (const tag of allTags) {
      insertTag.run({ tag });
      linkTag.run(targetId, tag);
    }

    // Upsert merged note
    if (mergedNote !== null) {
      db.prepare(
        `INSERT INTO bookmark_notes (bookmark_id, note) VALUES (?, ?)
         ON CONFLICT(bookmark_id) DO UPDATE SET note = excluded.note`
      ).run(targetId, mergedNote);
    }

    // Delete source bookmark (cascades handled by FK or manual cleanup)
    db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(sourceId);
    db.prepare('DELETE FROM bookmark_notes WHERE bookmark_id = ?').run(sourceId);
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(sourceId);
  })();

  return { survivorId: targetId, removedId: sourceId, mergedTags: allTags, mergedNote };
}

export function listMergeCandidates(
  db: Database,
  targetId: number
): Array<{ id: number; url: string; title: string }> {
  const target = getBookmarkById(db, targetId);
  if (!target) throw new Error(`Bookmark ${targetId} not found`);

  // Find bookmarks sharing at least one tag with the target
  return db
    .prepare(
      `SELECT DISTINCT b.id, b.url, b.title
       FROM bookmarks b
       JOIN bookmark_tags bt ON bt.bookmark_id = b.id
       WHERE bt.tag_id IN (
         SELECT tag_id FROM bookmark_tags WHERE bookmark_id = ?
       ) AND b.id != ?
       ORDER BY b.title`
    )
    .all(targetId, targetId) as Array<{ id: number; url: string; title: string }>;
}
