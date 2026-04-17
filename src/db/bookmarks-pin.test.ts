import { openDb, initSchema } from "./schema";
import { addBookmark } from "./bookmarks";
import { pinBookmark, unpinBookmark, listPinnedBookmarks } from "./bookmarks-pin";

function createTestDb() {
  const db = openDb(":memory:");
  initSchema(db);
  return db;
}

test("pin and list pinned bookmarks", () => {
  const db = createTestDb();
  const id = addBookmark(db, { url: "https://example.com", title: "Example", tags: [] });
  pinBookmark(db, id);
  const pinned = listPinnedBookmarks(db);
  expect(pinned).toHaveLength(1);
  expect(pinned[0].url).toBe("https://example.com");
});

test("unpin removes from pinned list", () => {
  const db = createTestDb();
  const id = addBookmark(db, { url: "https://example.com", title: "Example", tags: [] });
  pinBookmark(db, id);
  unpinBookmark(db, id);
  const pinned = listPinnedBookmarks(db);
  expect(pinned).toHaveLength(0);
});

test("pinBookmark returns false for missing id", () => {
  const db = createTestDb();
  const result = pinBookmark(db, 9999);
  expect(result).toBe(false);
});

test("multiple bookmarks only pinned ones listed", () => {
  const db = createTestDb();
  const id1 = addBookmark(db, { url: "https://a.com", title: "A", tags: [] });
  addBookmark(db, { url: "https://b.com", title: "B", tags: [] });
  pinBookmark(db, id1);
  const pinned = listPinnedBookmarks(db);
  expect(pinned).toHaveLength(1);
  expect(pinned[0].id).toBe(id1);
});

test("listPinnedBookmarks includes tags", () => {
  const db = createTestDb();
  const id = addBookmark(db, { url: "https://tagged.com", title: "Tagged", tags: ["dev", "ts"] });
  pinBookmark(db, id);
  const pinned = listPinnedBookmarks(db);
  expect(pinned[0].tags).toContain("dev");
});
