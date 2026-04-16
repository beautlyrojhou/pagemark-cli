import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './bookmarks.test';
import { addBookmark } from './bookmarks';
import { getAllTags, renameTag, deleteTag, getTagUsageCounts } from './tags';

describe('tags module', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
    addBookmark(db, { url: 'https://a.com', title: 'A', tags: ['typescript', 'cli'] });
    addBookmark(db, { url: 'https://b.com', title: 'B', tags: ['typescript', 'testing'] });
  });

  it('getAllTags returns all unique tags', () => {
    const tags = getAllTags(db);
    expect(tags.map(t => t.name)).toEqual(['cli', 'testing', 'typescript']);
  });

  it('renameTag renames an existing tag', () => {
    const result = renameTag(db, 'cli', 'command-line');
    expect(result).toBe(true);
    const tags = getAllTags(db);
    expect(tags.map(t => t.name)).toContain('command-line');
    expect(tags.map(t => t.name)).not.toContain('cli');
  });

  it('renameTag returns false for non-existent tag', () => {
    expect(renameTag(db, 'nonexistent', 'other')).toBe(false);
  });

  it('deleteTag removes tag and associations', () => {
    const result = deleteTag(db, 'testing');
    expect(result).toBe(true);
    expect(getAllTags(db).map(t => t.name)).not.toContain('testing');
  });

  it('getTagUsageCounts returns counts', () => {
    const counts = getTagUsageCounts(db);
    const ts = counts.find(t => t.name === 'typescript');
    expect(ts?.count).toBe(2);
    const cli = counts.find(t => t.name === 'cli');
    expect(cli?.count).toBe(1);
  });
});
