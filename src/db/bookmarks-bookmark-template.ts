import { Database } from 'better-sqlite3';

export interface BookmarkTemplate {
  id: number;
  name: string;
  url_pattern: string;
  title_prefix: string | null;
  default_tags: string | null;
  notes: string | null;
  created_at: string;
}

export function createTemplate(
  db: Database,
  name: string,
  urlPattern: string,
  titlePrefix?: string,
  defaultTags?: string[],
  notes?: string
): BookmarkTemplate {
  const stmt = db.prepare(`
    INSERT INTO bookmark_templates (name, url_pattern, title_prefix, default_tags, notes, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  const result = stmt.run(
    name,
    urlPattern,
    titlePrefix ?? null,
    defaultTags ? defaultTags.join(',') : null,
    notes ?? null
  );
  return getTemplateById(db, result.lastInsertRowid as number)!;
}

export function getTemplateById(db: Database, id: number): BookmarkTemplate | undefined {
  return db.prepare('SELECT * FROM bookmark_templates WHERE id = ?').get(id) as BookmarkTemplate | undefined;
}

export function getTemplateByName(db: Database, name: string): BookmarkTemplate | undefined {
  return db.prepare('SELECT * FROM bookmark_templates WHERE name = ?').get(name) as BookmarkTemplate | undefined;
}

export function listTemplates(db: Database): BookmarkTemplate[] {
  return db.prepare('SELECT * FROM bookmark_templates ORDER BY name ASC').all() as BookmarkTemplate[];
}

export function deleteTemplate(db: Database, id: number): boolean {
  const result = db.prepare('DELETE FROM bookmark_templates WHERE id = ?').run(id);
  return result.changes > 0;
}

export function applyTemplate(
  db: Database,
  templateId: number,
  url: string,
  overrideTitle?: string
): { url: string; title: string | null; tags: string[] } {
  const template = getTemplateById(db, templateId);
  if (!template) throw new Error(`Template with id ${templateId} not found`);
  const title = overrideTitle
    ? overrideTitle
    : template.title_prefix
    ? `${template.title_prefix} ${url}`
    : null;
  const tags = template.default_tags ? template.default_tags.split(',').filter(Boolean) : [];
  return { url, title, tags };
}
