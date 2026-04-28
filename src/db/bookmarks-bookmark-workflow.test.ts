import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { initSchema } from "./schema";
import {
  migrateWorkflows,
  createWorkflow,
  deleteWorkflow,
  listWorkflows,
  assignToWorkflow,
  removeFromWorkflow,
  getWorkflowBookmarks,
  advanceWorkflowStep,
} from "./bookmarks-bookmark-workflow";
import { addBookmark } from "./bookmarks";

function createTestDb() {
  const db = new Database(":memory:");
  initSchema(db);
  migrateWorkflows(db);
  return db;
}

describe("bookmarks-bookmark-workflow", () => {
  let db: ReturnType<typeof createTestDb>;
  let bookmarkId: number;

  beforeEach(() => {
    db = createTestDb();
    bookmarkId = addBookmark(db, {
      url: "https://example.com",
      title: "Example",
      tags: [],
    });
  });

  it("creates a workflow", () => {
    const id = createWorkflow(db, "Review", ["pending", "in-review", "done"]);
    expect(id).toBeGreaterThan(0);
  });

  it("lists workflows", () => {
    createWorkflow(db, "Review", ["pending", "in-review", "done"]);
    createWorkflow(db, "Publish", ["draft", "published"]);
    const workflows = listWorkflows(db);
    expect(workflows).toHaveLength(2);
    expect(workflows.map((w) => w.name)).toContain("Review");
    expect(workflows.map((w) => w.name)).toContain("Publish");
  });

  it("deletes a workflow", () => {
    const id = createWorkflow(db, "Review", ["pending", "done"]);
    deleteWorkflow(db, id);
    expect(listWorkflows(db)).toHaveLength(0);
  });

  it("assigns a bookmark to a workflow at initial step", () => {
    const wfId = createWorkflow(db, "Review", ["pending", "in-review", "done"]);
    assignToWorkflow(db, bookmarkId, wfId);
    const bookmarks = getWorkflowBookmarks(db, wfId);
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].bookmarkId).toBe(bookmarkId);
    expect(bookmarks[0].step).toBe("pending");
  });

  it("advances a bookmark to the next workflow step", () => {
    const wfId = createWorkflow(db, "Review", ["pending", "in-review", "done"]);
    assignToWorkflow(db, bookmarkId, wfId);
    advanceWorkflowStep(db, bookmarkId, wfId);
    const bookmarks = getWorkflowBookmarks(db, wfId);
    expect(bookmarks[0].step).toBe("in-review");
  });

  it("does not advance past the last step", () => {
    const wfId = createWorkflow(db, "Review", ["pending", "done"]);
    assignToWorkflow(db, bookmarkId, wfId);
    advanceWorkflowStep(db, bookmarkId, wfId); // pending -> done
    advanceWorkflowStep(db, bookmarkId, wfId); // already at last step
    const bookmarks = getWorkflowBookmarks(db, wfId);
    expect(bookmarks[0].step).toBe("done");
  });

  it("removes a bookmark from a workflow", () => {
    const wfId = createWorkflow(db, "Review", ["pending", "done"]);
    assignToWorkflow(db, bookmarkId, wfId);
    removeFromWorkflow(db, bookmarkId, wfId);
    expect(getWorkflowBookmarks(db, wfId)).toHaveLength(0);
  });

  it("returns empty list for workflow with no bookmarks", () => {
    const wfId = createWorkflow(db, "Empty", ["step1"]);
    expect(getWorkflowBookmarks(db, wfId)).toHaveLength(0);
  });
});
