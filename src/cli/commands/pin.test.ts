import Database from "better-sqlite3";
import { openDb, initSchema } from "../../db/schema";
import { addBookmark } from "../../db/bookmarks";
import { registerPinCommand } from "./pin";
import yargs from "yargs";

function createTestDb() {
  const db = openDb(":memory:");
  initSchema(db);
  return db;
}

function runCli(db: Database.Database, args: string[]) {
  const logs: string[] = [];
  const errors: string[] = [];
  jest.spyOn(console, "log").mockImplementation((m) => logs.push(m));
  jest.spyOn(console, "error").mockImplementation((m) => errors.push(m));
  const parser = registerPinCommand(yargs([]), db);
  parser.parse(args);
  return { logs, errors };
}

afterEach(() => jest.restoreAllMocks());

test("pin a bookmark", () => {
  const db = createTestDb();
  const id = addBookmark(db, { url: "https://example.com", title: "Example", tags: [] });
  const { logs } = runCli(db, ["pin", String(id)]);
  expect(logs[0]).toContain(`Pinned bookmark #${id}`);
});

test("unpin a bookmark", () => {
  const db = createTestDb();
  const id = addBookmark(db, { url: "https://example.com", title: "Example", tags: [] });
  runCli(db, ["pin", String(id)]);
  const { logs } = runCli(db, ["unpin", String(id)]);
  expect(logs[0]).toContain(`Unpinned bookmark #${id}`);
});

test("list pinned bookmarks", () => {
  const db = createTestDb();
  const id = addBookmark(db, { url: "https://pinned.com", title: "Pinned", tags: [] });
  runCli(db, ["pin", String(id)]);
  const { logs } = runCli(db, ["pinned"]);
  expect(logs.some((l) => l.includes("https://pinned.com"))).toBe(true);
});

test("list pinned shows empty message", () => {
  const db = createTestDb();
  const { logs } = runCli(db, ["pinned"]);
  expect(logs[0]).toContain("No pinned bookmarks");
});
