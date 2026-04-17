import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from './schema';
import { addBookmark } from './bookmarks';
import { setReminder, getReminder, clearReminder, listDueReminders, listAllReminders } from './bookmarks-remind';

function createTestDb() {
  const db = new Database(':memory:');
  initSchema(db);
  db.prepare(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER NOT NULL UNIQUE,
    remind_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  return db;
}

describe('bookmarks-remind', () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, { url: 'https://example.com', title: 'Example', tags: [] });
  });

  it('sets and retrieves a reminder', () => {
    const dt = new Date('2030-01-01T10:00:00Z');
    setReminder(db, bookmarkId, dt, 'review this');
    const r = getReminder(db, bookmarkId);
    expect(r).not.toBeNull();
    expect(r!.note).toBe('review this');
    expect(r!.remind_at).toBe('2030-01-01T10:00:00.000Z');
  });

  it('overwrites existing reminder', () => {
    setReminder(db, bookmarkId, new Date('2030-01-01T10:00:00Z'));
    setReminder(db, bookmarkId, new Date('2031-06-15T09:00:00Z'), 'updated');
    const r = getReminder(db, bookmarkId);
    expect(r!.note).toBe('updated');
    expect(r!.remind_at).toContain('2031');
  });

  it('clears a reminder', () => {
    setReminder(db, bookmarkId, new Date('2030-01-01T10:00:00Z'));
    clearReminder(db, bookmarkId);
    expect(getReminder(db, bookmarkId)).toBeNull();
  });

  it('lists due reminders', () => {
    setReminder(db, bookmarkId, new Date('2000-01-01T00:00:00Z'), 'past');
    const due = listDueReminders(db, new Date('2025-01-01T00:00:00Z'));
    expect(due.length).toBe(1);
    expect(due[0].note).toBe('past');
  });

  it('listAllReminders returns all', () => {
    setReminder(db, bookmarkId, new Date('2030-01-01T10:00:00Z'));
    expect(listAllReminders(db).length).toBe(1);
  });
});
