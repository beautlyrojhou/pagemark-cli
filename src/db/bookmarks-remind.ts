import { Database } from 'better-sqlite3';

export interface Reminder {
  id: number;
  bookmark_id: number;
  remind_at: string;
  note: string | null;
  created_at: string;
}

export function setReminder(
  db: Database,
  bookmarkId: number,
  remindAt: Date,
  note?: string
): void {
  db.prepare(`
    INSERT INTO reminders (bookmark_id, remind_at, note)
    VALUES (?, ?, ?)
    ON CONFLICT(bookmark_id) DO UPDATE SET remind_at = excluded.remind_at, note = excluded.note
  `).run(bookmarkId, remindAt.toISOString(), note ?? null);
}

export function getReminder(db: Database, bookmarkId: number): Reminder | null {
  return db.prepare('SELECT * FROM reminders WHERE bookmark_id = ?').get(bookmarkId) as Reminder | null;
}

export function clearReminder(db: Database, bookmarkId: number): void {
  db.prepare('DELETE FROM reminders WHERE bookmark_id = ?').run(bookmarkId);
}

export function listDueReminders(db: Database, asOf?: Date): Reminder[] {
  const dt = (asOf ?? new Date()).toISOString();
  return db.prepare(
    'SELECT * FROM reminders WHERE remind_at <= ? ORDER BY remind_at ASC'
  ).all(dt) as Reminder[];
}

export function listAllReminders(db: Database): Reminder[] {
  return db.prepare('SELECT * FROM reminders ORDER BY remind_at ASC').all() as Reminder[];
}
