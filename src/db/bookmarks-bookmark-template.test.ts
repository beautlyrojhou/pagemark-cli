import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { openDb, initSchema } from './schema';
import {
  createTemplate,
  getTemplateById,
  getTemplateByName,
  listTemplates,
  deleteTemplate,
  applyTemplate,
} from './bookmarks-bookmark-template';
import { migrateBookmarkTemplates } from './schema-template-migration';

function createTestDb() {
  const db = openDb(':memory:');
  initSchema(db);
  migrateBookmarkTemplates(db);
  return db;
}

describe('bookmark templates', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates and retrieves a template by id', () => {
    const t = createTemplate(db, 'github', 'https://github.com/*', 'GitHub:', ['dev', 'oss']);
    expect(t.id).toBeGreaterThan(0);
    expect(t.name).toBe('github');
    expect(t.url_pattern).toBe('https://github.com/*');
    expect(t.title_prefix).toBe('GitHub:');
    expect(t.default_tags).toBe('dev,oss');
    const fetched = getTemplateById(db, t.id);
    expect(fetched?.name).toBe('github');
  });

  it('retrieves a template by name', () => {
    createTemplate(db, 'news', 'https://news.ycombinator.com/*');
    const t = getTemplateByName(db, 'news');
    expect(t).toBeDefined();
    expect(t?.url_pattern).toBe('https://news.ycombinator.com/*');
  });

  it('lists all templates sorted by name', () => {
    createTemplate(db, 'zebra', 'https://z.com');
    createTemplate(db, 'alpha', 'https://a.com');
    const list = listTemplates(db);
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('alpha');
    expect(list[1].name).toBe('zebra');
  });

  it('deletes a template', () => {
    const t = createTemplate(db, 'temp', 'https://example.com');
    expect(deleteTemplate(db, t.id)).toBe(true);
    expect(getTemplateById(db, t.id)).toBeUndefined();
  });

  it('returns false when deleting non-existent template', () => {
    expect(deleteTemplate(db, 9999)).toBe(false);
  });

  it('applies template to a url', () => {
    const t = createTemplate(db, 'gh', 'https://github.com/*', 'GH:', ['dev']);
    const result = applyTemplate(db, t.id, 'https://github.com/user/repo');
    expect(result.url).toBe('https://github.com/user/repo');
    expect(result.title).toBe('GH: https://github.com/user/repo');
    expect(result.tags).toEqual(['dev']);
  });

  it('allows overriding title when applying template', () => {
    const t = createTemplate(db, 'gh2', 'https://github.com/*', 'GH:', ['dev']);
    const result = applyTemplate(db, t.id, 'https://github.com/x/y', 'My Repo');
    expect(result.title).toBe('My Repo');
  });
});
